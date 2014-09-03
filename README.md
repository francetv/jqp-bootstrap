JQP bootstrap
=========

Bootstrap for loading last available version of JQP.


Installation
--------------
This library has been declined in a bower component so in order to use it just add it to your project's bower.json dependencies :

```json
"dependencies": {
    ...
    "jqp-bootstrap": "git@gitlab.ftven.net:player/jqp-bootstrap.git"
    ...
}
```

How to use it
--------------

This library implements [UMD](http://bob.yexley.net/umd-javascript-that-runs-anywhere/), so you can import it with AMD or browser globals

```javascript
require.config({
    ...
    paths: {
        'jqp-bootstrap': './bower_components/jqp-bootstrap/jqp-bootstrap.standalone.min.js'
    }
})
require(['jqp-bootstrap', ...], function (bootstrap, ...) {
    ...
});
```

or

```html
<script type="text/javascript" src="./bower_components/jqp-bootstrap/jqp-bootstrap.standalone.min.js" />
```

