var http = require('http');
var join = require('path').join;
var request = require('request');
var serveSPM = require('../');

var port = 12345;
var server;

describe('serve spm', function() {

  before(function(done) {
    var publicPath = join(__dirname, './fixtures/site/');
    server = http.createServer(serveSPM(publicPath));
    server.listen(port, done);
  });

  after(function() {
    server && server.close();
    server = null;
  });

  describe('css', function() {

    it('css without imports', function(done) {
      request('http://localhost:'+port+'/relative.css', function(err, res, body) {
        body.should.be.eql('\na{position:relative;}\n');
        done();
      });
    });

    it('css with relative and package imports', function(done) {
      request('http://localhost:'+port+'/index.css', function(err, res, body) {
        body.should.be.eql('\n@import \"/sea-modules/css-a/1.0.0/index.css\";\n@import \"./relative.css\";\na{color:red;}\n');
        done();
      });
    });

    it('css in package which is main', function(done) {
      request('http://localhost:'+port+'/sea-modules/css-b/1.0.0/index.css', function(err, res, body) {
        body.should.be.eql('\nb{color:black;}\n');
        done();
      });
    });

    it('css in package which import other css packages', function(done) {
      request('http://localhost:'+port+'/sea-modules/css-a/1.0.0/index.css', function(err, res, body) {
        body.should.be.eql('\n@import \"/sea-modules/css-b/2.0.0/index.css\";\n@import \"./plus.css\";\n\na{color:red;}\n');
        done();
      });
    });

    it('css in package which is not main', function(done) {
      request('http://localhost:'+port+'/sea-modules/css-a/1.0.0/plus.css', function(err, res, body) {
        body.should.be.eql('\np{color:green;}\n');
        done();
      });
    });
  });

  describe('js', function() {

    it('wrap js', function(done) {
      request('http://localhost:'+port+'/relative.js', function(err, res, body) {
        body.should.be.eql('define(function(require, exports, module) {\n\nmodule.exports = \'relative\';\n\n});');
        done();
      });
    });

    it('dont wrap js if ?nowrap supplys', function(done) {
      request('http://localhost:'+port+'/relative.js?nowrap', function(err, res, body) {
        body.should.be.eql('\nmodule.exports = \'relative\';\n');
        done();
      });
    });

    it('js in package', function(done) {
      request('http://localhost:'+port+'/sea-modules/js-b/1.0.0/index.js', function(err, res, body) {
        body.should.be.eql('define(function(require, exports, module) {\n\nmodule.exports = \'b@1.0.0\';\n\n});');
        done();
      });
    });

    it('js in package which require other package', function(done) {
      request('http://localhost:'+port+'/sea-modules/js-a/1.0.0/index.js', function(err, res, body) {
        body.should.be.eql('define(function(require, exports, module) {\n\nvar plus = require(\'./plus\');\nvar b = require(\"sea-modules/js-b/2.0.0/index.js\");\n\nmodule.exports = \'a@1.0.0, \' + plus + b;\n\n});');
        done();
      });
    });

  });

  describe('plugins', function() {

    it('css plugin', function(done) {
      request('http://localhost:'+port+'/plugins/plugin.css.js', function(err, res, body) {
        body.should.be.eql('define(\"plugins/plugin.css.js\", [], function(require, exports, module){\nseajs.importStyle(\'body {background: #ffa;}\');\n});\n');
        done();
      });
    });

    it('tpl plugin', function(done) {
      request('http://localhost:'+port+'/plugins/index.tpl.js', function(err, res, body) {
        body.should.be.eql('define(\"plugins/index.tpl\", [], function(require, exports, module){\nmodule.exports=\'hello {{name}}\';\n});\n');
        done();
      });
    });

    it('json plugin', function(done) {
      request('http://localhost:'+port+'/plugins/index.json.js', function(err, res, body) {
        body.should.be.eql('define(\"plugins/index.json\", [], function(require, exports, module){\nmodule.exports ={\n  \"foo\": 1\n}\n\n});\n');
        done();
      });
    });

    it('handlebars plugin', function(done) {
      request('http://localhost:'+port+'/plugins/index.handlebars.js', function(err, res, body) {
        body.should.be.eql('define(\"plugins/index.handlebars\", [\"handlebars-runtime\"], function(require, exports, module) {\nvar Handlebars = require(\"handlebars-runtime\")[\"default\"];\nmodule.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {\n  this.compilerInfo = [4,\'>= 1.0.0\'];\nhelpers = this.merge(helpers, Handlebars.helpers); data = data || {};\n  \n\n\n  return \"todo\\n\";\n  });\n});\n');
        done();
      });
    });

  });

  describe('other', function() {

    it('serve other static files', function(done) {
      request('http://localhost:'+port+'/index.html', function(err, res) {
        res.statusCode.should.be.eql(200);
        done();
      });
    });

  });

});
