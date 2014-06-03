# Serve SPM

## Usage

```javascript
var express = require('express');
var serveSPM = require('serve-spm');

var app = express();

app.use(serveSPM('public'));
app.listen();
```

## LICENSE

The MIT License (MIT)
