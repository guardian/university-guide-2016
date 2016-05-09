import Subjects from './subjects'
import { config } from '../lib/cfg'
import { lowercase as lcSubjectName } from '../lib/subjectNames'
import reqwest from 'reqwest'
import bean from 'fat/bean'
import bonzo from 'ded/bonzo'
import groupBy from 'lodash/collection/groupBy'

import institutions from '../data/institutions.json!json'
import subjectNames from '../data/subjectNames.json!json'

const headers = [
    {'name': 'Rank 2016', 'type': 'numeric'},
    {'name': 'Rank 2015', 'type': 'numeric'},
    {'name': 'Institution', 'type': 'alpha'},
    {'name': 'Guardian score/100', 'type': 'numeric'},
    {'name': 'Satisfied with course', 'type': 'numeric'},

    {'name': 'Satisfied with teaching', 'type': 'numeric'},
    {'name': 'Satisfied with feedback', 'type': 'numeric'},
    {'name': 'Student to staff ratio', 'type': 'numeric'},
    {'name': 'Spend per student/10', 'type': 'numeric'},

    {'name': 'Average entry tariff', 'type': 'numeric'},
    {'name': 'Value added score/10', 'type': 'numeric'},
    {'name': 'Career after 6 months', 'type': 'numeric'},
    {'name': 'Link', 'type': 'nosort'}
];

var untruncateBtn = '<button onclick="event.target.parentNode.removeChild(event.target)" class="ug16__untruncate-btn ug16__untruncate-btn--table"> <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M15 5h2l.5 9.5 9.5.5v2l-9.5.5L17 27h-2l-.5-9.5L5 17v-2l9.5-.5L15 5z"></path></svg> Show all courses </button>'

var rankedInstitutions = Object.keys(institutions).map(id => institutions[id])
    .filter(institution => institution[1]).sort((a, b) => a[1] - b[1])

var subjectCache = {'all': {'institutions': rankedInstitutions}}

function preprocessData(data) {
    if (data.length) {
        var i = data[0].length-1;
        return data.map(row => {
            var copy = row.slice();
            copy[i] = `<a class="ug16-table__institution-link" href="${row[i]}" target="_blank"></a>`;
            return copy;
        })
    }
}

export default class Table {
    constructor(opts) {
        this.el = opts.el
        this.subjectChange = opts.subjectChange

        this.el.innerHTML = this.HTML;
        this.$tbodyEl = bonzo(this.el.querySelector('tbody'));
        this.$tfootEl = bonzo(this.el.querySelector('tfoot'));

        bean.on(this.el, 'click', 'tbody tr:not(.ug16-table__unranked-msg)',
            this.expandSelection.bind(this));
        bean.on(this.el, 'click', 'tfoot tr:not(.ug16-table__unranked-msg)',
            this.expandSelection.bind(this));

        this.subjectsComponent = new Subjects({
            el: this.el.querySelector('select'),
            change: this.show.bind(this)
        });
    }

    get HTML() {
        var subjectDisabled = config.subjectId ? ' disabled="disabled"' : '';
        return `<table class="sortable">
                    <caption>
                        <label for="ug16-table__subject">Subject area</label>
                        <select id="ug16-table__subject"${subjectDisabled}></select>
                        <a href="http://gu.com/p/492f9/">How to use these tables</a>
                        <span class="ug16-table__subject-link"></span>
                    </caption>
                    <thead><tr>${this.headersHTML}</tr></thead>
                    <tbody></tbody>
                    <tfoot></tfoot>
                </table>
                <p class="ug16-table__footnote">
                    Note: dashes are used where there is insufficient data to
                    calculate a ranking position for a provider delivering
                    courses in this subject area
                </p>`;
    }

    get headersHTML() {
        return headers.map(h => `<th class="sorttable_${h.type}" data-h="${h.name}">${h.name}</th>`).join('');
    }

    get unrankedHTML() {
        return `<tr class="ug16-table__unranked-msg">
                    <td colspan="${headers.length}">
                        Other universities where this subject is taught
                    </td>
                </tr>`;
    }

    expandedHTML(stats, courses) {
        var statsHTML =
            '<dl class="ug16-table__stats">' +
                headers.map((header, i) =>
                `<dt>${header.name}</dt><dd>${stats[i + 1] || '-'}</dd>`
                ).slice(4, -1).join('') +
            '</dl>';

        var tiers = groupBy(courses, c => c[2])
        var createCoursesListHTML = courses =>
            '<ul class="ug16-course-list">' +
            courses.map(c => `<li><a href="${c[0]}" target="_blank">${c[1]}</a></li>`).join('') +
            '</ul>';
        var coursesHTML =
            (tiers[1] ? createCoursesListHTML(tiers[1]) : '') +
            (tiers[2] ? untruncateBtn + createCoursesListHTML(tiers[2]) : '');
        return `<tr class="ug16-table__course-list">
                    <td colspan="${headers.length}">
                        ${statsHTML}${coursesHTML}
                    </td>
                </tr>`;
    }

    renderData(id, data) {
        this.el.setAttribute('data-id', id);

        var rows = preprocessData(data.institutions).map((row, pos) => {
            return `<tr data-institution="${row[0]}" class="row-${pos & 1}">` + row.slice(1).map((cell, i) => {
                return `<td data-h="${headers[i].name}">${cell || '-'}</td>`;
            }).join('') + '</tr>';
        });

        var firstUnranked = data.institutions.findIndex(row => row[1] == '');
        if (firstUnranked !== -1) {
            var unrankedRows = rows.splice(firstUnranked);
            this.$tfootEl.html(this.unrankedHTML + unrankedRows.join(''));
        }

        this.$tbodyEl.html(rows.join(''));

        this.el.querySelector('.ug16-table__subject-link').innerHTML =
            `<a href="${data.link}">Find out more about studying ${lcSubjectName(id)}</a>`;
    }

    show(id) {
        id = subjectNames[id] ? id : 'all';

        if (subjectCache[id]) {
            this.renderData(id, subjectCache[id]);
        } else {
            this.$tbodyEl.addClass('is-loading');

            reqwest({
                url: config.assetPath + '/assets/subjects/' + id + '.json',
                type: 'json',
                crossOrigin: true,
                success: data => {
                    subjectCache[id] = data;
                    this.$tbodyEl.removeClass('is-loading');
                    this.show(id);
                }
            });
        }

        this.clearSelection();
        this.subjectChange(id);
    }

    expandSelection(evt) {
        var subjectId = this.el.getAttribute('data-id');

        if (!/( a|label|button|input)/i.test(evt.target.tagName)) {
            let row = evt.currentTarget;
            let institutionId = row.getAttribute('data-institution');

            this.clearSelection();

            if (row === this.lastRow || row.className == 'ug16-table__course-list') {
                this.lastRow = undefined;
            } else {
                this.lastRow = row;
                bonzo(this.el).addClass('has-selected');
                bonzo(row).addClass('is-selected');

                let stats = subjectCache[subjectId].institutions.find(i => i[0] === institutionId);
                let courses = subjectId !== 'all' && subjectCache[subjectId].courses[institutionId];
                bonzo(row).after(this.expandedHTML(stats, courses));
            }
        }
    }

    clearSelection() {
        bonzo(this.el).removeClass('has-selected');
        bonzo(this.lastRow).removeClass('is-selected');
        bonzo(this.el.querySelector('.ug16-table__course-list')).remove();
    }

    set(id) {
        this.subjectsComponent.choose(id);
    }
}
