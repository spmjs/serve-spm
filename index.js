var join = require('path').join;
var relative = require('path').relative;
var fs = require('fs');
var through = require('through2');
var pipe = require('multipipe');
var extend = require('extend');

var gulp = require('gulp');
var less = require('gulp-less');
var gi = require('gulp-if');
var wrapper = require('gulp-wrapper');

var umi = require('umi');
var plugin = umi.plugin;

var RE_CSS  = /\.(css|less)$/;
var RE_JS   = /\.(js)$/;

var cache = {};

module.exports = function(root, opt) {
  opt = extend(opt || {}, {
    include: 'all'
  });

  opt.cwd = opt.cwd || join(root, '../');

  opt = umi.buildArgs(opt);
  opt = umi.util.extendOption(opt);
  
  // FIXME: may be conflict with other actions
  process.chdir(opt.cwd);

  return function(req, res, next) {
    if (cache[req.url]) {
      return res.end(cache[req.url]);
    }
    
    next = next || function() {};

    var file = relative(opt.cwd, join(root, req.url));
    if (!fs.existsSync(file)) {
      console.error('error: file %s not found', file);
      return next();
    }

    opt.pkg = new umi.Package(opt.cwd, {
      extraDeps: {handlebars: 'handlebars-runtime'},
      entry: [file]
    });

    // Build
    if (RE_CSS.test(file)) {
      buildCSS(file, opt, buildEnd);
    }
    else if (RE_JS.test(file)) {
      buildJS(file, opt, buildEnd);
    }
    else {
      next();
    }

    function buildEnd(file) {
      var text = file.contents ? file.contents.toString() : '';
      var isDevMode = process.env.NODE_ENV !== 'production';
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
