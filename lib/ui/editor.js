var datelib = require('datelib'),
    duality = require('duality/core'),
    events = require('duality/events'),
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
        height -= 13; // margin under editor

        // don't make the editor smaller than the syntax cheatsheet
        height = Math.max(height, $('#sidebar').outerHeight() || 0);
        $('#editor').css({height: height + "px"});
        $('#editor_container').css({height: height + "px"});
        $('#editor_overlay').css({height: height + "px"});
        var login_msg = $('#editor_overlay_login_message');
        login_msg.css({
            top: Math.floor((height - login_msg.outerHeight()) / 2) + 'px',
            left: Math.floor((700 - login_msg.outerWidth()) / 2) + 'px',
        });
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
    if (exports.PREV_DOC.history) {
        doc.history = JSON.parse(JSON.stringify(exports.PREV_DOC.history));
    }
    else {
        doc.history = [];
    }
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
        if (!$('#save_btn').hasClass('disabled')) {
            //var msg = prompt('Enter a short message describing this change');
            exports.CURRENT_DOC = exports.updateDoc(
                exports.CURRENT_DOC,
                req,
                editor
            );

            var comment = prompt(
                "Enter a short message describing the change (optional)"
            );
            if (comment === null) {
                // user clicked cancel
                return false;
            }

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
        }
        return false;
    });

    $('#cancel_btn').click(function () {
        if (!$(this).hasClass('disabled')) {
            // TODO: confirm if about to lose changes
            var _id = exports.CURRENT_DOC._id;
            exports.CURRENT_DOC = null;
            duality.setURL('GET', '/' + _id, {});
        }
    });

    function checkSession(userCtx) {
        if (userCtx.name) {
            $('#editor_overlay').removeClass('active');
            $('#save_btn').removeClass('disabled');
            $('#cancel_btn').removeClass('disabled');
            window.onresize();
        }
        else {
            $('#editor_overlay').addClass('active');
            $('#save_btn').addClass('disabled');
            $('#cancel_btn').addClass('disabled');
            window.onresize();
        }
    }

    $('#editor_btn').click(function () {
        $('#preview_btn').removeClass('active');
        $(this).addClass('active');
        $('#preview').hide();
        $('#editor_container').show();
        checkSession(session.userCtx);
    });

    $('#preview_btn').click(function () {
        $('#editor_btn').removeClass('active');
        $(this).addClass('active');
        $('#editor_container').hide();
        $('#preview').html(utils.bodyToHtml(exports.CURRENT_DOC.body) || '&nbsp;');
        $('#preview').show();
    });

    checkSession(req.userCtx);
    session.on('change', checkSession);
    events.on('beforeResource', function () {
        // remove listener when navigating away from page
        session.removeListener('change', checkSession);
    });
};
