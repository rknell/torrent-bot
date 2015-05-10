var torrentController = require('./torrent-controller');
var clivas = require('clivas');
var showRSS = require('./showRss');
var q = require('q');
var tracker = require('./tracker');
var kickassTV = require('./kickassTV');
var cleanAll = require('./cleanShows');
var kickassMovies = require('./kickassMovies').processShows();

var engine;

var lastUri;
var lastResponse;

//function play(uri){
//  var deferred = q.defer();
//
//  if(uri !== lastUri){
//    clivas.clear();
//    clivas.line("Loading " + uri);
//    //Stop the current one
//    if(engine){
//      clivas.line("Stopping current torrent");
//      engine.swarm.pause();
//      engine.swarm.destroy();
//      clearInterval(engine.drawTimerId);
//      engine.remove(function(){
//        engine.destroy(function(){
//          engine = torrentController.load(uri, function (err, host) {
//            host.url= host.url + 'media.mp4';
//            if(err)
//              deferred.reject(err);
//            else {
//              lastResponse = host;
//              deferred.resolve(host);
//            }
//          });
//        })
//      })
//    } else {
//      engine = torrentController.load(uri, function (err, host) {
//        host.url= host.url + 'media.mp4';
//        if(err)
//          deferred.reject(err);
//        else {
//          lastResponse = host;
//          deferred.resolve(host);
//        }
//      });
//    }
//  } else {
//    //Requesting the same url as last time, so just give the same response and we don't need to redownload the shizzle
//    deferred.resolve(lastResponse);
//  }
//
//  lastUri = uri;
//
//  return deferred.promise;
//}

//Run the scanners
kickassTV.processShows();


//module.exports = {
//  engine: engine,
//  play: play
//};
