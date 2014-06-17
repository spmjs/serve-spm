var path = require('path');
var join = path.join;
var fs = require('fs');
var exists = fs.existsSync;
var read = fs.readFileSync;
var mime = require('mime');
var urlparse = require('url').parse;
var Package = require('father').SpmPackage;
var through = require('through2');
var pipe = require('multipipe');
var gulp = require('gulp');
var less = require('gulp-less');
var gulpif = require('gulp-if');
var util = require('./util');
var rename = require('rename');

var cssParser = require('./parser/css');
var css2jsParser = require('./parser/css2js');
var jsParser = require('./parser/js');
var tplParser = require('./parser/tpl');
var jsonParser = require('./parser/json');
var handlebarsParser = require('./parser/handlebars');

module.exports = function(root, opts) {
  return function() {
    var args = Array.prototype.concat.apply([root, opts || {}], arguments);
    parse.apply(this, args);
  };
};

function parse(root, opts, req, res, next) {
  var pkg = new Package(root, {
    extraDeps: {handlebars: 'handlebars-runtime'}
  });

  var url = req.url.toLowerCase();
  req = urlparse(url);

  // Redirect pkg when request with /sea-modules
  var m = req.pathname.match(/\/sea-modules\/(.+?)\//);
  if (m && m[0]) {
    pkg = pkg.dependencies[m[1]];
  }

  // Proxy handlebars-runtime request
  var data;
  if (data = proxyHandlebars(req.pathname)) {
    return end(data, res, '.js');
  }

  var file = getFile(root, req.pathname);
  // console.log('  file: %s', file);
  if (!file) {
    return next();
  }

  var args = {
    pkg: pkg,
    cwd: root,
    idleading: './'
  };

  var useCss2jsParser = /\.css|\.less$/.test(file) &&
    /\.js$/.test(req.pathname);

  return pipe(
    gulp.src(file),
    gulpif(/\.less$/, less({ paths: [path.dirname(file)] })),
    gulpif(/\.css$/, cssParser(args)),
    gulpif(useCss2jsParser, css2jsParser(args)),

    gulpif(/\.js$/, jsParser(args)),

    // Plugins
    gulpif(/\.tpl$/, tplParser(args)),
    gulpif(/\.json$/, jsonParser(args)),
    gulpif(/\.handlebars$/, handlebarsParser(args)),

    // Send response
    through.obj(function(file) {
      end(file.contents, res, path.extname(file.path));
    })
  );
}

function getFile(root, pathname) {
  var file = join(root, pathname);
  if (exists(file)) return file;

  if (path.extname(file) === '.js') {
    file = file.slice(0, -3);
  }
  // .less.js, .css.js, .tpl.js, .json.js, .handlebars.js
  if (exists(file)) return file;

  var lessfile = rename(file, {extname:'.less'});
  if (path.extname(file) === '.css' && exists(lessfile)) {
    // .css -> .less
    return lessfile;
  }
}

function proxyHandlebars(pathname) {
  if (pathname === '/dist/cjs/handlebars.runtime.js' ||
    pathname === '/handlebars-runtime.js') {
    var id = pathname.slice(1, -3);
    var data = read(join(__dirname, 'handlebars.runtime.js'), 'utf-8');
    return util.template(data, {id:id});
  }
}

function end(data, res, extname) {
  if (['.tpl', '.json', '.handlebars'].indexOf(extname) > -1) {
    extname = '.js';
  }
  res.setHeader('Content-Type', mime.lookup(extname));
  res.writeHead(200);
  res.end(data);
}

