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
//var torrentEngine = require('../../services/main');
var torrentEngine = require('../../services/torrent-controller2');
//var chromecastPlayer = require('chromecast-player')();
var chromecastLib = require('../../services/chromecast');

var needToAttach = false;


function play(req, res){
  torrentEngine(req.body.url, function(status, update){
    res.json({url: status.href});
  })
  //torrentEngine.play(req.body.url)
  //  .then(function(result){
  //    res.json(result);
  //  })
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



  //torrentEngine.play(url)
  //  .then(function (result) {
  //    console.log('Trying to chromecast', result);

      //try{
      //  chromecastPlayer.launch('http://www.w3schools.com/html/mov_bbb.mp4', function(err, p) {
      //    p.once('playing', function() {
      //      console.log('playback has started.');
      //      res.json({success: true});
      //    });
      //  });
      //} catch(e){
      //  res.status(500).json(e);
      //  console.error(e);
      //}

  //if(!needToAttach){
  //  chromecastPlayer.launch(url, function(err, p) {
  //    needToAttach = true;
  //    if(err){
  //      console.error(err, url, title);
  //      res.status(500).json(err.message);
  //    }
  //    p.once('playing', function() {
  //      console.log('playback has started.');
  //      res.json({success: true});
  //    });
  //  });
  //} else {
  //  chromecastPlayer.attach(url, function(err, p) {
  //    if(err){
  //      console.error(err, url, title);
  //      res.status(500).json(err.message);
  //    }
  //    p.once('playing', function() {
  //      console.log('playback has started.');
  //      res.json({success: true});
  //    });
  //  });
  //}




      //var player = chromecastPlayer({
      //  path: "http://www.w3schools.com/html/mov_bbb.mp4",
      //  type: opts.type || 'video/mp4',
      //  metadata: {title: title || 'No title specified'}
      //}, function (err, p) {
      //  console.log("returned", err, p)
      //  p.once('playing', function () {
      //    console.log('playback has started.');
      //    res.json({success: true});
      //  })
      //});
    //})
}

module.exports = {
  routes: [
    {
      path: "play",
      method: "post",
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