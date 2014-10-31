var gutil = require('gulp-util');
var jsonParser = require('../lib/parser/json');
var util = require('../lib/util');

describe('json', function() {

  it('normal', function(done) {

    var origin = '{"a":1}';
    var expected = util.define('module.exports = ' +
      '{"a":1};');

    var stream = jsonParser();
    stream.on('data', function(newFile) {
      String(newFile.contents).should.be.equal(expected);
      done();
    });
    stream.write(new gutil.File({
      contents: new Buffer(origin)
    }));

  });
});
