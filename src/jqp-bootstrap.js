(function(global) {
    function factory(jsonpClient) {

        var staticMd5Urls = {
            prod: '//sivideo.webservices.francetelevisions.fr/assets/staticmd5/getUrl?callback={{CALLBACK_NAME}}&id={{ID}}',
            preprod: '//sivideo.webservices.ftv-preprod.fr/assets/staticmd5/getUrl?callback={{CALLBACK_NAME}}&id={{ID}}',
            dev: '//player.ftven.net/staticmd5/url/{{ID}}',
            local: '//127.0.0.1:8090/staticmd5/url/{{ID}}'
        };

        return {
            staticMd5Url: staticMd5Urls.prod,
            staticId: 'jquery.player.default.js',

            easyPlayer: function easyPlayer(selector, options) {
                this.get(['jqueryJQP', 'jquery/player'], options, function($) {
                    $(function() {
                        $(selector).player(options);
                    });
                });
            },

            createPlayer: function createPlayer(container, options, callback) {
                if (arguments.length === 2) {
                    callback = options;
                    options = {};
                }

                this.get(['PlayerApi'], options, function(Player) {
                    callback(new Player(container, options));
                });
            },

            get: function get(requestList, options, callback) {
                if (arguments.length === 2) {
                    callback = options;
                    options = {};
                }

                this.load(options, function(error) {
                    if (error) {
                        return callback(error);
                    }

                    require(
                        requestList,
                        callback
                    );
                }.bind(this));
            },

            load: function load(options, callback) {
                options = this._getOptions(options);

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

                if (options.staticId) {
                    this.staticId = options.staticId;
                }

                if (options.staticMd5Url) {
                    this.staticMd5Url = options.staticMd5Url;
                }

                this._callbacks = [callback];

                this.requestStaticmd5Url(null, function(error, jqpUrl) {
                    if (error) {
                        return this._onloadFinished(error);
                    }

                    jsonpClient.loadScript(
                        jqpUrl,
                        function(error) {
                            if (error) {
                                return this._onloadFinished(new Error('jqp load: ' + error.message));
                            }

                            this._onloadFinished();
                        }.bind(this)
                    );
                }.bind(this));
            },

            requestStaticmd5Url: function requestStaticmd5Url(options, callback) {
                var staticId = this.staticId;
                var staticMd5Url = this.staticMd5Url;

                options = this._getOptions(options);

                if (options.staticId) {
                    staticId = options.staticId;
                }

                if (options.staticMd5Url) {
                    staticMd5Url = options.staticMd5Url;
                }

                jsonpClient.get(
                    {
                        url: staticMd5Url.replace('{{ID}}', staticId),
                        timeout: 5000
                    },
                    function(error, data) {
                        if (error) {
                            return callback(error);
                        }

                        if (!data.result) {
                            return callback(new Error('invalid staticMd5 result'));
                        }

                        // fix response to be compatible with https protocol (while not fixed server side)
                        data.result = data.result
                            .replace(/^https?:/, '')
                            .replace(/^\/\/static\.francetv\.fr\//, '//staticftv-a.akamaihd.net/');

                        callback(null, data.result);
                    }
                );
            },

            _makeStaticId: function _makeStaticId(buildId) {
                return 'jquery.player.' + buildId + '.js';
            },

            _getOptions: function _getOptions(options) {
                var result = {};

                if (!options) {
                    return result;
                }

                if (typeof options === 'string') {
                    if (!/^jquery\.player\.(.+\.)?js$/.test(options)) {
                        options = this._makeStaticId(options);
                    }

                    result.staticId = options;
                } else {
                    if (options.buildId) {
                        result.staticId = this._makeStaticId(options.buildId);
                    } else if (options.staticId) {
                        result.staticId = options.staticId;
                    }

                    if (options.staticMd5Url) {
                        if (options.staticMd5Url in staticMd5Urls) {
                            result.staticMd5Url = staticMd5Urls[options.staticMd5Url];
                        } else {
                            result.staticMd5Url = options.staticMd5Url;
                        }
                    }
                }

                return result;
            },

            _matchOptions: function _matchOptions(options) {
                return !options ||
                    (!options.buildId || this._makeStaticId(options.buildId) === this.staticId) &&
                    (!options.staticId || options.staticId === this.staticId) &&
                    (!options.staticMd5Url || options.staticMd5Url === this.staticMd5Url);
            },

            _onloadFinished: function _onloadFinished(error) {
                this._loading = false;

                if (!error) {
                    this._loaded = true;
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
        define(['jsonpClient'], factory);
    } else {
        // Browser globals
        global.jqpBootstrap = factory(global.jsonpClient);
    }
}(this));
