var path = require('path');
var fs = require('fs');
var join = require('path').join;
var Package = require('father').SpmPackage;

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
util.getPackage = function(root) {
  var file = join(root, 'package.json');
  if (!fs.existsSync(file)) {
    return null;
  }
  var mtime = +new Date(fs.statSync(file).mtime);
  var data = pkgCache[root];
  if (!data || data.mtime !== mtime) {
    var pkg;
    try {
      pkg = new Package(root, {
        moduleDir: getModuleDir(root)
      });
      pkg._parse();
    } catch(e) {
      return null;
    }

    data = pkgCache[root] = {
      mtime: mtime,
      pkg: pkg
    };
  }
  return data.pkg;
};

function getModuleDir(root) {
  return fs.existsSync(join(root, 'sea-modules')) ? 'sea-modules' : 'spm_modules';
}

util.isCSSFile = function(file) {
  return ['.css', '.less', '.styl', '.sass', '.scss']
    .indexOf(path.extname(file)) > -1;
};

util.getModifiedTime = function getModifiedTime(file) {
  var ftime = mtime(file.path);
  var ptime = mtime(join(file.base, 'package.json'));
  return Math.max(ftime, ptime);

  function mtime(filepath) {
    return new Date(fs.statSync(filepath).mtime);
  }
};

util.isModified = function(headers, modifiedTime) {
  if (!headers || !headers['if-modified-since']) {
    return true;
  }
  return modifiedTime > +new Date(+headers['if-modified-since']);
};

util.isStandalone = function(file) {
  if (path.extname(file.path) !== '.js') {
    return false;
  }

  var pkg = file.pkg;
  var buildArgs = (pkg.spm && pkg.spm.buildArgs) || '';
  return buildArgs.indexOf('--include standalone') !== -1
    || buildArgs.indexOf('--include umd') !== -1;
};
