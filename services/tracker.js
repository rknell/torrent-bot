var Client = require('bittorrent-tracker');
var parseTorrent = require('parse-torrent');
var fs = require('fs');
var q = require('q');
var async = require('async');

var TVShows = require('../api/models/TVShow');
var TVShowsRecent = require('../api/models/TVShowRecent');

var successfulRequests = 0;
var unsuccessfulRequests = 0;
var timeoutMultiplier = 50;

function getSeeders(magnetLink) {
  var deferred = q.defer();

  var maxSeeders = 0;
  var parsedTorrent = parseTorrent(magnetLink); // { infoHash: 'xxx', length: xx, announce: ['xx', 'xx'] }

  var peerSeed = (Math.random() + ' ').substring(2, 10) + (Math.random() + ' ').substring(2, 10) + (Math.random() + ' ').substring(2, 8);

  var peerId = new Buffer(peerSeed);
  var port = 6881;
  var client = new Client(peerId, port, parsedTorrent);

  var returnedResults = 0;
  var returnedClientResults = 0;
  var numberOfTrackers = parsedTorrent.tr.length;

  client.on('scrape', function (data) {
    returnedResults++;
    client.stop();
    if (maxSeeders < data.complete) maxSeeders = data.complete;

    if (returnedResults === numberOfTrackers) {
      deferred.resolve(maxSeeders);
      client.stop();
      client.destroy();
      successfulRequests ++;
    }
  });

  client.on('update', function (data) {
    returnedClientResults++;

    if (data.complete > maxSeeders) {
      maxSeeders = data.complete;
    }

  });
  client.update();

  if((successfulRequests / (successfulRequests + unsuccessfulRequests)) < 0.9){
    timeoutMultiplier++;
  } else {
    timeoutMultiplier--;
  }


  if(timeoutMultiplier < 5) timeoutMultiplier = 5;
  if(timeoutMultiplier > 60) timeoutMultiplier = 60;
  setTimeout(function () {
    if (maxSeeders === 0) {
      //For some reason everything failed.
      //console.error("Could not get ANY seed results", magnetLink, returnedClientResults, maxSeeders);

      //Dont remove it just yet!
      maxSeeders = 100;
      unsuccessfulRequests ++;
    } else {
      //console.log("Timed out with results", magnetLink, returnedClientResults, maxSeeders);
      successfulRequests++;
    }
    deferred.resolve(maxSeeders);
    client.stop();
    client.destroy();
  }, 1000 * timeoutMultiplier);

  client.scrape();

  return deferred.promise;


}

function CheckSeeds() {
  TVShows.model.find({})
    .exec(function (err, docs) {
      console.log("Number of shows", docs.length);

      async.eachLimit(docs, 1, function (item, cbA) {
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
                  }, function (err) {
                    if (err) console.err("Error removing dodgy show from recents", err);
                  })

                } else {
                  episode.seeds = seeds;
                }
                item.save(function (err, doc) {
                  //cbC();
                  setTimeout(cbC, 1000 * 10);
                });
              })
              .catch(function (err) {
                if (err) console.error(err);
                cbC();
              })
          }, function (err) {
            cbB();
          })
        }, function (err) {
          cbA();
        })
      }, function (err) {
        //Completed checking seeds
        setTimeout(CheckSeeds, 1000 * 60 * 12);
      })
    })
}

setInterval(function(){
  console.log("Successful tracker requests", successfulRequests, unsuccessfulRequests, successfulRequests / (successfulRequests + unsuccessfulRequests), timeoutMultiplier)
}, 1000 * 10);


module.exports = {
  getSeeders: getSeeders
};

CheckSeeds();