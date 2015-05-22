import mainTemplate from './template/main.html!text'
import Table from './components/table'
import Animation from './components/animation'
import ShareButtons from './components/sharebuttons'
import CourseSearch from './components/coursesearch'
import { set as setConfig } from './lib/cfg'
import doT from 'olado/doT'

var mainTemplateFn = doT.template(mainTemplate);

function init(el, config) {
    setConfig(config);
    el.innerHTML = mainTemplateFn(config);

    var courseSearchComponent = new CourseSearch({
        el: el.querySelector('#ug16__search-container')
    });

    var tableComponent = new Table({
        el: el.querySelector('#ug16 .ug16__table-container'),
        subjectChange: id => window.location.hash = '#' + id
    });

    var shareButtonsComponent = new ShareButtons({
        el: el.querySelector('.ug16__share-buttons'),
        shortUrl: config.shortUrl,
        headline: config.headline
    });

    var animationComponent = new Animation({
        el: el.querySelector('.ug16__animation-container'),
        subjectChange: id => window.location.hash = '#' + id
    });

    function showTable() {
        tableComponent.set(window.location.hash.substring(1));
    }
    window.addEventListener('hashchange', showTable);
    showTable();

    if (window.guardian) {
        document.querySelector('.l-footer').style.display = 'block';
    }
}

(window.define || System.amdDefine)(function() { return {init: init}; });
