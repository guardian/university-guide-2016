import Subjects from './subjects'
import reqwest from 'reqwest'
import { config } from '../lib/cfg'

import institutionalRankings from '../data/institutionalRankings.json!json'
import subjectNames from '../data/subjectNames.json!json'

const institutionHeaders = ['Rank 2016', 'Rank 2015', 'Institution', 'Guardian score/100', 'Satisfied with course',
    'Satisfied with teaching', /*'Satisfied with feedback',*/ 'Student to staff ratio', 'Spend per student/10',
    'Average entry tariff', 'Value added score/10', 'Career after 6 months', 'Link'];

const subjectHeaders = institutionHeaders.slice();
subjectHeaders.splice(1, 1);

var subjectCache = {};

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
        this.callback = opts.callback
        this.renderTable()

        this.subjectsComponent = new Subjects({
            el: this.el.querySelector('select'),
            id: opts.id,
            change: this.show.bind(this)
        });
    }

    renderTable() {
        this.el.innerHTML = `
            <table>
                <caption>
                    <label>Subject <select></select></label>
                </caption>
                <thead><tr></tr></thead>
                <tbody></tbody>
            </table>`;
    }

    renderData(headers, rows) {
        this.el.querySelector('thead tr').innerHTML = headers.map(h => `<th data-h="${h}">${h}</th>`).join('');

        var html = preprocessData(rows).map(function(row) {
            return '<tr>' + row.map((cellVal, i) => `<td data-h="${headers[i]}">${cellVal}</td>`).join('') + '</tr>';
        }).join('');
        this.el.querySelector('tbody').innerHTML = html;
    }

    show(id) {
        if (subjectNames[id]) {
            this.showSubject(id);
        } else {
            this.showInstitutions();
        }
        this.callback(id);
    }

    set(id) {
        this.subjectsComponent.choose(id);
    }

    showSubject(id) {
        if (subjectCache[id]) {
            this.renderData(subjectHeaders, subjectCache[id]);
        } else {
            reqwest({
                url: config.assetPath + '/assets/data/subjects/' + id + '.json',
                type: 'json',
                success: data => {
                    this.renderData(subjectHeaders, data);
                    subjectCache[id] = data;
                }
            });
        }
    }

    showInstitutions() {
        this.renderData(institutionHeaders, institutionalRankings);
    }
}
