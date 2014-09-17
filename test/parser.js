var fs = require('fs');
var join = require('path').join;
var extend = require('extend');
var touch = require('touch');
var util = require('../util');
var Parser = require('../parser');
var moduleDir = require('spmrc').get('install.path');

describe('parser', function() {

  var root = join(__dirname, 'fixtures/parser');
  var args = {
    pkg: util.getPkg(root),
    root: root
  };

  it('normal', function() {
    var p = new Parser(extend(args, {
      req: {pathname: '/index.js'}
    }));
    p.name.should.be.equal('a');
    p.version.should.be.equal('0.1.0');
    p.file.should.be.endWith('/index.js');
    (p.noWrap === undefined).should.be.true;
  });

  it('search include nowrap', function() {
    var p = new Parser(extend(args, {
      req: {pathname: '/index.js', search:'nowrap&foo=bar'}
    }));
    p.file.should.be.endWith('/index.js');
    p.noWrap.should.be.true;
  });

  it('request dep package', function() {
    var p;

    p = new Parser(extend(args, {
      req: {pathname: '/b/0.1.0/index.js'}
    }));
    p.name.should.be.equal('a');
    p.version.should.be.equal('0.1.0');
    p.pkg.name.should.be.equal('b');
    p.pkg.version.should.be.equal('0.1.0');
    p.file.should.be.endWith('/b/0.1.0/index.js');

    p = new Parser(extend(args, {
      req: {pathname: '/b/invalid.version/index.js'}
    }));
    (p.pkg.father === undefined).should.be.true;

    // invalid version
    p = new Parser(extend(args, {
      req: {pathname: '/spm2/a/0.1.0/a.js'}
    }));
    (p.file === undefined).should.be.true;

    // tpl in dep pkg
    p = new Parser(extend(args, {
      req: {pathname: '/b/0.1.0/b.tpl.js'}
    }));
    p.pkg.name.should.be.equal('b');
    p.pkg.version.should.be.equal('0.1.0');
    p.file.should.be.endWith('/b/0.1.0/b.tpl');
  });

  it('getFile', function() {
    var p;

    p = new Parser(extend(args, {
      req: {pathname: '/htm/'}
    }));
    p.file.should.be.endWith('/htm/index.htm');

    p = new Parser(extend(args, {
      req: {pathname: '/html/'}
    }));
    p.file.should.be.endWith('/html/index.html');

    p = new Parser(extend(args, {
      req: {pathname: '/'}
    }));
    p.isDir.should.be.true;

    p = new Parser(extend(args, {
      req: {pathname: '/dist/a/0.1.0/index.js'}
    }));
    p.file.should.be.endWith('/index.js');
    p.file.should.not.be.endWith('/dist/a/0.1.0/index.js');

    p = new Parser(extend(args, {
      req: {pathname: '/dist/a/0.1.0/404.js'}
    }));
    (p.file === undefined).should.be.true;

    p = new Parser(extend(args, {
      req: {pathname: '/a/b/c/index.js'},
      paths: [
        ['/a/b/c', '']
      ]
    }));
    p.file.should.be.endWith('/index.js');
    p.file.should.not.be.endWith('/a/b/c/index.js');

    p = new Parser(extend(args, {
      req: {pathname: '/a/0.1.0/index.js'}
    }));
    p.file.should.be.endWith('/index.js');
    p.file.should.not.be.endWith('/dist/a/0.1.0/index.js');

    p = new Parser(extend(args, {
      req: {pathname: '/a/0.1.0/404.js'}
    }));
    (p.file === undefined).should.be.true;

    p = new Parser(extend(args, {
      req: {pathname: '/b/0.1.0/index.js'}
    }));
    p.file.should.be.endWith('/'+moduleDir+'/b/0.1.0/index.js');

    p = new Parser(extend(args, {
      req: {pathname: '/d/0.1.0/index.js'}
    }));
    p.file.should.be.endWith('/sea-modules/d/0.1.0/index.js');

    p = new Parser(extend(args, {
      req: {pathname: '/b/0.1.0/404.js'}
    }));
    (p.file === undefined).should.be.true;

    p = new Parser(extend(args, {
      req: {pathname: '/c/0.1.0/index.js'}
    }));
    p.file.should.be.endWith('/dist/c/0.1.0/index.js');

    p = new Parser(extend(args, {
      req: {pathname: '/handlebars-runtime.js'}
    }));
    p.file.should.be.endWith('/handlebars.runtime.js');
    p.handlebarId = 'handlebars-runtime';
    p.noWrap.should.be.true;

    p = new Parser(extend(args, {
      req: {pathname: '/dist/cjs/handlebars.runtime.js'}
    }));
    p.file.should.be.endWith('/handlebars.runtime.js');
    p.handlebarId = 'dist/cjs/handlebars.runtime';
    p.noWrap.should.be.true;

    p = new Parser(extend(args, {
      req: {pathname: '/a.css.js'}
    }));
    p.file.should.be.endWith('/a.css');

    p = new Parser(extend(args, {
      req: {pathname: '/b.js'}
    }));
    p.file.should.be.endWith('/b.coffee');

    p = new Parser(extend(args, {
      req: {pathname: '/c.css'}
    }));
    p.file.should.be.endWith('/c.less');

    p = new Parser(extend(args, {
      req: {pathname: '/d.css'}
    }));
    p.file.should.be.endWith('/d.scss');

    p = new Parser(extend(args, {
      req: {pathname: '/e.css'}
    }));
    p.file.should.be.endWith('/e.sass');

    p = new Parser(extend(args, {
      req: {pathname: '/f.css'}
    }));
    p.file.should.be.endWith('/f.styl');

    p = new Parser(extend(args, {
      req: {pathname: '/g.css'}
    }));
    (p.file === undefined).should.be.true;

    p = new Parser(extend(args, {
      req: {pathname: '/precompiler/a.js'}
    }));
    p.file.should.be.endWith('/precompiler/a.coffee');

    p = new Parser(extend(args, {
      req: {pathname: '/precompiler/b.css'}
    }));
    p.file.should.be.endWith('/precompiler/b.less');
  });

  it('isModified', function() {
    var file = join(root, 'index.js');
    var ltime = mtime(file);
    var p;

    p = new Parser(extend(args, {
      req: {pathname: '/index.js'},
      headers: {
        'if-modified-since': ltime
      }
    }));
    p.isModified().should.be.false;

    touch.sync(file);
    p = new Parser(extend(args, {
      req: {pathname: '/index.js'},
      headers: {
        'if-modified-since': ltime
      }
    }));
    p.isModified().should.be.true;

    function mtime(filepath) {
      return new Date(fs.statSync(filepath).mtime);
    }
  });

  it('isStandalone', function() {
    var p;

    p = new Parser(extend(args, {
      req: {pathname: '/index.js'}
    }));
    p.isStandalone('/path/to/index.js').should.be.false;

    args.pkg.origin.spm.buildArgs = '--include standalone';
    p = new Parser(extend(args, {
      req: {pathname: '/index.js'}
    }));
    p.isStandalone(join(root, 'index.css')).should.be.false;
    p.isStandalone(join(root, 'index.js')).should.be.true;
    p.isStandalone(join(root, 'notfound.js')).should.be.false;

    args.pkg.origin.spm.buildArgs = '--include umd';
    p = new Parser(extend(args, {
      req: {pathname: '/index.js'}
    }));
    p.isStandalone(join(root, 'index.css')).should.be.false;
    p.isStandalone(join(root, 'index.js')).should.be.true;
    p.isStandalone(join(root, 'notfound.js')).should.be.false;
  });
});

describe('parser for sea-modules', function() {

  var root = join(__dirname, 'fixtures/parser_seamodules');
  var args = {
    pkg: util.getPkg(root),
    root: root
  };

  it('normal', function() {
    var p = new Parser(extend(args, {
      req: {pathname: '/index.js'}
    }));
    p.name.should.be.equal('a');
    p.version.should.be.equal('0.1.0');
    p.file.should.be.endWith('/index.js');
  });
});
