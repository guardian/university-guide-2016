import names from '../data/subjectNames.json!json'
import bonzo from 'ded/bonzo'

export default class Subjects {
    constructor(props) {
        this.el = props.el
        this.change = props.change;

        bonzo(this.el).html(this.subjectOptions);
        this.el.addEventListener('change', () => {
            this.change(this.el.options[this.el.selectedIndex].value);
        });
    }

    get subjectOptions() {
        return '<option value="all">All subject areas</option>' +
            Object.keys(names).sort((a, b) => names[a] > names[b] ? 1 : -1).map(id => {
                return `<option value="${id}">${names[id]}</option>`
            }).join('');
    }

    choose(id) {
        this.el.selectedIndex = Array.from(this.el.options).findIndex(o => o.value === id);
        this.change(id);
    }
}
