# Serve SPM

[![NPM version](https://img.shields.io/npm/v/serve-spm.svg?style=flat)](https://npmjs.org/package/serve-spm)
[![Build Status](https://img.shields.io/travis/spmjs/serve-spm.svg?style=flat)](https://travis-ci.org/spmjs/serve-spm)
[![Coverage Status](https://img.shields.io/coveralls/spmjs/serve-spm.svg?style=flat)](https://coveralls.io/r/spmjs/serve-spm)
[![NPM downloads](http://img.shields.io/npm/dm/serve-spm.svg?style=flat)](https://npmjs.org/package/serve-spm)

Middleware for spm debug, support connect, express and koa.

## Usage

with express:

```javascript
var serveSPM = require('serve-spm');
require('express')().use(serveSPM(pkgRoot, {
  log: true
}));
```

with koa:

```javascript
var serveSPM = require('serve-spm').koa;
require('koa')().use(serveSPM(pkgRoot, {
  log: true
}));
```

## Options

### log

Enable log for requests, default `false`.

### paths

Map pathname for debug. e.g. `paths: [['/a/b/c/', '']]`

## LICENSE

Copyright (c) 2014 sorrycc. Licensed under the MIT license.
