'use strict'

const test = require('ava')
const Server = require('..')
const Cli = require('hooket-cli')
const Io = require('socket.io-client')
const request = require('request-promise')
const uuid = require('uuid/v4')
const Moment = require('moment')
const S = require('servfi')
const delay = require('delay')

let cli = null

test.before(async t => {
  const server = await Server.start()

  cli = new Cli({
    url: server.info.uri,
    fullResponse: true
  })

  t.context.serverInfo = server.info
})

test('Socket connect', async t => {
  const serverUri = t.context.serverInfo.uri
  const socket = Io(serverUri)

  const connected = await new Promise((resolve, reject) => {
    socket.on('connect', () => {
      resolve(true)
    })
  })

  t.deepEqual(socket.io.uri, serverUri)
  t.true(connected)
})

test('Push socket event message', async t => {
  const serverInfo = t.context.serverInfo
  const serverUri = serverInfo.uri
  const eventName = `event.${uuid()}`

  await cli.add({
    event: eventName
  })

  const socket = Io(serverUri)

  const res = await cli.emit(eventName, serverInfo)

  const socketEvent = await new Promise((resolve, reject) => {
    socket.on(eventName, (data) => {
      resolve(data)
    })
  })

  t.deepEqual(res.statusCode, 200)
  t.is(typeof res.data, 'object')
  t.is(typeof socketEvent, 'object')
  t.deepEqual(res.data.eventId, eventName)
  t.deepEqual(res.data.body.uri, serverUri)
  t.deepEqual(socketEvent.uri, serverUri)
  t.deepEqual(socketEvent.port, serverInfo.port)
})

test('Add new event', async t => {
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
  const serverUri = t.context.serverInfo.uri
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
  const serverUri = t.context.serverInfo.uri
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
  const serverUri = t.context.serverInfo.uri
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
  const serverUri = t.context.serverInfo.uri
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
  const message = 'this message'
  const server = await S.start({
    routes: [{
      path: '/',
      method: 'POST',
      handler (request, h) {
        const data = request.payload

        t.deepEqual(data.message, message)

        return h.response({
          ok: true
        }).code(200)
      }
    }]
  })

  const serverUri = t.context.serverInfo.uri
  const eventName = `event.${uuid()}`

  let res = await cli.add({
    event: eventName,
    webHooks: [
      server.uri
    ]
  })

  t.deepEqual(res.data.event, eventName)
  t.is(typeof res.data.webHooks, 'object')
  t.deepEqual(res.data.webHooks[0], server.uri)
  t.deepEqual(res.statusCode, 201)

  res = await request({
    uri: `${serverUri}/${res.data.id}`,
    method: 'POST',
    json: true,
    body: {
      message
    }
  })

  await delay(5000)

  t.deepEqual(res.statusCode, 200)
  t.deepEqual(res.data.body.message, message)
})
