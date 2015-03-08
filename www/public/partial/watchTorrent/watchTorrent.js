angular.module('www').controller('WatchtorrentCtrl',function($scope, $stateParams, $http, $sce, nowPlaying){

    $scope.magnetLink = $sce.trustAsResourceUrl("/api/stream/play/" + encodeURIComponent($stateParams.url) + "/media.mp4");

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
