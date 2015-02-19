var Client = require('bittorrent-tracker');
var parseTorrent = require('parse-torrent');
var fs = require('fs');
var q = require('q');

var TVShows = require('../api/models/TVShow');

function getSeeders(magnetLink) {
  var deferred = q.defer();

  try {

    var maxSeeders = 0;


    var parsedTorrent = parseTorrent(magnetLink); // { infoHash: 'xxx', length: xx, announce: ['xx', 'xx'] }

    var peerId = new Buffer('01234563890123456789');
    var port = 6881;

    var client = new Client(peerId, port, parsedTorrent);

    client.on('error', function (err) {
      // fatal client error!
      //console.log(err.message);
    });

    client.on('warning', function (err) {
      // a tracker was unavailable or sent bad data to the client. you can probably ignore it
      //console.log(err.message);
    });

    client.on('scrape', function (data) {
      //console.log('got a scrape response from tracker: ' + data.announce);
      //console.log('number of seeders in the swarm: ' + data.complete);
      //console.log('number of leechers in the swarm: ' + data.incomplete);
      //console.log('number of total downloads of this torrent: ' + data.incomplete);
      client.stop();
      if(maxSeeders < data.complete) maxSeeders = data.complete;
      deferred.resolve(maxSeeders);
    });

    //setTimeout(function(){
    //  deferred.resolve(maxSeeders);
    //  console.log("Returning " + maxSeeders + " seeders");
    //}, 200000);

    client.scrape();
  } catch(e){
    console.log("Error", e, magnetLink)
    deferred.reject(e);
  }


  return deferred.promise;
}

function CheckSeeds(){
  TVShows.model.find({})
    .exec(function(err, docs){
      console.log("Number of shows", docs.length);

      docs.forEach(function(item){
        item.seasons.forEach(function(season){
          season.episodes.forEach(function(episode, episodeIndex){
            getSeeders(episode.magnetLink)
              .then(function(seeds){
                if(seeds < 40){
                  console.log("Removed episode because not enough seeds", item.name, season.number, episode.number, episode.quality);
                  season.episodes.splice(episodeIndex, 1);
                } else {
                  episode.seeds = seeds;
                }

                item.save(function(err, doc){
                  //else console.log("Saved ", doc.name);
                });
              })
              .catch(function(err){
                console.error(err);
              })
          })
        })
      })
    })
}

module.exports = {
  getSeeders: getSeeders
};

CheckSeeds();

//Check and update the seeds every 30 minutes
setInterval(CheckSeeds, 1000 * 60 * 30);