var duality = require('duality/core'),
    db = require('db'),
    async = require('async'),
    jsdiff = require('../jsdiff');


exports.bindHistoryViewer = function (info, req, res) {
    var h = req.h;
    var doc_url = duality.getDBURL() + '/' + req.query.page;
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
};
