define(['../bootstrap', 'chai', 'sinon'], function(jqpBootstrap, chai, sinon) {
    'use strict';

    describe('jqp-bootstrap', function() {
        it ('should do staticmd5 requests', function(done) {
            jqpBootstrap.requestStaticmd5Url({
                staticMd5Url: 'local'
            }, function(error, jqpUrl) {
                if (error) {
                    return done(error);
                }
                done();
            });
        });

        it ('should load JQP', function(done) {
            jqpBootstrap.load({
                    staticMd5Url: 'local'
                }, function(error, JQP) {
                if (error) {
                    return done(error);
                }
                done();
            });
        });

        it ('should get jqp modules', function(done) {
            jqpBootstrap.get(['PlayerApi', 'jquery'], {
                    staticMd5Url: 'local'
                }, function(error, player, jquery) {
                if (error) {
                    return done(error);
                }

                if (!player) {
                    return done(new Error('player was not returned'));
                }

                if (!(jquery && jquery.fn && jquery.fn.jquery)) {
                    return done(new Error('player was not returned'));
                }
                done();
            });
        });
    });
});
