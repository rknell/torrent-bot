var Movie = require('../api/models/Movie');
var q = require('q');
var MovieDB = require('moviedb')('75b5199b3ca7adaee206a1698fd99cf0');

var tracker = require('./tracker');

var tmdbConfig;

function parseTitle(title) {

  var deferred = q.defer();

  var blacklistRegex = /Cam|Italian|French|Tamil|Legendado|Dublado|ThePirateFilmes|RedOctra|ita|Telugu|Hindi|lektor|Spanish|Espanol|Ingles|AndreTPF|Gesproken|DutchReleaseTeam|Filme|Dubbing|pimprg|Latino|Swedish/i;
  var blacklist = blacklistRegex.exec(title);

  if (!blacklist) {
    var qualityRegex = /720p|1080p|BrRip|DVDScr|HDRIP|DVDRIp/i;
    var quality = qualityRegex.exec(title);

    if (quality) {
      var titleRegex = /^(.*?)([0-9]{4})/i;
      var parsedTitle = titleRegex.exec(title);

      var output = {
        title: cleanTitle(parsedTitle[1]),
        quality: quality[0],
        year: parsedTitle[2]
      };

      deferred.resolve(output);
    } else {
      deferred.reject();
    }


  } else {
    deferred.reject();
  }

  return deferred.promise;

}

function cleanTitle(title) {
  title = title.replace(/\[|\(/i, "");
  title = title.replace(/\./i, " ");
  title = title.trim();
  title = title.toUpperCase();
  return title;
}


//var schema = new mongoose.Schema({
//  name: String,
//  year: Number,
//  magnetLink: String,
//  imdbId: String,
//  imdbRating: String,
//  poster: String,
//  quality: String,
//  dateAdded: Date,
//  description: String,
//  recommendations: [{
//    name: String,
//    type: String, //movie or tvshow
//    id: String
//  }]
//});

function isBetter(current, newItem) {
  var deferred = q.defer();
  var currentResult, newResult;
  tracker.getSeeders(current)
    .then(function (current) {
      currentResult = current;
      return tracker.getSeeders(newItem);
    })
    .then(function (newItem) {
      if (currentResult < newItem) {
        deferred.resolve(true);
      } else {
        deferred.resolve(false);
      }
    });

  return deferred.promise;
}

function saveToDb(data) {
  var deferred = q.defer();
  MovieDB.searchMovie({query: data.title}, function (err, res) {
    if (res && res.results[0]) {
      MovieDB.movieInfo({id: res.results[0].id}, function (err, movieInfo) {
        if (movieInfo) {
          Movie.model
            .find({
              name: data.title,
              //quality: data.quality,
              year: data.year
            })
            .exec(function (err, docs) {
              if (!docs.length) {

                if (movieInfo['original_language'] === "en") {
                  var baseUrl = tmdbConfig.images['base_url'];
                  var show = data;
                  var newItem = new Movie.model({
                    name: data.title,
                    quality: data.quality,
                    magnetLink: data.magnetUrl,
                    year: data.year,
                    poster: baseUrl + 'w342' + res.results[0]['poster_path'],
                    background: baseUrl + 'original' + res.results[0]['backdrop_path'],
                    dateAdded: Date(),
                    imdbId: movieInfo['imdb_id'],
                    description: movieInfo.overview
                  });

                  newItem.save(function (err, doc) {
                    if (doc) {
                      console.log(doc.name, "added");
                      deferred.resolve(doc);
                    } else {
                      if (err) {
                        console.error("Error updating movie", err);
                      }
                      deferred.reject();
                    }

                  })
                } else {
                  deferred.reject();
                }

              } else {
                var foundItem = docs[0];
                var foundMagnet = false;
                var madeChanges = false;

                foundItem.magnets.forEach(function (item) {
                  if (item.quality == data.quality) {
                    foundMagnet = true;
                    isBetter(item.magnetLink, data.magnetUrl)
                      .then(function (better) {
                        if (better) {
                          item.magnetLink = data.magnetUrl;
                          madeChanges = true;
                        }
                      })
                  }
                });

                if (!foundMagnet) {
                  foundItem.magnets.push({
                    quality: data.quality,
                    magnetLink: data.magnetUrl
                  })
                  madeChanges = true;
                }

                if (madeChanges) {
                  foundItem.save(function (err, doc) {
                    deferred.resolve(doc);
                    console.log("Updated movie", doc.name)
                  });
                }

                //deferred.reject();
              }
            });
        }
      })
    } else {
      deferred.reject();
    }
  });


  return deferred.promise;
}

function getTMDBConfig() {
  var deferred = q.defer();

  if (!tmdbConfig) {
    MovieDB.configuration(function (err, res) {
      tmdbConfig = res;
      deferred.resolve(res);
    })
  } else {
    deferred.resolve(tmdbConfig);
  }

  return deferred.promise;
}

function addMovie(title, magnetUrl) {

  return getTMDBConfig()
    .then(function () {
      return parseTitle(title)
    })
    .then(function (result) {
      result.magnetUrl = magnetUrl;
      return saveToDb(result);
    })
    .catch(function (err) {
      //console.error(err);
    })
}

module.exports = {
  addMovie: addMovie
};