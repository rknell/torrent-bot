angular.module('www').controller('WatchtorrentCtrl',function($scope, $stateParams, $http, $sce, nowPlaying){

    $scope.untrustedUrl;

    if($stateParams.url && $stateParams.url !== "continue"){
        nowPlaying.isPlaying = false;
        //Load up the gear
        $http.post('/api/stream/play', {url: $stateParams.url})
            .success(function(result){
                console.log("Stream result", result);
                $scope.streamUrl = $sce.trustAsResourceUrl(result.url);
                $scope.untrustedUrl = result.url;
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

    $scope.playChromecast = function () {
        $http.post('/api/stream/chromecast', {
            title: "No title yet",
            url: $scope.untrustedUrl
        })
            .success(function (result) {
                console.log("Result");
                $scope.isCasting = true;
            })
            .error(function (err) {
                alert("There was an error casting");
                console.log("Error", err)
            })
    }

});
