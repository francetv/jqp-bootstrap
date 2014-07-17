;(function(global) {
    function factory(jsonpClient) {
        return {
            staticMd5Url: 'http://webservices.francetelevisions.fr/assets/staticmd5/getUrl?callback={{CALLBACK_NAME}}&id={{ID}}',

            staticId: 'jquery.player.default.js',

            createPlayer: function createPlayer(container, options, callback) {
                this.get(['PlayerApi'], function(error, Player) {
                    if (error) {
                        return callback(error);
                    }

                    callback(null, new Player(container, options));
                });
            },

            get: function get(requestList, callback) {
                this.load(function(error) {
                    if (error) {
                        return callback(error);
                    }

                    jqprequire(
                        requestList,

                        // insert null as callback's first argument (error)
                        callback.bind(null, null)
                    );
                }.bind(this));
            },

            _makeStaticId: function _makeStaticId(buildId) {
                return 'jquery.player.' + buildId + '.js';
            },

            _matchOptions: function _matchOptions(options) {
                return (!options.buildId || this._makeStaticId(options.buildId) === this.staticId) &&
                    (!options.staticId || options.staticId === this.staticId) &&
                    (!options.staticMd5Url || options.staticMd5Url === this.staticMd5Url);
            },

            load: function load(options, callback) {
                if (this._loaded) {
                    if (!this._matchOptions(options)) {
                        return callback(new Error('Another JQP already loaded'));
                    }
                    return callback();
                }

                if (this._loading) {
                    if (!this._matchOptions(options)) {
                        return callback(new Error('Another JQP already loading'));
                    }
                    return this._callbacks.push(callback);
                }

                this._loading = true;

                if (options.buildId) {
                    this.staticId = this._makeStaticId(options.buildId);
                }
                else if (options.staticId) {
                    this.staticId = options.staticId;
                }

                if (options.staticMd5Url) {
                    switch (options.staticMd5Url) {
                        case 'local':
                            this.staticMd5Url = 'http://0.0.0.O:8090/staticmd5/url/{{ID}}';
                            break;
                        case 'dev':
                            this.staticMd5Url = 'http://player.ftven.net/staticmd5/url/{{ID}}?callback={{CALLBACK_NAME}}';
                            break;
                        case 'preprod':
                            this.staticMd5Url = 'http://webservices.ftv-preprod.fr/assets/staticmd5/getUrl?callback={{CALLBACK_NAME}}&id={{ID}}';
                            break;
                        default:
                            this.staticMd5Url = options.staticMd5Url;
                    }
                }

                this._callbacks = [callback];

                jsonpClient.get(
                    this.staticMd5Url.replace('{{ID}}', this.staticId),
                    function(error, data) {
                        if (error) {
                            return this._onloadFinished('staticMd5 load: ' + error);
                        }

                        if (!data.result) {
                            return this._onloadFinished('invalid staticMd5 result');
                        }

                        this.loadScript(data.result, function(error) {
                            if (error) {
                                return this._onloadFinished('jqp load: ' + error.message);
                            }

                            this._onloadFinished();
                        }.bind(this));
                    }.bind(this)
                );
            },

            jsonpClient: jsonpClient,

            loadScript: jsonpClient.loadScript,

            _onloadFinished: function _onloadFinished(error) {
                this._loading = false;

                if (!error) {
                    this._loaded = true;
                }
                else {
                    error = new Error(error);
                }

                this._callbacks.forEach(function(callback) {
                    callback(error);
                });

                delete this._callbacks;
            }
        };
    }

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['bower_components/jsonpClient/index'], factory);
    } else {
        // Browser globals
        global.jqpBootstrap = factory();
    }
}(this));