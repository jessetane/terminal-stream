module.exports = TerminalStream

var TransformStream = require('readable-stream/transform')
var inherits = require('inherits')

var length = Buffer(4)

inherits(TerminalStream, TransformStream)

function TerminalStream (onmessage) {
  if (!(this instanceof TerminalStream)) {
    return new TerminalStream(onmessage)
  }

  this.onmessage = onmessage
  this._awaiting = 0

  TransformStream.call(this)
}

TerminalStream.prototype._transform = function (buffer, enc, cb) {
  this._buffer = this._buffer && this._buffer.length ? Buffer.concat([ this._buffer, buffer ]) : buffer

  while (this._buffer.length >= this._awaiting) {
    this._handleMessage()
  }

  cb()
}

TerminalStream.prototype._handleMessage = function () {
  if (!this._awaitingKnown) {
    if (this._buffer.length < 4) {
      this._awaiting = 4
      return
    }

    this._awaitingKnown = true
    this._awaiting = this._buffer.readUIntLE(0, 4)
    this._buffer = this._buffer.slice(4)
  }

  if (this._buffer.length >= this._awaiting) {
    var message = this._buffer.slice(0, this._awaiting)
    this.emit('message', message)
    this.onmessage && this.onmessage(message)
    this._buffer = this._buffer.slice(this._awaiting)
    this._awaitingKnown = false
    this._awaiting = 0
  }
}

TerminalStream.prototype.send = function (buffer, enc) {
  buffer = Buffer.isBuffer(buffer) ? buffer : Buffer(buffer, enc)
  length.writeUIntLE(buffer.length, 0, 4)
  this.push(Buffer.concat([ length, buffer ]))
}
