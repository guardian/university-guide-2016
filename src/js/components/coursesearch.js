import Subjects from './subjects'
import reqwest from 'reqwest'
import { config } from '../lib/cfg'
import doT from 'olado/doT'
import instIdToName from '../data/instIdToName.json!json'
import subjectNames from '../data/subjectNames.json!json'
import bean from 'fat/bean'
import groupBy from 'lodash/collection/groupBy'
import uniq from 'lodash/array/uniq'

var searchResultTmplFn = doT.template(`
<div class="ug16-search-result">
    <h2>{{= it.institution }} <span>{{= it.courses.length }} course{{? it.courses.length > 1 }}s{{?}}</span></h2>
    <ul>
        {{~it.courses.slice(0,5) :course:index}}
        <li title="{{= course[2] }}">
            <a href="{{= course[1] }}" target="_blank">{{= course[2] }}</a>
        </li>
        {{~}}
    </ul>
    {{?it.courses.length > 5}}
    <button class="ug16-search-result__untruncate">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M15 5h2l.5 9.5 9.5.5v2l-9.5.5L17 27h-2l-.5-9.5L5 17v-2l9.5-.5L15 5z"/></svg>
        Show more courses
    </button>
    <ul style="display:none;">
        {{~it.courses.slice(5) :course:index}}
        <li title="{{= course[2] }}">
            <a href="{{= course[1] }}" target="_blank">{{= course[2] }}</a>
        </li>
        {{~}}
    </ul>
    {{?}}
</div>`);

function entries(obj) {
    return Object.keys(obj).map(k => [k, obj[k]])
}

export default class CourseSearch {
    constructor(opts) {
        var el = this.el = opts.el
        this.el.innerHTML = this.HTML

        this.searchResultsEl = el.querySelector('.ug16-search-results')
        this.subjectEl = el.querySelector('#ug16-search__subject')
        this.courseEl = el.querySelector('#ug16-search__course')
        this.institutionEl = el.querySelector('#ug16-search__provder')
        this.regionEl = el.querySelector('#ug16-search__region')

        this.subjectsComponent = new Subjects({
            el: this.subjectEl,
            change: a => a
        });

        this.bindEventHandlers();
    }

    bindEventHandlers() {

        bean.on(this.el.querySelector('form'), 'submit', function(event) {
            event.preventDefault();
            this.search();
        }.bind(this));

        bean.on(this.searchResultsEl, 'click', '.ug16-search-results__close-btn', function(event) {
            this.clearSearch();
        }.bind(this))

        bean.on(this.searchResultsEl, 'click', '.ug16-search-result .ug16-search-result__untruncate', function(event) {
            console.log('untruncate', event);
            event.target.nextElementSibling.style.display = 'block';
            event.target.parentNode.removeChild(event.target);
        });
    }

    clearSearch() {
        this.searchResultsEl.innerHTML = '';
    }

    search() {
         /*
         [
          1,
          "http://www.hud.ac.uk/courses/2014-15/00000025",
          "BSc (hons) physiotherapy (optional foundation year)",
          "S040",
          "0061",
          "00000025"
         ]*/
         if (!this.courseData) {
            this.searchResultsEl.innerHTML = 'Loading…'
            reqwest({
                url: config.assetPath + '/assets/courses.json' ,
                type: 'json',
                crossOrigin: true,
                success: function(resp) {
                    this.courseData = resp;
                    this.search()
                }.bind(this)
            });
         } else {
            var subj = this.subjectEl.value;
            var course = this.courseEl.value;
            var filtered = this.courseData;
            var regexps = course.split(' ').map(word => new RegExp(word, 'i'))
            if (subj !== 'all') filtered = filtered.filter(c => c[3] === subj)
            if (course !== '') filtered = filtered.filter(c => !regexps.find(re => !re.test(c[2])))

            var numProviders = uniq(filtered.map(c => c[4])).length

            var bySubject = groupBy(filtered, 3);
            Object.keys(bySubject).map(function(k) {
                bySubject[k] = groupBy(bySubject[k], 4);
            });

            var statsHTML = `
                <div class="ug16-search-results__stats">
                    Search results: <strong>${filtered.length}</strong> courses across <strong>${numProviders}</strong> institutions
                    <button class="ug16-search-results__close-btn">
                        <svg viewBox="0 0 33.2 33.2">
                            <g>
                                <polygon points="2.1,0 0,2.1 14.8,18.4 31.4,32.9 33.2,31.1 18.4,14.8 "></polygon>
                                <polygon points="0,31.1 2.1,33.2 18.4,18.4 33.2,2.1 31.1,0 14.8,14.8 "></polygon>
                            </g>
                        </svg>
                    </button>
                </div>`

            var resultsHTML = statsHTML;

            for (let [subjId, byInstitution] of entries(bySubject)) {
                resultsHTML += `<h2 class="ug16-search-results__subject">${subjectNames[subjId]}</h2>`
                resultsHTML += '<div class="ug16-search-results-group">'
                for (let [instId, course] of entries(byInstitution)) {
                    resultsHTML += searchResultTmplFn({
                        institution: instIdToName[instId],
                        courses: course
                    });
                }
                resultsHTML += '</div>'
            }

            this.searchResultsEl.innerHTML = resultsHTML
         }
    }

    get regions() {
        return ["East Midlands","East of England","London","North East England","North West England",
                "Northern Ireland","Scotland","South East England","South West England","Wales",
                "West Midlands","Yorkshire and the Humber"];
    }

    get regionOptions() {
        return this.regions.map(r => `<option value="${r}">${r}</option>`).join('')
    }

    get HTML() {
        return `
        <div class="ug16-search">

            <form>
                <label for='ug16-search__subject'>Subject</label>
                <select id="ug16-search__subject"></select>

                <label for='ug16-search__course'>Course</label>
                <input type="text" id="ug16-search__course"/>

                <label for='ug16-search__institution'>Institution</label>
                <input type="text" id="ug16-search__institution" />

                <label for='ug16-search__region'>Region</label>
                <select id="ug16-search__region">
                    <option value="all">All regions</option>
                    ${this.regionOptions}
                </select>

                <button>Search</button>
            </form>

        </div>
        <div class="ug16-search-results">
        </div>
        `
    }
}
