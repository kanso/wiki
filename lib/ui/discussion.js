var comments = require('duality/contrib/comments/comments'),
    duality = require('duality/core'),
    sanitize = require('sanitize'),
    _ = require('underscore')._;


exports.bindDiscussionPage = function (doc, req) {
    var opts = {
        user_link: '{baseURL}/_user/{user|uc}',
        monospace: true,
        descending: false,
        no_comments: '<p>No comments</p>'
    };
    comments.addToPage(req, doc._id, opts, function (err, data) {
        if (err) {
            // TODO: display nice error message
            return alert(err);
        }
        var users = comments.users(data);

        if (!users.length) {
            $('#discussion_users').html(
                '<p>No users are currently participating in this dicussion.</p>'
            );
        }
        else {
            $('#discussion_users').html('<ul></ul>');
            var baseURL = duality.getBaseURL(req);
            _.each(users, function (user) {
                $('#discussion_users ul').append(
                    '<li><a href="' +
                        baseURL + '/_user/' + sanitize.h(user) +
                    '">' + sanitize.h(user) + '</a></li>'
                );
            });
        }
        var div = $('#comments');
        div.get(0).scrollTop = div.attr("scrollHeight") - div.height();
        //div.animate({scrollTop: div.attr("scrollHeight") - div.height()}, 200);
    });
    window.onresize = function () {
        var height = document.documentElement.clientHeight;
        height -= $('#secondbar').outerHeight();
        height -= $('#topbar').outerHeight();
        height -= 32;
        // make space for comment form
        height -= 165;
        $('#comments').css({
            overflow: 'auto',
            maxHeight: height + "px"
        });
    };
    window.onresize();
};
