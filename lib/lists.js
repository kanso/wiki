/**
 * List functions to be exported from the design doc.
 */

var datelib = require('datelib'),
    events = require('duality/events'),
    templates = require('duality/templates'),
    utils = require('./utils'),
    shows = require('./shows'),
    ui = require('./ui');


exports.page = function (head, req) {
    start({code: 200, headers: {'Content-Type': 'text/html'}});

    var row, rows = [];
    while (row = getRow()) {
        rows.push(row);
    }

    var doc;
    if (rows.length) {
        doc = rows[0].doc;
    }
    else if (req.query.page === 'index') {
        doc = utils.createPage('index', req.userCtx.name);
    }

    if (doc) {
        doc.body_html = utils.bodyToHtml(doc.body);
        return {
            title: doc.title,
            content: templates.render('page.html', req, {
                doc: doc,
                pageid: doc._id,
                page_tabs: {page: true}
            })
        };
    }
    return shows.empty_page(null, req);
};


exports.edit_page = function (head, req) {
    start({code: 200, headers: {'Content-Type': 'text/html'}});

    var row, rows = [];
    while (row = getRow()) {
        rows.push(row);
    }

    var doc;
    if (rows.length) {
        doc = rows[0].doc;
    }
    else {
        doc = utils.createPage(req.query.page, req.userCtx.name);
    }

    doc.updatedBy = req.userCtx.name;
    if (!doc.time) {
        doc.time = {};
    }
    doc.time.modified = datelib.ISODateString();
    events.once('afterResponse', function (info, req, res) {
        ui.bindEditor(doc, req)
    });
    return {
        title: doc.title,
        content: templates.render('edit_page.html', req, {
            doc: doc,
            pageid: doc._id,
            page_tabs: {edit_page: true}
        })
    };
};
