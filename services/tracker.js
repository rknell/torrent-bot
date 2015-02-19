var Client = require('bittorrent-tracker');
var parseTorrent = require('parse-torrent');
var fs = require('fs');
var q = require('q');
var async = require('async');

var TVShows = require('../api/models/TVShow');
var TVShowsRecent = require('../api/models/TVShowRecent');

function getSeeders(magnetLink) {
  var deferred = q.defer();

  try {

    var maxSeeders = 0;
    var parsedTorrent = parseTorrent(magnetLink); // { infoHash: 'xxx', length: xx, announce: ['xx', 'xx'] }
    var peerId = new Buffer('01234563890123456789');
    var port = 6881;
    var client = new Client(peerId, port, parsedTorrent);

    client.on('scrape', function (data) {
      client.stop();
      if(maxSeeders < data.complete) maxSeeders = data.complete;
      deferred.resolve(maxSeeders);
    });

    client.scrape();

    setTimeout(deferred.reject, 6000);
  } catch(e){
    console.log("Error", e, magnetLink);
    deferred.reject(e);
  }

  return deferred.promise;
}

function CheckSeeds() {
  TVShows.model.find({})
    .exec(function (err, docs) {
      console.log("Number of shows", docs.length);

      async.eachLimit(docs, 5, function (item, cbA) {
        if (!item.seasons) item.seasons = [];
        async.eachLimit(item.seasons, 1, function (season, cbB) {
          if (!season.episodes) season.episodes = [];
          async.eachLimit(season.episodes, 1, function (episode, cbC) {
            getSeeders(episode.magnetLink)
              .then(function (seeds) {
                if (seeds < 40) {
                  console.log("Removed episode because not enough seeds", item.name, season.number, episode.number, episode.quality);
                  var episodeIndex = season.episodes.indexOf(episode);
                  season.episodes.splice(episodeIndex, 1);

                  TVShowsRecent.model.remove({
                    name: item.name,
                    season: season.number,
                    episode: episode.number,
                    quality: episode.quality
                  }, function(err){
                    if(err) console.err("Error removing dodgy show from recents", err);
                  })

                } else {
                  episode.seeds = seeds;
                }
                item.save(function (err, doc) {
                  cbC();
                });
              })
              .catch(function(err){
                if (err) console.error(err);
                cbC();
              })
          }, function (err) {
            cbB();
          })
        }, function (err) {
          cbA();
        })
      })
    })
}

module.exports = {
  getSeeders: getSeeders
};

CheckSeeds();