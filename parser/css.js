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

    if (!util.isRelative(dep)) {
      var arr = dep.split('/');
      dep = arr.shift();

      if (!deps || !deps[dep]) {
        return item.string;
      }

      var p = deps[dep];
      var main = p.main;
      // is require pkg file
      if (arr.length > 0) {
        main = arr.join('/');
      }
      return format('@import "/%s/%s/%s";', p.name, p.version, main);
    } else {
      return item.string;
    }
  });
}
