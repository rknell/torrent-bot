var torrentStream = require('torrent-stream');
var torrentEngine = require('./torrent-engine');
var address = require('network-address');
var clivas = require('clivas');
var numeral = require('numeral');

module.exports = {
  load: function (uri, callback) {
    var engine = torrentEngine(uri);
    var started = Date.now();
    var wires = engine.swarm.wires;
    var swarm = engine.swarm;
    var hotswaps = 0;
    var verified = 0;
    var invalid = 0;


    engine.on('verify', function() {
      verified++;
    });

    engine.on('invalid-piece', function() {
      invalid++;
    });

    engine.on('hotswap', function() {
      hotswaps++;
    });

    engine.on('ready', function () {
      engine.files.forEach(function (file) {
        var stream = file.createReadStream();
      });
    });

    engine.server.on("listening", function () {
      var host = address();
      var href = 'http://'+host+':'+engine.server.address().port+'/';
      var filename = engine.server.index.name.split('/').pop().replace(/\{|\}/g, '');
      var filelength = engine.server.index.length;
      var player = null;
      var downloaded = false;
      var streamUrl = 'http://' + address() + ':' + engine.server.address().port + '/';
      callback(undefined, {url:streamUrl});
      console.log("Stream URL is: " + streamUrl);


      process.stdout.write(new Buffer('G1tIG1sySg==', 'base64')); // clear for drawing
      var draw = function() {
        var unchoked = engine.swarm.wires.filter(active);
        var runtime = Math.floor((Date.now() - started) / 1000);
        var linesremaining = clivas.height;
        var peerslisted = 0;

        clivas.clear();
        clivas.line('{green:open} {bold:'+(player || 'vlc')+'} {green:and enter} {bold:'+href+'} {green:as the network address}');
        clivas.line('');
        clivas.line('{yellow:info} {green:streaming} {bold:'+filename+' ('+bytes(filelength)+')} {green:-} {bold:'+bytes(swarm.downloadSpeed())+'/s} {green:from} {bold:'+unchoked.length +'/'+wires.length+'} {green:peers}    ');
        clivas.line('{yellow:info} {green:path} {cyan:' + engine.path + '}');
        clivas.line('{yellow:info} {green:downloaded} {bold:'+bytes(swarm.downloaded)+'} {green:and uploaded }{bold:'+bytes(swarm.uploaded)+'} {green:in }{bold:'+runtime+'s} {green:with} {bold:'+hotswaps+'} {green:hotswaps}     ');
        clivas.line('{yellow:info} {green:verified} {bold:'+verified+'} {green:pieces and received} {bold:'+invalid+'} {green:invalid pieces}');
        clivas.line('{yellow:info} {green:peer queue size is} {bold:'+swarm.queued+'}');
        clivas.line('{80:}');
        linesremaining -= 8;

        wires.every(function(wire) {
          var tags = [];
          if (wire.peerChoking) tags.push('choked');
          clivas.line('{25+magenta:'+wire.peerAddress+'} {10:'+bytes(wire.downloaded)+'} {10+cyan:'+bytes(wire.downloadSpeed())+'/s} {15+grey:'+tags.join(', ')+'}   ');
          peerslisted++;
          return linesremaining-peerslisted > 4;
        });
        linesremaining -= peerslisted;

        if (wires.length > peerslisted) {
          clivas.line('{80:}');
          clivas.line('... and '+(wires.length-peerslisted)+' more     ');
        }

        clivas.line('{80:}');
        clivas.flush();
      };

      //engine.drawTimerId = setInterval(draw, 500);
      draw();
    });

    var active = function(wire) {
      return !wire.peerChoking;
    };

    var bytes = function(num) {
      return numeral(num).format('0.0b');
    };

    return engine;
  }
};
