var join = require('path').join;
var basename = require('path').basename;
var relative = require('path').relative;
var fs = require('fs');
var through = require('through2');
var pipe = require('multipipe');
var _ = require('lodash');

var gulp = require('gulp');
var less = require('gulp-less');
var gi = require('gulp-if');
var wrapper = require('gulp-wrapper');

var umi = require('umi');
var plugin = umi.plugin;
var concat = umi.concat;

var cache = {};

module.exports = function(root, opt) {
  opt = _.extend(opt || {}, {
    include: 'all'
  });
  opt.cwd = opt.cwd || join(root, '../');
  opt = umi.buildArgs(opt);
  opt = umi.util.extendOption(opt);
  
  process.chdir(opt.cwd);

  var isDevMode = process.env.NODE_ENV != 'production';

  return function(req, res, next) {
    next && next();

    if (cache[req.url]) {
      return res.end(cache[req.url]);
    }

    var file = relative(opt.cwd, join(root, req.url));
    if (!fs.existsSync(file)) {
      return next();
    }

    opt.pkg = new umi.Package(opt.cwd, {
      extraDeps: {handlebars: 'handlebars-runtime'}
    });

    if (isCSS(file)) {
      buildCSS(file, opt, end);
    }
    else if (isJS(file)) {
      buildJS(file, opt, end);
    }
    else {
      next();
    }

    function end(file) {
      var text = file.contents ? file.contents.toString() : '';
      if (!isDevMode) cache[req.url] = text;
      res.end(text);
    }
  };
};

function buildCSS(file, opt, callback) {
  pipe(
    gulp.src(file),
    gi(/\.less$/, less()),
    plugin.cssParser(opt),
    through.obj(callback)
  );
}

function buildJS(file, opt, callback) {
  var id = umi.transportId(file, opt.pkg);

  pipe(
    umi.src(file, opt),

    gi(/\.css$/, plugin.cssParser(opt)),
    gi(/\.css$/, plugin.css2jsParser(opt)),
    gi(/\.tpl$/, plugin.tplParser(opt)),
    gi(/\.json$/, plugin.jsonParser(opt)),
    gi(/\.handlebars$/, plugin.handlebarsParser(opt)),
    gi(/\.js$/, plugin.jsParser(opt)),
    umi.concat(),
    wrapper({
      header: [
        fs.readFileSync(join(__dirname, 'seajs-mini.js')),
        fs.readFileSync(join(__dirname, 'seajs-style.js'))
      ].join('\n'),
      footer: 'require(\''+id+'\');'
    }),

    through.obj(callback)
  );
}

var RE_CSS  = /\.(css|less)$/;
var RE_JS   = /\.(js)$/;

function isCSS(file) {
  return RE_CSS.test(file);
}

function isJS(file) {
  return RE_JS.test(file);
};
