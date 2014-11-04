var semver = require('semver');
var debug = require('debug')('rules');
var join = require('path').join;
var relative = require('path').relative;

module.exports = [

  // /$ -> index.html
  function(url, pkg) {
    if (/\/$/.test(url.pathname)) {
      debug('matching %s -> %s', url.pathname, 'index.html');
      return {
        path: join(pkg.dest, 'index.html')
      };
    }
  },

  // /$ -> index.htm
  function(url, pkg) {
    if (/\/$/.test(url.pathname)) {
      debug('matching %s -> %s', url.pathname, 'index.htm');
      return {
        path: join(pkg.dest, 'index.htm')
      };
    }
  },

  // ^/dist/{name}/{version}/a.js -> /a.js
  function(url, pkg) {
    var pathname = url.pathname;
    var prefix = '/dist/' + pkg.name + '/' + pkg.version;
    if (pathname.indexOf(prefix) === 0) {
      pathname = pathname.replace(prefix, '');
      debug('matching %s -> %s', url.pathname, pathname);
      return {
        path: join(pkg.dest, pathname)
      };
    }
  },

  // ^/{name}/{version}/a.js -> /a.js
  function(url, pkg) {
    var matched = matchNameVersion(url.pathname);
    if (matched && matched.name === pkg.name && matched.version === pkg.version) {
      debug('matching %s -> %s', url.pathname, matched.file);
      return {
        path: join(pkg.dest, matched.file)
      };
    }
  },

  // ^/{name}/{version}/a.js -> /dist/{name}/{version}/a.js
  function(url, pkg) {
    var matched = matchNameVersion(url.pathname);
    if (matched && matched.name === pkg.name && matched.version === pkg.version) {
      var pathname = join('dist', url.pathname);
      debug('matching %s -> %s', url.pathname, pathname);
      return {
        wrap: false,
        path: join(pkg.dest, pathname)
      };
    }
  },

  // ^/{name}/{version}/a.js -> /spm_modules/{name}/{version}/a.js
  function(url, pkg) {
    var matched = matchNameVersion(url.pathname);
    if (!matched) return;

    var sub = pkg.get(matched.name + '@' + matched.version);
    if (sub) {
      debug('matching %s -> %s', join(relative(pkg.dest ,sub.dest), matched.file));
      return {
        path: join(sub.dest, matched.file)
      };
    }
  },

  // ^/a.js -> a.js
  function(url, pkg) {
    return {
      path: join(pkg.dest, url.pathname)
    };
  }
];

// Match ^/{name}/{version}/.*.js
function matchNameVersion(pathname) {
  var m = pathname.match(/^\/(.+?)\/(.+?)\/(.*)/);
  if (m && m[0] && semver.valid(m[2])) {
    return {
      name: m[1],
      version: m[2],
      file: m[3]
    };
  }
}
