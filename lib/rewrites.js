/**
 * Rewrite settings to be exported from the design doc
 */

module.exports = [
    {from: '/static/*', to: 'static/*'},
    {from: '/_add/:page', to: '_show/add_page'},
    {from: '/_edit/:page', to: '_show/edit_page/:page'},
    {from: '/', to: '_list/page/pages', query: {
        limit: '1',
        page: 'index',
        key: ['index'],
        include_docs: 'true'
    }},
    {from: '/:page', to: '_list/page/pages', query: {
        limit: '1',
        key: [':page'],
        include_docs: 'true'
    }},
    {from: '*', to: '_show/not_found'}
];
