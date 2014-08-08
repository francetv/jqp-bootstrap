;
(function(global) {
    function factory(jqpBootstrap, jsonpClient, chai, sinon, mocha) {
        return describe('jqp-bootstrap', function() {
            describe('requestStaticmd5Url', function() {
                before(function() {
                    sinon.stub(jsonpClient, 'get')
                        .yieldsAsync(null, {
                            result: 'expected url'
                        });
                });

                after(function() {
                    jsonpClient.get.restore();
                });

                it('should do staticmd5 requests', function(done) {
                    jqpBootstrap.requestStaticmd5Url('id_build', function(error, jqpUrl) {
                        if (error) {
                            return done(error);
                        }

                        chai.expect(jqpUrl).to.equal('expected url');
                        done();
                    });
                });
            });

            describe('load', function() {
                before(function() {
                    sinon.stub(jsonpClient, 'get')
                        .yieldsAsync(null, {
                            result: 'expected url'
                        });

                    sinon.stub(jsonpClient, 'loadScript')
                        .yieldsAsync(null);
                });

                after(function() {
                    jsonpClient.get.restore();
                    jsonpClient.loadScript.restore();
                    jqpBootstrap._loading = false;
                    jqpBootstrap._loaded = false;
                    jqpBootstrap._callbacks = [];
                });

                it('should load JQP', function(done) {
                    jqpBootstrap.load('id_build', function(error, JQP) {
                        if (error) {
                            return done(error);
                        }

                        chai.expect(jsonpClient.loadScript.lastCall.args[0]).to.equal('expected url');
                        done();
                    });
                });
            });

            describe('get', function() {
                before(function() {
                    sinon.stub(jsonpClient, 'get')
                        .yieldsAsync(null, {
                            result: 'expected url'
                        });

                    sinon.stub(jsonpClient, 'loadScript')
                        .yieldsAsync(null);

                    global.require = sinon.stub().yieldsAsync(null, {}, {
                        fn: {
                            jquery: 'version'
                        }
                    });
                });

                after(function() {
                    jsonpClient.get.restore();
                    jsonpClient.loadScript.restore();
                    jqpBootstrap._loading = false;
                    jqpBootstrap._loaded = false;
                    jqpBootstrap._callbacks = [];
                });

                it('should get jqp modules', function(done) {
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
                            return done(new Error('jquery was not returned'));
                        }
                        done();
                    });
                });
            });

            describe('createPlayer', function() {
                var PlayerMock = function() {};
                before(function() {
                    sinon.stub(jsonpClient, 'get')
                        .yieldsAsync(null, {
                            result: 'expected url'
                        });

                    sinon.stub(jsonpClient, 'loadScript')
                        .yieldsAsync(null);

                    global.require = sinon.stub().yieldsAsync(PlayerMock);
                });

                after(function() {
                    jsonpClient.get.restore();
                    jsonpClient.loadScript.restore();
                    jqpBootstrap._loading = false;
                    jqpBootstrap._loaded = false;
                    jqpBootstrap._callbacks = [];
                });

                it('should get an instanciated player', function(done) {
                    jqpBootstrap.createPlayer({}, {}, function(player) {
                        if (!player) {
                            return done(new Error('player was not returned'));
                        }

                        done();
                    });
                });
            });
        });
    }

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['../bootstrap', 'bower_components/jsonpClient/jsonpClient', 'chai', 'sinon', 'mocha'], factory);
    } else {
        // Browser globals
        factory(global.jqpBootstrap, global.jsonpClient, global.chai, global.sinon, global.mocha);
    }
}(this));
