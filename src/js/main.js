import reqwest from 'reqwest'
import mainHTML from './text/main.html!text'
import Table from './components/table'

function init(el, context, config, mediator) {

    el.innerHTML = mainHTML

    var headers = ['Rank 2015', "Institution", "Guardian score/100", "Satisfied with course",
                "Satisfied with teaching", "Satisfied with feedback", "Student to staff ratio",
                "Spend per student/10", "Average entry tariff", "Value added score/10", "Career after 6 months"];

    var tableComponent = new Table({
        el: el.querySelector('#ug15 .ug15__table-container'),
        headers: headers
    })

	reqwest({
	    url: '/data.json',
	    type: 'json',
	    crossOrigin: true,
	    success: (resp) => tableComponent.renderData([[0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0]])

	});
    tableComponent.renderData([[0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0]])
}

(window.define || System.amdDefine)(function() { return {init: init}; });
