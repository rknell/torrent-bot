/**
 * Define a model by defining the mongoose schema. You can add mongoose plugins, express middleware
 * to handle security or anything else you would like to do that is directly related to the model
 *
 * These models will be picked up and api endpoints automatically exposed.
 */

var SimpleTimestamps = require('mongoose-simpletimestamps').SimpleTimestamps;
var middleware = require('../middleware');
var mongoose = require('mongoose');

//Define Schema
//-------------
var schema = new mongoose.Schema({
  name: String,
  logo: String,
  resourcePath:  String,
  favourite: String
});

//Plugins
//-------------
schema.plugin(SimpleTimestamps);

//Object that is returned
//-------------
module.exports = {
  middleware: {
    find: [],
    create: [],
    update: [],
    remove: [],
    findById: [],
    search: []
  },
  model: mongoose.model('StreamingChannel', schema)
}
