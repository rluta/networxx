var TTLChart = {
    data: [],
    spec: {},
    chart: null,
    activeNet: '',
    selectedNets: [],
    modelGlobals: {'delayAck': true },
    chartUrl: "data/ttl-chart.json",
    payloadTarget: 300,
    view: {
        menu:'#ttl-networks',
        properties:'#ttl-properties',
        payload:'#ttl-title',
        summary:'#ttl-summary',
        chart:'#ttl-chart'
    },
    properties: {
        'bw':{'label':'Bandwidth (Mbps)','min':0.5,'max':1000,'step':0.5},
        'rtt':{'label':'RTT (ms)','min':1,'max':500,'step':1},
        'rwnd':{'label':'Rwnd (kB)','min':4,'max':512,'step':1},
        'cwnd':{'label':'Cwnd (Packets)','min':2,'max':16,'step':1},
        'mtu':{'label':'MTU (B)','min':500,'max':9000,'step':500}
    },
    netsTemplate: {
        'adsl':{'name':'Adsl','bw':10,'rtt':30,'rwnd':144,'cwnd':10,'mtu':1500,'time':0},
        'adsl2':{'name':'Adsl Old','bw':10,'rtt':30,'rwnd':64,'cwnd':3,'mtu':1500,'time':0},
        'fibre':{'name':'Cable','bw':100,'rtt':20,'rwnd':64,'cwnd':3,'mtu':1500,'time':0},
        'ethernet':{'name':'Ethernet','bw':1000,'rtt':1,'rwnd':64,'cwnd':3,'mtu':1500,'time':0},
        'mobile':{'name':'Mobile','bw':3,'rtt':150,'rwnd':64,'cwnd':3,'mtu':1500,'time':0},
        'faraway':{'name':'Eth. Far','bw':1000,'rtt':150,'rwnd':64,'cwnd':3,'mtu':1500,'time':0}
    },
    update: function () {
        TTLChart.updateModel()
        TTLChart.chart.data('ttl')
            .remove(function (d) { return true; })
            .insert(TTLChart.data.ttl);
        TTLChart.chart.update()
    },
    addNetwork: function (templateName) {
        var id = templateName + TTLChart.selectedNets.length
        var net = {'id': id}
        for(var p in TTLChart.netsTemplate[templateName]) {
            net[p]=TTLChart.netsTemplate[templateName][p]
        }
        TTLChart.selectedNets.push(net);
        TTLChart.activeNet = TTLChart.selectedNets.length-1;
    },
    updateView: function () {
        $(".item[data-net]",TTLChart.view.menu).unbind().remove();
        for(var idx in TTLChart.selectedNets) {
            var ridx = TTLChart.selectedNets.length-1-idx
            var net = TTLChart.selectedNets[ridx]
            $(TTLChart.view.menu).prepend('<li data-net="'+ridx+'" class="item">'+net.name+'</li>');
        }
        $(".item[data-net]",TTLChart.view.menu)
            .bind('click',function (e) {
                TTLChart.activeNet = $(this).data('net')
                TTLChart.updateView();
            })

        $('.item[data-net="'+TTLChart.activeNet+'"]',TTLChart.view.menu).addClass('active');

        $('[data-payload]',TTLChart.view.payload)
            .data('payload',TTLChart.payloadTarget)
            .text(TTLChart.payloadTarget)

        $('[data-property]',TTLChart.view.properties).each( function () {
            var p = $(this).data('property');
            var props = TTLChart.properties[p];
            $(this).data('min', props.min)
            $(this).data('max',props.max)
            $(this).data('step',props.step)
            $(this).text(TTLChart.selectedNets[TTLChart.activeNet][p])
        })

        $(TTLChart.view.properties).data('net',TTLChart.activeNet);

        TTLChart.updateSummary();
    },
    updateTime: function (netIdx) {
        $('.item[data-net="'+netIdx+'"] .label',TTLChart.view.menu).text(Math.ceil(TTLChart.selectedNets[netIdx].time)+ ' ms');
    },
    updateValue: function (ev,dd,current,min,max,step) {
        var value = current + Math.floor(dd.deltaX/5) * step
        return Math.min(max,Math.max(min,value));
    },
    updateModel: function () {
        var data = []
        for (var netIdx in TTLChart.selectedNets) {
            var net = TTLChart.selectedNets[netIdx]
            net.target = TTLChart.payloadTarget
            net.time = TTLChart.buildData(data,net)
            TTLChart.updateTime(netIdx)
        }
        TTLChart.updateSummary();
        TTLChart.data = {'ttl':data}
    },
    updateSummary: function() {
        if (!TTLChart.view.summary) return;

        $(TTLChart.view.summary).children().remove()
        TTLChart.selectedNets.forEach( function (net) {
            if (TTLChart.selectedNets.filter(function (n) {return n.id == net.id+'drag'}).length >0) {
                net = TTLChart.selectedNets.filter(function (n) {return n.id == net.id+'drag'})[0]
            } else if (net.id.match(/drag$/)) {
                return;
            }
            $(TTLChart.view.summary).append(
                "<ul class='ttl-summary small'>"
                +"<li class='time'>"+net.time+"</li>"
                +"<li class='tput'>"+format(net.target*8/net.time*1000)+"</li>" +
                "</ul>");
            $("#ttl-target").html(net.target);
        })
    },
    buildData: function (data,net) {
        var done             = 0,
            bytesReceived    = 0,
            inflightBytes    = 0,
            windowMax        = Math.min(net.cwnd,net.rwnd),
            windowCurrent    = windowMax,
            unackedPackets   = 0,
            ackBytes         = {},
            sentBytes        = {},
            time             = 0.0,
            name             = net.id,
            mss              = net.mtu - 40,
            cwnd             = Math.min(net.cwnd * mss,10*1460),
            rwnd             = net.rwnd * 1024,
            latency          = net.rtt * 0.5,
            tryIndicator     = 0,
            loop             = 0,
            target           = net.target,
            ssmode           = true;

        if (name.indexOf("drag") + "drag".length == name.length) {
            name = name.substring(0,name.length-4)
            tryIndicator = 1
        }

        while (done == 0 && loop < 10000) {
            var sendable = 0

            // we've recieved ACK packets
            if (ackBytes[time]) {
                // update CWND using SS algorithm
                if (ssmode)
                    if (TTLChart.modelGlobals.delayAck)
                        cwnd += ackBytes[time] / 2
                    else
                        cwnd += ackBytes[time]
                else
                    cwnd += mss
                inflightBytes -= ackBytes[time]
            }

            // update windows
            windowMax = Math.min(cwnd,rwnd)
            windowCurrent = Math.max(0,windowMax-inflightBytes)

            // we've received some packets on the client
            if (sentBytes[time]) {
                var numPackets = Math.ceil(sentBytes[time] / mss) + unackedPackets
                if (TTLChart.modelGlobals.delayAck) {
                    var unacked = numPackets % 2
                    unackedPackets = unacked
                    numPackets -= unacked
                }
                ackBytes[time+latency] = Math.min(sentBytes[time],numPackets * mss)
                bytesReceived += sentBytes[time]
                if (bytesReceived >= target * 1024 ) done = 1
            } else {
                sentBytes[time]=0
            }

            // if window is open, try to send data
            if (windowCurrent > 0) {
                sendable = Math.min(2*latency * net.bw * 1024 / 8, windowCurrent)
                if ( sendable < windowCurrent )
                {
                    // congestion
                    cwnd = Math.floor(cwnd / 2)
                    ssmode = false
                }
                sentBytes[time+latency]= sendable
                inflightBytes += sendable
            }

            if (time > 0)
                data.push({
                    "name":name,
                    "try":tryIndicator,
                    "send":Math.max(0,time-latency),
                    "receive":time,
                    "bytes":sentBytes[time],
                    "done":0})
            time += latency;
            loop++;
        }
        return time;
    }
};
function format(num) {
    var denum = 1;
    var units = 'kbps';

    if (num > 1000) {
        denum = 1000 ;
        units = 'Mbps';
    }
    return Math.ceil(num*100/denum)/100+' '+units;
}

