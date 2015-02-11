angular.module('www').directive('placeholder', function() {
    return {
        link: function(scope, element, attrs) {
            element.bind('error', function() {
                    attrs.$set('src', "http://placehold.it/322x473");
            });
        }
    }
});
