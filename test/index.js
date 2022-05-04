import TerminalStream from 'terminal-stream'
import test from 'tap-esm'
import utf8 from 'utf8-transcoder'

var a = new TerminalStream()
var b = new TerminalStream()

test('decode single packet message', t => {
  t.plan(1)
  var expected = 'hello world'
  var message = utf8.encode(expected)
  function onmessage (evt) {
    b.removeEventListener('message', onmessage)
    var actual = utf8.decode(evt.data)
    t.equal(actual, expected)
  }
  b.addEventListener('message', onmessage)
  a._send = b.receive.bind(b)
  a.send(message)
})

test('decode two messages contained within a single packet', t => {
  t.plan(1)
  var expected = ['hello', 'world!']
  var actual = []
  var i = 0
  function onmessage (evt) {
    actual.push(utf8.decode(evt.data))
    if (++i === 2) {
      b.removeEventListener('message', onmessage)
      t.arrayEqual(actual, expected)
    }
  }
  b.addEventListener('message', onmessage)
  var n = 0
  var buffer = []
  a._send = data => {
    buffer.push(data)
    if (++n === 2) {
      data = new Uint8Array(buffer[0].length + buffer[1].length)
      data.set(buffer[0])
      data.set(buffer[1], buffer[0].length)
      b.receive(data)
    }
  }
  a.send(utf8.encode(expected[0]))
  a.send(utf8.encode(expected[1]))
})

test('decode two messages contained within two packets, where ~1.5 messages are in the first packet and the remaining ~0.5 are in the second packet', t => {
  t.plan(1)
  var expected = ['hello', 'world!']
  var actual = []
  var i = 0
  function onmessage (evt) {
    actual.push(utf8.decode(evt.data))
    if (++i === 2) {
      b.removeEventListener('message', onmessage)
      t.arrayEqual(actual, expected)
    }
  }
  b.addEventListener('message', onmessage)
  var n = 0
  var buffer = []
  a._send = data => {
    buffer.push(data)
    if (++n === 2) {
      var m1 = buffer[0].length
      var m2 = buffer[1].length
      var m3 = Math.floor(m2 / 2)
      data = new Uint8Array(m1 + m3)
      data.set(buffer[0])
      data.set(buffer[1].subarray(0, m3), m1)
      b.receive(data)
      data = new Uint8Array(m2 - m3)
      data.set(buffer[1].subarray(m3))
      b.receive(data)
    }
  }
  a.send(utf8.encode(expected[0]))
  a.send(utf8.encode(expected[1]))
})

test('decode multi-packet message with packet size > header size', t => {
  t.plan(1)
  var expected = 'hello world'
  var message = utf8.encode(expected)
  function onmessage (evt) {
    b.removeEventListener('message', onmessage)
    var actual = utf8.decode(evt.data)
    t.equal(actual, expected)
  }
  b.addEventListener('message', onmessage)
  a._send = message => {
    b.receive(message.subarray(0, 6))
    b.receive(message.subarray(6))
  }
  a.send(message)
})

test('decode multi-packet message with packet size === header size', t => {
  t.plan(1)
  var expected = 'hello world'
  var message = utf8.encode(expected)
  function onmessage (evt) {
    b.removeEventListener('message', onmessage)
    var actual = utf8.decode(evt.data)
    t.equal(actual, expected)
  }
  b.addEventListener('message', onmessage)
  a._send = message => {
    b.receive(message.subarray(0, 4))
    b.receive(message.subarray(4))
  }
  a.send(message)
})

test('decode multi-packet message with packet size < header size', t => {
  t.plan(1)
  var expected = 'hello world'
  var message = utf8.encode(expected)
  function onmessage (evt) {
    b.removeEventListener('message', onmessage)
    var actual = utf8.decode(evt.data)
    t.equal(actual, expected)
  }
  b.addEventListener('message', onmessage)
  a._send = message => {
    for (var i = 0; i < message.length; i++) {
      b.receive(message.subarray(i, i + 1))
    }
  }
  a.send(message)
})
