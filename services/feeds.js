var request = require('request');
var FeedParser = require('feedparser');
var TVShow = require('../api/models/TVShow');
var TVShowRecent = require('../api/models/TVShowRecent');
var async = require('async');
var q = require('q');
var tvdb = require('./tvdb');
var tracker = require('./tracker');

function showRss(cb) {
  setInterval(function () {
    fetch("http://showrss.info/feeds/all.rss", cb);
  }, 1000 * 60 * 5);
}

function fetch(feed, cb) {
  // Define our streams
  var data = [];
  var req = request(feed, {timeout: 10000, pool: false});
  req.setMaxListeners(50);
  // Some feeds do not respond without user-agent and accept headers.
  req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36')
  req.setHeader('accept', 'text/html,application/xhtml+xml');

  var feedparser = new FeedParser();

  // Define our handlers
  req.on('error', done);
  req.on('response', function (res) {
    if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));
    var charset = getParams(res.headers['content-type'] || '').charset;
    res = maybeTranslate(res, charset);
    // And boom goes the dynamite
    res.pipe(feedparser);
  });

  feedparser.on('error', done);
  feedparser.on('end', function () {
    done(null, data);
  });
  feedparser.on('readable', function () {
    var post;
    while (post = this.read()) {
      data.push(post);
    }
  });

  function maybeTranslate(res, charset) {
    var iconv;
    // Use iconv if its not utf8 already.
    if (!iconv && charset && !/utf-*8/i.test(charset)) {
      try {
        iconv = new Iconv(charset, 'utf-8');
        console.log('Converting from charset %s to utf-8', charset);
        iconv.on('error', done);
        // If we're using iconv, stream will be the output of iconv
        // otherwise it will remain the output of request
        res = res.pipe(iconv);
      } catch (err) {
        res.emit('error', err);
      }
    }
    return res;
  }

  function getParams(str) {
    var params = str.split(';').reduce(function (params, param) {
      var parts = param.split('=').map(function (part) {
        return part.trim();
      });
      if (parts.length === 2) {
        params[parts[0]] = parts[1];
      }
      return params;
    }, {});
    return params;
  }

  function done(err, data) {
    if (err) {
      console.error(err, err.stack);
    } else {

      var output = [];

      //Parse the show information for each item
      data.forEach(function (item) {
        var parsed = parseShowData(item);
        if (parsed) {
          output.push(parsed);
        }
      });

      async.eachSeries(output, function (item, cb) {
        addShowToDB(item)
          .then(function (result) {
            cb();
          })
          .catch(cb)
      }, function (err) {
        //console.log("Finished adding shows");
      })
    }
  }
}

function addSingleShow(title, magnetLink) {

  var deferred = q.defer();
  var data = parseShowData({title: title, magnetUri: magnetLink});

  if (data) {
    addShowToDB(data)
      .then(deferred.resolve)
      .catch(deferred.reject);
  } else {
    deferred.reject({message: "Invalid Title"});
  }

  return deferred.promise;

}

function parseShowData(item) {


  var blackListRegex = /Spanish|\[ITA\]|Lektor Pl|ITTV|Subtitulado|flemish/i;
  var isBlacklisted = blackListRegex.exec(item.title);
  var showData;

  if (!isBlacklisted) {
    var qualityRegex = /720p|1080p/i;


    var quality = qualityRegex.exec(item.title);

    if (!quality || !quality.length) {
      quality = "SD";
    } else {
      quality = quality[0];
    }

    var magnetUri;
    if (item['torrent:magneturi']) {
      magnetUri = item['torrent:magneturi']['#']
    } else if (item['rss:link']) {
      magnetUri = item['rss:link']['#']
    } else if (item.magnetUri) {
      magnetUri = item.magnetUri
    }

    //Try seasonXepisode format
    var regExp = /^(.*?)([0-9]{1,})x([0-9]{1,})(.*)/i;
    var result = regExp.exec(item.title);

    if (result) {
      if (!result[4]) result[4] = "";
      showData = {
        name: result[1].trim(),
        season: Number(result[2]),
        episode: Number(result[3]),
        episodeName: result[4].trim(),
        quality: quality,
        magnetUrl: magnetUri,
        originalName: item.title
      };
    }

    //Try SxxExx format
    var regExp = /^(.*?)S([0-9]{1,})E([0-9]{1,})/i;
    var result = regExp.exec(item.title);
    if (result) {
      showData = {
        name: result[1].trim(),
        season: Number(result[2]),
        episode: Number(result[3]),
        quality: quality,
        magnetUrl: magnetUri,
        originalName: item.title
      };
    }


    //Try date episode format (late shows)
    var regExp = /^(.*?)([0-9]{4})\-([0-9]{2}\-[0-9]{2})(.*|)(720p|1080p|)/i;
    var result = regExp.exec(item.title);
    if (result) {
      showData = {
        name: result[1].trim(),
        season: Number(result[2]),
        episode: result[3].trim(),
        episodeName: result[4].trim(),
        quality: quality,
        magnetUrl: magnetUri,
        originalName: item.title
      };

      if (showData.episodeName == "720p" || showData.episodeName == "1080p") {
        showData.quality = showData.episodeName;
        showData.episodeName = null;
      }

    }

    if (showData && showData.name) {
      showData.name = cleanName(showData.name);
    }

    return showData;

  }
}

