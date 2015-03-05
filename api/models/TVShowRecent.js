/*
This is a simple example of defining a model, simply define the schema and enter any middleware
in the module.exports call
 */

var mongoose = require('mongoose');

//tvdb background http://thetvdb.com/banners/fanart/original/265912-1.jpg
//tvdb icon http://thetvdb.com/banners/_cache/posters/265912-1.jpg

var schema = new mongoose.Schema({
  name: String,
  year: Number,
  posterUrl: String,
  backgroundUrl: String,
  season: Number,
  episode: String,
  watched: Boolean,
  dateAdded: Date,
  dateAired: Date,
  dateWatched: Date,
  quality: String,
  magnetLink: String,
  seeds: String,
  tvdbId: String
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
  model: mongoose.model('TVShowRecent', schema)
};