$('[data-property]')
    .drag("start",function (ev,dd) {
        var property = $(this).data('property');
        var netIdx = $(this).closest('[data-net]').data('net');
        var baseNet = TTLChart.selectedNets[netIdx]
        var net = {'id':baseNet.id+'drag'}
        for (var prop in baseNet) { if (prop != 'id') net[prop] = baseNet[prop] }
        TTLChart.selectedNets.push(net);
    })
    .drag(function (ev,dd) {
        var property = $(this).data('property');
        var net = TTLChart.selectedNets[TTLChart.selectedNets.length-1]
        net[property] = TTLChart.updateValue(ev,dd,net[property],$(this).data('min'),$(this).data('max'),$(this).data('step'))
        $(this).text(net[property]);
        TTLChart.update()
    })
    .drag("end",function (ev,dd) {
        var property = $(this).data('property');
        var netIdx = $(this).closest('[data-net]').data('net');
        var net = TTLChart.selectedNets[TTLChart.selectedNets.length-1]
        var baseNet = TTLChart.selectedNets[netIdx]
        for (var prop in baseNet) { if (prop != 'id') baseNet[prop] = net[prop] }
        $(this).text(baseNet[property]);
        TTLChart.selectedNets.pop();
        TTLChart.update()
    });

$('[data-payload]')
    .drag(function (ev,dd) {
        TTLChart.payloadTarget = TTLChart.updateValue(ev,dd,TTLChart.payloadTarget,$(this).data('min'),$(this).data('max'),$(this).data('step'))
        $(this).text(TTLChart.payloadTarget);
        TTLChart.update()
    });

$('#ttl-dack').click(function (e) {
    $(this).toggleClass('active')
    TTLChart.modelGlobals.delayAck = !TTLChart.modelGlobals.delayAck
    TTLChart.update()
})

$('#ttl-reset').click(function (e) {
    TTLChart.selectedNets = [];
    TTLChart.activeNet = '';
    if (TTLChart.chart) TTLChart.chart.initialize()
    TTLChart.updateSummary()
    TTLChart.updateView()
    TTLChart.update()
})

$('.dropdown li').click(function (e) {
    var value = $(this).data('network')
    TTLChart.addNetwork(value)
    TTLChart.updateView()
    TTLChart.update()
})

Reveal.addEventListener('ttl-chart', function (e) {
    if (TTLChart.chart == null) {
        var base = $("[data-state='"+e.type+"']",e.currentTarget).get(0);
        d3.json(TTLChart.chartUrl,function (error,json) {
            TTLChart.spec = json
            TTLChart.addNetwork('adsl');
            TTLChart.updateView();
            //TTLChart.updateModel();
            vg.parse.spec(TTLChart.spec, function(chart) {
                TTLChart.chart = chart({el:$('[data-chart="vg"]',base).get(0)})
                TTLChart.update();
            });
        });
    }
});