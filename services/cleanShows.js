var TVShows = require('../api/models/TVShow');
var async = require('async');
var q = require('q');

function clean(show){
  var deferred = q.defer();
  if(!show.seasons.length){
    //The show has no remaining seasons, so delete it
    show.remove(function(){
      console.log("Removing show because it has no more valid seasons", show.name);
      deferred.resolve();
    });
  } else {
    show.seasons.forEach(function(season, index){
      if(!season.episodes.length){
        //The show has no seasons
        console.log("Removed season because no valid episodes remain", show.name, season.number);
        show.seasons.splice(index, 1);
      }
    });

    show.save(function(err, doc){
      //console.log("Cleaned show", show.name);
      deferred.resolve();
    })
  }
  return deferred.promise;
}

function cleanAll(){
  var deferred = q.defer();

  TVShows.model.find({})
    .exec(function(err, docs){
      async.eachLimit(docs, 20, function(item, cb){
        clean(item)
          .finally(cb);
      }, function(err){
        deferred.resolve();
      })
    })

  return deferred.promise;
}

module.exports = {
  cleanAll: cleanAll
};
//Run it twice initially to remove all dead seasons and then dead shows
cleanAll().then(cleanAll);

setInterval(cleanAll, 1000 * 30);