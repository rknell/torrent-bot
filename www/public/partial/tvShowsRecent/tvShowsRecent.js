angular.module('www').controller('TvshowsrecentCtrl', function ($scope, $http, $state, nowPlaying) {

    $http.get('/api/tvshow/recent')
        .success(function (results) {
            $scope.shows = results;
            console.log("Loaded recent shows", results);
        });

    $scope.watch = function (show) {
        nowPlaying.startWatching(show.episode, show.season, show.name, show.magnetLink);
        //$state.go('watchTorrent', {url: show.magnetLink})
    };
});
