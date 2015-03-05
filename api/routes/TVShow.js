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

function recent(req, res) {
  TVShowRecent.model
    .find({})
    .sort('-dateAired')
    .limit(500)
    .exec(function (err, docs) {
      res.json(docs);
    })
}

function latestEpisode(tvShow) {
  //get most recent season
  var highestSeason;
  tvShow.seasons.forEach(function (season) {
    if (!highestSeason || season.number > highestSeason.number) {
      highestSeason = season;
    }
  });

  var highestEpisode;
  highestSeason.episodes.forEach(function (episode) {
    if (!highestEpisode || highestEpisode.datedAdded < episode.dateAdded) {
      highestEpisode = episode
    }
  });

  return {
    season: highestSeason.number,
    episode: highestEpisode
  }
}

function findAll(req, res) {
  TVShow.model
    .find({})
    .sort('name')
    .exec(function (err, docs) {
      res.json(docs);
    })
}

function markWatched(req, res) {

  var name = req.body.name;
  var seasonNumber = Number(req.body.season);
  var episodeNumber = String(req.body.episode);

  console.log("Marking watched", name, seasonNumber, episodeNumber);

  TVShow.model
    .find({name: name})
    .exec(function (err, docs) {
      if (docs.length) {
        docs.forEach(function (show) {
          show.seasons.forEach(function (season) {
            if (season.number === seasonNumber) {
              season.episodes.forEach(function (episode) {
                if (episode.number === episodeNumber) {
                  episode.watched = true;
                }
              })
            }
          });
          show.save(function (err, doc) {
            res.json(doc);
            console.log("Saved", doc.name);
          })
        })
      } else {
        res.status(404).json({
          message: "Could not find " + name,
          name: name,
          episode: episodeNumber,
          season: seasonNumber
        })
      }


    });

  if (name && seasonNumber && episodeNumber) {
    TVShowRecent.model
      .update({name: name, season: seasonNumber, episode: episodeNumber}, {watched: true}, {}, function (err, doc) {
        console.log("Updated recent episodes as watched", name, seasonNumber, episodeNumber);
      })
  }

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
    },
    {
      path: "watched",
      method: "post",
      fn: markWatched,
      middleware: []
    }
  ]
};