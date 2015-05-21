import mainHTML from './text/main.html!text'
import Table from './components/table'
import Animation from './components/animation'
import CourseSearch from './components/coursesearch'
import { set as setConfig } from './lib/cfg'

function init(el, config) {
    el.innerHTML = mainHTML;
    setConfig(config);

    var courseSearchComponent = new CourseSearch({
        el: el.querySelector('#ug16__search-container')
    });

    var tableComponent = new Table({
        el: el.querySelector('#ug16 .ug16__table-container'),
        subjectChange: id => window.location.hash = '#' + id
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
}

(window.define || System.amdDefine)(function() { return {init: init}; });
