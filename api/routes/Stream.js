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
var chromecastLib = require('../../services/chromecast');
var torrentStreamLib = require('../../services/torrentStreamLib');

var needToAttach = false;

function play(req, res){
  torrentStreamLib.start(req.params.url)
    .then(function(result){
      res.contentType('mp4');
      result.stream.pipe(res);
    })
}

function chromecast(req, res) {
  var title = req.body.title;
  var url = req.body.url;

  chromecastLib.play(url, url)
    .then(function(result){
      res.json({success: true});
    })
    .catch(function(err){
      res.status(500).json(err);
    });
}

module.exports = {
  routes: [
    {
      path: "play/:url/media.mp4",
      method: "get",
      fn: play,
      middleware: []
    },
    {
      path: "chromecast",
      method: "post",
      fn: chromecast,
      middleware: []
    }
  ]
};