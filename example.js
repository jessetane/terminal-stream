var ts = require('./')
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
