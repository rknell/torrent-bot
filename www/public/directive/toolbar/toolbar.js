angular.module('www').directive('toolbar', function() {
	return {
		restrict: 'E',
		replace: true,
		scope: {

		},
		templateUrl: 'directive/toolbar/toolbar.html',
		controller: function($scope, $state){
            $scope.navigate = function(state){
                $state.go(state);
            }
        }
	};
});
