var torrentStream = require('torrent-stream');
var q = require('q');
var ffmpeg = require('fluent-ffmpeg');

function start(torrent) {
  var deferred = q.defer();
  var ts = torrentStream(torrent);

  ts.on("ready", function () {
    selectMediaFile(ts)
      .then(function(ts){

      })
  });

  return deferred.promise;
}

function selectMediaFile(ts){
  var deferred = q.defer();
  var largestFile;
  ts.files.forEach(function(item){
    if(!largestFile || item.length > largestFile.length){
      largestFile = item;
    }
  });
  ts.mediaFile = largestFile;
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

  ts.publishStream = ts.transcodedStream.stream;

  deferred.resolve(ts);

  return deferred.promise;
}

module.exports = {
  start: start,
  selectMediaFile: selectMediaFile,
  transcode: transcode
};