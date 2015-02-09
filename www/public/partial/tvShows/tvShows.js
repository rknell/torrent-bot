/*global alert*/
angular.module('www').controller('TvshowsCtrl',function($scope, $http, $state){

    $http.get("/api/TVShow")
        .success(function(result){
            console.log("Shows", result);
            $scope.shows = result;
        })
        .error(function(err){
            alert("An error occurred");
            console.error(err);
        });

    $scope.view = function(show){
        $state.go('show', {id: show._id});
    }

});
