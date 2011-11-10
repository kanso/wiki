var session = require('session'),
    datelib = require('datelib'),
    duality = require('duality/core'),
    db = require('db');


exports.BOTTOM = 0;

exports.scrollToBottom = function () {
    var div = $('#discussion');
    div.get(0).scrollTop = div.attr("scrollHeight") - div.height();
    exports.BOTTOM = div.get(0).scrollTop;
};

exports.atBottom = function () {
    return $('#discussion').get(0).scrollTop >= exports.BOTTOM;
};

exports.resizeToWindow = function () {
    var at_bottom = exports.atBottom();

    var height = document.documentElement.clientHeight;
    height -= $('#secondbar').outerHeight();
    height -= $('#topbar').outerHeight();
    height -= 32;
    height -= 13; // 1em margin above
    height -= 13; // 1em margin below
    height -= $('#comment_form').outerHeight();
    height -= 27; // margin above and below comment form

    // don't make the container smaller than the sidebar
    height = Math.max(height, $('#sidebar').outerHeight() || 0);
    $('#discussion').css({height: height + "px"});

    if (at_bottom) {
        exports.scrollToBottom();
    }
};

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
                return alert(err);
            }
            duality.setURL(
                'GET',
                '/_discuss/' + encodeURIComponent(req.query.page),
                {}
            );
        });
        return false;
    });
    exports.scrollToBottom();
    window.onresize = exports.resizeToWindow;
    window.onresize();
};
