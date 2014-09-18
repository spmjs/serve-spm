var util = require('../util');
var imports = require('css-imports');
var format = require('util').format;
var through = require('through2');

module.exports = function cssParser(options) {
  return through.obj(function(file) {
    file = parser(file, options);
    this.push(file);
  });
};

function parser(file, options) {
  file.contents = new Buffer(transportFile(file, options.pkg));
  return file;
}

function transportFile(file, pkg) {
  return imports(file.contents, function(item) {
    var deps = pkg.dependencies;
    var dep = item.path;

    if (!util.isRelative(dep) && deps && deps[dep]) {
      var p = deps[dep];
      return format('@import "/%s/%s/%s";', p.name, p.version, p.main);
    } else {
      return item.string;
    }
  });
}
