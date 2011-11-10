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
    discussion_ui = require('./ui/discussion'),
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
                sidebar: utils.bodyToHtml(sidebar.body),
                logged_in: !!(req.userCtx.name)
            })
        };
    }
    else {
        // empty page
        if (req.query.page && req.query.page[0] === '_') {
            return exports.not_found(doc, req);
        }
        return {
            title: utils.idToTitle(req.query.page),
            content: templates.render('empty_page.html', req, {
                pageid: req.query.page,
                page_title: utils.idToTitle(req.query.page),
                page_tabs: {page: true},
                sidebar: utils.bodyToHtml(sidebar.body),
                logged_in: !!(req.userCtx.name),
                empty_doc: true
            })
        };
    }
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
    var empty_doc = !(doc);
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
            sidebar: sidebar,
            logged_in: !!(req.userCtx.name),
            empty_doc: empty_doc
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
    var empty_doc = !(doc);
    if (!doc && req.query.page === 'index') {
        doc = utils.createPage('index', req.userCtx.name);
    }
    if (!sidebar) {
        sidebar = utils.createPage('sidebar', req.userCtx.name);
    }

    if (doc) {
        var h;
        if (!empty_doc) {
            var h_id = req.query.change || doc.latest_change._id;
            h = _.detect(doc.history, function (h) {
                return h._id === h_id;
            });
            // used in template
            h.selected = true;
            // display newest first
            doc.history.reverse();

            doc.history = _.map(doc.history, function (h) {
                h.pptime = utils.prettyTime(h.time);
                return h;
            });
        }

        // pass to bindHistoryViewer
        req.h = h;
        events.once('afterResponse', history_ui.bindHistoryViewer);

        return {
            title: doc.title,
            content: templates.render('history_page.html', req, {
                doc: doc,
                pageid: doc._id,
                page_tabs: {history_page: true},
                logged_in: !!(req.userCtx.name),
                empty_doc: empty_doc
            })
        };
    }
    else {
        return {
            title: utils.idToTitle(req.query.page),
            content: templates.render('empty_history_page.html', req, {
                doc: doc,
                pageid: req.query.page,
                page_title: utils.idToTitle(req.query.page),
                page_tabs: {history_page: true},
                logged_in: !!(req.userCtx.name),
                empty_doc: empty_doc
            })
        };
    }
};


exports.discussion = function (head, req) {
    start({code: 200, headers: {'Content-Type': 'text/html'}});

    var row, rows = [];
    while (row = getRow()) {
        rows.push(row);
    }
    var comments = _.filter(rows, function (r) {
        return r.doc.type === 'comment';
    });
    var doc_row = _.detect(rows, function (r) {
        return r.doc.type === 'page';
    });
    var empty_doc = !(doc_row);
    var doc = doc_row ? doc_row.doc: {};

    comments = _.map(comments, function (c) {
        c.doc.type = 'comment';
        c.doc.pptime = utils.prettyTime(c.doc.time);
        return c.doc;
    });
    // add edit events to comments
    if (doc && doc.history) {
        _.each(doc.history, function (h) {
            h.type = 'edit';
            h.is_edit = true;
            h.pptime = utils.prettyTime(h.time);
            comments.push(h);
        });
    }
    comments = _.sortBy(comments, function (c) {
        return c.time;
    });
    var participants = comments.map(function (c) {
        return c.user;
    });
    participants = _.uniq(participants);

    if (req.query.page && req.query.page[0] === '_') {
        return shows.not_found(null, req);
    }

    events.once('afterResponse', discussion_ui.bindDiscussion);

    return {
        title: doc.title || utils.idToTitle(req.query.page),
        content: templates.render('discussion.html', req, {
            doc: doc,
            page_title: doc.title || utils.idToTitle(req.query.page),
            page_subtitle: doc.subtitle,
            pageid: doc._id || req.query.page,
            participants: participants,
            comments: comments,
            page_tabs: {discussion_page: true},
            logged_in: !!(req.userCtx.name),
            empty_doc: empty_doc
        })
    };
};
