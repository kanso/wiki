/**
 * Show functions to be exported from the design doc.
 */

var datelib = require('datelib'),
    templates = require('duality/templates'),
    events = require('duality/events'),
    utils = require('./utils'),
    discussion_ui = require('./ui/discussion');


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
        discussion_ui.bindDiscussionPage(doc, req);
    });
    return {
        title: doc.title || req.query.page,
        content: templates.render('discussion.html', req, {
            doc: doc,
            comments_target: doc._id || req.query.page,
            pageid: doc._id,
            page_tabs: {discussion_page: true}
        })
    };
};
