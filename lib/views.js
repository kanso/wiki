/**
 * Views to be exported from the design doc.
 */

exports.pages = {
    map: function (doc) {
        if (doc.type === 'page') {
            // emit doc._rev to change the view when the doc is updated and
            // invalidate client-side cache. The etag of a view only changes
            // if the view output changes (not including changes from
            // include_docs=true) ...this is apparently the intended behaviour
            emit([doc._id], doc._rev);
        }
    }
};
