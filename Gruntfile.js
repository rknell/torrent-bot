var pkg = require('./package.json');

module.exports = function(grunt) {

  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    // Configure a mochaTest task
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          captureFile: 'results.txt', // Optionally capture the reporter output to a file
          quiet: false, // Optionally suppress output to standard out (defaults to false)
          clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false)
        },
        src: ['engine/**/*.test.js', 'api/**/*.test.js', 'engine/*.test.js', 'api/*.test.js']
      }
    },
    mocha_istanbul: {
      coverage: {
        src: ['engine', 'api'], // a folder works nicely
        options: {
          mask: '**/*.test.js'
        }
      }
    },
    istanbul_check_coverage: {
      default: {
        options: {
          coverageFolder: 'coverage*', // will check both coverage folders and merge the coverage results
          check: {
            lines: 80,
            statements: 80
          }
        }
      }
    }
  });

  grunt.event.on('coverage', function(lcovFileContents, done){
    // Check below
    done();
  });

  grunt.registerTask('test', 'mochaTest');
  grunt.registerTask('default', 'coverage');
  grunt.registerTask('coverage', ['mocha_istanbul:coverage']);

};


//Using exclusion patterns slows down Grunt significantly
//instead of creating a set of patterns like '**/*.js' and '!**/node_modules/**'
//this method is used to create a set of inclusive patterns for all subdirectories
//skipping node_modules, bower_components, dist, and any .dirs
//This enables users to create any directory structure they desire.
var createFolderGlobs = function(fileTypePatterns) {
  fileTypePatterns = Array.isArray(fileTypePatterns) ? fileTypePatterns : [fileTypePatterns];
  var ignore = ['node_modules','bower_components','dist','temp'];
  var fs = require('fs');
  return fs.readdirSync(process.cwd())
    .map(function(file){
      if (ignore.indexOf(file) !== -1 ||
        file.indexOf('.') === 0 ||
        !fs.lstatSync(file).isDirectory()) {
        return null;
      } else {
        return fileTypePatterns.map(function(pattern) {
          return file + '/**/' + pattern;
        });
      }
    })
    .filter(function(patterns){
      return patterns;
    })
    .concat(fileTypePatterns);
};