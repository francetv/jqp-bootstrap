define(['../bootstrap', 'chai', 'sinon'], function(jqpBootstrap, chai, sinon) {
    'use strict';

    describe('jqp-bootstrap', function() {
        it ('should be available', function() {
            chai.expect(jqpBootstrap).to.eql({jqp:'module'});
        });
    });
});
