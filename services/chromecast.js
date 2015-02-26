var Client                = require('castv2-client').Client;
var DefaultMediaReceiver  = require('castv2-client').DefaultMediaReceiver;
//var mdns                  = require('mdns');
//var scanner    = require('chromecast-scanner');
var q = require('q');

//var _player, _service, client, browser, _host;

function getHost(){
  var deferred = q.defer();

  var Client = require('node-ssdp').Client;
  var client = new Client();

  client.on('response', function (headers, statusCode, rinfo) {
    console.log('chromecast running on address', rinfo.address);
    client._stop();
    deferred.resolve(rinfo.address);
  });

  client.search('urn:dial-multiscreen-org:service:dial:1');

  return deferred.promise;
}

function play(url, title, poster){
  var deferred = q.defer();

  getHost().then(ondeviceup);

  function ondeviceup(host) {

    output.host = host;

    output.client = new Client();

    output.client.connect(host, function() {
      console.log('connected, launching app ...');

      output.client.launch(DefaultMediaReceiver, function(err, player) {
        output.player = player;
        var media = {

          // Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
          contentId: url,
          contentType: 'video/mp4',
          streamType: 'BUFFERED', // or LIVE

          // Title and cover displayed while buffering
          metadata: {
            type: 0,
            metadataType: 0,
            title: title || url,
            images: [
              { url: poster }
            ]
          }
        };

        output.player.on('status', function(status) {
          console.log('status broadcast playerState=%s', status.playerState);
        });

        console.log('app "%s" launched, loading media %s ...', player.session.displayName, media.contentId);

        output.player.load(media, { autoplay: true }, function(err, status) {
          console.log('media loaded playerState=%s', status.playerState);

          if(err) deferred.reject(err);
          else deferred.resolve({
            status: status,
            player: player,
            client: output.client
          });

          //// Seek to 2 minutes after 15 seconds playing.
          //setTimeout(function() {
          //  player.seek(2*60, function(err, status) {
          //    //
          //  });
          //}, 15000);

        });

      });

    });

    output.client.on('error', function(err) {
      console.log('Error: %s', err.message);
      output.client.close();
      deferred.reject();
    });

  }
  return deferred.promise;
}

var output = {
  play: play
};

module.exports = output;