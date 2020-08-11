import TerminalStream from 'terminal-stream'
import utf8 from 'utf8-transcoder'

var a = new TerminalStream()
a.addEventListener('message', evt => {
  var message = JSON.parse(utf8.decode(evt.detail))
  console.log('a got:', message.name)
})

var b = new TerminalStream()
b.addEventListener('message', evt => {
  var message = JSON.parse(utf8.decode(evt.detail))
  console.log('b got:', message.name)

  if (message.name === 'hello') {
    b.send(utf8.encode(JSON.stringify({ name: 'world' })))
  }
})

a._send = message => {
  for (var i = 0; i < message.length; i++) {
    b.receive(message.subarray(i, i + 1))
  }
}

b._send = message => {
  for (var i = 0; i < message.length; i++) {
    a.receive(message.subarray(i, i + 1))
  }
}

a.send(utf8.encode(JSON.stringify({ name: 'hello' })))
// b got: hello
// a got: world
