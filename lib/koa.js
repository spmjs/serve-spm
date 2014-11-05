'use strict';

var path = require('path');
var mime = require('mime');

var util = require('./util');
var parse = require('./parse');
var transport = require('./transport');

module.exports = function(root, opts) {
  opts = opts || {};
  var log = opts.log || function() {};

  return function*(next) {
    if (this.header['servespmexit']) {
      next = notFound(this);
    }

    var pkg = util.getPackage(root);
    if (!pkg) {
      return yield* next;
    }

    var file = parse(this.url, {
      pkg: pkg,
      rules: opts.rules
    });

    if (!file) {
      return yield* next;
    }


    var modifiedTime = util.getModifiedTime(file);
    this.set('Last-Modified', modifiedTime);
    if (!util.isModified(this.header, modifiedTime)) {
      this.status = 304;
      return;
    }

    log('>> ServeSPM %s < ./%s',
      file.url.pathname, path.relative(process.cwd(), file.path));

    // nowrap
    var data, ext;
    if (!file.wrap) {
      data = file.contents;
      ext = path.extname(file.path);
    }

    else {
      // transport file
      file = yield transportThunk(file, {pkg: pkg});
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

function* notFound(ctx) {
  ctx.status = 404;
}

function transportThunk(file, opt) {
  return function(cb) {
    transport(file, opt, cb);
  };
}
