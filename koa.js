var path = require('path');
var fs = require('fs');
var urlparse = require('url').parse;
var through = require('through2');
var pipe = require('multipipe');
var gulp = require('gulp');
var less = require('gulp-less');
var gulpif = require('gulp-if');
var coffee = require('gulp-coffee');
var mime = require('mime');
var extend = require('extend');

var cssParser = require('./parser/css');
var css2jsParser = require('./parser/css2js');
var jsParser = require('./parser/js');
var tplParser = require('./parser/tpl');
var jsonParser = require('./parser/json');
var handlebarsParser = require('./parser/handlebars');
var standalonify = require('./parser/standalonify');
var Parser = require('./parser');
var util = require('./util');

module.exports = function(root, opts) {
  opts = opts || {};
  return function*(next) {
    if (this.header['servespmexit']) {
      next = notFound(this);
    }

    var pkg = util.getPkg(root);
    if (!pkg) {
      return yield* next;
    }

    var parser = new Parser(extend({
      root: root,
      req: urlparse(this.url.toLowerCase()),
      headers: this.header,
      pkg: util.getPkg(root)
    }, opts));

    // is dep package, but not found
    if (!parser.pkg) {
      return yield* next;
    }

    // don't handle if file is not found
    if (!parser.file) {
      return yield* next;
    }

    // don't handle dir
    if (parser.isDir) {
      return yield* next;
    }

    // 304
    var isModified = parser.isModified();
    this.set('Last-Modified', parser.modifiedTime);
    if (!isModified) {
      this.status = 304;
      return;
    }

    if (opts.log) {
      console.log('>> ServeSPM %s < ./%s',
        parser.req.pathname, path.relative(process.cwd(), parser.file));
    }

    var data, ext;
    // nowrap
    if (parser.noWrap) {
      data = fs.readFileSync(parser.file, 'utf-8');
      if (parser.handlebarId) {
        data = util.template(data, {id:parser.handlebarId});
      }
      ext = path.extname(parser.file);
    }

    else {
      // transport file
      var file = yield parse(parser);
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

function parse(parser) {
  var file = parser.file;
  var useCss2jsParser = util.isCSSFile(file) &&
    /\.js$/.test(parser.req.pathname);
  var useStandalone = function(file) {
    return parser.isStandalone(file.path);
  };

  return function(cb) {
    pipe(
      gulp.src(file),

      gulpif(/\.less$/, less({ paths: [path.dirname(file)] })),
      gulpif(/\.css$/, cssParser(parser)),
      gulpif(useCss2jsParser, css2jsParser(parser)),
      gulpif(/\.coffee$/, coffee({bare: true})),
      gulpif(/\.js$/, jsParser(parser)),
      gulpif(/\.tpl$/, tplParser(parser)),
      gulpif(/\.json$/, jsonParser(parser)),
      gulpif(/\.handlebars$/, handlebarsParser(parser)),
      gulpif(useStandalone, standalonify(this.url)),

      through.obj(function(file) {
        cb(null, file);
      })
    )
    .once('error', cb);
  };
}
