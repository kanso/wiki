var session = require('session'),
    datelib = require('datelib'),
    duality = require('duality/core'),
    db = require('db');


exports.bindDiscussion = function (info, req, res) {
    $('#comment_form').submit(function (ev) {
        ev.preventDefault();
        var form = this;
        var doc = {
            type: 'comment',
            target: req.query.page,
            time: datelib.ISODateString(),
            user: session.userCtx.name,
            comment: $('textarea[name=comment]', form).val()
        };
        if (!doc.comment) {
            return alert('Comment form is empty');
        }
        var appdb = db.use(duality.getDBURL());
        appdb.saveDoc(doc, function (err) {
            if (err) {
                alert(err);
            }
            duality.setURL(
                'GET',
                '/_discuss/' + encodeURIComponent(req.query.page),
                {}
            );
        });
        return false;
    });
};
