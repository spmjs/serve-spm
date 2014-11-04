
var extname = require('path').extname;
var readFile = require('fs').readFileSync;
var exists = require('fs').existsSync;
var urlparse = require('url').parse;
var debug = require('debug')('parse');

/*
  url:
  opt:
    pkg:
    rules:
*/

module.exports = function parse(url, opt) {
  url = urlparse(url.toLowerCase());
  var rules = opt.rules || [];
  var file = findFile(url, opt.pkg, rules);
  if (!file) return;

  // wrap define by default, except for
  // 1. has ?nowrap in url
  // 2. specified in rules
  if (hasNoWrap(url)) {
    file.wrap = false;
  } else if (typeof file.wrap !== 'boolean') {
    file.wrap = true;
  }

  file.base = opt.pkg.dest;
  file.url = url;
  file.pkg = opt.pkg;
  file.contents = readFile(file.path);
  return file;
};

function hasNoWrap(url) {
  var search = url.search;
  return search && search.indexOf('nowrap') > -1;
}

function findFile(url, pkg, rules) {
  for (var i in rules) {
    debug('find file from rule[%s]', i);
    var rule = rules[i];
    var ret = rule(url, pkg);

    // ignore when no result or result is invalid
    if (typeof ret === 'undefined' || !isFile(ret)) {
      continue;
    }

    // check filepath exists
    var filepath = testFile(ret.path);
    if (filepath) {
      debug('matched %s -> %s on rule[%s]', url.pathname, filepath, i);
      ret.path = filepath;
      return ret;
    }
  }
}

function isFile(file) {
  return !!(file && file.path);
}

function testFile(filepath) {
  if (exists(filepath)) return filepath;

  var file;

  // a.css.js$ -> a.css
  // a.tpl.js$ -> a.tpl
  // ...
  if (/\.[a-z]+\.js$/.test(filepath)) {
    file = filepath.slice(0, -3);
    if (exists(file)) return file;
  }

  // a.js$ -> a.coffee
  if (extname(filepath) === '.js') {
    file = filepath.replace(/\.js$/, '.coffee');
    if (exists(file)) return file;
  }

  // a.css$ -> a.less
  // a.css$ -> a.scss, a.sass
  // a.css$ -> a.styl
  if (extname(filepath) === '.css' && exists(file)) {
    file = filepath.replace(/\.css$/, '.less');
    if (exists(file)) return file;

    file = filepath.replace(/\.css$/, '.scss');
    if (exists(file)) return file;

    file = filepath.replace(/\.css$/, '.sass');
    if (exists(file)) return file;

    file = filepath.replace(/\.css$/, '.styl');
    if (exists(file)) return file;
  }
}
