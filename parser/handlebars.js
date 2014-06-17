'use strict';

var handlebars = require('handlebars');
var join = require('path').join;
var util = require('../util');
var PluginError = require('gulp-util').PluginError;
var through = require('through2');

module.exports = function handlebarsParser(options) {
  return through.obj(function(file) {
    file = parser(file, options);
    this.push(file);
  });
};

var headerTpl = 'define(function(require, exports, module) {\n' +
  'var Handlebars = require("{{handlebars}}")["default"];\n';
var footerTpl = '\n});\n';

function parser(file, options) {
  var ignore = options.ignore;
  var pkg = options.pkg;
  var hpkg = pkg.dependencies['handlebars-runtime'];

  // version should be same between precompile tool and required package
  check(hpkg);

  var hid = 'handlebars-runtime';
  file.contents = Buffer.concat([
    new Buffer(util.template(headerTpl, {handlebars: hid})),
    new Buffer('module.exports = Handlebars.template('),
    new Buffer(precompile(file, hid)),
    new Buffer(');'),
    new Buffer(footerTpl)
  ]);
  return file;
}

function precompile(file) {
  var code = file.contents.toString();
  return handlebars.precompile(code);
}

function check(pkg) {
  if (!pkg) return;
  var path = join(__dirname, '../package.json');
  var ver = require(path).dependencies.handlebars;
  if (pkg.version !== ver) {
    throw new PluginError('transport:handlebars', 'handlebars version should be ' + ver + ' but ' + pkg.version);
  }
}
