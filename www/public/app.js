angular.module('www', ['ui.bootstrap','ui.utils','ui.router','ngAnimate']);

angular.module('www').config(function($stateProvider, $urlRouterProvider) {

    $stateProvider.state('tvShows', {
        url: '/tvshows',
        templateUrl: 'partial/tvShows/tvShows.html'
    });

    $stateProvider.state('play-legacy', {
        url: '/play/:url',
        templateUrl: 'partial/watchTorrent/watchTorrent.html'
    });

    $stateProvider.state('watchTorrent', {
        url: '/watchTorrent/:url',
        templateUrl: 'partial/watchTorrent/watchTorrent.html'
    });
    $stateProvider.state('tvShowsRecent', {
        url: '/tvShows/recent',
        templateUrl: 'partial/tvShowsRecent/tvShowsRecent.html'
    });
    $stateProvider.state('show', {
        url: '/tvShows/:id',
        templateUrl: 'partial/show/show.html'
    });
    $stateProvider.state('moviesAll', {
        url: '/movies/all',
        templateUrl: 'partial/moviesAll/moviesAll.html'
    });
    /* Add New States Above */
    $urlRouterProvider.otherwise('/tvshows');

});

angular.module('www').run(function($rootScope) {

    $rootScope.safeApply = function(fn) {
        var phase = $rootScope.$$phase;
        if (phase === '$apply' || phase === '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

});
