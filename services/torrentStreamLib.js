var torrentStream = require('torrent-stream');
var q = require('q');
var ffmpeg = require('fluent-ffmpeg');

function start(torrent) {
  var deferred = q.defer();
  var ts = torrentStream(torrent);

  ts.on("ready", function () {
    var proc = ffmpeg(ts.files[0].createReadStream())
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

    deferred.resolve({
      engine: ts,
      stream: proc
    });
  });

  return deferred.promise;
}

module.exports = {
  start: start
};