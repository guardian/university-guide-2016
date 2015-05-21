import Subjects from './subjects'
import reqwest from 'reqwest'
import { config } from '../lib/cfg'
import doT from 'olado/doT'
import instIdToName from '../data/instIdToName.json!json'
import subjectNames from '../data/subjectNames.json!json'
import bean from 'fat/bean'
import groupBy from 'lodash/collection/groupBy'
import uniq from 'lodash/array/uniq'

const buttonSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M15 5h2l.5 9.5 9.5.5v2l-9.5.5L17 27h-2l-.5-9.5L5 17v-2l9.5-.5L15 5z"/></svg>';

var searchResultTmplFn = doT.template(`
{{##def.courseli:course:
<li title="{{= course.name }}">
    <a href="{{= course.url }}" target="_blank">{{= course.name }}</a>
</li>
#}}
{{##def.institutiondiv:institution:
<div class="ug16-search-result">
    <h2>
        {{= institution.name }}
        <div class="ug16-search__ranking">Ranked 5th overall, {{= institution.rank}} in subject</div>
        <div class="ug16-search__course-count">
            {{= institution.courses.length }} course{{? institution.courses.length > 1 }}s{{?}}
        </div>
    </h2>
    <div class="ug16-search__course-list">
        {{?institution.courses.length <= 5}}
            <ul class="ug16-course-list">
                {{~institution.courses :course:j}}
                    {{#def.courseli:course}}
                {{~}}
            </ul>
        {{?}}
        {{?institution.courses.length > 5}}
            <ul class="ug16-course-list">
                {{~institution.courses.slice(0,3) :course:j}}
                    {{#def.courseli:course}}
                {{~}}
            </ul>
            <button class="ug16-search-result__untruncate">
                ${buttonSVG} Show all
            </button>
            <ul class="ug16-course-list" style="display:none;">
                {{~institution.courses.slice(3) :course:j}}
                    {{#def.courseli:course}}
                {{~}}
            </ul>
        {{?}}
    </div>
</div>
#}}
{{~it.subjects :subject:index}}
    <div class="ug16-search-subject">
        <h2 class="ug16-search-subject__name">
            <div style="font-size: 12px">courses in</div>{{= subject.name}}
            <a href="{{= subject.link}}">view rankings</a>
        </h2>
        <div class="ug16-search-subject__results">
            {{?subject.institutions.length <= 3}}
                {{~subject.institutions :institution:i}}
                    {{#def.institutiondiv:institution}}
                {{~}}
            {{?}}
            {{?subject.institutions.length > 3}}
                {{~subject.institutions.slice(0, 2) :institution:i}}
                    {{#def.institutiondiv:institution}}
                {{~}}
                <button class="ug16-search-result__untruncate">
                    ${buttonSVG} Show all
                </button>
                <div class="ug16-search-result__extra">
                    {{~subject.institutions.slice(2) :institution:i}}
                        {{#def.institutiondiv:institution}}
                    {{~}}
                </div>
            {{?}}
        </div>
    </div>
{{~}}`);

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
        this.institutionEl = el.querySelector('#ug16-search__institution')
        this.regionEl = el.querySelector('#ug16-search__region')
        this.searchButtonEl = el.querySelector('.ug16-search form button')

        this.subjectsComponent = new Subjects({
            el: this.subjectEl,
            change: a => a
        });

        this.bindEventHandlers();

        this.search();
    }

    bindEventHandlers() {

        bean.on(this.el.querySelector('form'), 'submit', function(event) {
            if (!this.isFilterEmpty) {
                event.preventDefault();
                this.search();
            }
        }.bind(this));

        bean.on(this.searchResultsEl, 'click', '.ug16-search-results__close-btn', function(event) {
            this.clearSearch();
        }.bind(this))

        bean.on(this.searchResultsEl, 'click', '.ug16-search-result__untruncate', function(event) {
            event.target.nextElementSibling.style.display = 'block';
            event.target.parentNode.removeChild(event.target);
        });

        for (let el of [this.subjectEl, this.courseEl, this.institutionEl, this.regionEl]) {
            bean.on(el, 'change', this.updateButtonState.bind(this));
        }
        bean.on(this.courseEl, 'keyup', this.updateButtonState.bind(this));
        bean.on(this.institutionEl, 'keyup', this.updateButtonState.bind(this));

        bean.on(this.searchResultsEl, 'click', function(event) {
            if (event.target.className === 'ug16-search-results__rankings-link') {
                this.clearSearch();
                this.scrollToTable();
            }
        }.bind(this));
    }

    scrollToTable() {
        window.scrollTo(null, this.el.getBoundingClientRect().top);
    }

    updateButtonState() {
        if (this.isFilterEmpty) {
            this.searchButtonEl.setAttribute('disabled', 'disabled');
        } else {
            this.searchButtonEl.removeAttribute('disabled');
        }
    }

    get isFilterEmpty() {
        return this.subjectEl.value === 'all' && this.courseEl.value === '' &&
            this.institutionEl.value === '' && this.regionEl.value === 'all';
    }

    clearSearch() {
        this.searchResultsEl.innerHTML = '';
    }

    getOrdinal(n) {
       var s=["th","st","nd","rd"],
           v=n%100;
       return n+(s[(v-20)%10]||s[v]||s[0]);
    }

    getRankingDisplayVal(gsgId, instId, ordinal) {
        var ranking = this.getRankingSortValue(gsgId, instId);
        if (ranking === 9999) return 'n/a';
        return (ordinal && ranking) ? this.getOrdinal(ranking): ranking;
    }

    getRankingSortValue(gsgId, instId) {
        if (!this.rankingsData[gsgId]) return 9999;
        return this.rankingsData[gsgId][instId] || 9999;
    }

    searchResultHTML(subjId, results) {
        var institutions = [];
        for (let[instId, courses] of results) {
            institutions.push({
                name: instIdToName[instId],
                courses: courses,
                rank: this.getRankingDisplayVal(subjId, instId, true)
            });
        }
        return institutions;
    }

    renderSearchResults(results) {
        var filtered = results;
        var numProviders = uniq(filtered.map(c => c.instId)).length;

        var bySubject = groupBy(filtered, 'gsgId');
        Object.keys(bySubject).map(function(k) {
            bySubject[k] = groupBy(bySubject[k], 'instId');
        });

        var statsHTML = `
            <div class="ug16-search-results__meta">
                <p>
                    Search results: <strong>${filtered.length}</strong> courses across <strong>${numProviders}</strong> institutions
                </p>
                <button class="ug16-search-results__close-btn">
                    <svg viewBox="0 0 33.2 33.2">
                        <g>
                            <polygon points="2.1,0 0,2.1 14.8,18.4 31.4,32.9 33.2,31.1 18.4,14.8 "></polygon>
                            <polygon points="0,31.1 2.1,33.2 18.4,18.4 33.2,2.1 31.1,0 14.8,14.8 "></polygon>
                        </g>
                    </svg>
                </button>
            </div>`;

        var subjects = [];
        for (let [subjId, byInstitution] of entries(bySubject)) {
            var subjectResults = entries(byInstitution)
                .sort((a,b) => this.getRankingSortValue(subjId, a[0]) - this.getRankingSortValue(subjId, b[0]));

            subjects.push({
                name: subjectNames[subjId],
                link: '#' + subjId,
                institutions: this.searchResultHTML(subjId, subjectResults)
            });
        }

        console.log(subjects);

        this.searchResultsEl.innerHTML = statsHTML + searchResultTmplFn({subjects: subjects});
    }

    renderErrorMessage(msg) {
        var errorHTML = `
            <div class="ug16-search-results__meta">
                <p>${msg}</p>
                <button class="ug16-search-results__close-btn">
                    <svg viewBox="0 0 33.2 33.2">
                        <g>
                            <polygon points="2.1,0 0,2.1 14.8,18.4 31.4,32.9 33.2,31.1 18.4,14.8 "></polygon>
                            <polygon points="0,31.1 2.1,33.2 18.4,18.4 33.2,2.1 31.1,0 14.8,14.8 "></polygon>
                        </g>
                    </svg>
                </button>
            </div>`
        this.searchResultsEl.innerHTML = errorHTML
    }

    renderLoadingMessage() {
        this.searchResultsEl.innerHTML = `
            <div class="ug16-search-results__meta">
                <p>Searching…</p>
            </div>`
    }

    search() {
         if (!this.courseData) {
            this.renderLoadingMessage();
            reqwest({
                url: config.assetPath + '/assets/search.json',
                type: 'json',
                crossOrigin: true,
                success: function(resp) {
                    this.courseData = resp.courses;
                    this.courseData.forEach(c => c.institutionName = instIdToName[c.instId])
                    this.courseData.forEach(c => c.subjName = subjectNames[c.gsgId] || 'Unknown subject')
                    this.rankingsData = resp.rankings;
                    this.regionsData = resp.regions;
                    this.search();
                }.bind(this)
            });
         } else {
            this.renderLoadingMessage();

            window.setTimeout(function() {
                var subj = this.subjectEl.value;
                var course = this.courseEl.value;
                var institution = this.institutionEl.value;
                var region = this.regionEl.value;
                var filtered = this.courseData;
                if (subj !== 'all') filtered = filtered.filter(c => c.gsgId === subj)
                if (course !== '') {
                    let regexps = course.split(' ').map(word => new RegExp(word, 'i'))
                    filtered = filtered.filter(c => !regexps.find(re => !re.test(c.name)))
                }
                if (institution !== '') {
                    let regexps = institution.split(' ').map(word => new RegExp(word, 'i'))
                    filtered = filtered.filter(c => !regexps.find(re => !re.test(c.institutionName)))
                }
                if (region !== 'all') filtered = filtered.filter(c => this.regionsData[c.instId] === region);
                if (filtered.length > 5000) this.renderErrorMessage('Too many results. Please refine your search!')
                else this.renderSearchResults(filtered)
            }.bind(this), 10);
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
                <div class="ug16-search__field">
                    <label for='ug16-search__subject'>Subject</label>
                    <select id="ug16-search__subject"></select>
                </div>

                <div class="ug16-search__field">
                    <label for='ug16-search__course'>Course</label>
                    <input type="text" id="ug16-search__course" value="film" />
                </div>

                <div class="ug16-search__field">
                    <label for='ug16-search__institution'>Institution</label>
                    <input type="text" id="ug16-search__institution"/>
                </div>

                <div class="ug16-search__field">
                    <label for='ug16-search__region'>Region</label>
                    <select id="ug16-search__region">
                        <option value="all">All regions</option>
                        ${this.regionOptions}
                    </select>
                </div>

                <button disabled="disabled">Search</button>

            </form>

        </div>
        <div class="ug16-search-results">
        </div>
        `
    }
}
