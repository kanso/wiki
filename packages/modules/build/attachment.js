var fs = require('fs'),
    mime = require('kanso/deps/node-mime/mime'),
    jsp = require('kanso/deps/UglifyJS/lib/parse-js'),
    pro = require('kanso/deps/UglifyJS/lib/process'),
    modules = require('kanso/lib/modules'),
    logger = require('kanso/lib/logger'),
    utils = require('kanso/lib/utils');


function minify(src) {
    var ast = jsp.parse(src);   // parse code and get the initial AST
    ast = pro.ast_mangle(ast);  // get a new AST with mangled names
    ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
    return pro.gen_code(ast);   // compressed code here
}


/**
 * Create modules.js attachment using _modules property to find modules in the
 * design doc and wrap them with the appropriate boilerplate.
 */

module.exports = function (root, path, settings, doc, callback) {
    if (!doc._modules) {
        // TODO: should this throw?
        return callback(null, doc);
    }

    if (settings.modules_attachment === false) {
        delete doc._modules;
        return callback(null, doc);
    }

    var wrapped_modules = '';
    for (var k in doc._modules) {
        wrapped_modules += modules.wrap(k, utils.getPropertyPath(doc, k));
    }

    delete doc._modules;

    fs.readFile(__dirname + '/bootstrap.js', function (err, content) {
        if (err) {
            return callback(err);
        }
        var data = content.toString() + (wrapped_modules || '');

        if (settings.minify) {
            logger.info('compressing', 'modules.js');
            data = minify(data);
        }

        if (!doc._attachments) {
            doc._attachments = {};
        }
        doc._attachments['modules.js'] = {
            'content_type': mime.lookup('modules.js'),
            'data': new Buffer(data).toString('base64')
        };

        callback(null, doc);
    });
};
