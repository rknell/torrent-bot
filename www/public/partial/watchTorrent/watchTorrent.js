angular.module('www').controller('WatchtorrentCtrl',function($scope, $stateParams, $http, $sce, nowPlaying){


    if($stateParams.url && $stateParams.url !== "continue"){
        nowPlaying.isPlaying = false;
        //Load up the gear
        $http.post('/api/stream/play', {url: $stateParams.url})
            .success(function(result){
                console.log("Stream result", result);
                $scope.streamUrl = $sce.trustAsResourceUrl(result.url);
                nowPlaying.isPlaying = true;
                nowPlaying.streamUrl = $scope.streamUrl;
            })
            .error(function(err){
                console.error(err);
                alert("An error occurred loading the file");
            })
    } else {
        $scope.streamUrl = nowPlaying.streamUrl;
    }

});
