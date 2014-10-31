
module.exports = function(root, opts) {
  return function() {
    var args = Array.prototype.concat.apply([root, opts || {}], arguments);
    require('./lib/express').apply(this, args);
  };
};

module.exports.util = require('./lib/util');

if (require('generator-support')) {
  module.exports.koa = require('./lib/koa');
} else {
  module.exports.koa = function() {
    throw new Error('Generator is not supported');
  };
}
