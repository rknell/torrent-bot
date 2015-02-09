angular.module('www').directive('tvShowToolbar', function() {
	return {
		restrict: 'E',
		scope: {

		},
		templateUrl: 'directive/tvShowToolbar/tvShowToolbar.html',
		controller: function($scope, $state){
            $scope.navigate = function(state){
                $state.go(state);
            }
        }
	};
});
