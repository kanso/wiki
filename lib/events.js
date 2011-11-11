/**
 * Bindings to Kanso events
 */

var events = require('duality/events'),
    session = require('session');


/**
 * The init method fires when the app is initially loaded from a page rendered
 * by CouchDB.
 */

/**
 * events.on('init', function () {
 *     // app initialization code goes here...
 * });
 */


/**
 * The sessionChange event fires when the app is first loaded and the user's
 * session information becomes available. It is also fired whenever a change
 * to the user's session is detected, for example after logging in or out.
 */

/**
 * session.on('change', function (userCtx, req) {
 *     // session change handling code goes here...
 * });
 */


/**
 * The updateFailure event fires when an update function returns a document as
 * the first part of an array, but the client-side request to update the
 * document fails.
 */

events.on('updateFailure', function (err, info, req, res, doc) {
    alert(err.message || err.toString());
});

// syntax highlighting of code blocks
events.on('afterResponse', function (info, req, res) {
    $('pre > code').each(function () {
        if (this.className) {
            // has a code class
            $(this).html(hljs.highlight(this.className, $(this).text()).value);
        }
    });
});

session.on('change', function (userCtx) {
    if (userCtx.name) {
        $('#secondbar .tabs .edit_page').removeClass('disabled');
        $('#sidebar a.edit_sidebar').removeClass('disabled');
    }
    else {
        $('#secondbar .tabs .edit_page').addClass('disabled');
        $('#sidebar a.edit_sidebar').addClass('disabled');
    }
});
