// Modified from markdown.js from Hakim to handle external html files
(function () {
    /*jslint loopfunc: true, browser: true*/
    /*globals alert*/
    'use strict';

    var querySlidingHtml = function () {
        var sections = document.querySelectorAll('[data-html]'),
            section, j, jlen;

        for (j = 0, jlen = sections.length; j < jlen; j++) {
            section = sections[j];
            var id = 'htmlslide'+j;

            if (section.getAttribute('data-html').length) {

                var xhr = new XMLHttpRequest(),
                    url = section.getAttribute('data-html'),
                    cb = function () {
                        if (xhr.readyState === 4) {
                            if (
                                (xhr.status >= 200 && xhr.status < 300) ||
                                xhr.status === 0 // file protocol yields status code 0 (useful for local debug, mobile applications etc.)
                            ) {
                                section.innerHTML = xhr.responseText;
                                if (section.getAttribute('data-js') !== null) {
                                    // make sure we set a statename to the section if not present
                                    if (section.getAttribute('data-state') === null) {
                                        section.setAttribute('data-state',id);
                                    }
                                    var jsurl = section.getAttribute('data-js');
                                    var script = document.createElement('script')
                                    script.src = jsurl;
                                    section.appendChild(script)
                                    section.removeAttribute('data-js');
                                }
                            } else {
                                section.outerHTML = '<section data-state="alert">ERROR: The attempt to fetch ' + url + ' failed with the HTTP status ' + xhr.status + '. Check your browser\'s JavaScript console for more details.</p></section>';
                            }
                            section.removeAttribute('data-html');
                        }
                    };

                xhr.onreadystatechange = cb;

                xhr.open('GET', url, false);
                try {
                    xhr.send();
                } catch (e) {
                    alert('Failed to get file' + url + '.' + e);
                }
            }
        }
        // test if we should recurse
        sections = document.querySelectorAll('[data-html]');
        if (sections.length > 0) {
            console.log("Recursive HTML slide loading");
            querySlidingHtml();
        }
    };

    querySlidingHtml();
})();