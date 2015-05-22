'use strict';
define([], function() {
    function addCSS(url) {
        var head = document.querySelector('head');
        var link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', url);
        head.appendChild(link);
    }

    function polyfillSystemJs(baseURL, cb) {
        var require = window.require;

        // New frontend
        var isSystemJs = !! window.System;
        // Mobile apps
        var isRequireJs = !! window.requirejs;
        // Frontend
        var isCurl = !! (window.require && ! isRequireJs);

        var moduleLoader = isSystemJs ? 'systemjs' : (isCurl ? 'curl' : (isRequireJs ? 'requirejs' : null));

        switch (moduleLoader) {
            case 'systemjs':
                cb(window.System);
                break;
            case 'curl':
                // https://github.com/systemjs/systemjs/issues/461
                window.require = undefined;

                // We assume curl has the js plugin built in
                // document.write is broken in async, so load ES6 module loader manually
                require(['js!' + baseURL + '/es6-module-loader'], function () {
                    require(['js!' + baseURL + '/system!exports=System'], function (System) {
                        // https://github.com/systemjs/systemjs/issues/461
                        // Restore old require
                        window.require = require;
                        cb(System);
                    });
                });
                break;
            case 'requirejs':
                // https://github.com/systemjs/systemjs/issues/461
                window.require = undefined;

                var shim = {};
                shim[baseURL + '/system.js'] = { exports: 'System' };
                var config = { shim: shim };

                // document.write is broken in async, so load ES6 module loader manually
                require(config, [baseURL + '/es6-module-loader.js'], function () {
                    require(config, [baseURL + '/system.js'], function (System) {
                        // https://github.com/systemjs/systemjs/issues/461
                        // Restore old require
                        window.require = require;
                        cb(System);
                    });
                });
                break;
            default:
                throw new Error('No module loader found');
                break;
        }
    };

    function configureSystemJs(baseURL, moduleId, System) {
        // TODO: Use System.clone
        // https://github.com/systemjs/systemjs/issues/457
        System.paths['main'] = baseURL + '/' + moduleId + '.js';
        System.paths['interactive-traceur-runtime'] = baseURL + '/traceur-runtime' + '.js';
        return System;
    };

    return {
        boot: function(el) {

            var config = {
                assetPath: '{{ assetPath }}',
                headline: '{{ headline }}',
                standfirst: '{{ standfirst }}',
                shortUrl: '{{ shortUrl }}',
                subjectId: '{{ subjectId }}'
            };

            // Loading message while we fetch JS / CSS
            el.innerHTML = '<div style="font-size: 24px; text-align: center; padding: 72px 0; font-family: \'Guardian Egyptian Web\',Georgia,serif;">Loading…</div>';

            // Load CSS asynchronously
            window.setTimeout(function() {
                addCSS('{{ assetPath }}/main.css');
            }, 10);



            var baseURL = config.assetPath;
            var moduleId = 'main';
            polyfillSystemJs(baseURL, function (System) {
                configureSystemJs(baseURL, moduleId, System);
                // Annoyingly Traceur runtime is not bundled, so we load it
                // manually
                // https://github.com/systemjs/systemjs/issues/431
                System.import('interactive-traceur-runtime').then(function () {
                    // Traceur runtime overrides window.System
                    // https://github.com/systemjs/builder/issues/169#issuecomment-103933246
                    window.System = System;
                    System.import(moduleId).then(function (main) {
                        main.default.init(el, config);
                    });
                });
            });
        }
    };
});
