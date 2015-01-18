'use strict';

var path = require('path');
var join = path.join;
var mime = require('mime');
var File = require('vinyl');
var urlparse = require('url').parse;
var debug = require('debug')('serve-spm:koa');

var util = require('./util');
var parse = require('./parse');
var transport = require('./transport');

module.exports = function(root, opts) {
  opts = opts || {};
  var log = opts.log || function() {};
  var ignore = Array.isArray(opts.ignore) ? opts.ignore : [];

  return function*(next) {
    if (Array.isArray(opts.paths)) {
      opts.paths.forEach(function(p) {
        this.url = this.url.replace(p[0], p[1]);
      }.bind(this));
    }

    if (opts.base) {
      var basepath = urlparse(opts.base).pathname;
      basepath = basepath.replace(/\/$/, '');
      this.url = this.url.replace(basepath, '');
    }

    debug('parse url %s', this.url);
    var pkg = util.getPackage(root);
    var rootPkg = pkg;
    var match;
    if (pkg && (match = util.matchNameVersion(this.url))) {
      pkg = pkg.getPackage(match.name + '@' + match.version);
    }
    if (!pkg) {
      debug('can not find local module of %s', this.url);
      return yield* next;
    }

    var file;
    if (this.body) {
      file = new File({
        base: pkg.dest,
        path: join(pkg.dest, this.url),
        contents: new Buffer(this.body)
      });
      file.url = urlparse(this.url);
      file.pkg = pkg;
      file.wrap = true;
    } else {
      file = parse(this.url, {
        rootPkg: rootPkg,
        pkg: pkg,
        rules: opts.rules
      });
    }

    if (!file) {
      debug('cat not find matched file of %s', this.url);
      return yield* next;
    }

    if (opts.cache) {
      var modifiedTime = util.getModifiedTime(file);
      this.set('Last-Modified', modifiedTime);
      if (!util.isModified(this.header, modifiedTime)) {
        debug('file %s is not modified', file.path);
        this.status = 304;
        return;
      }
    }

    log('>> ServeSPM %s < ./%s',
      file.url.pathname, path.relative(process.cwd(), file.path));

    // nowrap
    var data, ext;
    if (!file.wrap || this.headers['x-requested-with'] === 'XMLHttpRequest') {
      debug('return unwrapped file %s', file.path);
      data = file.contents;
      ext = path.extname(file.path);
    }

    else {
      // transport file
      debug('return transported file %s', file.path);
      file = yield transportThunk(file, {
        pkg: pkg,
        ignore: ignore,
        base: opts.base,
        prefix: opts.prefix
      });
      data = file.contents;
      ext = path.extname(file.path);
    }

    if (['.tpl', '.json', '.handlebars'].indexOf(ext) > -1) {
      ext = '.js';
    }
    this.set('Content-Type', mime.lookup(ext));
    this.body = data;
    this.status = 200;
  };
};

module.exports.util = util;

function transportThunk(file, opt) {
  return function(cb) {
    transport(file, opt, cb);
  };
}
