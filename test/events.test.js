'use strict'

const test = require('ava')
const Server = require('..')
const Cli = require('hooket-cli')
const Io = require('socket.io-client')
const request = require('request-promise')
const uuid = require('uuid/v4')
const Moment = require('moment')
const Hapi = require('@hapi/hapi')

test.before(async t => {
  const { info } = await Server.start()

  t.context.cli = new Cli({
    url: info.uri,
    fullResponse: true
  })

  t.context.serverInfo = info
})

test('Socket connect', async t => {
  const serverUri = t.context.serverInfo.uri
  const socket = Io(serverUri)

  const connected = await new Promise((resolve, reject) => {
    socket.on('connect', (e) => {
      resolve(true)
    })
  })

  t.deepEqual(socket.io.uri, serverUri)
  t.true(connected)
})

test('Push socket event message', async t => {
  const { serverInfo, cli } = t.context
  const serverUri = serverInfo.uri
  const eventName = `event.${uuid()}`

  await cli.add({
    event: eventName
  })

  const socket = Io(serverUri)

  return new Promise((resolve, reject) => {
    socket.on(eventName, (data) => {
      t.is(typeof data, 'object')
      t.deepEqual(data.uri, serverUri)
      t.deepEqual(data.port, serverInfo.port)
      resolve(data)
    })

    cli.emit(eventName, serverInfo)
  })
})

test('Add new event', async t => {
  const { cli } = t.context
  const eventName = `event.${uuid()}`
  const date = Moment().date()

  const eventData = {
    event: eventName
  }

  const res = await cli.add(eventData)

  t.deepEqual(res.statusCode, 201)
  t.is(typeof res.data, 'object')
  t.deepEqual(res.data.event, eventName)
  t.true(res.data.created > date)
})

test('Get All events', async t => {
  const { cli, serverInfo } = t.context
  const serverUri = serverInfo.uri
  const eventName = `event.${uuid()}`

  await cli.add({
    event: eventName
  })

  const res = await request({
    uri: `${serverUri}/events`,
    method: 'GET',
    json: true
  })

  t.deepEqual(res.statusCode, 200)
  t.is(typeof res.data, 'object')
  t.true(res.data.length > 0)
  t.true(res.data.filter(e => e.event === eventName).length > 0)
})

test('Get event by id', async t => {
  const { cli, serverInfo } = t.context
  const serverUri = serverInfo.uri
  const eventName = `event.${uuid()}`

  let res = await await cli.add({
    event: eventName
  })

  const newEvent = res.data

  res = await request({
    uri: `${serverUri}/events/${newEvent.id}`,
    method: 'GET',
    json: true
  })

  t.deepEqual(res.statusCode, 200)
  t.is(typeof res.data, 'object')
  t.deepEqual(res.data.id, newEvent.id)
})

test('Get event by eventName', async t => {
  const { cli, serverInfo } = t.context
  const serverUri = serverInfo.uri
  const eventName = `event.${uuid()}`

  let res = await cli.add({
    event: eventName
  })

  const newEvent = res.data

  res = await request({
    uri: `${serverUri}/events/${newEvent.event}`,
    method: 'GET',
    json: true
  })

  t.deepEqual(res.statusCode, 200)
  t.is(typeof res.data, 'object')
  t.deepEqual(res.data.id, newEvent.id)
  t.deepEqual(res.data.event, newEvent.event)
})

test('Remove event by id', async t => {
  const { cli, serverInfo } = t.context
  const serverUri = serverInfo.uri
  const eventName = `event.${uuid()}`

  let res = await cli.add({
    event: eventName
  })

  const newEvent = res.data

  res = await request({
    uri: `${serverUri}/events/${newEvent.id}`,
    method: 'DELETE',
    json: true
  })

  t.deepEqual(res.statusCode, 200)
  t.is(typeof res.data, 'object')
  t.deepEqual(res.data.id, newEvent.id)
  t.deepEqual(res.data.event, newEvent.event)
})

test('Request webHooks', async t => {
  const { cli } = t.context
  const eventName = `event.${uuid()}`
  const message = 'this message'
  const server = Hapi.server()

  server.route({
    path: '/',
    method: 'POST',
    handler ({ payload }, h) {
      t.deepEqual(payload.message, message)

      return h.response({
        ok: true
      }).code(200)
    }
  })

  await server.start()

  await cli.add({
    event: eventName,
    webHooks: [
      server.info.uri
    ]
  })

  await cli.emit(eventName, message)
})
