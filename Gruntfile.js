module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bwr: grunt.file.readJSON('bower.json'),

    clean: {
      js: ["bootstrap.min.js", "bootstrap.standalone.js", "bootstrap.standalone.min.js"]
    },
    mocha_phantomjs: {
      all: ['test/**/testrunner*.html']
    },
    requirejs: {
      compile: {
        options: {
          baseUrl: "./src",
          name: "<%= pkg.name %>",
          out: "bootstrap.standalone.js",
          optimize: "none"
        }
      }
    },
    uglify: {
      dist: {
        files: {
          'bootstrap.min.js': ['src/<%= pkg.name %>.js']
        }
      },
      standalone: {
        files: {
          'bootstrap.standalone.min.js': ['bootstrap.standalone.js']
        }
      }
    },
    bump: {
      options: {
        files: ['package.json', 'bower.json'],
        updateConfigs: ['pkg', 'bwr'],
        commit: true,
        commitMessage: 'Release version %VERSION%',
        commitFiles: [
          'package.json',
          'bower.json',
          'bootstrap.min.js',
          'bootstrap.standalone.js',
          'bootstrap.standalone.min.js',
          'cov.html'
        ],
        commitForceAdd: true,
        createTag: true,
        tagName: '%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin',
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
      }
    },
    'check-coverage': {
      options: {
        files: ['src/jqp-bootstrap.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-mocha-phantomjs');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-bump');

  grunt.registerTask('clean-main', ['clean:js']);

  grunt.registerTask('test', ['mocha_phantomjs']);

  grunt.registerTask('build', ['clean-main', 'requirejs', 'uglify']);

  grunt.registerTask('default', ['test','build']);

  grunt.registerTask("release",
    "Release a new version, than commit and push it",
    function(target) {
      target = target || "patch";
      grunt.task.run("check-meta-consistency", "check-git-clean", "test", "check-coverage", "build", "bump:" + target);
    }
  );

  grunt.registerTask("check-meta-consistency",
    "Check package meta-data consistency (same versions and names in package.json and bower.json",
    function() {
      var pkgName = grunt.config('pkg.name');
      var bwrName = grunt.config('bwr.name');
      var pkgVersion = grunt.config('pkg.version');
      var bwrVersion = grunt.config('bwr.version');

      if (!pkgName) {
        grunt.fatal('Missing name in package.json file.');
      }

      if (!bwrName) {
        grunt.fatal('Missing name in bower.json file.');
      }

      if (pkgName !== bwrName) {
        grunt.fatal('Names mismatch in package.json and bower.json files.');
      }

      if (!pkgVersion) {
        grunt.fatal('Missing version in package.json file.');
      }

      if (!bwrVersion) {
        grunt.fatal('Missing version in bower.json file.');
      }

      if (pkgVersion !== bwrVersion) {
        grunt.fatal('Versions mismatch in package.json and bower.json files.');
      }

      grunt.log.writeln('Package meta-data ok.');
    }
  );

  grunt.registerTask("check-git-clean",
    "Check current GIT repository is clean",
    function() {
        var exec = require('child_process').exec;
        var done = this.async();

        exec('git status -s', function(err, stdout, stderr) {
          if (err) {
            grunt.fatal('Can not get GIT status:\n  ' + stderr);
          }

          if (stdout) {
            grunt.fatal('GIT repo not clean.\nCommit all and clean repo before retrying.\n' + stdout);
          }

          grunt.log.ok('GIT repo clean.');
          done();
        });
    }
  );

  grunt.registerTask("check-coverage",
    "Check current tests code coverage",
    function() {
        var spawn = require('child_process').spawn;
        var exec = require('child_process').exec;
        var fs = require('fs');
        var finaly = this.async();

        var opts = this.options({
          files: []
        });

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

              if (json.coverage < 50) {
                grunt.fatal('coverage too low: ' + json.coverage);
              }
              else {
                grunt.log.write('coverage: ' + json.coverage);
                finaly();
              }
            });
          });
        });

        function revert(cb) {
          var count = 0;
          var errors = [];

          function done(err) {
            if (err) {
              errors.push(err);
            }

            if (++count === opts.files.length) {
              if (!errors.length) {
                errors = null;
              }
              cb(errors);
            }
          }

          opts.files.forEach(function(file) {
            fs.stat(file + '~', function(err) {
              if (err) {
                return done();
              }

              exec('mv ' + file + '~ ' + file, function(err, stdout, stderr) {
                if (err) {
                  return done('unable to restore file:\n' + file + '\n' + err);
                }
                done();
              });
            });
          });
        }

        function prepareFiles(cb) {
          var count = 0;
          var errors = [];

          function done(err) {
            if (err) {
              errors.push(err);
            }

            if (++count === opts.files.length) {
              if (!errors.length) {
                errors = null;
              }
              cb(errors);
            }
          }

          opts.files.forEach(function(file) {
            try {
              grunt.file.copy(file, file + '~');
            }
            catch(err) {
              done('unable to backup file:\n' + file + '\n' + err);
              return;
            }

            exec('./node_modules/.bin/jscoverage ' + file + ' ' + file, function(err, stdout, stderr) {
              if (err) {
                return done('unable to prepare file with jscoverage:\n' + file + '\n' + err);
              }

              done();
            });
          });
        }

        function getFileCov(cb) {
          var resultJSON = '';
          var resultHTML = '';
          var errors = [];

          var convertor = spawn('node_modules/.bin/json2htmlcov');
          var testrunner = spawn('node_modules/.bin/mocha-phantomjs', ['-R', 'json-cov', 'test/testrunner.html']);

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
    }
  );
};