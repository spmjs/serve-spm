'use strict';

var strip = require('strip-comments');
var through = require('through2');

module.exports = function css2jsParser() {
  return through.obj(function(file) {
    file = parser(file);
    this.push(file);
  });
};

var headerTpl = 'define(function(require, exports, module){\n';
var footerTpl = '\n});\n';

function parser(file) {
  var code = file.contents.toString();

  file.contents = Buffer.concat([
    new Buffer(headerTpl),
    new Buffer('seajs.importStyle(\''),
    new Buffer(css2js(code)),
    new Buffer('\');'),
    new Buffer(footerTpl)
  ]);
  return file;
}

function css2js(code) {

  code = strip
    .block(code)
    .replace(/\n|\r/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '"');

  return code;
}
