exports.bind = function (editor) {
    // TODO: remove once finished inspecting the api
    window.editor = editor;
    $('#editor_buttons .bold').click(function (ev) {
        exports.toggleBorI(2);
    });
    $('#editor_buttons .italic').click(function (ev) {
        exports.toggleBorI(1);
    });
};

exports.countLeft = function (ch, doc, pos) {
    var curr;
    var i = 0;
    var count_left = 0;
    do {
        curr = doc.getTextRange({
            start: {column: pos.column - i - 1, row: pos.row},
            end:   {column: pos.column - i, row: pos.row}
        });
        if (curr === ch) {
            count_left++;
        }
        i++;
    }
    while (curr === ch);
    return count_left;
};

exports.countRight = function (ch, doc, pos) {
    var curr;
    var i = 0;
    var count_right = 0;
    do {
        curr = doc.getTextRange({
            start: {column: pos.column + i + 1, row: pos.row},
            end:   {column: pos.column + i, row: pos.row}
        });
        if (curr === ch) {
            count_right++;
        }
        i++;
    }
    while (curr === ch);
    return count_right;
};

exports.multiChar = function (ch, num) {
    var str = '';
    while (str.length < num) {
        str = str + ch;
    }
    return str;
};

exports.toggleBorI = function (num) {
    editor.focus();
    var session = editor.getSession();
    var selection = session.getSelection();
    var cp = editor.getCursorPosition();
    var sr = selection.getRange().clone();
    var stext = selection.doc.getTextRange(sr);

    if (stext.length) {
        var outer_left = exports.countLeft('*', selection.doc, sr.start);
        var inner_left = exports.countRight('*', selection.doc, sr.start);
        var outer_right = exports.countRight('*', selection.doc, sr.end);
        var inner_right = exports.countLeft('*', selection.doc, sr.end);
        //console.log([outer_left, inner_left, inner_right, outer_right]);

        var total_left = outer_left + inner_left;
        var total_right = outer_right + inner_right;
        // the number of matching '*' either side
        var total_matched = Math.min(total_left, total_right);

        // grow selection to encompass matching outer '*' characters
        selection.setSelectionRange({
            start: {
                column: sr.start.column - (total_matched - inner_left),
                row: sr.start.row
            },
            end: {
                column: sr.end.column + (total_matched - inner_right),
                row: sr.end.row
            }
        });
        // this seems to fix a few things after setting the selection range
        selection.shiftSelection(0);

        var new_total;
        // not wrapped
        if (total_matched === 0) {
            //console.log('not wrapped');
            new_total = num;
        }
        // odd
        else if (total_matched % 2) {
            //console.log('odd');
            // italic
            if (num === 1) {
                new_total = 0;
                if (total_matched >= 3) {
                    new_total = 2;
                }
            }
            // bold
            else if (num === 2) {
                new_total = 3;
                if (total_matched >= 3) {
                    new_total = 1;
                }
            }
        }
        // even
        else {
            //console.log('even');
            if (num === 1) {
                new_total = 1;
                if (total_matched >= 2) {
                    new_total = 3;
                }
            }
            // bold
            else if (num === 2) {
                new_total = 0;
            }
        }

        var new_sr = selection.getRange().clone();
        var new_stext = selection.doc.getTextRange(new_sr);
        var inner_val = new_stext.replace(/^\*+/, '').replace(/\*+$/, '');
        var wrapper = exports.multiChar('*', new_total);
        var new_val = wrapper + inner_val + wrapper;
        selection.doc.replace(new_sr, new_val);

        var diff = new_total - total_matched;
        // resize selection to inner value
        selection.setSelectionRange({
            start: {
                column: sr.start.column + diff,
                row: sr.start.row
            },
            end: {
                column: sr.start.column + diff + inner_val.length,
                row: sr.start.row
            }
        });
        // this seems to fix a few things after setting the selection range
        selection.shiftSelection(0);
    }
    else {
        var inner_val;
        // italic
        if (num === 1) {
            inner_val = 'italic text';
        }
        // bold
        else if (num === 2) {
            inner_val = 'bold text';
        }
        var wrapper = exports.multiChar('*', num);
        selection.doc.insert(cp, wrapper + inner_val + wrapper);

        selection.setSelectionRange({
            start: {row: cp.row, column: cp.column + num},
            end: {row: cp.row, column: cp.column + num + inner_val.length}
        });
        selection.shiftSelection(0);
    }
};
