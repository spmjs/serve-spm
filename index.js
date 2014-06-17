var path = require('path');
var join = path.join;
var fs = require('fs');
var read = fs.readFileSync;
var mime = require('mime');
var url = require('url');
var Package = require('father').SpmPackage;
var imports = require('css-imports');
var requires = require('requires');
var format = require('util').format;
var gulpTransport = require('gulp-transport');
var through = require('through2');
var pipe = require('multipipe');
var gulp = require('gulp');
var less = require('less');
var gulpless = require('gulp-less');
var gulpif = require('gulp-if');

var JS_PLUGINS = {
  '.tpl': gulpTransport.plugin.tplParser,
  '.json': gulpTransport.plugin.jsonParser,
  '.handlebars': gulpTransport.plugin.handlebarsParser,
  '.css': require('./plugins/css2js')
};
var RE_SEAMODULE = /\/sea-modules\/(.+?)\//;

module.exports = function(root, opts) {

  opts = opts || {};
  if (typeof opts.proxy === 'string') {
    opts.proxy = [opts.proxy];
  }

  return function(req, res, next) {

    next = next || function() {};

    var _url = req.url.toLowerCase();
    var pkg = new Package(root, {
      extraDeps: {handlebars: 'handlebars-runtime'}
    });

    if (opts.proxy) {
      opts.proxy.forEach(function(p) {
        if (p.charAt(0) !== '/' && p !== '') {
          p = '/' + p;
        }
        _url = _url.replace(p+'/'+pkg.name+'/'+pkg.version, '');
      });
    }

    req = url.parse(_url);
    var file = join(root, req.pathname);
    var extname = path.extname(file);

    // Proxy handlebars.runtime
    // 很恶心的实现，一定有更好的方式
    if (req.pathname === '/dist/cjs/handlebars.runtime.js' ||
      req.pathname === '/handlebars-runtime.js') {
      var handlebarsFile = join(__dirname, 'handlebars.runtime.js');
      var handlebarsData = read(handlebarsFile, 'utf-8');
      var name = req.pathname.slice(1, -3);
      handlebarsData = handlebarsData.replace('{{name}}', name);
      return end(handlebarsData, '.js');
    }

    var m = req.pathname.match(RE_SEAMODULE);
    if (m && m[0]) {
      pkg = pkg.dependencies[m[1]];
    }

    if (!fs.existsSync(file)) {
      if (extname !== '.js') {

        // May be .less
        if (extname === '.css') {
          var lessfile = file.replace(/\.css$/, '.less');
          if (fs.existsSync(lessfile)) {

            // Precompile less
            return less.render(read(lessfile, 'utf-8'), {
              paths: [path.dirname(lessfile)]
            }, function(err, css) {
              if (err) {
                console.error('less compile error: %s in file %s, line no. %s',
                  err.message, err.filename, err.line);
                next();
              } else {
                end(css, '.css');
              }
            });
          }
        }

        return next();
      }

      var newfile = file.replace(/\.less\.js$/g, '.css.js');
      newfile = newfile.replace(/\.js$/g, '');

      var plugin = JS_PLUGINS[path.extname(newfile)];
      if (!plugin) {
        return next();
      }

      var args = {
        pkg: pkg,
        cwd: root,
        idleading: './'
      };

      var stream;
      var _lessfile = newfile.replace(/\.css$/, '.less');
      if (!fs.existsSync(newfile) && fs.existsSync(_lessfile)) {
        stream = gulp.src(_lessfile).pipe(gulpless({
          paths: [path.dirname(_lessfile)]
        }));
      } else {
        stream = gulp.src(newfile);
      }

      return pipe(
        stream,
        gulpif(/\.css$/, through.obj(function(file) {
          var newCSS = parseCSS(file.contents.toString(), pkg);
          file.contents = new Buffer(newCSS);
          this.push(file);
        })),
        plugin(args),
        through.obj(function(file) {
          end(file.contents, '.js');
        })
      );
    }

    var data = read(file, 'utf-8');

    // Wrap JS files with CMD
    if (extname === '.js' && req.href.indexOf('?nowrap') === -1) {
      data = parseJS(data, pkg);
      data = wrapCMD(data);
    }

    // Transform css @import id
    if (extname === '.css') {
      data = parseCSS(data, pkg);
    }

    end(data, extname);

    function end(data, extname) {
      res.setHeader('Content-Type', mime.lookup(extname));
      res.writeHead(200);
      return res.end(data);
    }
  };
};

function parseCSS(data, pkg) {
  return imports(data, function(item) {
    var dep = item.path;

    if (isRelative(dep)) {
      return item.string;
    }

    else {
      var pkg_ = pkg.dependencies[dep];
      return format('@import "/sea-modules/%s/%s/%s";',
        pkg_.name, pkg_.version, pkg_.main);
    }
  });
}

function parseJS(data, pkg) {
  return requires(data, function(item) {
    var dep = item.path.toLowerCase();

    if (isRelative(dep)) {
      var extname = path.extname(dep);

      // Add .js for js plugins
      if (JS_PLUGINS[extname]) {
        return format('require("%s.js")', dep);
      }

      return item.string;
    }

    else {
      var pkg_ = pkg.dependencies[dep];
      return format('require("sea-modules/%s/%s/%s")',
        pkg_.name, pkg_.version, pkg_.main);
    }
  });
}

function wrapCMD(data) {
  return [
    'define(function(require, exports, module) {',
    data,
    '});'
  ].join('\n');
}

function isRelative(item) {
  return item.charAt(0) === '.';
}
