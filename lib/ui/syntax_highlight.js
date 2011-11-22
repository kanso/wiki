/**
 * Add syntax highlighting to the page using highlight.js (hljs)
 */

module.exports = function () {
    $('pre > code').each(function () {
        if (this.className) {
            // has a code class
            $(this).html(hljs.highlight(this.className, $(this).text()).value);
        }
    });
};
