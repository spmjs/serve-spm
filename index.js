var path = require('path');
var join = path.join;
var fs = require('fs');
var mime = require('mime');
var url = require('url');
var Package = require('father').SpmPackage;
var imports = require('css-imports');
var requires = require('requires');
var format = require('util').format;

module.exports = function(root, src, opt) {

  opt = opt || {};
  src = join(root, src);

  return function(req, res, next) {

    next = next || function() {};

    req = url.parse(req.url);
    var file = join(src, req.pathname);
    var extname = path.extname(file);

    var pkg = new Package(root);

    var re = /\/sea-modules\/(.+?)\//;
    var m = req.pathname.match(re);
    if (m && m[0]) {
      pkg = pkg.dependencies[m[1]];
    }

    if (!fs.existsSync(file)) {
      return next();
    }

    var data = fs.readFileSync(file, 'utf-8');

    // Wrap JS files with CMD
    if (extname === '.js' && req.href.indexOf('?nowrap') === -1) {
      data = parseJS(data, pkg);
      data = wrapCMD(data);
    }

    // Transform css @import id
    if (extname === '.css') {
      data = parseCSS(data, pkg);
    }

    res.setHeader('Content-Type', mime.lookup(extname));
    res.writeHead(200);
    res.end(data);
  };
};

function parseCSS(data, pkg) {
  return imports(data, function(item) {
    var dep = item.path;

    if (isRelative(dep)) {
      return item.string;
    }

    else {
      var pkg_ = pkg.dependencies[dep];
      return format('@import "/sea-modules/%s/%s/%s";',
        pkg_.name, pkg_.version, pkg_.main);
    }
  });
}

function parseJS(data, pkg) {
  return requires(data, function(item) {
    var dep = item.path;

    if (isRelative(dep)) {
      return item.string;
    }

    else {
      var pkg_ = pkg.dependencies[dep];
      return format('require("sea-modules/%s/%s/%s");',
        pkg_.name, pkg_.version, pkg_.main);
    }
  });
}

function isRelative(item) {
  return item.charAt(0) === '.';
}

function wrapCMD(data) {
  return [
    'define(function(require, exports, module) {',
    data,
    '});'
  ].join('\n');
}
