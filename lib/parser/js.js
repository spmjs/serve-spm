'use strict';

var util = require('../util');
var requires = require('searequire');
var format = require('util').format;
var through = require('through2');
var rename = require('rename');
var join = require('path').join;
var relative = require('path').relative;
var dirname = require('path').dirname;
var exists = require('fs').existsSync;
var lstat = require('fs').lstatSync;

module.exports = function jsParser(options) {
  return through.obj(function(file) {
    file = parser(file, options);
    this.push(file);
  });
};

function parser(file, options) {
  file.contents = new Buffer(transportFile(file, options));

  var id = file.url.pathname.substring(1);
  // if (options.isEntry) {
  //   id = util.template('{{name}}/{{version}}/{{filepath}}', {
  //     name: pkg.name,
  //     version: pkg.version,
  //     filepath: path.relative(options.root, file.path)
  //   });
  // }
  // if (!options.url || id !== options.url.pathname.slice(1)) {
  //   id = '';
  // }

  file.contents = new Buffer(util.define(id, file.contents));
  return file;
}

function replaceAsync(code) {
  return code.replace(/require\(\[/g, 'require.async([');
}

function transportFile(file, options) {
  var code = file.contents.toString();
  code = replaceAsync(code);
  return requires(code, function(item) {
    var dep = item.path.toLowerCase();

    if (util.isRelative(dep)) {
      if (util.isCSSFile(dep)) {
        return format('require("%s")', winPath(rename(dep, {extname:'.css'})));
      }
      var dir = dirname(file.path);
      var newfile = winPath(relative(dir, getFile(join(dir, item.path))));
      if (newfile.charAt(0) !== '.') {
        newfile = './' + newfile;
      }
      return format('require("%s")', newfile);

    } else {
      var arr = dep.split('/');

      var ignore = [];
      var rootPkg = getRootPkg(options.pkg);

      // Parse global and ignore.
      if (arr.length === 1 && rootPkg &&
        rootPkg.origin && rootPkg.origin.spm && rootPkg.origin.spm.buildArgs) {
        var global = getGlobal(rootPkg.origin.spm.buildArgs.global);
        if (global[arr[0]]) {
          return 'window.' + global[arr[0]];
        }

        if (rootPkg.origin.spm.buildArgs.ignore) {
          ignore = rootPkg.origin.spm.buildArgs.ignore;
        }
      }

      dep = arr.shift();

      if (ignore.indexOf(dep) > -1) {
        return item.string;
      }

      var p = (options.pkg.dependencies && options.pkg.dependencies[dep]) ||
        (options.pkg.devDependencies && options.pkg.devDependencies[dep]);
      if (!p) return item.string;

      var main = p.main;
      // is require pkg file
      if (arr.length > 0) {
        main = arr.join('/');
      }

      main = winPath(relative(p.dest, getFile(join(p.dest, main))));
      return format('require("%s/%s/%s")',
        p.name, p.version, main);
    }
  });
}

function getFile(file) {
  if (!exists(file) && !exists(file + '.js')) {
    return file;
  }
  // is file
  if (exists(file) && lstat(file).isFile()) {
    return file;
  }
  if (exists(file + '.js') && lstat(file + '.js').isFile()) {
    return file + '.js';
  }
  // is directory
  if (lstat(file).isDirectory()) {
    return join(file, 'index.js');
  }

  return file;
}

function winPath(path) {
  return path.replace(/\\/g, '/');
}

function getGlobal(str) {
  if (!str) return {};
  if (({}).toString.call(str) === '[object Object]') return str;
  if (typeof str !== 'string') return {};

  var ret = {};
  str.split(/\s*,\s*/).forEach(function(item) {
    var m = item.split(':');
    ret[m[0]] = m[1];
  });
  return ret;
}

function getRootPkg(pkg) {
  while (pkg.father) {
    pkg = pkg.father;
  }
  return pkg;
}

