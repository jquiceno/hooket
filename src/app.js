'use strict'

const { Server } = require('.')

async function init () {
  try {
    const server = await Server.start()
    server.log('info', `Hooket server start in port: ${server.info.port}`)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

process.on('unhandledRejection', error => {
  console.error('UnhandledRejection', error.message, error)
})

process.on('unhandledException', error => {
  console.error('unhandledException', error.message, error)
})

init()
