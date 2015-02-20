angular.module('www').controller('MovieCtrl',function($scope, $http,$stateParams, $state){

    $http.get("/api/Movie/" + $stateParams.id)
        .success(function(result){
            console.log("Got movie", result);
            $scope.movie = result;
            $scope.$root.background = result.background;
        })
        .error(function(err){
            console.log(err);
            alert("There was an error loading the show");
        });

    $scope.watch = function(magnet){
        //nowPlaying.startWatching(episode.number, $scope.currentSeason.number, $scope.show.name,episode.magnetLink);
        $state.go('watchTorrent', {url: magnet.magnetLink});
    }

});
