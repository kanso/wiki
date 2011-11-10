/**
 * Show functions to be exported from the design doc.
 */

var templates = require('duality/templates');


exports.not_found = function (doc, req) {
    return {
        code: 404,
        title: 'Not found',
        content: templates.render('404.html', req, {})
    };
};
