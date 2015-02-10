angular.module('www').controller('TvshowsrecentCtrl',function($scope, $http, $state){

    $http.get('/api/tvshow/recent')
        .success(function(results){
            //results.forEach(function(item){
            //    item.latestEpisode = latestEpisode(item);
            //})
            $scope.shows = results;
            console.log("Loaded recent shows", results);
        });

    //function latestEpisode(tvShow){
    //    //get most recent season
    //    var highestSeason;
    //    tvShow.seasons.forEach(function(season){
    //        if(!highestSeason || season.number > highestSeason.number){
    //            highestSeason = season;
    //        }
    //    });
    //
    //    var highestEpisode;
    //    highestSeason.episodes.forEach(function(episode){
    //        if(!highestEpisode || highestEpisode.datedAdded < episode.dateAdded){
    //            highestEpisode = episode
    //        }
    //    });
    //
    //    return {
    //        season: highestSeason.number,
    //        episode: highestEpisode
    //    }
    //}

    $scope.watch = function(show){
        $state.go('watchTorrent', {url: show.magnetLink})
    }
});
