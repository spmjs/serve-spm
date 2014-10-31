var fs = require('fs');
var path = require('path');
var join = path.join;
var extend = require('extend');
var rename = require('rename');
var glob = require('glob');
var spmrc = require('spmrc');
var uniq = require('array-uniq');
var semver = require('semver');
var moduleDir = spmrc.get('install.path');

function Parser(opts) {
  extend(this, opts);

  this.name = this.pkg.name;
  this.version = this.pkg.version;

  this.parseReq();
  this.parseDepPkg();
  this.file = this.getFile();

  if (this.file && this.pkg) {
    this.entries = this.getEntries();
    this.isEntry = !this.pkg.father && this.entries.indexOf(this.file) > -1;
  }
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
  if (m && m[0] && /^\d+\.\d+\.\d+/.test(m[2])) {
    var pkgId = m[1] + '@' + m[2];
    this.pkg = this.pkg.get(pkgId);
  }
};

Parser.prototype.getFile = function() {
  var pathname = this.req.pathname;
  var root = this.root;

  if (this.paths && Array.isArray(this.paths)) {
    this.paths.forEach(function(item) {
      pathname = pathname.replace(item[0], item[1]);
    });
  }

  var file = join(root, pathname);

  // /$ -> index.htm, index.html
  if (/\/$/.test(file)) {
    if (map(join(file, 'index.html'))) return file;
    if (map(join(file, 'index.htm'))) return file;
    this.isDir = true;
  }

  var prefix;

  // ^/dist/name/version/a.js -> /a.js
  prefix = '/dist/'+this.name+'/'+this.version;
  if (new RegExp('^'+prefix+'/').test(pathname)) {
    if (map(file.replace(prefix, ''))) return file;
  }

  // ^/name/version/a.js -> /a.js
  prefix = '/' + this.name+'/'+this.version;
  if (new RegExp('^'+prefix+'/').test(pathname)) {
    if (map(file.replace(prefix, ''))) return file;
  }

  var m = pathname.match(/^\/(.+?)\/(.+?)\//);
  if (m && m[0] && semver.valid(m[2])) {
    // ^/name/version/a.js -> /dist/name/version/a.js
    if (map(join(root, 'dist', pathname))) {
      this.noWrap = true;
      return file;
    }
    // ^/name/version/a.js -> /spm_modules/name/version/a.js
    if (map(join(root, moduleDir, pathname))) return file;
    // Deprecate: ^/name/version/a.js -> /sea_modules/name/version/a.js
    if (map(join(root, 'sea-modules', pathname))) return file;

    // change file for deps pkg, only support spm_modules
    file = join(root, moduleDir, pathname);
  }

  // ^handlebars-runtime.js, ^/dist/cjs/handlebars.runtime.js -> hanelebars.runtime.js
  if (pathname === '/dist/cjs/handlebars.runtime.js' ||
    pathname === '/handlebars-runtime.js') {
    this.noWrap = true;
    this.handlebarId = pathname.slice(1, -3);
    return join(__dirname, '../handlebars.runtime.js');
  }

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

  // file itself
  if (map(file)) return file;

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
  var ltime = +new Date(+this.headers['if-modified-since']);

  this.modifiedTime =  Math.max(ftime, ptime);

  if (!this.headers || !this.headers['if-modified-since']) {
    return true;
  }

  return this.modifiedTime > ltime;

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
  if (buildArgs.indexOf('--include standalone') === -1
    && buildArgs.indexOf('--include umd') === -1) {
    return false;
  }

  return this.entries.indexOf(filepath) > -1;
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
