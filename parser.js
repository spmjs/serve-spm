var fs = require('fs');
var path = require('path');
var join = path.join;
var Package = require('father').SpmPackage;
var extend = require('extend');
var rename = require('rename');
var glob = require('glob');
var spmrc = require('spmrc');
var uniq = require('array-uniq');
var moduleDir = spmrc.get('install.path');

function Parser(opts) {
  extend(this, opts);

  this.name = this.pkg.name;
  this.version = this.pkg.version;

  this.parseReq();
  this.parseDepPkg();
  this.file = this.getFile();
}

module.exports = Parser;

Parser.prototype.parseReq = function() {
  var search = this.req.search;
  if (search && search.indexOf('nowrap') > -1) {
    this.noWrap = true;
  }
};

Parser.prototype.parseDepPkg = function() {
  this.rootPkg = this.pkg;

  var m = this.req.pathname.match(/^\/(.+?)\/(.+?)\//);
  if (m && m[0]) {
    var pkgId = m[1] + '@' + m[2];
    this.pkg = this.pkg.get(pkgId);
  }
};

Parser.prototype.getFile = function() {
  var pathname = this.req.pathname;
  var root = this.root;
  var file = join(root, pathname);

  // /$ -> index.htm, index.html
  if (/\/$/.test(file)) {
    if (map(join(file, 'index.html'))) return file;
    if (map(join(file, 'index.htm'))) return file;
    this.isDir = true;
  }

  // ^/dist/name/version/a.js -> /a.js
  var prefix = '/dist/'+this.name+'/'+this.version;
  if (new RegExp('^'+prefix+'/').test(pathname)) {
    if (map(file.replace(prefix, ''))) return file;
  }

  var m = pathname.match(/^\/(.+?)\/(.+?)\//);
  if (m && m[0]) {
    // ^/name/version/a.js -> /dist/name/version/a.js
    if (map(join(root, 'dist', pathname))) {
      this.noWrap = true;
      return file;
    }
    // ^/name/version/a.js -> /spm_modules/name/version/a.js
    if (map(join(root, moduleDir, pathname))) return file;
  }

  // ^handlebars-runtime.js, ^/dist/cjs/handlebars.runtime.js
  if (pathname === '/dist/cjs/handlebars.runtime.js' ||
    pathname === '/handlebars-runtime.js') {
    this.handlebarId = pathname.slice(1, -3);
    return join(root, 'handlebars.runtime.js');
  }

  // file itself
  if (map(file)) return file;

  if (path.extname(file) === '.js') {
    // a.css.js^ -> a.css, a.tpl.js -> a.tpl, ...
    if (map(file.slice(0, -3))) return file;
    // a.js^ -> a.coffee
    if (map(rename(file, {extname: '.coffee'}))) return file;
  }

  // a.css^ -> a.less
  // a.css^ -> a.scss, a.sass
  // a.css^ -> a.styl
  if (path.extname(file) === '.css') {
    if (map(rename(file, {extname: '.less'}))) return file;
    if (map(rename(file, {extname: '.scss'}))) return file;
    if (map(rename(file, {extname: '.sass'}))) return file;
    if (map(rename(file, {extname: '.styl'}))) return file;
  }

  function map(_file) {
    if (fs.existsSync(_file)) {
      file = _file;
      return true;
    }
  }
};

Parser.prototype.isModified = function() {
  var ftime = mtime(this.file);
  var ptime = mtime(join(this.root, 'package.json'));
  var ltime = new Date(this.headers['if-modified-since']);

  return Math.max(ftime, ptime) > ltime;

  function mtime(filepath) {
    return new Date(fs.statSync(filepath).mtime);
  }
};

Parser.prototype.isStandalone = function(filepath) {
  if (path.extname(filepath) !== '.js') {
    return false;
  }

  var pkg = this.rootPkg.origin;
  var buildArgs = (pkg.spm && pkg.spm.buildArgs) || '';
  if (buildArgs.indexOf('--include standalone') === -1) {
    return false;
  }

  var entries = this.getEntries();
  if (entries.indexOf(filepath) === -1) {
    return false;
  }

  return true;
};

Parser.prototype.getEntries = function() {
  var pkg = this.pkg;
  var entries = [];
  // main
  entries.push(join(pkg.dest, pkg.main));
  // outputs
  pkg.output.forEach(function(output) {
    var items = glob.sync(output, {cwd:pkg.dest});
    items.forEach(function(item) {
      entries.push(join(pkg.dest, item));
    });
  });
  // unique
  return uniq(entries);
};
