import Subjects from './subjects'
import reqwest from 'reqwest'
import { config } from '../lib/cfg'
import doT from 'olado/doT'
import institutions from '../data/institutions.json!json'
import subjectNames from '../data/subjectNames.json!json'
import bean from 'fat/bean'
import groupBy from 'lodash/collection/groupBy'
import uniq from 'lodash/array/uniq'
import bonzo from 'ded/bonzo'
import searchResultsTmpl from '../template/searchresults.html!text'

var searchResultTmplFn = doT.template(searchResultsTmpl);

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

        this.subjectsComponent.choose(config.subjectId || 'all');

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

        bean.on(this.searchResultsEl, 'click', '.ug16__untruncate-btn', function(event) {
            event.target.nextElementSibling.style.display = 'block';
            event.target.parentNode.removeChild(event.target);
        });

        for (let el of [this.subjectEl, this.courseEl, this.institutionEl, this.regionEl]) {
            bean.on(el, 'change', this.updateButtonState.bind(this));
        }
        bean.on(this.courseEl, 'keyup', this.updateButtonState.bind(this));
        bean.on(this.institutionEl, 'keyup', this.updateButtonState.bind(this));

        bean.on(this.searchResultsEl, 'click', 'a.ug16-search-results__rankings-link', function(event) {
            this.clearSearch();
            window.scrollTo(0, bonzo(document.querySelector('#rankings')).offset().top);
        }.bind(this));
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

    getRankingDisplayVal(gsgId, instId) {
        var ranking = this.getRankingSortValue(gsgId, instId);
        if (ranking === 9999) return 'n/a';
        return ranking ? this.getOrdinal(ranking): ranking;
    }

    getOverallRankingDisplayVal(instId) {
        var ranking = institutions[instId][1];
        if (!ranking) return 'n/a';
        return ranking ? this.getOrdinal(ranking): ranking;
    }

    getRankingSortValue(gsgId, instId) {
        if (!this.rankingsData[gsgId]) return 9999;
        return this.rankingsData[gsgId][instId] || 9999;
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

            var subjectInstitutions = [];
            for (let[instId, courses] of subjectResults) {
                subjectInstitutions.push({
                    name: institutions[instId][3],
                    courses: courses,
                    rank: this.getRankingDisplayVal(subjId, instId),
                    overall: this.getOverallRankingDisplayVal(instId)
                });
            }

            subjects.push({
                name: subjectNames[subjId] || 'Miscellaneous',
                link: '#' + subjId,
                institutions: subjectInstitutions
            });
        }

        subjects.sort((a, b) => b.institutions.length - a.institutions.length);

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
                    this.courseData.forEach(c => c.institutionName = institutions[c.instId][3])
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
        var subjectDisabled = config.subjectId ? ' disabled="disabled"' : '';
        return `
        <div class="ug16-search">

            <form>
                <div class="ug16-search__field">
                    <label for='ug16-search__course'>Course</label>
                    <input type="text" id="ug16-search__course" />
                </div>

                <div class="ug16-search__field ug16-search__field--subject-area">
                    <label for='ug16-search__subject'>Subject area</label>
                    <select id="ug16-search__subject"${subjectDisabled}></select>
                </div>

                <div class="ug16-search__field">
                    <label for='ug16-search__region'>Region</label>
                    <select id="ug16-search__region">
                        <option value="all">All regions</option>
                        ${this.regionOptions}
                    </select>
                </div>

                <div class="ug16-search__field">
                    <label for='ug16-search__institution'>Institution</label>
                    <input type="text" id="ug16-search__institution"/>
                </div>

                <button disabled="disabled">Search</button>

            </form>

        </div>
        <div class="ug16-search-results">
        </div>
        `
    }
}
