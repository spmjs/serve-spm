var path = require('path');
var join = path.join;
var fs = require('fs');
var mime = require('mime');
var url = require('url');
var Package = require('father').SpmPackage;
var imports = require('css-imports');
var requires = require('requires');
var format = require('util').format;
var gulpTransport = require('gulp-transport');
var through = require('through2');
var pipe = require('multipipe');
var gulp = require('gulp');

var plugins = {
  '.tpl': gulpTransport.plugin.tplParser,
  '.json': gulpTransport.plugin.jsonParser,
  '.handlebars': gulpTransport.plugin.handlebarsParser,
  '.css': gulpTransport.plugin.css2jsParser
};

module.exports = function(root, src) {

  src = join(root, src || '');

  return function(req, res, next) {

    next = next || function() {};

    req = url.parse(req.url.toLowerCase());
    var file = join(src, req.pathname);
    var extname = path.extname(file);

    // Proxy handlebars.runtime
    // 很恶心的实现，一定有更好的方式
    if (req.pathname === '/dist/cjs/handlebars.runtime.js' ||
      req.pathname === '/handlebars-runtime.js') {
      res.setHeader('Content-Type', mime.lookup('.js'));
      res.writeHead(200);
      var handlebarsFile = join(__dirname, 'handlebars.runtime.js');
      var handlebarsData = fs.readFileSync(handlebarsFile, 'utf-8');
      var name = req.pathname.slice(1, -3);
      handlebarsData = handlebarsData.replace('{{name}}', name);
      return res.end(handlebarsData);
    }

    var pkg = new Package(root, {
      extraDeps: {handlebars: 'handlebars-runtime'}
    });

    var re = /\/sea-modules\/(.+?)\//;
    var m = req.pathname.match(re);
    if (m && m[0]) {
      pkg = pkg.dependencies[m[1]];
    }

    if (!fs.existsSync(file)) {
      if (extname !== '.js') return next();

      var newfile = file.slice(0, -3);
      var newextname = path.extname(newfile);
      var plugin = plugins[newextname];

      if (!plugin) {
        return next();
      }

      var args = {
        pkg: pkg,
        cwd: root,
        idleading: './'
      };

      return pipe(
        gulp.src(newfile),
        plugin(args),
        through.obj(function(file) {
          res.setHeader('Content-Type', mime.lookup('.js'));
          res.writeHead(200);
          res.end(file.contents);
        })
      );
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
    var dep = item.path.toLowerCase();

    if (isRelative(dep)) {
      var extname = path.extname(dep);
      if (plugins[extname]) {
        return format('require("%s.js")', dep);
      }

      return item.string;
    }

    else {
      var pkg_ = pkg.dependencies[dep];
      return format('require("sea-modules/%s/%s/%s")',
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
