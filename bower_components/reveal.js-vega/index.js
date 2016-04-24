var RevealVega = window.RevealVega || (function() {
    var createChart = function(base,vgspec) {
        var spec = JSON.parse(vgspec);
        if (!!Reveal.getConfig().vega) {
            spec.config = Object.assign({},Reveal.getConfig().vega.config,spec.config);
        }
        // type: vega => full vega specification
        // type: vega-lite => vega lite spec
        if (base.getAttribute('type') !== 'vega') {
            spec = window.vl.compile(spec).spec;
        }
        vg.parse.spec(spec,function (chart) {
            base._chart = chart;
            base._spec = spec;
            chart({el:base}).update();
        });
    };

    var initializeCharts = function(){
        // don't create charts before all libs are available
        if (!window.vg || !window.vl || !window.d3) {
            setTimeout(initializeCharts,50);
            return;
        }
        // Get all canvases
        var charts = document.querySelectorAll("chart[type|='vega']");
        for (var i = 0; i < charts.length; i++ ){
            var chart = charts[i];
            if ( ! chart.hasAttribute("src") ) {
                var specs = chart.getElementsByTagName('spec');
                if (specs.length > 0) {
                    createChart(chart, specs[0].textContent);
                }
            } else {
                var xhr = new XMLHttpRequest(),
                    url = chart.getAttribute("src");
                xhr.onload = function() {
                    if (xhr.readyState === 4) {
                        createChart(chart, xhr.responseText);
                    }
                    else {
                        console.warn( 'Failed to get file ' + url +". ReadyState: " + xhr.readyState + ", Status: " + xhr.status);
                    }
                };

                xhr.open( 'GET', url, false );
                try {
                    xhr.send();
                }
                catch ( error ) {
                    console.warn( 'Failed to get file ' + url + '. Make sure that the presentation and the file are served by a HTTP server and the file can be found there. ' + error );
                }
            }
        }
    }

    // load external scripts
    var body = document.getElementsByTagName('body')[0];
    if (!window.d3) {
        var d3 = document.createElement('script');
        d3.src = '//d3js.org/d3.v3.min.js';
        body.appendChild(d3);
    }

    // load vega only when D3 is available, otherwise vega will complain and may crash
    (function loadVega() {
        if (!window.d3) { setTimeout(loadVega, 50); return }
        if (!window.vg) {
            var vega = document.createElement('script');
            vega.src = '//vega.github.io/vega/vega.js';
            body.appendChild(vega);
        }
        if (!window.vl) {
            var vegalite = document.createElement('script');
            vegalite.src = '//vega.github.io/vega-lite/vega-lite.js';
            body.appendChild(vegalite);
        }
    })();

    // append style object to hide spec definitions
    var style = document.createElement('style');
    style.textContent="chart > spec { display: none; }"
    body.appendChild(style)

    // initialize graphs when ready
    Reveal.addEventListener('ready', function(){
        initializeCharts();
    });
})();