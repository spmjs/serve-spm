define("test site/0.1.0/public/js-local-require/a", ["test site/0.1.0/public/js-local-require/b"], function(require, exports, module){
var b = require("test site/0.1.0/public/js-local-require/b");
b.foo();

});
define("test site/0.1.0/public/js-local-require/b", [], function(require, exports, module){
exports.foo = function() { alert(1); };

});
require('test site/0.1.0/public/js-local-require/a');