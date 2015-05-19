import Subjects from './subjects'
import { config } from '../lib/cfg'
import reqwest from 'reqwest'
import bean from 'fat/bean'
import bonzo from 'ded/bonzo'

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
            copy[i] = `<a class="institution-link" href="${row[i]}" target="_blank"></a>`;
            return copy;
        })
    }
}

export default class Table {
    constructor(opts) {
        this.el = opts.el
        this.subjectChange = opts.subjectChange

        this.el.innerHTML = this.HTML;
        this.tbodyEl = this.el.querySelector('tbody');

        bean.on(this.el, 'click', 'tbody tr:not(.unranked-message)', this.expandSelection.bind(this));

        this.subjectsComponent = new Subjects({
            el: this.el.querySelector('select'),
            change: this.show.bind(this)
        });
    }

    get HTML() {
        return `<table>
                    <caption>
                        <label for="ug16-table__subject">Subject</label>
                        <select id="ug16-table__subject"></select>
                        <div class="subject-link"></div>
                    </caption>
                    <thead><tr>${this.headersHTML}</tr></thead>
                    <tbody></tbody>
                </table>`;
    }

    get headersHTML() {
        return headers.map(h => `<th data-h="${h}">${h}</th>`).join('');
    }

    get unrankedHTML() {
        return `<tr class="unranked-message">
                    <td colspan="${headers.length}">Other universities where this subject is taught</td>
                </tr>`;
    }

    coursesHTML(courses) {
        return `<tr class="course-list">
                    <td colspan="${headers.length}">
                        <ul>${courses.map(c => `<li><a href="${c[0]}" target="_blank">${c[1]}</a></li>`).join('')}</ul>
                    </td>
                </tr>`;
    }

    renderData(id, data) {
        this.el.setAttribute('data-id', id);

        var unrankedStart = data.institutions.findIndex(row => row[1] == '');
        var html = preprocessData(data.institutions).map((row, pos) => {
            var ret = `<tr data-institution="${row[0]}">` + row.slice(1).map((cell, i) => {
                return `<td data-h="${headers[i]}">${cell || '-'}</td>`;
            }).join('') + '</tr>';

            if (pos === unrankedStart) ret = this.unrankedHTML + ret;
            return ret;
        }).join('');
        this.tbodyEl.innerHTML = html;

        this.el.querySelector('.subject-link').innerHTML =
            `<a href="${data.link}">Find out more about studying ${(subjectNames[id] || '').toLowerCase()}</a>`;
    }

    show(id) {
        id = subjectNames[id] ? id : 'all';

        if (subjectCache[id]) {
            this.renderData(id, subjectCache[id]);
        } else {
            bonzo(this.tbodyEl).addClass('is-loading');

            reqwest({
                url: config.assetPath + '/assets/subjects/overall/' + id + '.json',
                type: 'json',
                success: data => {
                    subjectCache[id] = data;
                    bonzo(this.tbodyEl).removeClass('is-loading');
                    this.show(id);
                }
            });
        }

        this.clearSelection();
        this.subjectChange(id);
    }

    expandSelection(evt) {
        var subjectId = this.el.getAttribute('data-id');

        if (evt.target.tagName !== 'A' && subjectId !== 'all') {
            let row = evt.currentTarget;
            let institutionId = row.getAttribute('data-institution');

            this.clearSelection();

            if (row === this.lastRow || row.className == 'course-list') {
                this.lastRow = undefined;
            } else {
                this.lastRow = row;
                bonzo(this.el).addClass('has-selected');
                bonzo(row).addClass('is-selected');

                let courses = subjectCache[subjectId].courses[institutionId];
                bonzo(row).after(this.coursesHTML(courses));
            }
        }
    }

    clearSelection() {
        bonzo(this.el).removeClass('has-selected');
        bonzo(this.lastRow).removeClass('is-selected');
        bonzo(this.el.querySelector('.course-list')).remove();
    }

    set(id) {
        this.subjectsComponent.choose(id);
    }
}
