exports.bind = function (editor) {
    // TODO: remove once finished inspecting the api
    window.editor = editor;
    $('#editor_buttons .bold').click(function (ev) {
        editor.focus();
        var session = editor.getSession();
        var cp = editor.getCursorPosition();
        var selection = session.getSelection();
        var stext = selection.doc.getTextRange(selection.getRange());

        if (stext.length) {
            // TODO
        }
        else {
            session.insert(cp, '**strong text**');
            selection.setSelectionRange({
                start: {row: cp.row, column: cp.column + 2},
                end: {row: cp.row, column: cp.column + 13}
            });
        }
    });
};
