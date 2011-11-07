/**
 * Document types to export
 */

var Type = require('couchtypes/types').Type,
    fields = require('couchtypes/fields'),
    permissions = require('couchtypes/permissions'),
    validators = require('couchtypes/validators'),
    wvalidators = require('./validators'),
    _ = require('underscore')._;


exports.page = new Type('page', {
    allow_extra_fields: true,
    permissions: {
        add: permissions.loggedIn(),
        update: permissions.loggedIn(),
        remove: permissions.hasRole('_admin')
    },
    fields: {
        title: fields.string(),
        subtitle: fields.string({required: false}),
        body: fields.string({required: false}),
        //latest_change: {
            // a copy of the latest history object:
            //
            // user - user that made the change
            // time - time of change (ISO Date string)
            // comment - optional comment on change
            // prev - the previous history entry id
        //},
        //history: [
            // {_id: 'created', ...},
            // {_id: 'updated.1-492c7093d2899f1f29b6c49c4ea4b0d5', ...},
            // {_id: 'updated.2-492c7093d2899f1f29b6c49c4ea4b0d5', ...},
            //
            // see validate_doc_update function on this type for
            // history validation rules
            //
            // History entries include:
            //
            // user - user that made the change
            // time - time of change (ISO Date string)
            // comment - optional comment on change
            // prev - the previous history entry id
        //]
    },
    validate_doc_update: function (newDoc, oldDoc, userCtx) {

        if (newDoc._deleted) {
            return;
        }

        /**** Basic checks for first history entry ****/

        if (!newDoc.history) {
            throw {forbidden: 'New document missing history property'};
        }
        if (!_.isArray(newDoc.history)) {
            throw {forbidden: 'History property should be an array'};
        }
        var created_h = _.detect(newDoc.history, function (h) {
            return h._id === 'created';
        });
        if (!created_h) {
            throw {forbidden: 'No history entry for first edit'};
        }


        /**** Check the number of history items that were added/removed ****/

        var prev_history = [];
        if (oldDoc) {
            prev_history = _.map(oldDoc.history, function (h) {
                return h._id;
            });
        }
        var newdoc_history = _.map(newDoc.history, function (h) {
            return h._id;
        });
        var removed_history = _.difference(prev_history, newdoc_history);
        if (removed_history.length) {
            throw {unauthorized: 'Cannot delete document history entries'};
        }
        var new_history = _.difference(newdoc_history, prev_history);
        if (!new_history.length) {
            throw {forbidden: 'Missing history entry for new document'};
        }
        if (new_history.length > 1) {
            throw {forbidden: 'Too many new history entries'};
        }

        // latest history addition
        var h_id = new_history[0];

        if (h_id !== newDoc.history[newDoc.history.length - 1]._id) {
            throw {forbidden: 'New history entry should be added to the end ' +
                              'of the history array'};
        }

        var h = newDoc.history[newDoc.history.length - 1];


        /**** Check history entry id is in the correct format ****/

        if (oldDoc) {
            if (h._id !== 'updated.' + oldDoc._rev) {
                throw {forbidden: 'History ID does not match previous revision'};
            }
        }
        else {
            if (h._id !== 'created') {
                throw {forbidden: 'First history ID should be "created"'};
            }
        }


        /**** Validate latest history entry ****/

        if (!h.user) {
            throw {forbidden: 'History entry missing username'};
        }
        if (h.user !== userCtx.name) {
            throw {unauthorized: 'History entry does not match username'};
        }
        if (!h.time) {
            throw {forbidden: 'History entry missing time'};
        }
        try {
            wvalidators.ISODateString(newDoc, h.time)
        }
        catch (e) {
            throw {forbidden: 'History entry has invalid ISO date format'};
        }
        if (oldDoc) {
            if (h.prev !== oldDoc.latest_change._id) {
                throw {forbidden: 'History prev property does not match id ' +
                                  'of previous latest_change._id'};
            }
        }
        else {
            if (h.prev !== null) {
                throw {forbidden: 'On first history entry prev should be null'};
            }
        }


        /**** Validate existing attachments ****/

        // test that all previous history entries are still attached
        // and have matching md5's

        if (oldDoc) {
            for (var k in oldDoc._attachments) {
                if (/^history\//.test(k)) {
                    var natt = newDoc._attachments[k];
                    var oatt = oldDoc._attachments[k];
                    if (!natt) {
                        throw {
                            unauthorized: 'Previous history attachments ' +
                                          'cannot be removed'
                        };
                    }
                    if (natt.digest !== oatt.digest ||
                        natt.length !== oatt.length ||
                        natt.content_type !== oatt.content_type) {
                        throw {
                            unauthorized: 'Previous history attachments ' +
                                          'cannot be modified'
                        };
                    }
            }
            }
        }


        /**** Validate new history attachment ****/

        if (!newDoc._attachments) {
            throw {forbidden: 'Missing history attachments'};
        }

        if (!newDoc._attachments['history/' + h._id + '.json']) {
            throw {forbidden: 'Missing history attachment for latest update'};
        }

        // TODO: test attachment length to see if it matches the JSON.stringify
        // value for oldDoc?


        /**** Validate the 'latest_change' property ****/

        if (!newDoc.latest_change) {
            throw {forbidden: 'Missing latest_change property'};
        }
        if (JSON.stringify(newDoc.latest_change) !== JSON.stringify(h)) {
            throw {forbidden: 'latest_change property does not match ' +
                              'latest history entry'};
        }

    }
});
