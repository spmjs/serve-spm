# Serve SPM

[![Build Status](https://travis-ci.org/spmjs/serve-spm.png)](https://travis-ci.org/spmjs/serve-spm)
[![Coverage Status](https://coveralls.io/repos/spmjs/serve-spm/badge.png?branch=master)](https://coveralls.io/r/spmjs/serve-spm?branch=master)

spm@3x middleware.

## Usage

```javascript
var express = require('express');
var serveSPM = require('serve-spm');
var join = require('path').join;

var app = express();
app.use(serveSPM(join(__dirname, 'public'), {
  log: true
}));
```

## LICENSE

The MIT License (MIT)
