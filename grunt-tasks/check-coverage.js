module.exports = function (grunt) {
    grunt.registerMultiTask('check-coverage', 'Check current tests code coverage', function(){
        var spawn = require('child_process').spawn;
        var fs = require('fs');
        var finaly = this.async();

        var opts = this.options({
          minimumCov: 50,
          testRunnerFile: 'test/testrunner.html'
        });
        var files = this.filesSrc;

        prepareFiles(function(errorPrepare) {
          if (errorPrepare) {
            return revert(function(errorRollback) {
              if (errorRollback) {
                grunt.fatal('Error while preparing file and rollback.\n' + errorPrepare + '\n' + errorRollback);
              }

              grunt.fatal('Error while preparing files for coverage.\n' + errorPrepare);
            });
          }

          getFileCov(function(err, json, html) {
            if (err) {
              grunt.log.error('Unable to get coverage.\n' + err);
            }
            else {
              grunt.file.write('cov.html', html);
            }

            revert(function(error) {
              if (error) {
                grunt.fatal('Error while rollbacking files.\n' + error);
              }

              if (json && json.coverage) {
                grunt.log.writeln('');
                if (json.coverage < opts.minimumCov) {
                  grunt.fatal('coverage too low: ' + json.coverage);
                }
                else {
                  grunt.log.writeln('coverage: ' + json.coverage);
                }
              }

              finaly();
            });
          });
        });

        function revert(cb) {
          grunt.log.writeln('restore backup files');
          var count = 0;
          var errors = [];

          function done(err) {
            if (err) {
              errors.push(err);
            }

            if (++count === files.length) {
              if (!errors.length) {
                errors = null;
              }
              cb(errors);
            }
          }

          files.forEach(function(file) {
            fs.stat(file + '~', function(err) {
              if (err) {
                return done();
              }

              try {
                grunt.file.copy(file + '~', file);
              }
              catch(error) {
                done('unable to restore file:\n' + file + '\n' + err);
                return;
              }

              try {
                grunt.file.delete(file + '~');
              }
              catch(error) {
                done('unable to delete backup file:\n' + file + '\n' + err);
                return;
              }

              grunt.log.writeln(' - ' + file + '~ -> ' + file);
              done();
            });
          });
        }

        function prepareFiles(cb) {
          grunt.log.writeln('prepare files for jscoverage (backup to files~)');
          var count = 0;
          var errors = [];

          function done(err) {
            if (err) {
              errors.push(err);
            }

            if (++count === files.length) {
              if (!errors.length) {
                errors = null;
              }
              cb(errors);
            }
          }

          files.forEach(function(file) {
            try {
              grunt.file.copy(file, file + '~');
            }
            catch(err) {
              done('unable to backup file:\n' + file + '\n' + err);
              return;
            }

            var checker = spawn('./node_modules/.bin/jscoverage', [file, file]);

            checker.on('close', function(code) {
              if (code !== 0) {
                return done('unable to prepare file with jscoverage:\n' + file + '\n' + err);
              }

              grunt.log.writeln(' - ' + file + ' -> ' + file + '~');
              done();
            });
          });
        }

        function getFileCov(cb) {
          grunt.log.writeln('\nGetting coverage...\n');

          var resultJSON = '';
          var resultHTML = '';
          var errors = [];

          var convertor = spawn('node_modules/.bin/json2htmlcov');
          var testrunner = spawn('node_modules/.bin/mocha-phantomjs', ['-R', 'json-cov', opts.testRunnerFile]);

          testrunner.stdout.on('data', function (data) {
            resultJSON += data;
          });

          testrunner.stderr.on('data', function (data) {
            errors.push(data);
          });

          testrunner.on('close', function (code) {
            if (code !== 0 && !errors.length) {
              errors.push('testrunner exited with code ' + code);
            }

            if (!errors.length && resultJSON) {
              convertor.stdin.write(resultJSON);
            }

            convertor.stdin.end();
          });

          convertor.stdout.on('data', function (data) {
            resultHTML += data;
          });

          convertor.stderr.on('data', function (data) {
            errors.push(data);
          });

          convertor.on('close', function (code) {
            if (code !== 0 && !errors.length) {
              errors.push('convertor exited with code ' + code);
            }

            if (!errors.length) {
              try {
                resultJSON = JSON.parse(resultJSON);
                errors = null;
              }
              catch(error) {
                errors.push(error);
              }
            }

            cb(errors, resultJSON, resultHTML);
          });
        }
    });
};