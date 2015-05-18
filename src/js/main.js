import reqwest from 'reqwest'
import mainHTML from './text/main.html!text'
import Table from './components/table'
import CourseSearch from './components/coursesearch'
import Subjects from './components/subjects'
import institutionalRankings from './data/institutionalRankings.json!json'
import subjectNames from './data/subjectNames.json!json'

const institutionHeaders = ['Rank 2016', 'Rank 2015', 'Institution', 'Guardian score/100', 'Satisfied with course',
    'Satisfied with teaching', /*'Satisfied with feedback',*/ 'Student to staff ratio', 'Spend per student/10',
    'Average entry tariff', 'Value added score/10', 'Career after 6 months', 'Link'];

const subjectHeaders = institutionHeaders.slice();
subjectHeaders.splice(1, 1);

function preprocessData(data) {
    if (data.length) {
        var i = data[0].length-1;
        return data.map(row => {
            var copy = row.slice();
            copy[i] = `<a href="${row[i]}" target="_blank"></a>`;
            return copy;
        })
    }
}

function init(el, context, config, mediator) {
    el.innerHTML = mainHTML;

    var courseSearchComponent = new CourseSearch({
        el: el.querySelector('#ug16__search-container')
    });

    var subjectsComponent = new Subjects({
        el: el.querySelector('#ug16 .ug16__subject__select'),
        change: (id) => window.location.hash = '#' + id
    });

    var tableComponent = new Table({
        el: el.querySelector('#ug16 .ug16__table-container'),
        preprocessData: preprocessData
    });

    function showInstitutions() {
        tableComponent.renderCaption('All universities');
        tableComponent.renderData(institutionHeaders, institutionalRankings);
    }

    function showSubject(id) {
        tableComponent.renderCaption(subjectNames[id]);
        reqwest({
            url: 'assets/data/subjects/' + id + '.json',
            type: 'json',
            success: tableComponent.renderData.bind(tableComponent, subjectHeaders)
        });
    }

    function showTable() {
        var id = window.location.hash.substring(1);
        if (subjectNames[id]) {
            showSubject(id);
        } else {
            showInstitutions();
        }
    }

    window.addEventListener('hashchange', showTable);
    showTable();
}

(window.define || System.amdDefine)(function() { return {init: init}; });
