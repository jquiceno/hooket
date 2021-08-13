'use strict'

const { Server: IoServer } = require('socket.io')
const Hapi = require('@hapi/hapi')
const routes = require('./routes')
const laabr = require('laabr')
const Event = require('./lib/event')
const { config } = require('getfig')

const { PORT, HOOKET_PORT } = config.get('env')

async function start ({ port = PORT || HOOKET_PORT } = {}) {
  const server = Hapi.server({
    port,
    routes: {
      cors: {
        origin: ['*']
      }
    },
    router: {
      stripTrailingSlash: true
    }
  })

  await server.register([laabr])

  server.decorate('toolkit', 'success', function (data) {
    const { method } = this.request
    const statusCode = (method === 'post') ? 201 : 200

    return this.response({
      data,
      statusCode
    }).code(statusCode)
  })

  const io = new IoServer(server.listener, {
    cors: {
      origin: '*',
      credentials: true
    }
  })

  io.on('connection', (socket) => {
    server.log('info', `connected socket ${socket.id}`)
  })

  await server.route(routes(io, Event))

  await server.start()

  return server

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
}

module.exports = {
  start
}
