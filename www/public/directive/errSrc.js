angular.module('www').directive('placeholder', function() {
    return {
        link: function(scope, element, attrs) {
            var lastArt = 1;
            element.bind('error', function() {
                //var lastArt = attrs.lastart;
                var tvdbId = attrs.tvdbid;
                if (lastArt === 4 || !tvdbId || !lastArt) {
                    attrs.$set('src', "http://placehold.it/322x473");
                } else {
                    lastArt++;
                    attrs.$set('lastArt', lastArt);
                    attrs.$set('src', "http://thetvdb.com/banners/_cache/posters/" + tvdbId + "-" + lastArt + ".jpg");
                }
            });
        }
    }
});
