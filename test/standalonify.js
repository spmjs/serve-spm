var join = require('path').join;
var fs = require('fs');
var gutil = require('gulp-util');
var standalonifyParser = require('../lib/parser/standalonify');
var util = require('../lib/util');

describe('standalonify', function() {

  it('normal', function(done) {

    var origin = 'alert(1);';
    var sea = fs.readFileSync(join(__dirname, '../sea.js'), 'utf-8');
    var expected = sea + '\n/* Config Base */\nseajs.config({base:\'/\'});\n\nalert(1);\n\n/*! Sea.js Init */\nseajs.use(\'/a\');\n';

    var stream = standalonifyParser('/a');
    stream.on('data', function(newFile) {
      String(newFile.contents).should.be.equal(expected);
      done();
    });
    stream.write(new gutil.File({
      contents: new Buffer(origin)
    }));

  });
});
