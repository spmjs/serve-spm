'use strict';

var path = require('path');
var mime = require('mime');
var debug = require('debug')('serve-spm:express');
var urlparse = require('url').parse;

var parse = require('./parse');
var util = require('./util');
var transport = require('./transport');

module.exports = function(root, opts) {
  opts = opts || {};
  var log = opts.log || function() {};
  var ignore = Array.isArray(opts.ignore) ? opts.ignore : [];

  return function(req, res, next) {
    if (Array.isArray(opts.paths)) {
      opts.paths.forEach(function(p) {
        req.url = req.url.replace(p[0], p[1]);
      });
    }

    if (opts.base) {
      var basepath = urlparse(opts.base).pathname;
      basepath = basepath.replace(/\/$/, '');
      req.url = req.url.replace(basepath, '');
    }

    debug('parse url %s', req.url);
    var pkg = util.getPackage(root);

    // Handle idleading
    var idleadingPrefix = util.getIdleadingPrefix(pkg);
    if (idleadingPrefix) {
      if (req.url.indexOf('/' + idleadingPrefix + '/' + pkg.name + '/' + pkg.version + '/') === 0) {
        req.url = req.url.replace('/' + idleadingPrefix, '');
      }
    }

    var rootPkg = pkg;
    var match;
    if (pkg && (match = util.matchNameVersion(req.url))) {
      pkg = pkg.getPackage(match.name + '@' + match.version);
    }
    if (!pkg) {
      debug('can not find local module of %s', req.url);
      return next();
    }

    var file = parse(req.url, {
      pkg: pkg,
      rootPkg: rootPkg,
      rules: opts.rules
    });

    if (!file) {
      return next();
    }

    // 304
    var modifiedTime = util.getModifiedTime(file);
    res.setHeader('Last-Modified', modifiedTime);
    if (!util.isModified(req.headers, modifiedTime)) {
      debug('file %s is not modified', file.path);
      res.writeHead(304);
      return res.end('');
    }

    log('>> ServeSPM %s < ./%s',
      file.url.pathname, path.relative(process.cwd(), file.path));

    // nowrap
    if (!file.wrap || req.headers['x-requested-with'] === 'XMLHttpRequest') {
      debug('return unwrapped file %s', file.path);
      return end(file.contents, res, path.extname(file.path));
    }

    file.idleadingPrefix = idleadingPrefix;

    var opt = {
      pkg: pkg,
      ignore: ignore,
      base: opts.base
    };
    debug('return transported file %s', file.path);
    transport(file, opt, function(err, file) {
      var ext = path.extname(file.path);
      end(file.contents, res, ext);
    });
  };
};

function end(data, res, extname) {
  res.setHeader('Content-Type', mime.lookup(extname));
  res.writeHead(200);
  res.end(data);
}
