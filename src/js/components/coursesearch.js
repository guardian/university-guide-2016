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
    <h2>
        <span class="ug16-search__institution-rank">
            {{= it.rank }}
        </span>
        {{= it.institution }}
        <span class="ug16-search__course-count">{{= it.courses.length }} course{{? it.courses.length > 1 }}s{{?}}</span>
    </h2>

    {{?it.courses.length <= 7}}
        <ul>
            {{~it.courses :course:index}}
            <li title="{{= course.name }}">
                <a href="{{= course.url }}" target="_blank">{{= course.name }}</a>
            </li>
            {{~}}
        </ul>
    {{?}}
    {{?it.courses.length > 7}}
        <ul>
            {{~it.courses.slice(0,5) :course:index}}
            <li title="{{= course.name }}">
                <a href="{{= course.url }}" target="_blank">{{= course.name }}</a>
            </li>
            {{~}}
        </ul>
        <button class="ug16-search-result__untruncate">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M15 5h2l.5 9.5 9.5.5v2l-9.5.5L17 27h-2l-.5-9.5L5 17v-2l9.5-.5L15 5z"/></svg>
            Show more courses
        </button>
        <ul style="display:none;">
            {{~it.courses.slice(5) :course:index}}
            <li title="{{= course.name }}">
                <a href="{{= course.url }}" target="_blank">{{= course.name }}</a>
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
        this.institutionEl = el.querySelector('#ug16-search__institution')
        this.regionEl = el.querySelector('#ug16-search__region')
        this.searchButtonEl = el.querySelector('.ug16-search form button')

        this.subjectsComponent = new Subjects({
            el: this.subjectEl,
            change: a => a
        });

        this.bindEventHandlers();
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

        bean.on(this.searchResultsEl, 'click', '.ug16-search-result .ug16-search-result__untruncate', function(event) {
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

    renderSearchResults(results) {
        var filtered = results;
        var numProviders = uniq(filtered.map(c => c.instId)).length

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
                </div>`

            var resultsHTML = statsHTML;

            for (let [subjId, byInstitution] of entries(bySubject)) {
                var subjectLink = subjectNames[subjId] ? `<a class="ug16-search-results__rankings-link" href="#${subjId}">view rankings</a>` : '';
                resultsHTML += `<h2 class="ug16-search-results__subject">${subjectNames[subjId] || 'Unknown subject'} ${subjectLink}</h2>`;

                var subjectResultsHTML = ''
                var subjectResults = entries(byInstitution)
                    .sort((a,b) => this.getRankingSortValue(subjId, a[0]) - this.getRankingSortValue(subjId, b[0]))
                for (let [instId, courses] of subjectResults) {
                    subjectResultsHTML += searchResultTmplFn({
                        institution: instIdToName[instId],
                        courses: courses,
                        rank: this.getRankingDisplayVal(subjId, instId, true)
                    });
                }
                resultsHTML += `<div class="ug16-search-results-group">${subjectResultsHTML}</div>`;
            }

            this.searchResultsEl.innerHTML = resultsHTML
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
                    this.search();
                }.bind(this)
            });
         } else {
            this.renderLoadingMessage();

            window.setTimeout(function() {
                var subj = this.subjectEl.value;
                var course = this.courseEl.value;
                var filtered = this.courseData;
                var regexps = course.split(' ').map(word => new RegExp(word, 'i'))
                if (subj !== 'all') filtered = filtered.filter(c => c.gsgId === subj)
                if (course !== '') filtered = filtered.filter(c => !regexps.find(re => !re.test(c.name)))

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
                    <input type="text" id="ug16-search__course"/>
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
