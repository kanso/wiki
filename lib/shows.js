/**
 * Show functions to be exported from the design doc.
 */

var datelib = require('datelib'),
    templates = require('kanso/templates'),
    events = require('kanso/events'),
    utils = require('./utils'),
    ui = require('./ui');


exports.edit_page = function (doc, req) {
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
            page_tabs: {edit: true}
        })
    };
};

exports.add_page = function (doc, req) {
    doc = {
        _id: req.query.page,
        type: 'page',
        title: req.query.page,
        subtitle: 'Page subtitle',
        body: '',
        time: {
            created: datelib.ISODateString()
        },
        creator: req.userCtx.name
    };
    return exports.edit_page(doc, req);
};

exports.empty_page = function (doc, req) {
    if (req.query.page && req.query.page[0] === '_') {
        return exports.not_found(doc, req);
    }
    return {
        title: req.query.page,
        content: templates.render('empty_page.html', req, {
            page: req.query.page
        })
    };
};

exports.not_found = function (doc, req) {
    return {
        code: 404,
        title: 'Not found',
        content: templates.render('404.html', req, {})
    };
};

exports.discussion = function (doc, req) {
    if (req.query.page && req.query.page[0] === '_') {
        return exports.not_found(doc, req);
    }
    doc = doc || {};
    events.once('afterResponse', function (info, req, res) {
        ui.bindDiscussionPage(doc, req);
    });
    return {
        title: doc.title || req.query.page,
        content: templates.render('discussion.html', req, {
            doc: doc,
            comments_target: doc._id || req.query.page,
            page_tabs: {discussion: true}
        })
    };
};
