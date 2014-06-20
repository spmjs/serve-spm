var path = require('path');
var util = require('../util');
var requires = require('searequire');
var format = require('util').format;
var through = require('through2');
var rename = require('rename');

var headerTpl = 'define(function(require, exports, module){\n';
var footerTpl = '\n});\n';

module.exports = function jsParser(options) {
  return through.obj(function(file) {
    file = parser(file, options);
    this.push(file);
  });
};

function parser(file, options) {
  file.contents = new Buffer(transportFile(file, options));
  if (!options.nowrap) {
    file.contents = wrap(file, options);
  }
  return file;
}

function transportFile(file, options) {
  return requires(file.contents.toString(), function(item) {
    var dep = item.path.toLowerCase();

    if (util.isRelative(dep)) {
      var extname = path.extname(dep);

      // .less -> .css
      if (extname === '.less') {
        return format('require("%s")', rename(dep, {extname:'.css'}));
      }

      return item.string;
    }

    else {
      var p = options.pkg.dependencies[dep];
      if (!p) return item.string;
      return format('require("sea-modules/%s/%s/%s")',
        p.name, p.version, p.main);
    }
  });
}

function wrap(file) {
  return Buffer.concat([
    new Buffer(headerTpl),
    file.contents,
    new Buffer(footerTpl)
  ]);
}
