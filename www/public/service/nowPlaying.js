angular.module('www').factory('nowPlaying', function ($state, $http) {

    var nowPlaying = {
        isPlaying: false,
        startWatching: function (episode, season, name, magnetLink) {
            console.log("About to play", episode, season, name, magnetLink);
            $state.go('watchTorrent', {url: magnetLink});
            $http.post("/api/tvshow/watched", {
                name: name,
                episode: episode,
                season: season
            })
                .success(function (result) {
                    console.log("Marked as watched", result.name);
                })
                .error(function (err) {
                    console.error("Error making show as watched", err);
                })
        }
    };

    return nowPlaying;
});
