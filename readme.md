# terminal-stream
A stream for use at the terminals of circular pipelines.

## Why
Implementing streaming RPC interfaces can be a bit of a pain. Duplexifying length-prefixed-stream's encoder and decoder or piping them into another transform just feels like too much work / code!

## How
Messages are sent from a terminal stream prefixed with a 32bit unsigned integer indicating their byte-length. As bits and pieces of the message reach the next terminal stream in the pipeline, they are buffered into memory until the entire content is available. Once reassembled, instead of being pushing into the read buffer, the message is emitted as an event and / or passed to the convenience handler.

## Example
``` javascript
var ts = require('terminal-stream')
var thru = require('through2')

var a = ts(function (message) {
  message = JSON.parse(message)
  console.log('a got:', message.name)
})

var b = ts(function (message) {
  message = JSON.parse(message)
  console.log('b got:', message.name)

  if (message.name === 'hello') {
    b.send(JSON.stringify({ name: 'world' }))
  }
})

var chunkedTransport1 = mkchunked()
var chunkedTransport2 = mkchunked()

function mkchunked () {
  return thru(function (c, e, cb) {
    for (var i = 0; i < c.length; i++) {
      this.push(c.slice(i, i + 1))
    }
    cb()
  })
}

a
  .pipe(chunkedTransport1)
  .pipe(b)
  .pipe(chunkedTransport2)
  .pipe(a)

a.send(JSON.stringify({ name: 'hello' }))
// b got: hello
// a got: world
```

## Prior art
* [message-stream](https://www.npmjs.com/package/message-stream)
* [length-prefixed-stream](https://www.npmjs.com/package/length-prefixed-stream)

## License
WTFPL
