var request = require('request');
var FeedParser = require('feedparser');
var TVShow = require('../api/models/TVShow');
var TVShowRecent = require('../api/models/TVShowRecent');
var async = require('async');
var q = require('q');
var tvdb = require('./tvdb');

//tvdb.getSeries('Helix').then(function(result){
//  console.log(JSON.stringify(result, null, 2));
//})

function showRss(cb) {
  fetch("http://showrss.info/feeds/all.rss", cb);
}


module.exports = {
  showRss: showRss
};


function fetch(feed, cb) {
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
      if(cb)  cb(err);
    } else {

      var output = [];

      //Parse the show information for each item
      data.forEach(function (item) {

        var qualityRegex = /720p|1080p/gi;
        var quality = qualityRegex.exec(item.title);

        if (!quality || !quality.length) {
          quality = "SD";
        } else {
          quality = quality[0];
        }

        //Try seasonXepisode format
        var regExp = /^(.*?)([0-9]{1,})x([0-9]{1,})(.*)/gi;
        var result = regExp.exec(item.title);
        if (result) {
          if (!result[4]) result[4] = "";
          var showData = {
            name: result[1].trim(),
            season: Number(result[2]),
            episode: Number(result[3]),
            episodeName: result[4].trim(),
            quality: quality,
            magnetUrl: item.link,
            originalName: item.title
          };
          output.push(showData);
        }


        //Try date episode format (late shows)
        var regExp = /^(.*?)([0-9]{4})\-([0-9]{2}\-[0-9]{2})(.*|)(720p|1080p|)/gi;
        var result = regExp.exec(item.title);
        if (result) {
          var showData = {
            name: result[1].trim(),
            season: Number(result[2]),
            episode: result[3].trim(),
            episodeName: result[4].trim(),
            quality: quality,
            magnetUrl: item.link,
            originalName: item.title
          };

          if (showData.episodeName == "720p" || showData.episodeName == "1080p") {
            showData.quality = showData.episodeName;
            showData.episodeName = null;
          }
          output.push(showData);
        }
      });

      if (cb) cb(output);

      async.eachSeries(output, function (item, cb) {
        addShowToDB(item).then(function (result) {
          cb();
        })
      }, function (err) {
        console.log("Finished adding shows");
      })


    }
  }
}

function addShowToRecents(showData, posterUrl, backgroundUrl){
  var newShow = new TVShowRecent.model({
    name: showData.name,
    year: showData.year,
    posterUrl: posterUrl,
    backgroundUrl: backgroundUrl,
    season: showData.season,
    episode: showData.episode,
    watched: false,
    dateAdded: Date(),
    dateWatched: Date(),
    quality: showData.quality,
    magnetLink: showData.magnetLink
  })
  newShow.save(function(err, doc){
    console.log("Added " + showData.name + " to recents");
  })
}


function addShowToDB(showData) {
  var deferred = q.defer();
  TVShow.model.findOne({name: showData.name}).exec(function (err, doc) {
    if (doc) {
      //Update doc
      var foundSeason = false;
      doc.seasons.forEach(function (season) {
        if (season.number == showData.season) {
          foundSeason = true;
          var foundEpisode = false;
          season.episodes.forEach(function (episode) {
            if (episode.number == showData.episode && episode.quality == showData.quality) {
              foundEpisode = true;
            }
          });
          if (!foundEpisode) {
            season.episodes.push({
              number: showData.episode,
              name: showData.episodeName,
              quality: showData.quality,
              magnetLink: showData.magnetUrl,
              dateAdded: Date()
            });
            addShowToRecents(showData, doc.posterUrl, doc.backgroundUrl)
          }
        }
      });
      if (!foundSeason) {
        doc.seasons.push({
          number: showData.season,
          episodes: [{
            number: showData.episode,
            name: showData.episodeName,
            quality: showData.quality,
            magnetLink: showData.magnetUrl,
            dateAdded: Date()
          }]
        })
        addShowToRecents(showData, doc.posterUrl, doc.backgroundUrl)
      }
      doc.save(function (err, doc) {
        deferred.resolve(doc);
        console.log("Updated show", doc.name);
      })
    } else {
      //tvdb background http://thetvdb.com/banners/fanart/original/265912-1.jpg
//tvdb icon http://thetvdb.com/banners/_cache/posters/265912-1.jpg
      //Create a new entry
      tvdb.getSeries(showData.name)
        .then(function (tvdbdata) {
          //if(!tvdbdata) tvdbdata = {}
          try{
            var newShow = new TVShow.model({
              name: showData.name,
              imdbId: tvdbdata.IMDB_ID,
              tvdbId: tvdbdata.id,
              posterUrl: "http://thetvdb.com/banners/_cache/posters/" + tvdbdata.id + "-1.jpg",
              backgroundUrl: "http://thetvdb.com/banners/fanart/original/" + tvdbdata.id + "-1.jpg",
              network: tvdbdata.Network,
              description: tvdbdata.Overview,
              seasons: [{
                number: showData.season,
                episodes: [{
                  name: showData.episodeName,
                  number: showData.episode,
                  quality: showData.quality,
                  magnetLink: showData.magnetUrl,
                  dateAdded: Date()
                }]
              }]
            });

            newShow.save(function (err, doc) {
              deferred.resolve(doc);
              addShowToRecents(showData, doc.posterUrl, doc.backgroundUrl)
              try {
                console.log("Added show", doc.name);
              } catch (e) {
                console.log(showData);
                console.log(e);
              }

            })
          }catch(e){

            console.log(e, showData);
          }

        })
        .catch(function(err){
          console.error(err, showData);
        })

    }
  });
  return deferred.promise;
}

