exports.wrapToggle = function (start, value, /*optional*/end) {
    editor.focus();
    var session = editor.getSession();
    var selection = session.getSelection();
    var cp = editor.getCursorPosition();
    var sr = selection.getRange().clone();
    var stext = selection.doc.getTextRange(sr);

    if (stext.length) {
        var ss = sr.start, se = sr.end;

        var leftchars = selection.doc.getTextRange({
            start: {column: ss.column - start.length, row: ss.row},
            end:   {column: ss.column, row: ss.row}
        });
        var rightchars = selection.doc.getTextRange({
            start: {column: se.column, row: se.row},
            end:   {column: se.column + end.length, row: se.row}
        });

        var inner_left, outer_left, inner_right, outer_right;
        if (stext.substr(0, start.length) === start) {
            inner_left = true;
        }
        else if (leftchars === start) {
            outer_left = true;
        }
        if (stext.substr(stext.length - end.length, end.length) === end) {
            inner_right = true;
        }
        else if (rightchars === end) {
            outer_right= true;
        }

        var wrapped_inner = inner_left && inner_right;
        var wrapped_outer = outer_left && outer_right;

        if (inner_left && inner_right) {
            // wrapped inner, remove inner blocks
            var val = stext.substr(
                start.length,
                stext.length - start.length - end.length
            );
            selection.doc.replace(sr, val);
            selection.setSelectionRange({
                start: ss,
                end: {
                    column: se.column - start.length - end.length,
                    row: se.row
                }
            });
            selection.shiftSelection(0);
        }
        else if (outer_left && outer_right) {
            // wrapped outer, remove outer blocks
            selection.setSelectionRange({
                start: {column: ss.column - start.length, row: ss.row},
                end:   {column: se.column + end.length,   row: se.row},
            });
            selection.shiftSelection(0);
            selection.doc.replace(selection.getRange(), stext);
            selection.setSelectionRange({
                start: {
                    column: ss.column - start.length,
                    row: ss.row
                },
                end: {
                    column: se.column - start.length,
                    row: se.row
                }
            });
            selection.shiftSelection(0);
        }
        else if (!wrapped_inner && !wrapped_outer) {
            // not properly wrapped, add outer blocks
            if (end) {
                selection.doc.insert(se, end);
            }
            selection.doc.insert(ss, start);
            selection.setSelectionRange(sr);
            selection.shiftSelection(start.length);
        }
    }
    else {
        selection.doc.insert(cp, start + value + end);
        selection.setSelectionRange({
            start: {row: cp.row, column: cp.column + start.length},
            end: {row: cp.row, column: cp.column + start.length + value.length}
        });
        selection.shiftSelection(0);
    }
};

exports.bind = function (editor) {
    // TODO: remove once finished inspecting the api
    window.editor = editor;

    $('#editor_buttons .bold').click(function (ev) {
        exports.wrapToggle('**', 'strong text', '**')
    });
    $('#editor_buttons .italic').click(function (ev) {
        // TODO: handle the mixture of bold and italic better, wmd won't remove
        // wrapped elements in the case of **foo** when clicking italic but add
        // ***foo***
        exports.wrapToggle('*', 'emphasized text', '*')
    });
};
