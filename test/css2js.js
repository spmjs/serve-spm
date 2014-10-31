var gutil = require('gulp-util');
var css2jsParser = require('../lib/parser/css2js');
var util = require('../lib/util');

describe('css2js', function() {

  it('normal', function(done) {

    var origin = '' +
      'h1{color:red;};' +
      '';
    var expected = util.define('' +
      'seajs.importStyle(\'h1{color:red;};\');' +
      '');

    var stream = css2jsParser();
    stream.on('data', function(newFile) {
      String(newFile.contents).should.be.equal(expected);
      done();
    });
    stream.write(new gutil.File({
      contents: new Buffer(origin)
    }));

  });
});
