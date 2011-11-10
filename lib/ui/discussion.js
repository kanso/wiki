var session = require('session'),
    datelib = require('datelib'),
    duality = require('duality/core'),
    events = require('duality/events'),
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

function checkEmpty() {
    var comment = $('#comment_form textarea[name=comment]').val();
    if (!comment) {
        console.log('disable buttons');
        $('#add_comment').addClass('disabled');
        $('#clear_comment').addClass('disabled');
    }
    else {
        console.log('enable buttons');
        $('#add_comment').removeClass('disabled');
        $('#clear_comment').removeClass('disabled');
    }
}

function checkSession(userCtx) {
    if (userCtx.name) {
        $('#comment_form_login_message').hide();
        $('#comment_form').show();
    }
    else {
        $('#comment_form_login_message').show();
        $('#comment_form').hide();
    }
}

exports.bindDiscussion = function (info, req, res) {

    $('#comment_form').submit(function (ev) {
        ev.preventDefault();
        if (!$('#add_comment').hasClass('disabled')) {
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
        }
        return false;
    });

    $('#clear_comment').click(function (ev) {
        $('#comment_form textarea[name=comment]').val('');
        checkEmpty();
    });
    $('#comment_form textarea[name=comment]').keyup(checkEmpty);
    checkEmpty();

    session.on('change', checkSession);
    checkSession(req.userCtx);
    events.on('beforeResource', function () {
        // remove listener when navigating away from page
        session.removeListener('change', checkSession);
    });

    exports.scrollToBottom();
    window.onresize = exports.resizeToWindow;
    window.onresize();
};
