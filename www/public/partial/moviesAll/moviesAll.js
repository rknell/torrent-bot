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

    $scope.view = function(movie){
        console.log("Attempting to view", movie);
        $state.go('movie', {id: movie._id});
    }

});