function cleanName(name) {
  name = name.replace(/\./gi, " ");
  name = name.replace(/\&/gi, " ");
  name = name.replace(/\'|\!|\(|\)|US/gi, "");
  name = name.trim();
  name = name.toUpperCase();
  return name;
}

function addShowToRecents(showData, posterUrl, backgroundUrl, tmdbData) {
  var newShow = new TVShowRecent.model({
    name: tmdbData.showRes.name,
    year: showData.year,
    posterUrl: tmdbData.showRes["poster_path"],
    backgroundUrl: tmdbData.showRes["backdrop_path"],
    season: showData.season,
    episode: showData.episode,
    watched: false,
    dateAdded: Date(),
    dateAired: tmdbData.episodeRes['air_date'],
    quality: showData.quality,
    magnetLink: showData.magnetUrl,
    tvdbId: showData.tvdbId
  });

  newShow.save(function (err, doc) {
    if (err) {
      console.error(showData, err)
    }
  })
}

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

function getTMDBData(showData) {
  var deferred = q.defer();
  try {
    var MovieDB = require('./moviedb')('75b5199b3ca7adaee206a1698fd99cf0');
    getTMDBConfig()
      .then(function () {
        MovieDB.searchTv({query: showData.name}, function (err, showRes) {
          if (err || !showRes.results || !showRes.results.length) {
            if (err) {
              console.error(err);
            }
            deferred.reject(err);
          }
          else {
            showRes.results[0]['backdrop_path'] = tmdbConfig.images['base_url'] + 'w1280' + showRes.results[0]['backdrop_path'];
            showRes.results[0]['poster_path'] = tmdbConfig.images['base_url'] + 'w342' + showRes.results[0]['poster_path'];

            MovieDB.tvEpisodeInfo({
              season_number: showData.season,
              episode_number: showData.episode,
              id: showRes.results[0].id
            }, function (err, episodeRes) {
              if (err) {
                console.error(err);
                deferred.reject(err);
              }
              else {
                episodeRes["still_path"] = tmdbConfig.images['base_url'] + 'w300' + episodeRes["still_path"]
                deferred.resolve({
                  showRes: showRes.results[0],
                  episodeRes: episodeRes
                })
              }
            })
          }
        })
      })
      .catch(function (err) {
        console.error(err);
        deferred.reject(err);
      });
  } catch (e) {
    console.error("Error getTMDBdata", e, e.stack);
    deferred.reject(e);
  }


  return deferred.promise;
}

function updateShow(doc, showData, tmdbData) {
  var deferred = q.defer();
  //Update doc
  var foundSeason = false;
  var madeChanges = false;

  doc.seasons.forEach(function (season) {
    if (season.number == showData.season) {
      foundSeason = true;
      var foundEpisode = false;
      season.episodes.forEach(function (episode) {
        if (episode.number == showData.episode && episode.quality == showData.quality) {
          foundEpisode = episode;
        }
      });
      if (!foundEpisode) {
        season.episodes.push({
          name: tmdbData.episodeRes['name'],
          number: tmdbData.episodeRes['episode_number'],
          quality: showData.quality,
          magnetLink: showData.magnetUrl,
          dateAdded: Date(),
          dateAired: tmdbData.episodeRes['air_date'],
          stillUrl: tmdbData.episodeRes['still_path'],
          synopsis: tmdbData.episodeRes.overview
        });
        addShowToRecents(showData, doc.posterUrl, doc.backgroundUrl, tmdbData);
        madeChanges = true;
      } else {
        //Found the episode, but this might be a better torrent
        isBetter(foundEpisode.magnetLink, showData.magnetUrl)
          .then(function (result) {
            if (result) {
              foundEpisode.magnetLink = showData.magnetLink
              madeChanges = true;
            }
          })
      }
    }
  });
  if (!foundSeason) {
    doc.seasons.push({
      number: showData.season,
      episodes: [{
        name: tmdbData.episodeRes['name'],
        number: tmdbData.episodeRes['episode_number'],
        quality: showData.quality,
        magnetLink: showData.magnetUrl,
        dateAdded: Date(),
        dateAired: tmdbData.episodeRes['air_date'],
        stillUrl: tmdbData.episodeRes['still_path'],
        synopsis: tmdbData.episodeRes.overview
      }]
    });
    addShowToRecents(showData, doc.posterUrl, doc.backgroundUrl, tmdbData);
    madeChanges = true;
  }
  if (madeChanges) {
    doc.save(function (err, doc) {
      deferred.resolve(doc);
      console.log("Updated show", doc.name);
    })
  } else {
    deferred.reject({message: "No Changes Made"});
  }

  return deferred.promise;
}


function saveShow(showData, tmdbData) {
  var deferred = q.defer();

  var newShow = new TVShow.model({
    name: tmdbData.showRes.name,
    tmdbId: tmdbData.showRes.id,
    posterUrl: tmdbData.showRes["poster_path"],
    backgroundUrl: tmdbData.showRes["backdrop_path"],
    seasons: [{
      number: tmdbData.episodeRes['season_number'],
      episodes: [{
        name: tmdbData.episodeRes['name'],
        number: tmdbData.episodeRes['episode_number'],
        quality: showData.quality,
        magnetLink: showData.magnetUrl,
        dateAdded: Date(),
        dateAired: tmdbData.episodeRes['air_date'],
        stillUrl: tmdbData.episodeRes['still_path'],
        synopsis: tmdbData.episodeRes.overview
      }]
    }]
  });

  newShow.save(function (err, doc) {
    if (doc) {
      returned = true;
      deferred.resolve(doc);
      addShowToRecents(showData, doc.posterUrl, doc.backgroundUrl, tmdbData);
      console.log("Added show", doc.name);
    } else {
      if (!err) {
        console.log("No doc for some reason");
        deferred.reject({message: "No doc for some reason"});
      }
      else {
        deferred.reject({message: "Error adding show", data: err});
      }
    }
  });


  return deferred.promise;
}


function addShowToDB(showData) {
  var deferred = q.defer();

  tracker.getSeeders(showData.magnetUrl)
    .then(function (result) {
      if (result > 60) {
        getTMDBData(showData)
          .then(function (tmdbData) {
            TVShow.model.findOne({name: tmdbData.showRes.name})
              .exec(function (err, doc) {
                if (err) {
                  deferred.reject(err);
                } else {
                  if (doc) {
                    updateShow(doc, showData, tmdbData)
                      .then(deferred.resolve)
                      .catch(deferred.reject);

                  } else {
                    saveShow(showData, tmdbData)
                      .then(deferred.resolve)
                      .catch(deferred.reject);
                  }
                }
              });
          }).catch(deferred.reject);
      } else {
        console.log('Not adding', showData.name, 'Not enough seeds');
        deferred.reject({message: "Not enough seeds"});
      }
    })
    .catch(function(err){
      deferred.reject(err);
    });

  return deferred.promise;
}

var tmdbConfig;
function getTMDBConfig() {
  var deferred = q.defer();
  try {
    if (!tmdbConfig) {
      var MovieDB = require('./moviedb')('75b5199b3ca7adaee206a1698fd99cf0');
      MovieDB.configuration(function (err, res) {
        tmdbConfig = res;
        deferred.resolve(res);
      })
    } else {
      deferred.resolve(tmdbConfig);
    }
  } catch (e) {
    deferred.reject(e);
    console.log("Error getting TMDB Config", e, e.stack);
  }
  return deferred.promise;
}

module.exports = {
  showRss: showRss,
  addSingleShow: addSingleShow
};
