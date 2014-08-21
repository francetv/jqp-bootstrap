module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bwr: grunt.file.readJSON('bower.json'),

    clean: {
      js: ["bootstrap.min.js", "bootstrap.standalone.js", "bootstrap.standalone.min.js", "cov.html"]
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
      src: ['src/**/*.js'],
      options: {
        minimumCov: 50,
        testRunnerFile: 'test/testrunner.html'
      }
    }
  });

  grunt.loadNpmTasks('grunt-mocha-phantomjs');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-bump');

  grunt.loadTasks('grunt-tasks');

  grunt.registerTask('clean-main', ['clean:js']);

  grunt.registerTask('test', ['mocha_phantomjs']);

  grunt.registerTask('build', ['clean-main', 'requirejs', 'uglify']);

  grunt.registerTask('default', ['test','build']);
};