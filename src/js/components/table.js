import Subjects from './subjects'
import { config } from '../lib/cfg'
import reqwest from 'reqwest'

import institutionalRankings from '../data/institutionalRankings.json!json'
import subjectNames from '../data/subjectNames.json!json'

const headers = ['Rank 2016', 'Rank 2015', 'Institution', 'Guardian score/100', 'Satisfied with course',
    'Satisfied with teaching', /*'Satisfied with feedback',*/ 'Student to staff ratio', 'Spend per student/10',
    'Average entry tariff', 'Value added score/10', 'Career after 6 months', 'Link'];

var subjectCache = {'all': {'institutions': institutionalRankings}};

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

export default class Table {
    constructor(opts) {
        this.el = opts.el
        this.subjectChange = opts.subjectChange

        this.el.innerHTML = this.HTML;

        this.subjectsComponent = new Subjects({
            el: this.el.querySelector('select'),
            change: this.show.bind(this)
        });
    }

    get HTML() {
        return `<table>
                    <caption>
                        <label>Subject <select></select></label>
                        <span class="subject-link"></span>
                    </caption>
                    <thead><tr>${this.headersHTML}</tr></thead>
                    <tbody></tbody>
                </table>`;
    }

    get headersHTML() {
        return headers.map(h => `<th data-h="${h}">${h}</th>`).join('');
    }

    renderData(id, data) {
        this.el.setAttribute('data-id', id);

        var html = preprocessData(data.institutions).map(function(row) {
            return '<tr>' + row.map((cellVal, i) => `<td data-h="${headers[i]}">${cellVal}</td>`).join('') + '</tr>';
        }).join('');
        this.el.querySelector('tbody').innerHTML = html;

        this.el.querySelector('.subject-link').innerHTML =
            `<a href="${data.link}">Find out more about studying ${(subjectNames[id] || '').toLowerCase()}</a>`;

    }

    show(id) {
        id = subjectNames[id] ? id : 'all';

        if (subjectCache[id]) {
            this.renderData(id, subjectCache[id]);
        } else {
            reqwest({
                url: config.assetPath + '/assets/subjects/overall/' + id + '.json',
                type: 'json',
                success: data => {
                    subjectCache[id] = data;
                    this.show(id);
                }
            });
        }

        this.subjectChange(id);
    }

    set(id) {
        this.subjectsComponent.choose(id);
    }
}
