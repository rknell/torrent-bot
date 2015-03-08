var torrentStream = require('torrent-stream');
var q = require('q');
var ffmpeg = require('fluent-ffmpeg');

function start(torrent) {
  var deferred = q.defer();
  var ts = torrentStream(torrent);

  ts.on("ready", function () {
    deferred.resolve(ts)
  });

  return deferred.promise;
}

function selectMediaFile(ts){
  var deferred = q.defer();
  ts.files.forEach(function(item){
    if(!ts.mediaFile || item.length > ts.mediaFile.length){
      ts.mediaFile = item;
    }
  });
  console.log("Playing file",ts.mediaFile.name, Math.round(ts.mediaFile.length / 1000000),"mb");
  ts.publishStream = ts.mediaFile.createReadStream();
  deferred.resolve(ts);
  return deferred.promise;
}

function transcode(ts){
  var deferred = q.defer();
  ts.transcodedStream = ffmpeg(ts.mediaFile.createReadStream())
    .format("mp4")
    .size("340x?")
    .addOptions([
      "-movflags frag_keyframe+faststart",
      "-strict -2"
    ])
    // setup event handlers
    .on('end', function() {
      console.log('file has been converted succesfully');
      //TODO: Stop torrent?
    })
    .on('error', function(err) {
      console.log('an error happened: ' + err.message);
    });

  ts.publishStream = ts.transcodedStream.stream();

  deferred.resolve(ts);

  return deferred.promise;
}

module.exports = {
  start: start,
  selectMediaFile: selectMediaFile,
  transcode: transcode
};