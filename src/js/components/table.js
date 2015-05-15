export default class Table {
    constructor(opts) {
        this.el = opts.el
        this.headers = opts.headers
        this.opts = opts
        this.renderTable()
    }

    renderTable() {
        this.el.innerHTML = `<table><thead><tr>${this.headersHTML}</tr></thead><tbody></tbody></table>`
    }

    get headersHTML() {
        return this.headers.map(h => `<th>${h}</th>`).join('')
    }

    renderData(rows) {
        var html = rows.map(function(row) {
            return '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
        }).join('');
        this.el.querySelector('tbody').innerHTML = html;
    }
}
