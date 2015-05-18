import Subjects from './subjects'
import reqwest from 'reqwest'
import { config } from '../lib/cfg'
import doT from 'olado/doT'
import instIdToName from '../data/instIdToName.json!json'

var searchResultHTML = `
<div class="ug16-search-result">
    <h2>{{= it.institution }} <span>({{= it.courses.length }} courses)</span></h2>
    <ul>
        {{~it.courses.slice(0,5) :course:index}}
        <li title="{{= course[2] }}">
            <a href="{{= course[1] }}" target="_blank">{{= course[2] }}</a>
        </li>
        {{~}}
    </ul>
</div>`

var searchResultTmplFn = doT.template(searchResultHTML);
export default class CourseSearch {
    constructor(opts) {
        this.el = opts.el
        this.el.innerHTML = this.HTML

        this.searchResultsEl = el.querySelector('.ug16-search-results')
        this.subjectEl = el.querySelector('#ug16-search__subject')
        this.courseEl = el.querySelector('#ug16-search__course')
        this.providerEl = el.querySelector('#ug16-search__provder')
        this.regionEl = el.querySelector('#ug16-search__region')

        this.subjectsComponent = new Subjects({
            el: this.subjectEl,
            change: a => a
        });

        this.bindEventHandlers();
    }

    bindEventHandlers() {
        this.el.querySelector('form').addEventListener('submit', function(event) {
            event.preventDefault();
            this.search();
        }.bind(this));
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
                    console.log('parsing')
                    this.courseData = resp;
                    console.log('parsed')
                    this.search()
                }.bind(this)
            });
         } else {
            var subj = this.subjectEl.value;
            var course = this.courseEl.value;
            var filtered = this.courseData;
            if (subj !== 'all') filtered = filtered.filter(c => c[3] === subj)
            if (course !== '') filtered = filtered.filter(c => c[2].indexOf(course) !== -1)

            var byProvider = {};
            filtered.map(function(c) {
                byProvider[c[4]] = byProvider[c[4]] || [];
                byProvider[c[4]].push(c);
            });

            var results = Object.keys(byProvider).map(function(instId) {
                return searchResultTmplFn({
                    institution: instIdToName[instId],
                    courses: byProvider[instId]
                });
            }).join('')

            this.searchResultsEl.innerHTML = results
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

                <label for='ug16-search__provider'>Provider</label>
                <input type="text" id="ug16-search__provder" />

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
