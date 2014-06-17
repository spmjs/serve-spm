'use strict';

var through = require('through2');

module.exports = function jsonParser(options) {
  return through.obj(function(file) {
    file = parser(file, options);
    this.push(file);
  });
};

var headerTpl = 'define(function(require, exports, module){\n';
var footerTpl = '\n});\n';

function parser(file) {
  file.contents = Buffer.concat([
    new Buffer(headerTpl),
    new Buffer('module.exports ='),
    file.contents,
    new Buffer(footerTpl)
  ]);
  return file;
}
