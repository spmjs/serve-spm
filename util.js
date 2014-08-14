var path = require('path');
var fs = require('fs');
var join = require('path').join;
var Package = require('father').SpmPackage;
var spmrc = require('spmrc');
var moduleDir = spmrc.get('install.path');

var util = module.exports = {};

util.template = function(format, data) {
  if (!format) return '';
  return format.replace(/{{([a-z]*)}}/g, function(all, match) {
    return data[match] || '';
  });
};

util.isRelative = function(filepath) {
  return filepath.charAt(0) === '.';
};

util.define = function(str, id) {
  var idStr = '';
  if (id) {
    idStr = '\''+id+'\', ';
  }
  return 'define(' + idStr + 'function(require, exports, module){\n' +
    String(str) + '\n});\n';
};

/**
 * getPkg with lastmodified cache.
 */
var pkgCache = {};
util.getPkg = function(root) {
  var file = join(root, 'package.json');
  if (!fs.existsSync(file)) {
    return null;
  }
  var mtime = +new Date(fs.statSync(file).mtime);
  var data = pkgCache[root];
  if (!data || data.mtime !== mtime) {
    var isSeaModules = !fs.existsSync(join(root, moduleDir)) &&
      fs.existsSync(join(root, 'sea-modules'));
    data = pkgCache[root] = {
      mtime: mtime,
      pkg: new Package(root, {
        moduleDir: isSeaModules ? 'sea-modules' : moduleDir
      })
    };
  }
  return data.pkg;
};

util.isCSSFile = function(file) {
  return ['.css', '.less', '.styl', '.sass', '.scss']
    .indexOf(path.extname(file)) > -1;
}
