'use strict';

var through = require('through2');

module.exports = function tplParser(options) {
  return through.obj(function(file) {
    file = parser(file, options);
    this.push(file);
  });
};

var headerTpl = 'define(function(require, exports, module){\n';
var footerTpl = '\n});\n';

function parser(file) {
  var code = file.contents.toString();

  file.contents = Buffer.concat([
    new Buffer(headerTpl),
    new Buffer('module.exports=\''),
    new Buffer(code.replace(/\n|\r/g, '').replace(/'/g, '"')),
    new Buffer('\';'),
    new Buffer(footerTpl)
  ]);
  return file;
}
