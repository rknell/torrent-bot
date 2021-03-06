var request = require('request');
var cheerio = require('cheerio');
var feeds = require('./feeds');
var async = require('async');
var q = require('q');
q.longStackSupport = true;

function getPage(number) {
  console.log("Processing Kickass TV Shows Page", number);

  var deferred = q.defer();

  request({
    method: 'GET'
    , uri: "http://kickass.to/tv/" + number
    , gzip: true
  }, function (err, res, body) {
    try {
      var $ = cheerio.load(body);
      var rows = $('table').find('tr');

      var items = [];
      rows.each(function (index, element) {
        var output = {
          title: $(this).find('.cellMainLink').text(),
          magnetLink: $(this).find('.imagnet').attr('href')
        };
        if (output.title && output.title.length < 500 && output.title.length > 10) {
          items.push(output);
        }
      });

      var outstanding = [];

      async.eachLimit(items, 2, function (item, cb) {
        outstanding.push(item.title);

        var timeoutId = setTimeout(function () {
          console.log("Timing out", item.title);
          outstanding.splice(outstanding.indexOf(item.title), 1);
          cb();
        }, 1000 * 15);

        feeds.addSingleShow(item.title, item.magnetLink)
          .then(function () {
            console.log("Added", item.title);
          })
          .finally(function () {
            outstanding.splice(outstanding.indexOf(item.title), 1);
            clearTimeout(timeoutId);
            cb();
          });
      }, function (err) {
        setTimeout(deferred.resolve, 5000);
      });

      function outstandingFn() {
        setTimeout(function () {
          if (outstanding.length) {
            //console.log("Outstanding", JSON.stringify(outstanding, null, 2));
            outstandingFn();
          }
        }, 1000 * 30);
      }

      outstandingFn();
    } catch (e) {
      //console.error("Could not process page", number, "scrape issue.", e, e.stack);
      console.log(body);
      setTimeout(deferred.resolve, 1000 * 15);
      deferred.resolve();
    }
  });

  return deferred.promise;
}

function processShows() {
  var pages = [];

  for (var i = 1; i < 400; i++) {
    pages.push(i);
  }

  async.eachLimit(pages, 1, function (item, cb) {
    getPage(item)
      .then(function (result) {
        //console.log("Processed page", item);

      })
      .catch(function (err) {
        console.error("Error processing show page", err.stack);
      })
      .finally(function (result) {
        //setTimeout(cb, 1000 * 60);
        cb();
      })
  }, function (done) {
    console.log("Processed all shows, starting again.");
    setTimeout(processShows, 1000 * 60 * 15);
  })
}

processShows();

module.exports = {
  processShows: processShows
}