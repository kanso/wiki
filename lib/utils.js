/**
 * Module dependencies
 */

var sanitize = require('sanitize'),
    kanso_utils = require('duality/utils'),
    showdown = require('showdown'),
    datelib = require('datelib');


/**
 * Converts a page body from markdown text to HTML. Internal links are converted
 * to markdown-style links first. Any HTML elements are sanitized before going
 * through the markdown converter to avoid script injections.
 *
 * @name bodyToHtml(str)
 * @param {String} str - The markdown text to convert to HTML
 * @returns {String}
 * @api public
 */

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


/**
 * Given a page id or slug create a string suitable for use a the page's title.
 * Replaces underscores with spaces and transforms the first character to
 * uppercase.
 *
 * @name idToTitle(str)
 * @param {String} str - the page id to transform
 * @returns {String}
 * @api publis
 */

exports.idToTitle = function (str) {
    return str.substr(0, 1).toUpperCase() + str.substr(1).replace(/_/g, ' ');
};


/**
 * Trim trailing and leading whitespace from a string.
 *
 * @name trim(str)
 * @param {String} str
 * @returns {String}
 * @api public
 */

exports.trim = function (str) {
    return str.replace(/^\s+/, '').replace(/\s+$/, '');
};


/**
 * Creates a new page object to display/edit using a specific page id.
 *
 * @name createPage(pageid)
 * @param {String} pageid
 * @returns {Object}
 * @api public
 */

exports.createPage = function (pageid, creator) {
    var doc = {
        _id: pageid,
        type: 'page',
        title: exports.idToTitle(pageid),
        subtitle: '',
        body: ''
        // history and latest_change properties added before saving
    };
    if (pageid === 'index') {
        var baseURL = kanso_utils.getBaseURL();
        doc.title = 'Welcome to your new wiki';
        doc.subtitle = 'A collaborative website, created by its users';
        doc.body = '' +
            '## Congratulations!\n' +
            '\n' +
            'This is the default page you see after installing. You are ' +
            'now ready to start creating your own website!\n' +
            '\n' +
            '\n' +
            '### What is a wiki?\n' +
            '\n' +
            'A wiki is a website created by its users. It allows any user ' +
            'to make additions or changes to the site, and can help to ' +
            'keep content up-to-date and relevant. Most wikis allow you to ' +
            'edit pages using a simplified _markup language_. This is a ' +
            'specific way of writing text to change the way it\'s ' +
            'displayed.\n' +
            '\n' +
            '\n' +
            '### Getting started\n' +
            '\n' +
            'This wiki uses __Markdown__ for editing pages. The best way ' +
            'to understand this style of writing, is to click on the ' +
            '"Edit tab" for a page and experiment using the syntax guide ' +
            'provided. To view your changes just click on the preview ' +
            'button. By creating links to other pages you can begin to ' +
            'build a complete site.\n' +
            '\n' +
            'To start creating your own site, click on the [Edit tab](' +
            baseURL + '/_edit/index).\n' +
            '';
    }
    return doc;
};

exports.zeroPad = function (str, len) {
    str = '' + str;
    while (str.length < len) {
        str = '0' + str;
    }
    return str;
};
