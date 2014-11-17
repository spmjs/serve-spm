'use strict';

var path = require('path');
var mime = require('mime');

var parse = require('./parse');
var util = require('./util');
var transport = require('./transport');

module.exports = function(root, opts) {
  opts = opts || {};
  var log = opts.log || function() {};

  return function(req, res, next) {
    next = req.headers['servespmexit'] ? notFound : (next || notFound);

    var pkg = util.getPackage(root);
    var match;
    if (pkg && (match = util.matchNameVersion(req.url))) {
      pkg = pkg.get(match.name + '@' + match.version);
    }
    if (!pkg) {
      return next();
    }

    var file = parse(req.url, {
      pkg: pkg,
      rules: opts.rules
    });

    if (!file) {
      return next();
    }

    // 304
    var modifiedTime = util.getModifiedTime(file);
    res.setHeader('Last-Modified', modifiedTime);
    if (!util.isModified(req.headers, modifiedTime)) {
      res.writeHead(304);
      return res.end('');
    }

    log('>> ServeSPM %s < ./%s',
      file.url.pathname, path.relative(process.cwd(), file.path));

    // nowrap
    if (!file.wrap) {
      return end(file.contents, res, path.extname(file.path));
    }

    var opt = {
      pkg: pkg
    };
    transport(file, opt, function(err, file) {
      var ext = path.extname(file.path);
      end(file.contents, res, ext);
    });

    function notFound() {
      res.writeHead(404);
      res.end('');
    }
  };
};

function end(data, res, extname) {
  if (['.tpl', '.json', '.handlebars'].indexOf(extname) > -1) {
    extname = '.js';
  }
  res.setHeader('Content-Type', mime.lookup(extname));
  res.writeHead(200);
  res.end(data);
}
