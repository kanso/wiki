/**
 * List functions to be exported from the design doc.
 */

var datelib = require('datelib'),
    async = require('async'),
    db = require('db'),
    duality = require('duality/core'),
    events = require('duality/events'),
    templates = require('duality/templates'),
    jsdiff = require('./jsdiff'),
    utils = require('./utils'),
    shows = require('./shows'),
    ui = require('./ui'),
    _ = require('underscore')._;


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

exports.history_page = function (head, req) {
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

    events.once('afterResponse', function (info, req, res) {
        var doc_url = duality.getDBURL() + '/' + doc._id;
        var curr_url = doc_url + '/history/' + h._id + '.json';
        var tasks = {
            curr: async.apply(db.request, {expect_json: true, url: curr_url})
        };
        if (h.prev) {
            var prev_url = doc_url + '/history/' + h.prev + '.json';
            tasks.prev = async.apply(db.request, {
                expect_json: true,
                url: prev_url
            });
        }
        async.parallel(tasks, function (err, results) {
            if (err) {
                // TODO: improve this
                alert(err);
            }

            var diff = jsdiff.diffString(
                results.prev ? results.prev.body: '',
                results.curr.body
            );

            // jsdiff inserts spaces at the start of each line and each space
            // is doubled for some reason
            diff = diff.replace(/^ /g, '');
            diff = diff.replace(/\n /g, '\n');
            diff = diff.replace(/  /g, ' ');
            diff = diff.replace(/<\/del> /g, '</del>');

            var pre = $('<pre></pre>').html(diff);
            $('#history_diff').html(pre);
        });
    });

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
