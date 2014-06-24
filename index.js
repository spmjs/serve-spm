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
var glob = require('glob');
var minimist = require('minimist');
var format = require('util').format;

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
  var pkg = new Package(root);
  var name = pkg.name;
  var version = pkg.version;

  var url = req.url.toLowerCase();
  req = urlparse(url);

  // Redirect pkg when request with /sea-modules
  var m = req.pathname.match(/\/sea-modules\/(.+?)\/(.+?)\//);
  if (m && m[0]) {
    pkg = pkg.get(m[1] + '@' + m[2]);
  }

  if (!pkg) {
    return next && next();
  }

  // Proxy handlebars-runtime request
  var data;
  if (data = proxyHandlebars(req.pathname)) {
    return end(data, res, '.js');
  }

  var file = getFile(root, req.pathname, name, version, opts);
  // console.log('  file: %s', file);
  if (!file) {
    return next && next();
  }

  var args = {
    pkg: pkg,
    cwd: root,
    idleading: './'
  };

  var useCss2jsParser = /\.css|\.less$/.test(file) &&
    /\.js$/.test(req.pathname);
  var useJsParser = /\.js$/.test(file) &&
    req.path.indexOf('?nowrap') === -1;

  return pipe(
    gulp.src(file),
    gulpif(/\.less$/, less({ paths: [path.dirname(file)] })),
    gulpif(/\.css$/, cssParser(args)),
    gulpif(useCss2jsParser, css2jsParser(args)),

    gulpif(useJsParser, jsParser(args)),

    // Plugins
    gulpif(/\.tpl$/, tplParser(args)),
    gulpif(/\.json$/, jsonParser(args)),
    gulpif(/\.handlebars$/, handlebarsParser(args)),

    // Send response
    through.obj(function(file) {
      var data = file.contents;
      var entries = getEntries(pkg);
      var buildArgs = parsePkgArgs(pkg.dest);
      var ext = path.extname(file.path);

      // add sea mini for entry js files in standalone mode
      if (ext === '.js' &&
        buildArgs.include === 'standalone' &&
        entries.indexOf(file.path) > -1) {
        data = data.toString();
        var seajs = read(join(__dirname, './sea.js'), 'utf-8');
        var init = new Buffer('\n/*! Sea.js Init */\nseajs.use(\''+url+'\');\n');
        data = seajs + data + init;
      }

      end(data, res, ext);
    })
  );
}

function getEntries(pkg) {
  var entries = [];

  // main
  entries.push(join(pkg.dest, pkg.main));

  // outputs
  if (pkg.output) {
    pkg.output.forEach(function(output) {
      var items = glob.sync(output, {cwd:pkg.dest});
      items.forEach(function(item) {
        entries.push(join(pkg.dest, item));
      });
    });
  }

  return entries;
}

function parsePkgArgs(cwd) {
  try {
    var pkg = require(join(cwd, 'package.json'));
  } catch(e) {
    throw new Error('package.json not found');
  }
  if (!(pkg.spm && pkg.spm.buildArgs)) return {};
  var args = minimist(pkg.spm.buildArgs.split(/\s+/));
  args.ignore = args.ignore || '';
  args.ignore = args.ignore.split(',');
  delete args['_'];
  return args;
}

function getFile(root, pathname, name, version, opts) {

  if (opts.dist) {
    var distTpl = opts.distTpl || '/{{dist}}/{{name}}/{{version}}';
    var data = { dist:opts.dist, name:name, version:version };
    var id = util.template(distTpl, data).replace(/^\/+/, '/');
    pathname = pathname.replace(id, '');
  }

  var file = join(root, pathname);

  if (file.slice(-1) === '/') {
    if (exists(join(file, 'index.html'))) {
      return join(file, 'index.html');
    }
    if (exists(join(file, 'index.htm'))) {
      return join(file, 'index.htm');
    }
    return null;
  }

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

