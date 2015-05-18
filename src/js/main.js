import reqwest from 'reqwest'
import mainHTML from './text/main.html!text'
import Table from './components/table'
import data from './data/institutionalRankings.json!json';

function init(el, context, config, mediator) {

    el.innerHTML = mainHTML

    var tableComponent = new Table({
        el: el.querySelector('#ug15 .ug15__table-container'),
        caption: 'All universities',
        headers: ['Rank 2016', 'Rank 2015', 'Institution', 'Guardian score/100', 'Satisfied with course',
                'Satisfied with teaching', /*'Satisfied with feedback',*/ 'Student to staff ratio',
                'Spend per student/10', 'Average entry tariff', 'Value added score/10', 'Career after 6 months',
                'Link']
    })
    tableComponent.renderData(data);
}

(window.define || System.amdDefine)(function() { return {init: init}; });
