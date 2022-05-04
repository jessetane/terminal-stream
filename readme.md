# terminal-stream
A message oriented wrapper for stream oriented transports.

## Why
Implementing something like RPC over a streaming transport (e.g. TCP) requires an intermediate mechanism to ensure only complete messages are delivered to the application, even though messages may be combined or fragmented in unpredictable ways.

## How
Messages sent from a terminal stream are prefixed with a 32bit unsigned integer indicating the number of bytes they contain (accordingly the maximum message size is 2^32 bits or 4GB). As pieces of the message reach the next terminal stream in the pipeline, they are buffered into memory until the entire content is available, at which point a `message` event is dispatched with its `data` property set to the content. Note that a terminal stream will only work with an ordered underlying transport.

## Example
``` javascript
import TerminalStream from 'terminal-stream'
import utf8 from 'utf8-transcoder'

var a = new TerminalStream()
a.addEventListener('message', evt => {
  var message = JSON.parse(utf8.decode(evt.data))
  console.log('a got:', message.name)
})

var b = new TerminalStream()
b.addEventListener('message', evt => {
  var message = JSON.parse(utf8.decode(evt.data))
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
```
``` shell
$ npm run example
$ npm run example-browser
```

## Constructor
#### `var t = new TerminalStream()`

## Methods
#### `t.send(message)`
#### `t._send(data)`
Users must implement this with their transport of choice.
#### `t.receive(data)`
Users must pass data to this method from their transport of choice.

## Events
#### `t.dispatchEvent(new Event('message'))`
Find message data on the `data` property of the event.

## Test
``` shell
$ npm test
$ npm test-browser
```

## Prior art
* [length-prefixed-stream](https://www.npmjs.com/package/length-prefixed-stream)
* [message-stream](https://www.npmjs.com/package/message-stream)

## License
MIT
