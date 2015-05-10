angular.module('www').controller('TvshowsrecentCtrl', function ($scope, $http, $state, nowPlaying, $mdDialog) {
    var selectedShow;
    $http.get('/api/tvshow/recent')
        .success(function (results) {
            $scope.shows = results;
            console.log("Loaded recent shows", results);
        });

    $scope.watch = function (show) {
        //$scope.$root.background = show.backgroundUrl;

        //$state.go('watchTorrent', {url: show.magnetLink})

        $scope.showAdvanced(function (result) {
            console.log(result);
        });

        selectedShow = show;
    };

    $scope.showAdvanced = function (ev) {
        $mdDialog.show({
            controller: DialogController,
            templateUrl: 'templates/selectTorrent.tmpl.html',
            targetEvent: ev
        })
            .then(function (result) {
                //$scope.alert = 'You said the information was "' + answer + '".';
                console.log("modal result", result);
                nowPlaying.startWatching(selectedShow.episode, selectedShow.season, selectedShow.name, result.url);
            }, function () {
                //$scope.alert = 'You cancelled the dialog.';
            });
    };

    function DialogController($scope, $mdDialog) {
        $scope.show = selectedShow;
        //$scope.hide = function () {
        //    $mdDialog.hide();
        //};
        $scope.cancel = function () {
            $mdDialog.cancel();
        };

        $scope.watch = $mdDialog.hide;
        //$scope.answer = function (answer) {
        //    $mdDialog.hide(answer);
        //};
    }
});
