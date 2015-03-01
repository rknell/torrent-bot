var request = require('request');
var cheerio = require('cheerio');
var feeds = require('./feeds');
var async = require('async');
var q = require('q');
q.longStackSupport = true;

function getPage(number){

  var deferred = q.defer();

  request({ method: 'GET'
    , uri: "http://kickass.to/tv/" + number
    , gzip: true
  }, function(err, res, body){
    try {
      var $ = cheerio.load(body);
      var rows = $('table').find('tr');

      var items = [];
      rows.each(function(index, element){

        var output = {
          title: $(this).find('.cellMainLink').text(),
          magnetLink:$(this).find('.imagnet').attr('href')
        };

        if (output.title && output.title.length < 500 && output.title.length > 10) {
          items.push(output);
        }
      });


      var outstanding = [];

      async.each(items, function (item, cb) {
        outstanding.push(item.title);
        if (item.title === "Brooklyn Nine-Nine S02E16 HDTV x264-ASAP [eztv]") {
          var a = 0;
        }
        feeds.addSingleShow(item.title, item.magnetLink)
          .then(function () {
            console.log("Added", item.title);
          })
          .catch(function (err) {
            console.log("Rejected", item.title, err);
          })
          .finally(function () {
            outstanding.splice(outstanding.indexOf(item.title), 1);
            cb();
          });
      }, function (err) {
        deferred.resolve();
      });

      setTimeout(function () {
        console.log("Outstanding", JSON.stringify(outstanding, null, 2));
      }, 1000 * 20);

    } catch(e){
      deferred.reject(e);
    }

  });

  return deferred.promise;
}

function processShows(){
  var pages = [];

  for(var i = 1; i < 400; i++){
    pages.push(i);
  }

  async.eachLimit(pages, 1, function (item, cb) {
    getPage(item)
      .then(function(result){
        //console.log("Processed page", item);

      })
      .catch(function (err) {
        console.error("Error processing show page", err.stack);
      })
      .finally(function(result){
        //setTimeout(cb, 1000 * 15);
        cb();
      })
  }, function(done){
    console.log("Processed all shows, starting again.");
    setTimeout(processShows, 1000 * 60 * 15);
  })
}

module.exports = {
  processShows: processShows
}