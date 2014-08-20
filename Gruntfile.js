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
          'bootstrap.standalone.min.js'
        ],
        commitForceAdd: true,
        createTag: true,
        tagName: '%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin',
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
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
      grunt.task.run("check-meta-consistency", "check-git-clean", "test", "build", "bump:" + target);
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
};