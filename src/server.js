'use strict'

const { Server: IoServer } = require('socket.io')
const Hapi = require('@hapi/hapi')
const routes = require('./routes')

async function start ({ port = null } = {}) {
  port = process.env.PORT || process.env.HOOKET_PORT || port

  const server = Hapi.server({
    port,
    routes: {
      cors: {
        origin: ['*']
      }
    }
  })

  const io = new IoServer(server.listener, {
    cors: {
      origin: '*'
    }
  })

  await server.route(routes(io))

  await server.start()

  io.on('connection', (socket) => {
    console.log('connected', socket.id)
  })

  console.log(`Hooket server start in port: ${server.info.port}`)

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
