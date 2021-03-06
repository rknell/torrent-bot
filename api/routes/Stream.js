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
var pump = require('pump');

var needToAttach = false;
var ts;
function play(req, res) {
  console.log("Started playing", req.params.url);

  torrentStreamLib.start(req.params.url, req.headers.range)
    .then(torrentStreamLib.selectMediaFile)
    //.then(torrentStreamLib.transcode)
    .then(function (ts) {
      res.contentType('mp4');
      res.setHeader("Content-Length", ts.mediaFile.length);
      res.setHeader('Content-Range', 'bytes ' + ts.range.start + '-' + ts.range.end + '/' + ts.mediaFile.length);
      ts.publishStream.pipe(res, {end: true});
      console.log("Should have started streaming");
    })
    .catch(function (err) {
      console.error("Error streaming file", err);
      res.status(500).json(err);
    });
}

function chromecast(req, res) {
  var title = req.body.title;
  var url = req.body.url;

  chromecastLib.play(url, url)
    .then(function (result) {
      res.json({success: true});
    })
    .catch(function (err) {
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