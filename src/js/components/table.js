export default class Table {
    constructor(opts) {
        this.el = opts.el
        this.preprocessData = opts.preprocessData || ( d => d )
        this.opts = opts
        this.renderTable()
    }

    renderTable() {
        this.el.innerHTML = `<table><caption></caption><thead><tr></tr></thead><tbody></tbody></table>`
    }

    renderCaption(caption) {
        this.el.querySelector('caption').innerHTML = caption;
    }

    renderData(headers, rows) {
        this.el.querySelector('thead tr').innerHTML = headers.map(h => `<th data-h="${h}">${h}</th>`).join('');

        rows = this.preprocessData(rows)
        function formatValue(val) {
            if (typeof val === 'number' && !Number.isInteger(val)) {
                return val.toFixed(1);
            } else{
                return val;
            }
        }
        var html = rows.map(function(row) {
            return '<tr>' + row.map((cellVal, i) => {
                return `<td data-h="${headers[i]}">${formatValue(cellVal)}</td>`;
            }).join('') + '</tr>';
        }).join('');
        this.el.querySelector('tbody').innerHTML = html;
    }
}
