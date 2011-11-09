/**
 * Rewrite settings to be exported from the design doc
 */

module.exports = [
    {from: '/static/*', to: 'static/*'},
    {from: '/_add/:page', to: '_show/add_page'},
    {from: '/_edit/:page', to: '_list/edit_page/pages', query: {
        limit: '2',
        keys: [':page', 'sidebar'],
        include_docs: 'true'
    }},
    {from: '/_history/:page', to: '_list/history_page/pages', query: {
        limit: '2',
        keys: [':page', 'sidebar'],
        include_docs: 'true'
    }},
    {from: '/_history/:page/:change', to: '_list/history_page/pages', query: {
        limit: '2',
        keys: [':page', 'sidebar'],
        include_docs: 'true'
    }},
    {from: '/_discuss/:page', to: '_show/discussion/:page'},
    {from: '/', to: '_list/page/pages', query: {
        limit: '2',
        page: 'index',
        keys: ['index', 'sidebar'],
        include_docs: 'true'
    }},
    {from: '/test/:page', to: '_view/pages', query: {
        keys: ['index', 'sidebar']
    }},
    {from: '/:page', to: '_list/page/pages', query: {
        limit: '2',
        keys: [':page', 'sidebar'],
        include_docs: 'true'
    }},
    {from: '*', to: '_show/not_found'}
];
