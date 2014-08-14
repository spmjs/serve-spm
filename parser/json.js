'use strict';

var through = require('through2');
var util = require('../util');

module.exports = function jsonParser() {
  return through.obj(function(file) {
    this.push(parser(file));
  });
};

function parser(file) {
  var code = String(file.contents);
  code = 'module.exports = ' + code + ';';
  code = util.define(code);

  file.contents = new Buffer(code);
  return file;
}
