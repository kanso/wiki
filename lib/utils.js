/**
 * Module dependencies
 */

var sanitize = require('sanitize'),
    duality_utils = require('duality/utils'),
    datelib = require('datelib'),
    _ = require('underscore')._;


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
        var baseURL = duality_utils.getBaseURL();
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
    if (pageid === 'sidebar') {
        var baseURL = duality_utils.getBaseURL();
        doc.title = 'Sidebar';
        doc.subtitle = 'Editing this will update the sidebar on all pages';
        doc.body = '' +
            '#### Sidebar\n' +
            '\n' +
            'Example sidebar. A place to put navigation links and site-wide ' +
            'information.\n' +
            '\n' +
            'See [help](' + baseURL + '/_help) for more details.\n' +
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

exports.prettyTime = function (d) {
    if (!datelib.isDate(d)) {
        d = new Date(d);
    }
    return '' +
        d.getFullYear() + '-' +
        (d.getMonth() + 1) + '-' +
        d.getDate() + ' ' +
        '(' +
            exports.zeroPad(d.getHours(), 2) + ':' +
            exports.zeroPad(d.getMinutes(), 2) + ':' +
            exports.zeroPad(d.getSeconds(), 2) +
        ')';
};

// escape characters special to markdown, replacing _ with \_ for example
exports.escapeMarkdown = function (str) {
    return str.replace(/([\*_{}\[\]\\])/g, function (whole_match, m1) {
        return '\\' + m1;
    });
};
