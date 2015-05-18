import Subjects from './subjects'

export default class CourseSearch {
    constructor(opts) {
        this.el = opts.el
        this.el.innerHTML = this.HTML
        this.subjectsComponent = new Subjects({
            el: this.el.querySelector('#ug16-search__subject'),
            change: a => a
        })
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

            <label for='ug16-search__subject'>Subject</label>
            <select id="ug16-search__subject"></select>

            <label for='ug16-search__course'>Course</label>
            <input type="text" id="ug16-search__course" />

            <label for='ug16-search__provider'>Provider</label>
            <input type="text" id="ug16-search__provder" />

            <label for='ug16-search__region'>Region</label>
            <select id="ug16-search__region">
                <option value="all">All regions</option>
                ${this.regionOptions}
            </select>

            <button>Search</button>

        </div>
        `
    }
}
