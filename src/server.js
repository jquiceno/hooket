'use strict'

const Io = require('socket.io')
const { server: Server } = require('servfi')
const routes = require('./routes')

async function start ({ port = null } = {}) {
  port = process.env.PORT || process.env.TALKLY_PORT || port

  const server = Server({
    port
  })

  const io = Io(server.listener)

  await server.route(routes(io))

  await server.start()

  console.log(`Talkly server start in port: ${server.info.port}`)

  // io.origins((origin, fn) => {
  //   // console.log(origin)
  //   return fn(null, true)
  //   // if (['hola.com'].indexOf(origin) > -1) {
  //   //   return fn(null, true)
  //   // }

  //   // return fn('origin not allowed', false)
  // })

  // io.set('authorization', (IncomingMessage) => {
  //   console.log(IncomingMessage.socket)
  // })

  // io.use((socket, next) => {
  //   console.log(socket.handshake)
  //   return next()
  //   // next(new Error('Not a doge error'))
  // })

  // io.on('connection', (sk) => {
  //   sk.on('disconnecting', (sk) => {
  //     console.log(`Disconnected!`)
  //   })
  // })

  return server
}

module.exports = {
  start
}
