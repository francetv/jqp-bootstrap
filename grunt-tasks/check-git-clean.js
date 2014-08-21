module.exports = function (grunt) {
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