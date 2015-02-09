/*
This is a simple example of defining a model, simply define the schema and enter any middleware
in the module.exports call
 */

var mongoose = require('mongoose');

//tvdb background http://thetvdb.com/banners/fanart/original/265912-1.jpg
//tvdb icon http://thetvdb.com/banners/_cache/posters/265912-1.jpg

var schema = new mongoose.Schema({
  name: {type: String, unique: true},
  year: Number,
  magnetLink: String,
  imdbId: String,
  imdbRating: String,
  tvdbId: String,
  posterUrl: String,
  backgroundUrl: String,
  network: String,
  description: String,
  recommendations: [{
    name: String,
    type: String, //movie or tvshow
    id: String
  }],
  seasons: [{
    number: Number,
    poster: String,
    episodes: [{
      number: String,
      name: String,
      quality: String,
      magnetLink: String,
      watched: {type: Boolean, default: false},
      dateAdded: Date,
      dateWatched: Date
    }]
  }]
});

module.exports = {
  middleware: {
    find: [],
    create: [],
    update: [],
    remove: [],
    findById: [],
    search: []
  },
  model: mongoose.model('TVShow', schema)
};
