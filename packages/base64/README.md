## Base64 Module

Functions for encoding and decoding base64. Adapted for use in a CommonJS
environment from http://www.webtoolkit.info/javascript-base64.html


### Usage

```javascript
var base64 = require('base64');

base64.encode('foo'); // returns "Zm9v"
base64.decode('Zm9v'); // returns "foo"
```


### API

#### base64.encode(value)

Encodes a string as base64, returning the result.

#### base64.decode(value)

Decodes a base64 encoded string, returning the result.
