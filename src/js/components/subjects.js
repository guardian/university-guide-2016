import names from '../data/subjectNames.json!json'

export default class Subjects {
    constructor(props) {
        this.el = props.el
        this.change = props.change;

        this.el.innerHTML = this.subjectOptions;
        this.el.addEventListener('change', () => {
            this.change(this.el.options[this.el.selectedIndex].value);
        });
    }

    get subjectOptions() {
        return '<option value="all">All subjects</option>' +
            Object.keys(names).sort((a, b) => names[a] > names[b] ? 1 : -1).map(id => {
                return `<option value="${id}">${names[id]}</option>`
            }).join('');
    }

    choose(id) {
        this.el.selectedIndex = this.el.options.findIndex(o => o.value === id);
        this.change(id);
    }
}
