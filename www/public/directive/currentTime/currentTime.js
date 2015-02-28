angular.module('www').directive('currentTime', function() {
	return {
		restrict: 'E',
		replace: true,
		scope: {

		},
		templateUrl: 'directive/currentTime/currentTime.html',
        controller: function($scope, $interval){
            $interval(function(){
                $scope.currentTime = new Date();
            }, 1000)
        }
	};
});
