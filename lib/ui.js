var datelib = require('datelib'),
    kanso_core = require('kanso/core'),
    db = require('kanso/db');


exports.CURRENT_DOC = null;

exports.resizeEditorToWindow = function (editor) {
    return function () {
        var height = document.documentElement.clientHeight;
        height -= $('#secondbar').outerHeight();
        height -= $('#topbar').outerHeight();
        height -= 32;
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
    session.setMode(new MarkdownMode());
    session.on('change', function () {
        exports.CURRENT_DOC.body = session.getValue();
    });
};

exports.updateDoc = function (doc, req, editor) {
    doc.updatedBy = req.userCtx.name;
    if (!doc.time) {
        doc.time = {};
    }
    doc.title = $('#edit_page_form input[name="title"]').val();
    doc.subtitle = $('#edit_page_form input[name="subtitle"]').val();
    doc.body = editor.getSession().getValue();
    doc.time.modified = datelib.ISODateString();
    return doc;
};

exports.bindEditor = function (doc, req) {
    // only set this if adding a new doc or the _id and _rev don't match.
    // this can be used to preserve state between page navigation when using
    // preview / history pages
    exports.CURRENT_DOC = doc;

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
            $('#edit_page_form input[name="subtitle"]').val(subtitle);
            $('#subtitle p').text(subtitle);
        }
    });

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
        console.log('saving');
        console.log(exports.CURRENT_DOC);
        db.saveDoc(exports.CURRENT_DOC, function (err) {
            if (err) {
                return alert(err);
            }
            kanso_core.setURL('GET', '/' + exports.CURRENT_DOC._id, {});
        });
        return false;
    });

    $('#cancel_btn').click(function () {
        // TODO: confirm if about to lose changes
        var _id = exports.CURRENT_DOC._id;
        exports.CURRENT_DOC = null;
        kanso_core.setURL('GET', '/' + _id, {});
    });
};
