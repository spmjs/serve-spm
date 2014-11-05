var handlebarsParser = require('../lib/parser/handlebars');
var util = require('../lib/util');

describe('handlebars', function() {

  it('normal', function(done) {

    var origin = '{{a}}\n\r\'\"';
    var expected = util.define('var Handlebars = require(\"handlebars-runtime\")[\"default\"];\nmodule.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {\n  this.compilerInfo = [4,\'>= 1.0.0\'];\nhelpers = this.merge(helpers, Handlebars.helpers); data = data || {};\n  var buffer = \"\", stack1, helper, functionType=\"function\", escapeExpression=this.escapeExpression;\n\n\n  if (helper = helpers.a) { stack1 = helper.call(depth0, {hash:{},data:data}); }\n  else { helper = (depth0 && depth0.a); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }\n  buffer += escapeExpression(stack1)\n    + \"\\n\\r\'\\\"\";\n  return buffer;\n  });');

    var pkg = {
      dependencies: {
        'handlebars-runtime': {
          version: '1.3.0'
        }
      }
    };

    var stream = handlebarsParser({
      pkg: pkg
    });
    stream.on('data', function(newFile) {
      String(newFile.contents).should.be.equal(expected);
      done();
    });
    stream.write({
      url: {pathname: ''},
      contents: new Buffer(origin)
    });
    stream.end();
  });

  it('version error', function(done) {

    var origin = '{{a}}';

    var pkg = {
      dependencies: {
        'handlebars-runtime': {
          version: '1.4.0'
        }
      }
    };

    var stream = handlebarsParser({
      pkg: pkg
    });
    stream.on('error', function(e) {
      e.message.should.be.equal('handlebars version should be 1.3.0 but 1.4.0');
      done();
    });
    stream.write({
      url: {pathname: ''},
      contents: new Buffer(origin)
    });
    stream.end();
  });

  it('handlebars-runtime not found', function(done) {

    var origin = '{{a}}';

    var pkg = {
      dependencies: {
      }
    };

    var stream = handlebarsParser({
      pkg: pkg
    });
    stream.on('error', function(e) {
      e.message.should.be.equal('handlebars-runtime not found in dependencies');
      done();
    });
    stream.write({
      url: {pathname: ''},
      contents: new Buffer(origin)
    });
    stream.end();

  });
});
