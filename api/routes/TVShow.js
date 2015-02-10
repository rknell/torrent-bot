/*
 This defines custom routes. It is pretty standard nodejs, you just need to add to the routes array
 the appropriate details so a route can be created with security and other bits.
 This example overrides the default find function in the Cat model by simply using the find name.
 To override the default functions on the models use the following names:
 find,
 create,
 update,
 remove,
 findById,
 search
 */
var torrentEngine = require('../../services/main');
var TVShow = require('../models/TVShow');
var TVShowRecent = require('../models/TVShowRecent');

function recent(req, res){
  TVShowRecent.model
    .find({})
    .sort('-dateAdded')
    .limit(500)
    .exec(function(err, docs){
      console.log("Returning recent shows", docs);
      res.json(docs);
      //var output = [];
      //  docs.forEach(function(item){
      //
      //    item.latestEpisode = latestEpisode(item);
      //
      //    output.push(item);
      //  })
      //res.json(output);
    })
}

function latestEpisode(tvShow){
  //get most recent season
  var highestSeason;
  tvShow.seasons.forEach(function(season){
    if(!highestSeason || season.number > highestSeason.number){
      highestSeason = season;
    }
  });

  var highestEpisode;
  highestSeason.episodes.forEach(function(episode){
    if(!highestEpisode || highestEpisode.datedAdded < episode.dateAdded){
      highestEpisode = episode
    }
  });

  return {
    season: highestSeason.number,
    episode: highestEpisode
  }
}

function findAll(req, res, model) {
  console.log('Final all executed')
  TVShow.model
    .find({})
    .sort('name')
    .exec(function (err, docs) {
      res.json(docs);
    })
}

module.exports = {
  routes: [
    {
      path: "recent",
      method: "get",
      fn: recent,
      middleware: []
    },
    {
      path: "",
      method: "get",
      fn: findAll,
      middleware: []
    }
  ]
};