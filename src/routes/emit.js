'use strict'

module.exports = (io, eventId, data) => {
  return io.sockets.emit(eventId, data)
}
