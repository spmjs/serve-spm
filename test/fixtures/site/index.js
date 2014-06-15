
var a = require('js-a');
var b = require('js-b');
console.log(a);
console.log(b);

require('./plugins/plugin.css');
require('./plugins/index.tpl');
require('./plugins/index.json');
require('./plugins/index.handlebars');

var relative = require('./relative');
console.log(relative);
