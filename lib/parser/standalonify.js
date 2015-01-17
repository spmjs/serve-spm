'use strict';

var join = require('path').join;
var fs = require('fs');
var through = require('through2');

module.exports = function(opts) {
  return through.obj(function(file) {
    this.push(parser(file, opts));
  });
};

function parser(file, opts) {
  var code = String(file.contents);
  var sea = fs.readFileSync(join(__dirname, '../../sea.js'), 'utf-8');
  var base = opts.base || '/';
  var seaconfig = '\n/* Config Base */\nseajs.config({base:\''+base+'\'});\n\n';
  var init = '\n\n/*! Init */\ng_spm_init(\''+opts.url.replace(/^\//, '')+'\');\n';

  // code = sea + seaconfig + code + init;
  code = sea + seaconfig + code + init;
  file.contents = new Buffer(code);
  return file;
}
