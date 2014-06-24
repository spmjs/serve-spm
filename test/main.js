var http = require('http');
var join = require('path').join;
var request = require('request');
var serveSPM = require('../');

var port = 12345;
var server;

describe('serve spm', function() {

  before(function(done) {
    var publicPath = join(__dirname, './fixtures/site/');
    server = http.createServer(serveSPM(publicPath, {
      dist: 'assets'
    }));
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

    it('css in package which is not in root package', function(done) {
      request('http://localhost:'+port+'/sea-modules/css-b/2.0.0/index.css', function(err, res, body) {
        body.should.be.eql('\nb{color:green;}\n');
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

  describe('less', function() {
    it('support less', function(done) {
      request('http://localhost:'+port+'/precompilers/index.css', function(err, res, body) {
        body.should.be.eql('@import \"/sea-modules/css-a/1.0.0/index.css\";\np {\n  color: green;\n}\na {\n  color: #5b83ad;\n}\n');
        done();
      });
    });

    it('.css.js for less file', function(done) {
      request('http://localhost:'+port+'/precompilers/a.css.js', function(err, res, body) {
        body.should.be.eql('define(function(require, exports, module){\nseajs.importStyle(\'p {  color: green;}\');\n});\n');
        done();
      });
    });

    it('.less.js', function(done) {
      request('http://localhost:'+port+'/precompilers/a.less.js', function(err, res, body) {
        body.should.be.eql('define(function(require, exports, module){\nseajs.importStyle(\'p {  color: green;}\');\n});\n');
        done();
      });
    });

    it('.less.js which import other packages', function(done) {
      request('http://localhost:'+port+'/precompilers/index.less.js', function(err, res, body) {
        body.should.be.eql('define(function(require, exports, module){\nseajs.importStyle(\'@import \"/sea-modules/css-a/1.0.0/index.css\";p {  color: green;}a {  color: #5b83ad;}\');\n});\n');
        done();
      });
    });
  });

  describe('js', function() {

    it('wrap js', function(done) {
      request('http://localhost:'+port+'/relative.js', function(err, res, body) {
        body.should.be.eql('define(function(require, exports, module){\n\nmodule.exports = \'relative\';\n\n});\n');
        done();
      });
    });

    it('dont wrap js if ?nowrap supplys', function(done) {
       request('http://localhost:'+port+'/relative.js?nowrap', function(err, res, body) {
         body.should.be.eql('\nmodule.exports = \'relative\';\n');
         done();
       });
    });

    it('require css or less in js', function(done) {
        request('http://localhost:'+port+'/require-css.js', function(err, res, body) {
          body.should.be.eql('define(function(require, exports, module){\nrequire(\'./relative.css\');\nrequire(\"./precompilers/a.css\");\n});\n');
          done();
        });
    });

    it('js in package', function(done) {
      request('http://localhost:'+port+'/sea-modules/js-b/1.0.0/index.js', function(err, res, body) {
        body.should.be.eql('define(function(require, exports, module){\n\nmodule.exports = \'b@1.0.0\';\n\n});\n');
        done();
      });
    });

    it('js in package which require other package', function(done) {
      request('http://localhost:'+port+'/sea-modules/js-a/1.0.0/index.js', function(err, res, body) {
        body.should.be.eql('define(function(require, exports, module){\n\nvar plus = require(\'./plus\');\nvar b = require(\"sea-modules/js-b/2.0.0/index.js\");\n\nmodule.exports = \'a@1.0.0, \' + plus + b;\n\n});\n');
        done();
      });
    });

    it('dont resolve package that cant be found', function(done) {
      request('http://localhost:'+port+'/pkg-not-found.js', function(err, res, body) {
        body.should.be.eql('define(function(require, exports, module){\nrequire(\'bar\');\n\n});\n');
        done();
      });
    });

    it('add seajs mini for standalone', function(done) {
      request('http://localhost:'+port+'/main.js', function(err, res, body) {
        body.should.be.containEql('seajs.org');
        done();
      });
    });

  });

  describe('plugins', function() {

    it('css plugin', function(done) {
      request('http://localhost:'+port+'/plugins/plugin.css.js', function(err, res, body) {
        body.should.be.eql('define(function(require, exports, module){\nseajs.importStyle(\'body {background: #ffa;}\');\n});\n');
        done();
      });
    });

    it('tpl plugin', function(done) {
      request('http://localhost:'+port+'/plugins/index.tpl.js', function(err, res, body) {
        body.should.be.eql('define(function(require, exports, module){\nmodule.exports=\'hello {{name}}\';\n});\n');
        done();
      });
    });

    it('json plugin', function(done) {
      request('http://localhost:'+port+'/plugins/index.json.js', function(err, res, body) {
        body.should.be.eql('define(function(require, exports, module){\nmodule.exports ={\n  \"foo\": 1\n}\n\n});\n');
        done();
      });
    });

    it('handlebars plugin', function(done) {
      request('http://localhost:'+port+'/plugins/index.handlebars.js', function(err, res, body) {
        body.should.be.eql('define(function(require, exports, module) {\nvar Handlebars = require(\"handlebars-runtime\")[\"default\"];\nmodule.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {\n  this.compilerInfo = [4,\'>= 1.0.0\'];\nhelpers = this.merge(helpers, Handlebars.helpers); data = data || {};\n  \n\n\n  return \"todo\\n\";\n  });\n});\n');
        done();
      });
    });

  });

  describe('dist', function() {

    it('proxy dist', function(done) {
      request('http://localhost:'+port+'/assets/serve-spm-test/0.1.0/index.js', function(err, res, body1) {
        request('http://localhost:'+port+'/index.js', function(err, res, body2) {
          body1.should.be.eql(body2);
          done();
        });
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

    it('default index.html or index.htm', function(done) {
      request('http://localhost:'+port+'/', function(err, res, body1) {
        request('http://localhost:'+port+'/index.html', function(err, res, body2) {
          body1.should.be.eql(body2);
          done();
        });
      });
    });

  });

});
