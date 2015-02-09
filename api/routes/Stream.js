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

function play(req, res){
  torrentEngine.play(req.body.url)
    .then(function(result){
      res.json(result);
    })
}

module.exports = {
  routes: [
    {
      path: "play",
      method: "post",
      fn: play,
      middleware: []
    }
  ]
};