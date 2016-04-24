Reveal.addEventListener('h2streams',function (e) {
    var base = $("[data-state='"+e.type+"']",e.currentTarget).get(0);

    var svgNode = $("svg",base).get(0);
    var transition = 300;
    var svg;
    var seqCount =0;
    var running = false;
    var currentTransaction = 0;

    var transactions = [
        {
            name:'simple',
            description:'Requête/réponse simple',
            data:[
                {seq: 1, from:'client', type: 'settings', sid: 0, text: ''},
                {seq: 1, from:'server', type: 'settings', sid: 0, text: ''},
                {seq: 6, from:'client', type: 'settings', sid: 0, text: 'ACK'},
                {seq: 6, from:'server', type: 'settings', sid: 0, text: 'ACK'},
                {seq: 2, from:'client', type: 'header', sid: 1, text: '/'},
                {seq: 16, from:'client', type: 'goaway', sid: 0, text: ''},
                {seq: 7, from:'server', type: 'header', sid: 1, text: 'OK'},
                {seq: 8, from:'server', type: 'data', sid: 1, text: '...'},
                {seq: 9, from:'server', type: 'data', sid: 1, text: '...'},
                {seq: 10, from:'server', type: 'data', sid: 1, text: '...'},
            ]
        },
        {
            name:'mux',
            description:'Flux multiples',
            data:[
                {seq: 1, from:'client', type: 'header', sid: 3, text: '/1.js'},
                {seq: 2, from:'client', type: 'header', sid: 5, text: '/1.css'},
                {seq: 3, from:'client', type: 'header', sid: 7, text: '/1.jpg'},
                {seq: 6, from:'server', type: 'header', sid: 3, text: 'OK'},
                {seq: 7, from:'server', type: 'data', sid: 3, text: '...'},
                {seq: 8, from:'client', type: 'header', sid: 9, text: 'POST'},
                {seq: 8, from:'server', type: 'header', sid: 5, text: 'OK'},
                {seq: 9, from:'client', type: 'data', sid: 9, text: '{}'},
                {seq: 9, from:'server', type: 'data', sid: 3, text: '...'},
                {seq: 10, from:'server', type: 'header', sid: 7, text: 'OK'},
                {seq: 11, from:'server', type: 'data', sid: 3, text: '...'},
                {seq: 12, from:'server', type: 'data', sid: 5, text: '...'},
                {seq: 13, from:'server', type: 'data', sid: 7, text: '...'},
                {seq: 14, from:'server', type: 'header', sid: 9, text: 'OK'},
                {seq: 15, from:'server', type: 'data', sid: 7, text: '...'}
            ]
        },
        {
            name:'priority',
            description:'Contrôle de flux et priorisation',
            data:[
                {seq: 1, from:'client', type: 'header', sid: 3, text: '/1.css', dep: 1, weight: 16},
                {seq: 2, from:'client', type: 'header', sid: 5, text: '/1.js', dep: 3, weight: 32},
                {seq: 3, from:'client', type: 'header', sid: 7, text: '/1.jpg', dep: 3, weight: 16},
                {seq: 14, from:'client', type: 'window_update', sid: 3, text: '3000'},
                {seq: 15, from:'client', type: 'priority', sid: 5, text: '', dep: 1, weight: 32},
                {seq: 6, from:'server', type: 'header', sid: 3, text: 'OK'},
                {seq: 7, from:'server', type: 'data', sid: 3, text: '...'},
                {seq: 8, from:'server', type: 'data', sid: 3, text: '...'},
                {seq: 9, from:'server', type: 'data', sid: 3, text: '...'},
                {seq: 10, from:'server', type: 'data', sid: 3, text: '...'},
                {seq: 11, from:'server', type: 'data', sid: 3, text: '...'},
                {seq: 19, from:'server', type: 'data', sid: 3, text: '...'},
                {seq: 20, from:'server', type: 'header', sid: 5, text: 'OK'},
                {seq: 21, from:'server', type: 'data', sid: 5, text: '...'},
                {seq: 22, from:'server', type: 'data', sid: 3, text: '...'},
                {seq: 23, from:'server', type: 'data', sid: 5, text: '...'},
                {seq: 24, from:'server', type: 'data', sid: 5, text: '...'},
                {seq: 25, from:'server', type: 'data', sid: 5, text: '...'},
                {seq: 26, from:'server', type: 'data', sid: 3, text: '...'},
                {seq: 27, from:'server', type: 'header', sid: 7, text: 'OK'},
                {seq: 28, from:'server', type: 'data', sid: 7, text: '...'},
                {seq: 29, from:'server', type: 'data', sid: 7, text: '...'}
            ]
        },
        {
            name:'push',
            description:'Push promises',
            data:[
                {seq: 1, from:'client', type: 'header', sid: 1, text: '/'},
                {seq: 14, from:'client', type: 'rst_stream', sid: 4, text: ''},
                {seq: 6, from:'server', type: 'header', sid: 1, text: 'OK'},
                {seq: 7, from:'server', type: 'push_promise', sid: 1, text: '/1.css', dep:2, weight: ' '},
                {seq: 8, from:'server', type: 'push_promise', sid: 1, text: '/1.js', dep:4, weight:' '},
                {seq: 9, from:'server', type: 'data', sid: 1, text: '...'},
                {seq: 10, from:'server', type: 'data', sid: 1, text: '...'},
                {seq: 11, from:'server', type: 'header', sid: 2, text: 'OK'},
                {seq: 12, from:'server', type: 'data', sid: 1, text: '...'},
                {seq: 13, from:'server', type: 'data', sid: 1, text: '...'},
                {seq: 14, from:'server', type: 'header', sid: 4, text: 'OK'},
                {seq: 15, from:'server', type: 'data', sid: 1, text: '...'},
                {seq: 16, from:'server', type: 'data', sid: 2, text: '...'},
                {seq: 17, from:'server', type: 'data', sid: 2, text: '...'},
                {seq: 18, from:'server', type: 'data', sid: 4, text: '...'},
                {seq: 19, from:'server', type: 'data', sid: 2, text: '...'},
                {seq: 20, from:'server', type: 'data', sid: 2, text: '...'},
                {seq: 21, from:'server', type: 'data', sid: 2, text: '...'}
            ]
        }
    ];

    var client, clientFrames = [], server, serverFrames = [];
    var colorScale = d3.scale.category20();
    var height, width, rectHeight, rectWidth;


    function render() {
        height = svgNode.clientHeight - 20, width = svgNode.clientWidth - 20;
        rectHeight = height * 0.4, rectWidth = width * 0.8;
        svg = d3.select(svgNode).append('g')
            .attr('transform', 'translate(10,10)');
        var defs = d3.select(svgNode).append("defs");

        defs.append("marker")
            .attr({
                "id": "arrow",
                "viewBox": "0 -10 20 20",
                "refX": 10,
                "refY": 0,
                "markerWidth": 10,
                "markerHeight": 10,
                "orient": "auto"
            })
            .append("path")
            .attr("d", "M0,-10L20,0L0,10")
            .attr("class", "arrowHead");

        svg.append('rect').attr('class', 'mux')
            .attr('x', (width - rectWidth) / 2)
            .attr('y', (height - rectHeight) / 2)
            .attr('width', rectWidth)
            .attr('height', rectHeight);

        client = svg.append('g').attr('class', 'client')
            .attr('transform', 'translate(0,' + (height - rectHeight) / 2 + ')');

        client.append("line").attr("class", "arrow")
            .attr("marker-end", "url(#arrow)")
            .attr("y1", rectHeight / 4).attr("y2", rectHeight / 4)
            .attr("x1", 0).attr("x2", width);

        server = svg.append('g').attr('class', 'server')
            .attr('transform', 'translate(0,' + height / 2 + ')');

        server.append("line").attr("class", "arrow")
            .attr("marker-end", "url(#arrow)")
            .attr("y1", rectHeight / 4).attr("y2", rectHeight / 4)
            .attr("x1", width).attr("x2", 0);
    }

    function drawFrame(root) {
        root.append('rect')
            .attr('height',rectHeight/2-10)
            .attr('fill', function (d) {
                return colorScale(d.sid)
            })
            .attr('width',width/5);

        root.append('text')
            .attr('text-anchor','middle')
            .attr('font-size','1em')
            .attr('fill','black').attr('stroke','black')
            .attr('x',width/10)
            .attr('y',rectHeight/4+10)
            .text(function (d) { return d.text});

        root.append('text')
            .attr('text-anchor','middle')
            .attr('font-size','32')
            .attr('fill','black').attr('stroke','black')
            .attr('x',width/10)
            .attr('y',28)
            .text(function (d) { return d.type});

        root.append('text')
            .attr('text-anchor','start')
            .attr('font-size','32')
            .attr('fill','black').attr('stroke','black')
            .attr('x',5)
            .attr('y',rectHeight/2-20)
            .text(function (d) { return d.sid});

        root.append('text')
            .attr('text-anchor','end')
            .attr('font-size','32')
            .attr('opacity',0.8)
            .attr('fill','black').attr('stroke','black')
            .attr('x',width/5-5)
            .attr('y',rectHeight/2-20)
            .text(function (d) { return (d.dep)?(d.weight?d.weight:16):''});

        root.append('text')
            .attr('text-anchor','middle')
            .attr('font-size','32')
            .attr('opacity',0.8)
            .attr('fill','black').attr('stroke','black')
            .attr('x',width/10)
            .attr('y',rectHeight/2-20)
            .text(function (d) { return (d.dep)?d.dep:''});
    }

    function update() {

        var cFrames = client.selectAll('g.frame').data(clientFrames, function (d) { return d.seq+'_'+ d.sid});
        var sFrames = server.selectAll('g.frame').data(serverFrames, function (d) { return d.seq+'_'+ d.sid});
        var clientScale = d3.scale.linear().domain([0,5]).range([0,width]);
        var serverScale = d3.scale.linear().domain([0,5]).range([width,0]);

        var cFrameDetail = cFrames.enter().append('g')
            .attr('class',function (d) { return 'frame '+ d.type})
            .attr('transform',function (d) { return 'translate(-'+width/5+',5)'});

        cFrames.transition(transition).ease('linear')
            .attr('transform',function (d) { return 'translate('+clientScale(d.step)+',5)'});

        cFrames.exit().transition(transition).remove();
        drawFrame(cFrameDetail);

        var sFrameDetail = sFrames.enter().append('g')
            .attr('class',function (d) { return 'frame '+ d.type})
            .attr('transform',function (d) { return 'translate('+width+',5)'});

        sFrames.transition(transition).ease('linear')
            .attr('transform',function (d) { return 'translate('+serverScale(d.step)+',5)'});

        sFrames.exit().transition(transition).remove();
        drawFrame(sFrameDetail);

        d3.select(".h2streams .h2footer").html(transactions[currentTransaction].description)
    }

    function nextSeq() {
        if (running) {
            seqCount++;
            // increase steps on in flight packets
            clientFrames = clientFrames.map(function (d) {
                d.step++;
                return d
            }).filter(function (d) {
                return d.step <= 5
            });
            serverFrames = serverFrames.map(function (d) {
                d.step++;
                return d
            }).filter(function (d) {
                return d.step <= 5
            });
            transactions[currentTransaction].data.filter(function (d) {
                return d.seq == seqCount
            }).forEach(function (d) {
                if (d.from == 'server')
                    serverFrames.push($.extend({}, d, {step: 0}));
                else
                    clientFrames.push($.extend({}, d, {step: 0}));
            });
            update();
            if (clientFrames.length == 0
                && serverFrames.length == 0
                && transactions[currentTransaction].data.filter(function (d) {return d.seq > seqCount}).length == 0) {
                seqCount=0;
                running=false;
                if (currentTransaction<transactions.length-1)
                    currentTransaction++;
                else
                    currentTransaction=0;
            }
        }
        setTimeout(nextSeq,transition);
    }

    nextSeq();
    render();
    update();

    $(base).on('action', function () {
        running=!running;
    });
},false);
