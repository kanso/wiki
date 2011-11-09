/**
 * List functions to be exported from the design doc.
 */

var datelib = require('datelib'),
    async = require('async'),
    db = require('db'),
    duality = require('duality/core'),
    duality_utils = require('duality/utils'),
    events = require('duality/events'),
    templates = require('duality/templates'),
    jsdiff = require('./jsdiff'),
    utils = require('./utils'),
    shows = require('./shows'),
    editor_ui = require('./ui/editor'),
    history_ui = require('./ui/history'),
    _ = require('underscore')._;


exports.page = function (head, req) {
    start({code: 200, headers: {'Content-Type': 'text/html'}});

    var row, rows = [];
    while (row = getRow()) {
        rows.push(row);
    }

    var doc = _.detect(rows, function (r) {
        return r.id === req.query.page;
    });
    var sidebar = _.detect(rows, function (r) {
        return r.id === 'sidebar';
    });
    if (doc) {
        doc = doc.doc;
    }
    if (sidebar) {
        sidebar = sidebar.doc;
    }
    if (!doc && req.query.page === 'index') {
        doc = utils.createPage('index', req.userCtx.name);
    }
    if (!sidebar) {
        sidebar = utils.createPage('sidebar', req.userCtx.name);
    }

    if (req.query.page === 'sidebar') {
        // don't show the sidebar twice
        sidebar = {
            body: '#### Viewing Sidebar\n\n' +
                  '[Back to home](' + duality_utils.getBaseURL() + ')'
        };
    }

    if (doc) {
        doc.body_html = utils.bodyToHtml(doc.body);
        return {
            title: doc.title,
            content: templates.render('page.html', req, {
                doc: doc,
                pageid: doc._id,
                page_tabs: {page: true},
                sidebar: utils.bodyToHtml(sidebar.body)
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

    var doc = _.detect(rows, function (r) {
        return r.id === req.query.page;
    });
    var sidebar = _.detect(rows, function (r) {
        return r.id === 'sidebar';
    });
    if (doc) {
        doc = doc.doc;
    }
    if (sidebar) {
        sidebar = sidebar.doc;
    }
    if (!doc) {
        doc = utils.createPage(req.query.page, req.userCtx.name);
    }
    if (!sidebar) {
        sidebar = utils.createPage('sidebar', req.userCtx.name);
    }

    events.once('afterResponse', function (info, req, res) {
        editor_ui.bindEditor(doc, req)
    });
    return {
        title: doc.title,
        content: templates.render('edit_page.html', req, {
            doc: doc,
            pageid: doc._id,
            page_tabs: {edit_page: true},
            sidebar: sidebar
        })
    };
};

exports.history_page = function (head, req) {
    start({code: 200, headers: {'Content-Type': 'text/html'}});

    var row, rows = [];
    while (row = getRow()) {
        rows.push(row);
    }

    var doc = _.detect(rows, function (r) {
        return r.id === req.query.page;
    });
    var sidebar = _.detect(rows, function (r) {
        return r.id === 'sidebar';
    });
    if (doc) {
        doc = doc.doc;
    }
    if (sidebar) {
        sidebar = sidebar.doc;
    }
    if (!doc && req.query.page === 'index') {
        doc = utils.createPage('index', req.userCtx.name);
    }
    if (!sidebar) {
        sidebar = utils.createPage('sidebar', req.userCtx.name);
    }

    var h_id = req.query.change || doc.latest_change._id;
    h = _.detect(doc.history, function (h) {
        return h._id === h_id;
    });
    // used in template
    h.selected = true;
    // display newest first
    doc.history.reverse();

    doc.history = _.map(doc.history, function (h) {
        var d = new Date(h.time);
        h.pptime = d.getFullYear() + '-' +
                   (d.getMonth() + 1) + '-' +
                   d.getDate() + ' ' +
                   '(' +
                        utils.zeroPad(d.getHours(), 2) + ':' +
                        utils.zeroPad(d.getMinutes(), 2) + ':' +
                        utils.zeroPad(d.getSeconds(), 2) +
                    ')';
        return h;
    });

    // pass to bindHistoryViewer
    req.h = h;
    events.once('afterResponse', history_ui.bindHistoryViewer);

    // TODO: handle missing doc
    //if (doc) {
        return {
            title: doc.title,
            content: templates.render('history_page.html', req, {
                doc: doc,
                pageid: doc._id,
                page_tabs: {history_page: true}
            })
        };
    //}
    //return shows.empty_page(null, req);
};
