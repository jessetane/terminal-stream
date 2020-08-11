import EventTarget from 'xevents/event-target.js'
import CustomEvent from 'xevents/custom-event.js'

const headerSize = 4
const header = new Uint8Array(headerSize)

class TerminalStream extends EventTarget {
  constructor () {
    super()
    this.buffer = null
    this.awaiting = 0
    this.position = 0
    this.state = 0
  }

  send (data) {
    var messageSize = data.length
    var message = new Uint8Array(headerSize + messageSize)
    new DataView(message.buffer).setUint32(0, messageSize, true)
    message.set(data, headerSize)
    this._send(message)
  }

  receive (data) {
    var dataSize = data ? data.length : 0
    if (this.state === 0) {
      // initial state
      if (dataSize === 0) {
        throw new Error('data size must be nonzero during initial state')
      }
      this.state = 1
      if (dataSize < headerSize) {
        // we don't have enough data to parse the header, so buffer and wait for more data 
        this.buffer = new Uint8Array(headerSize)
        this.buffer.set(data)
        this.awaiting = headerSize - dataSize
        this.position = dataSize
      } else {
        // we have enough data to read the header, but instead of parsing it, just buffer and recurse
        this.buffer = data.subarray(0, headerSize)
        data = dataSize === headerSize ? null : data.subarray(headerSize)
        this.receive(data)
      }
    } else {
      if (dataSize >= this.awaiting) {
        // we have enough data to process either a header or a message
        if (this.awaiting) {
          if (dataSize > this.awaiting) {
            this.buffer.set(data.subarray(0, this.awaiting), this.position)
            data = data.subarray(this.awaiting)
          } else {
            this.buffer.set(data, this.position)
            data = null
          }
        }
        if (this.state === 1) {
          // we were waiting to complete a header
          this.awaiting = new DataView(this.buffer.buffer).getUint32(0, true)
          this.buffer = new Uint8Array(this.awaiting)
          this.position = 0
          this.state = 2
          if (data) {
            this.receive(data)
          }
        } else if (this.state === 2) {
          // we were waiting for more data
          this.dispatchEvent(new CustomEvent('message', { detail: this.buffer }))
          this.buffer = null
          this.awaiting = this.position = this.state = 0
          if (data) {
            this.receive(data)
          } 
        } else {
          throw new Error('unknown state: ' + this.state)
        }
      } else {
        // just buffer and wait for more
        this.buffer.set(data, this.position)
        this.awaiting -= dataSize
        this.position += dataSize
      }
    }
  }
}

export default TerminalStream
