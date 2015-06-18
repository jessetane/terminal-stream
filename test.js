var tape = require('tape')
var through = require('through2')
var concat = require('concat-stream')
var ts = require('./')

var chunk = function (ultra) {
  return through(function (data, enc, cb) {
    while (data.length) {
      var chunk = data.slice(0, ultra ? 1 : 1 + ((Math.random() * data.length) | 0))
      this.push(chunk)
      data = data.slice(chunk.length)
    }
    cb()
  })
}

tape('encode -> decode', function (t) {
  var e = ts()
  var d = ts()

  d.on('message', function (data) {
    t.same(data.toString(), 'hello world')
    t.end()
  })

  e.send('hello world')
  e.pipe(d)
})

tape('buffered encode -> buffered decode', function (t) {
  var e = ts()
  var d = ts()

  d.on('message', function (data) {
    t.same(data.toString(), 'hello world')
    t.end()
  })

  e.send('hello world')
  e.end()

  e.pipe(concat(function (data) {
    d.end(data)
  }))
})

tape('encode -> decode twice', function (t) {
  t.plan(2)

  var e = ts()
  var d = ts()

  var expects = ['hello world', 'hola mundo']

  d.on('message', function (data) {
    t.same(data.toString(), expects.shift())
  })

  e.send('hello world')
  e.send('hola mundo')
  e.pipe(d)
})

tape('encode -> decode storm', function (t) {
  t.plan(50)

  var e = ts()
  var d = ts()
  var expects = []

  for (var i = 0; i < 50; i++) {
    expects.push(new Buffer(50))
  }

  d.on('message', function (data) {
    t.same(data, expects.shift())
  })

  expects.forEach(function (b) {
    e.send(b)
  })

  e.pipe(d)
})

tape('chunked encode -> decode', function (t) {
  var e = ts()
  var d = ts()

  d.on('message', function (data) {
    t.same(data.toString(), 'hello world')
    t.end()
  })

  e.send('hello world')
  e.pipe(chunk()).pipe(d)
})

tape('chunked encode -> decode twice', function (t) {
  t.plan(2)

  var e = ts()
  var d = ts()

  var expects = ['hello world', 'hola mundo']

  d.on('message', function (data) {
    t.same(data.toString(), expects.shift())
  })

  e.send('hello world')
  e.send('hola mundo')
  e.pipe(chunk()).pipe(d)
})

tape('chunked encode -> decode storm', function (t) {
  t.plan(50)

  var e = ts()
  var d = ts()
  var expects = []

  for (var i = 0; i < 50; i++) {
    expects.push(new Buffer(50))
  }

  d.on('message', function (data) {
    t.same(data, expects.shift())
  })

  expects.forEach(function (b) {
    e.send(b)
  })

  e.pipe(chunk()).pipe(d)
})

tape('ultra chunked encode -> decode', function (t) {
  var e = ts()
  var d = ts()

  d.on('message', function (data) {
    t.same(data.toString(), 'hello world')
    t.end()
  })

  e.send('hello world')
  e.pipe(chunk(true)).pipe(d)
})

tape('ultra chunked encode -> decode twice', function (t) {
  t.plan(2)

  var e = ts()
  var d = ts()

  var expects = ['hello world', 'hola mundo']

  d.on('message', function (data) {
    t.same(data.toString(), expects.shift())
  })

  e.send('hello world')
  e.send('hola mundo')
  e.pipe(chunk(true)).pipe(d)
})

tape('ultra chunked encode -> decode storm', function (t) {
  t.plan(50)

  var e = ts()
  var d = ts()
  var expects = []

  for (var i = 0; i < 50; i++) {
    expects.push(new Buffer(50))
  }

  d.on('message', function (data) {
    t.same(data, expects.shift())
  })

  expects.forEach(function (b) {
    e.send(b)
  })

  e.pipe(chunk(true)).pipe(d)
})
