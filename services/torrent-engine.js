var torrentStream = require('torrent-stream');
var http = require('http');
var fs = require('fs');
var rangeParser = require('range-parser');
var urlSvc = require('url');
var mime = require('mime');
var pump = require('pump');
var ffmpeg = require('fluent-ffmpeg');

var parseBlocklist = function (filename) {
  // TODO: support gzipped files
  var blocklistData = fs.readFileSync(filename, {encoding: 'utf8'});
  var blocklist = [];
  blocklistData.split('\n').forEach(function (line) {
    var match = null;
    if ((match = /^\s*[^#].*?\s*:\s*([a-f0-9.:]+?)\s*-\s*([a-f0-9.:]+?)\s*$/.exec(line))) {
      blocklist.push({
        start: match[1],
        end: match[2]
      });
    }
  });
  return blocklist;
};

var createServer = function (engine, opts) {
  var server = http.createServer();
  var index = opts.index;
  var getType = opts.type || mime.lookup.bind(mime);
  var filter = opts.filter || true;

  var onready = function () {
    if (typeof index !== 'number') {
      index = engine.files.reduce(function (a, b) {
        return a.length > b.length ? a : b;
      });
      index = engine.files.indexOf(index);
    }

    engine.files[index].select();
    server.index = engine.files[index];

    if (opts.sort) engine.files.sort(opts.sort);
  };

  engine.on('ready', onready);

  server.on('request', function (request, response) {
    var url = urlSvc.parse(request.url);
    var host = request.headers.host || 'localhost';
    engine.host = host;

    var toPlaylist = function () {
      var toEntry = function (file, i) {
        return '#EXTINF:-1,' + file.path + '\n' + 'http://' + host + '/' + i;
      };

      return '#EXTM3U\n' + engine.files.filter(filter).map(toEntry).join('\n');
    };

    var toJSON = function () {
      var toEntry = function (file, i) {
        return {name: file.name, length: file.length, url: 'http://' + host + '/' + i};
      };

      return JSON.stringify(engine.files.filter(filter).map(toEntry), null, '  ');
    };

    // Allow CORS requests to specify arbitrary headers, e.g. 'Range',
    // by responding to the OPTIONS preflight request with the specified
    // origin and requested headers.
    if (request.method === 'OPTIONS' && request.headers['access-control-request-headers']) {
      response.setHeader('Access-Control-Allow-Origin', request.headers.origin);
      response.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      response.setHeader(
        'Access-Control-Allow-Headers',
        request.headers['access-control-request-headers']);
      response.setHeader('Access-Control-Max-Age', '1728000');

      response.end();
      return;
    }

    if (request.headers.origin) response.setHeader('Access-Control-Allow-Origin', request.headers.origin);
    if (url.pathname === '/' || url.pathname === "/media.mp4") url.pathname = '/' + index;

    if (url.pathname === '/favicon.ico') {
      response.statusCode = 404;
      response.end();
      return;
    }

    if (url.pathname === '/.json') {
      var json = toJSON();
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.setHeader('Content-Length', Buffer.byteLength(json));
      response.end(json);
      return;
    }

    if (url.pathname === '/.m3u') {
      var playlist = toPlaylist()
      response.setHeader('Content-Type', 'application/x-mpegurl; charset=utf-8');
      response.setHeader('Content-Length', Buffer.byteLength(playlist));
      response.end(playlist);
      return;
    }

    engine.files.forEach(function (file, i) {
      if (url.pathname.slice(1) === file.name) url.pathname = '/' + i;
    });

    var i = Number(url.pathname.slice(1));

    if (isNaN(i) || i >= engine.files.length) {
      response.statusCode = 404;
      response.end();
      return;
    }

    var file = engine.files[i];
    var range = request.headers.range;
    range = range && rangeParser(file.length, range)[0];
    //response.setHeader('Accept-Ranges', 'bytes');
    //response.setHeader('Content-Type', getType(file.name));

    //if (!range) {
    //  response.setHeader('Content-Length', file.length);
    //  if (request.method === 'HEAD') return response.end();
    //} else {
    //  response.statusCode = 206;
    //  response.setHeader('Content-Length', range.end - range.start + 1);
    //  response.setHeader('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + file.length);
    //  if (request.method === 'HEAD') return response.end();
    //}
    //var stream = fs.createReadStream("/private/tmp/torrent-stream/6c05d501cc08586b4ca021e880471df3af12cb87/The.Big.Bang.Theory.S08E17.HDTV.x264-LOL\[ettv\]/the.big.bang.theory.817.hdtv-lol.mp4");
    //var proc = ffmpeg(stream)
    //  .format('mp4')
    //  //.size('320x?')
    //  //.videoBitrate('512k')
    //  .videoCodec('libx264')
    //  //.fps(24)
    //  //.audioBitrate('96k')
    //  //.audioCodec('libmp3lame')
    //  //.audioFrequency(22050)
    //  //.audioChannels(1)
    //  .on("end", function(){console.log("Transcoding ended")})
    //  .on("error", function(err){console.error("Transcoding error", err)})
    //  .pipe(response, {end: true});

    //var transcoder = new Transcoder(file.createReadStream(range))
    //  .maxSize(320, 240)
    //  .videoCodec('h264')
    //  .videoBitrate(200 * 1000)
    //  .fps(25)
    //  .audioCodec('mp3')
    //  .sampleRate(44100)
    //  .channels(1)
    //  .audioBitrate(64 * 1000)
    //  .format('mp4')
    //  .custom('strict', 'experimental')
    //  .on('finish', function () {
    //    console.log("Finished transcoding");
    //  })
    //  .on('progress', function(progress){
    //    //console.log("Transcode progress", progress);
    //  })
    //  .on('metadata', function(metadata){
    //    setTimeout(function(){
    //      console.log("Beginning stream");
    //      response.setHeader('Content-Length', range.end - range.start + 1);
    //      response.setHeader('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + file.length);
    //      fs.createReadStream("./transcodedVideo.mp4").pipe(response);
    //    }, 15000);
    //  })
    //  .on('error', function(err){
    //    console.error("Transcode error", err);
    //  })
    //  .stream().pipe(fs.createWriteStream("./transcodedVideo.mp4"));
    //
    //
    //  //var args = transcoder._compileArguments();
    //  //args = [ '-i', '-' ].concat(args);
    //  //args.push('pipe:1');
    //  //
    //  //transcoder.stream().pipe(response);
    //
    ////pump(file.createReadStream(range), response, function(err){
    ////  console.error("Stream error", err);
    ////});
  });

  server.on('connection', function (socket) {
    socket.setTimeout(36000000);
  });

  return server;
};

module.exports = function (torrent, opts) {
  if (!opts) opts = {};

  // Parse blocklist
  if (opts.blocklist) opts.blocklist = parseBlocklist(opts.blocklist);

  var engine = torrentStream(torrent, opts);

  // Just want torrent-stream to list files.
  if (opts.list) return engine;

  // Pause/Resume downloading as needed
  engine.on('uninterested', function () {
    engine.swarm.pause();
  });
  engine.on('interested', function () {
    engine.swarm.resume();
  });

  //engine.server = createServer(engine, opts);

  // Listen when torrent-stream is ready, by default a random port.
  engine.on('ready', function () {
    engine.server.listen(opts.port || 0, opts.hostname);
  });

  if (opts.peerPort) engine.listen(opts.peerPort);

  return engine;
};
