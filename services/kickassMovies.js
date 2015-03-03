var request = require('request');
var cheerio = require('cheerio');
var feeds = require('./feeds');
var async = require('async');
var q = require('q');
var movies = require('./movies');

function getPage(number){
  console.log("Processing Kickass Movies Page", number);

  var deferred = q.defer();

  request({ method: 'GET'
    , uri: "http://kickass.to/movies/" + number
    , gzip: true
  }, function(err, res, body){
    try {
      var $ = cheerio.load(body);
      var rows = $('table').find('tr');

      async.eachLimit(rows, 2, function(index, element){

        var output = {
          title: $(this).find('.cellMainLink').text(),
          magnetLink:$(this).find('.imagnet').attr('href')
        }

        if(output.title.length < 500 && output.title.length > 10){

          movies.addMovie(output.title, output.magnetLink)
            .then(deferred.resolve)
            .catch(deferred.reject);
        }
      })
    } catch(e){
      e.data = body;
      deferred.reject(e);
    }
  });

  return deferred.promise;
}

function processShows(){
  var pages = [];

  for(var i = 1; i < 100; i++){
    pages.push(i);
  }

  async.eachLimit(pages, 2, function(item, cb){
    getPage(item)
      .then(function(result){
        //console.log("Processed page", item);

      })
      .finally(function(result){
        setTimeout(cb, 1000 * 15);
        //cb();
      })
  }, function(done){
    console.log("Processed all shows.");
    setTimeout(processShows, 1000 * 60 * 20);
  })
}

module.exports = {
  processShows: processShows
}