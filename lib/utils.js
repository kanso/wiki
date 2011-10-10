var sanitize = require('kanso/sanitize'),
    kanso_utils = require('kanso/utils'),
    showdown = require('./showdown');


exports.bodyToHtml = function (str) {
    var baseURL = kanso_utils.getBaseURL();
    var match, re = new RegExp('\\[\\[([^\\]]+)\\]\\]');
    while (match = re.exec(str)) {
        var before = str.substr(0, match.index)
        var after = str.substr(match.index + match[0].length)
        str = before +
            '[' + sanitize.h(match[1]) + ']' +
            '(' + baseURL + '/' + encodeURIComponent(match[1]) + ')' +
            after;
    }
    var c = new showdown.converter();
    return c.makeHtml(sanitize.h(str));
};
