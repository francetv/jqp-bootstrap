;(function(global) {
    function factory() {
        return {
            jqp: 'module'
        };
    }

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals
        global.jqpBootstrap = factory();
    }
}(this));