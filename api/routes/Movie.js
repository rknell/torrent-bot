var Movie = require('../models/Movie');

function findAll(req, res) {
  Movie.model
    .find({})
    .sort('-dateAdded')
    .exec(function (err, docs) {
      res.json(docs);
    })
}

module.exports = {
  routes: [
    {
      path: "",
      method: "get",
      fn: findAll,
      middleware: []
    }
  ]
};