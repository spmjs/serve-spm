'use strict';

var path = require('path');
var pipe = require('multipipe');
var less = require('gulp-less');
var gulpif = require('gulp-if');
var coffee = require('gulp-coffee');
var reactify = require('gulp-reactify');
var to5 = require('gulp-6to5');
var cssParser = require('./parser/css');
var css2jsParser = require('./parser/css2js');
var jsParser = require('./parser/js');
var tplParser = require('./parser/tpl');
var jsonParser = require('./parser/json');
var handlebarsParser = require('./parser/handlebars');
var standalonify = require('./parser/standalonify');
var util = require('./util');

module.exports = function transport(file, opt, cb) {
  var pkg = opt.pkg;
  var useCss2jsParser = util.isCSSFile(file.path) &&
    /\.js$/.test(file.url.pathname);
  var useStandalone = function(file) {
    return util.isStandalone(file);
  };
  var stream = pipe(
    gulpif(/\.less$/, less({ paths: [path.dirname(file.path)] })),
    gulpif(/\.css$/, cssParser({pkg: pkg})),
    gulpif(useCss2jsParser, css2jsParser()),
    gulpif(/\.coffee$/, coffee({bare: true})),
    gulpif(/\.js$/, pipe(
      reactify(),
      gulpif(file.pkg.origin.spm['6to5'], to5(file.pkg.origin.spm['6to5'])),
      jsParser({pkg: pkg, ignore: opt.ignore})
    )),
    gulpif(/\.tpl$/, tplParser()),
    gulpif(/\.json$/, jsonParser()),
    gulpif(/\.handlebars$/, handlebarsParser({pkg: pkg})),
    gulpif(useStandalone, standalonify({url:file.url.pathname,base:opt.base}))
  ).once('data', function(file) {
    cb(null, file);
  });
  stream.write(file);
  stream.end();
};
