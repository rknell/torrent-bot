var torrentStream = require('torrent-stream');
var q = require('q');
var ffmpeg = require('fluent-ffmpeg');
var rangeParser = require('range-parser');

function start(torrent, range) {
  var deferred = q.defer();



  var ts = torrentStream(torrent, {
    connections: 200,
    uploads: 0,
    trackers: [
      "udp://open.demonii.com:1337",
      "udp://tracker.coppersurfer.tk:6969",
      "udp://tracker.leechers-paradise.org:6969"
    ]
  });

  ts.range = range;

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
  ts.range = ts.range && rangeParser(ts.mediaFile.length, ts.range)[0];
  ts.publishStream = ts.mediaFile.createReadStream(ts.range);
  deferred.resolve(ts);
  return deferred.promise;
}

function transcode(ts){
  var deferred = q.defer();
  ts.transcodedStream = ffmpeg(ts.publishStream)
    .format("mp4")
    .size("?x480")
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