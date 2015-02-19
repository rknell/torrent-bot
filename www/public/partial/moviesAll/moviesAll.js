angular.module('www').controller('MoviesallCtrl',function($scope, $state, $http){

    $http.get("/api/Movie")
        .success(function(result){
            console.log("Movies", result);
            $scope.movies = result;
        })
        .error(function(err){
            alert("An error occurred");
            console.error(err);
        });

    $scope.view = function(magnet){
        $state.go('watchTorrent', {url: magnet.magnetLink});
    }

});
