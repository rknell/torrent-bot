var request = require('request');
var cheerio = require('cheerio');
var feeds = require('./feeds');
var async = require('async');
var q = require('q');

function getPage(number){

  var deferred = q.defer();

  request({ method: 'GET'
    , uri: "http://kickass.to/tv/" + number
    , gzip: true
  }, function(err, res, body){
    var $ = cheerio.load(body);
    var rows = $('table').find('tr');

    rows.each(function(index, element){

      var output = {
        title: $(this).find('.cellMainLink').text(),
        magnetLink:$(this).find('.imagnet').attr('href')
      }

      //console.log(output);
      //console.log("Adding", output.title)

      if(output.title.length < 500 && output.title.length > 10){
        feeds.addSingleShow(output.title, output.magnetLink)
          .then(function(){
            var a =0;
            deferred.resolve();
          })
          .catch(deferred.reject);
      }
    })
  });

  return deferred.promise;
}

function processShows(){
  var pages = [];

  for(var i = 1; i < 400; i++){
    pages.push(i);
  }

  async.eachLimit(pages, 1, function(item, cb){
    getPage(item)
      .then(function(result){
        //console.log("Processed page", item);

      })
      .finally(function(result){
        setTimeout(cb, 1000 * 15);
        //cb();
      })
  }, function(done){
    console.log("Processed all shows, starting again.");
    setTimeout(processShows, 1000 * 60 * 15);
  })
}

module.exports = {
  processShows: processShows
}