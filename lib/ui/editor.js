var datelib = require('datelib'),
    comments = require('duality/contrib/comments/comments'),
    duality = require('duality/core'),
    db = require('db'),
    session = require('session'),
    utils = require('../utils'),
    sanitize = require('sanitize'),
    base64 = require('base64'),
    _ = require('underscore')._;


exports.CURRENT_DOC = null;

exports.resizeEditorToWindow = function (editor) {
    return function () {
        var height = document.documentElement.clientHeight;
        height -= $('#secondbar').outerHeight();
        height -= $('#topbar').outerHeight();
        height -= 32;
        height -= 13; // 1em margin above editor
        height -= 13; // 1em margin below editor

        // don't make the editor smaller than the syntax cheatsheet
        height = Math.max(height, $('#sidebar').outerHeight() || 0);
        var container = $('#editor').get(0);
        container.style.height = height + "px";
        editor.resize();
    };
};

exports.initEditor = function (editor) {
    editor.setTheme("ace/theme/textmate");
    // use window.require to use Ace's require fn instead of kanso's custom
    // require function for this module
    var MarkdownMode = window.require("ace/mode/markdown").Mode;

    editor.renderer.setShowGutter(false);
    editor.renderer.setHScrollBarAlwaysVisible(false);
    editor.renderer.setShowPrintMargin(false);
    editor.setHighlightActiveLine(false);

    var session = editor.getSession();
    session.setUseWrapMode(true);
    session.setMode(new MarkdownMode());
    session.on('change', function () {
        exports.CURRENT_DOC.body = session.getValue();
    });
};

exports.updateDoc = function (doc, req, editor) {
    doc.title = $('#edit_page_form input[name="title"]').val();
    doc.subtitle = $('#edit_page_form input[name="subtitle"]').val();
    doc.body = editor.getSession().getValue();
    return doc;
};

exports.prepareDoc = function (doc, req, comment) {
    doc.history = JSON.parse(JSON.stringify(exports.PREV_DOC.history)) || [];
    var h;
    if (doc.history.length) {
        h = {
            _id: 'updated.' + doc._rev,
            time: datelib.ISODateString(),
            user: session.userCtx.name,
            prev: exports.PREV_DOC.latest_change._id
        };
    }
    else {
        h = {
            _id: 'created',
            time: datelib.ISODateString(),
            user: session.userCtx.name,
            prev: null
        }
    }
    if (comment) {
        h.comment = comment;
    }
    doc.history.push(h);
    doc.latest_change = h;
    if (!doc._attachments) {
        doc._attachments = {};
    }
    doc._attachments['history/' + h._id + '.json'] = {
        data: base64.encode(JSON.stringify(exports.CURRENT_DOC))
    };
    return doc;
};

exports.bindEditor = function (doc, req) {
    // only set this if adding a new doc or the _id and _rev don't match.
    // this can be used to preserve state between page navigation when using
    // preview / history pages
    exports.CURRENT_DOC = JSON.parse(JSON.stringify(doc));
    exports.PREV_DOC = doc;

    $('#title').click(function (ev) {
        var title = prompt('Enter a new page title');
        if (title !== null) {
            $('#edit_page_form input[name="title"]').val(title);
            $('#title h1').text(title);
        }
    });
    $('#subtitle').click(function (ev) {
        var subtitle = prompt('Enter a new page subtitle');
        if (subtitle !== null) {
            subtitle = utils.trim(subtitle);
            if (subtitle === '') {
                $('#edit_page_form input[name="subtitle"]').val('');
                $('#subtitle p').html('<em>Click to add subtitle</em>');
            }
            else {
                $('#subtitle p').text(subtitle);
                $('#edit_page_form input[name="subtitle"]').val(subtitle);
            }
        }
    });

    if ($('input[name="subtitle"]').val() === '') {
        $('#subtitle p').html('<em>Click to add subtitle</em>');
    }


    var editor = ace.edit('editor');
    exports.initEditor(editor);
    window.onresize = exports.resizeEditorToWindow(editor);
    window.onresize();

    $('#edit_page_form').submit(function (ev) {
        ev.preventDefault();
        //var msg = prompt('Enter a short message describing this change');
        exports.CURRENT_DOC = exports.updateDoc(
            exports.CURRENT_DOC,
            req,
            editor
        );

        var comment = prompt(
            "Enter a short message describing the change (optional)"
        );
        exports.CURRENT_DOC = exports.prepareDoc(
            exports.CURRENT_DOC,
            req,
            comment
        );

        var appdb = db.use(duality.getDBURL());
        appdb.saveDoc(exports.CURRENT_DOC, function (err) {
            if (err) {
                return alert(err);
            }
            duality.setURL('GET', '/' + exports.CURRENT_DOC._id, {});
        });
        return false;
    });

    $('#cancel_btn').click(function () {
        // TODO: confirm if about to lose changes
        var _id = exports.CURRENT_DOC._id;
        exports.CURRENT_DOC = null;
        duality.setURL('GET', '/' + _id, {});
    });

    $('#editor_btn').click(function () {
        $('#preview_btn').removeClass('active');
        $(this).addClass('active');
        $('#preview').hide();
        $('#editor').show();
    });

    $('#preview_btn').click(function () {
        $('#editor_btn').removeClass('active');
        $(this).addClass('active');
        $('#editor').hide();
        $('#preview').html(utils.bodyToHtml(exports.CURRENT_DOC.body) || '&nbsp;');
        $('#preview').show();
    });
};

exports.bindDiscussionPage = function (doc, req) {
    var opts = {
        user_link: '{baseURL}/_user/{user|uc}',
        monospace: true,
        descending: false,
        no_comments: '<p>No comments</p>'
    };
    comments.addToPage(req, doc._id, opts, function (err, data) {
        if (err) {
            // TODO: display nice error message
            return alert(err);
        }
        var users = comments.users(data);

        if (!users.length) {
            $('#discussion_users').html(
                '<p>No users are currently participating in this dicussion.</p>'
            );
        }
        else {
            $('#discussion_users').html('<ul></ul>');
            var baseURL = duality.getBaseURL(req);
            _.each(users, function (user) {
                $('#discussion_users ul').append(
                    '<li><a href="' +
                        baseURL + '/_user/' + sanitize.h(user) +
                    '">' + sanitize.h(user) + '</a></li>'
                );
            });
        }
        var div = $('#comments');
        div.get(0).scrollTop = div.attr("scrollHeight") - div.height();
        //div.animate({scrollTop: div.attr("scrollHeight") - div.height()}, 200);
    });
    window.onresize = function () {
        var height = document.documentElement.clientHeight;
        height -= $('#secondbar').outerHeight();
        height -= $('#topbar').outerHeight();
        height -= 32;
        // make space for comment form
        height -= 165;
        $('#comments').css({
            overflow: 'auto',
            maxHeight: height + "px"
        });
    };
    window.onresize();
};
