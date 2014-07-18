define(['../bootstrap', 'chai', 'sinon'], function(jqpBootstrap, chai, sinon) {
    'use strict';

    describe('jqp-bootstrap', function() {
        it ('should should do staticmd5 requests', function(done) {
            jqpBootstrap.requestStaticmd5Url(null, function(error, jqpUrl) {
                if (error) {
                    return done(error);
                }
                done();
            });
        });

        it ('should load JQP', function(done) {
            jqpBootstrap.load(null, function(error, JQP) {
                if (error) {
                    return done(error);
                }
                done();
            });
        });
    });
});
