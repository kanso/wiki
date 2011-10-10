/**
 * List functions to be exported from the design doc.
 */

var templates = require('kanso/templates'),
    utils = require('./utils'),
    shows = require('./shows');


exports.page = function (head, req) {
    start({code: 200, headers: {'Content-Type': 'text/html'}});

    var row, rows = [];
    while (row = getRow()) {
        rows.push(row);
    }

    if (rows.length) {
        var doc = rows[0].doc;
        doc.body_html = utils.bodyToHtml(doc.body);
        return {
            title: doc.title,
            content: templates.render('page.html', req, {
                doc: doc,
                page_tabs: {page: true}
            })
        };
    }
    return shows.empty_page(null, req);
};
