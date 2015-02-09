angular.module('www').controller('ShowCtrl',function($scope, $http, $stateParams, $rootScope, $state){



    $http.get("/api/TVShow/" + $stateParams.id)
        .success(function(result){
            console.log("Got show", result);
            $scope.show = result;
            $scope.$root.background = result.backgroundUrl;
            $scope.$root.body = {"background-image": 'url(' + result.backgroundUrl + ') cover'};
            console.log(result.backgroundUrl)
        })
        .error(function(err){
            console.log(err);
            alert("There was an error loading the show");
        })

    $scope.setCurrent = function(season){
        $scope.currentSeason = season;
    }

    $scope.watch = function(episode){
        $state.go('watchTorrent', {url: episode.magnetLink})
    }

});
