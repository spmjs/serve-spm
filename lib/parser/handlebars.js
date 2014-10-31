'use strict';

var handlebars = require('handlebars');
var join = require('path').join;
var util = require('../util');
var PluginError = require('gulp-util').PluginError;
var through = require('through2');

module.exports = function handlebarsParser(options) {
  return through.obj(function(file, enc, cb) {
    var pkg = options.pkg;
    var hpkg = pkg.dependencies['handlebars-runtime'];

    // version should be same between precompile tool and required package
    var err = check(hpkg);
    if (err) {
      return cb(err);
    }

    file = parser(file);
    this.push(file);
  });
};

function parser(file) {
  var code = '' +
    'var Handlebars = require("handlebars-runtime")["default"];\n' +
    'module.exports = Handlebars.template(' +
    precompile(file) +
    ');';
  code = util.define(code);

  file.contents = new Buffer(code);
  return file;
}

function precompile(file) {
  return handlebars.precompile(String(file.contents));
}

function check(pkg) {
  var path = join(__dirname, '../../package.json');
  var ver = require(path).dependencies.handlebars;
    if (!pkg) {
      return new PluginError('transport:handlebars', 'handlebars-runtime not found in dependencies');
    }
    if (pkg.version !== ver) {
    return new PluginError('transport:handlebars',
      'handlebars version should be ' + ver + ' but ' + pkg.version);
  }
}
