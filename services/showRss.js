var request = require('request');
var FeedParser = require('feedparser');
var TVShows = require('./TVShows');
var async = require('async');


setInterval(go, 1000 * 60 * 5);

function go(){
  fetch("http://showrss.info/feeds/all.rss");
}

function fetch(feed) {
  // Define our streams
  var data = [];
  var req = request(feed, {timeout: 10000, pool: false});
  req.setMaxListeners(50);

  // Some feeds do not respond without user-agent and accept headers.
  req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36')
  req.setHeader('accept', 'text/html,application/xhtml+xml');

  var feedparser = new FeedParser();

  // Define our handlers
  req.on('error', done);
  req.on('response', function (res) {
    if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));
    var charset = getParams(res.headers['content-type'] || '').charset;
    res = maybeTranslate(res, charset);
    // And boom goes the dynamite
    res.pipe(feedparser);
  });

  feedparser.on('error', done);

  feedparser.on('end', function () {
    done(null, data);
  });

  feedparser.on('readable', function () {
    var post;
    while (post = this.read()) {
      data.push(post);
    }
  });

  function maybeTranslate(res, charset) {
    var iconv;
    // Use iconv if its not utf8 already.
    if (!iconv && charset && !/utf-*8/i.test(charset)) {
      try {
        iconv = new Iconv(charset, 'utf-8');
        console.log('Converting from charset %s to utf-8', charset);
        iconv.on('error', done);
        // If we're using iconv, stream will be the output of iconv
        // otherwise it will remain the output of request
        res = res.pipe(iconv);
      } catch (err) {
        res.emit('error', err);
      }
    }
    return res;
  }

  function getParams(str) {
    var params = str.split(';').reduce(function (params, param) {
      var parts = param.split('=').map(function (part) {
        return part.trim();
      });
      if (parts.length === 2) {
        params[parts[0]] = parts[1];
      }
      return params;
    }, {});
    return params;
  }

  function done(err, data) {
    if (err) {
      console.error(err, err.stack);
    } else {

      //var output = [];

      //Parse the show information for each item
      //data.forEach(function (item) {
      //  var parsed = TVShows.parseShowData(item);
      //  if (parsed) {
      //    output.push(parsed);
      //  }
      //});

      async.eachSeries(data, function (item, cb) {
        TVShows.addSingleShow(item.title, item.link,"ShowRSS")
          .then(function(){
            cb()
          })
          .catch(cb);
        //addShowToDB(item)
        //  .then(function (result) {
        //    cb();
        //  })
        //  .catch(cb)
      }, function (err) {
        console.log("Finished processing ShowRSS");
      })
    }
  }
}

go();