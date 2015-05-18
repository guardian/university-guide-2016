export default class Table {
    constructor(opts) {
        this.el = opts.el
        this.headers = opts.headers
        this.caption = opts.caption
        this.preprocessData = opts.preprocessData || ( d => d )
        this.opts = opts
        this.renderTable()
        this.renderCaption(this.caption)
    }

    renderTable() {
        this.el.innerHTML = `<table><caption></caption><thead><tr>${this.headersHTML}</tr></thead><tbody></tbody></table>`
    }

    renderCaption(caption) {
        this.el.querySelector('caption').innerHTML = caption;
    }

    get headersHTML() {
        return this.headers.map(h => `<th>${h}</th>`).join('')
    }

    renderData(rows) {
        rows = this.preprocessData(rows)
        function formatValue(val) {
            if (typeof val === 'number' && !Number.isInteger(val)) {
                return val.toFixed(1);
            } else{
                return val;
            }
        }
        var html = rows.map(function(row) {
            return '<tr>' + row.map(cellVal => '<td>' + formatValue(cellVal) + '</td>').join('') + '</tr>';
        }).join('');
        this.el.querySelector('tbody').innerHTML = html;
    }
}
