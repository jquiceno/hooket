'use strict'

const Event = require('../lib/event')
const Boom = require('@hapi/boom')
const request = require('request')

module.exports = io => [{
  path: '/events/{eventId}',
  method: 'GET',
  async handler (req, h) {
    let res = {}
    const eventId = req.params.eventId

    try {
      const event = new Event(eventId)
      const eventData = await event.get()

      res = {
        data: eventData,
        statusCode: 200
      }
    } catch (e) {
      console.log(e)
      res = e.output.payload
    }

    return h.response(res).code(res.statusCode)
  }
},
{
  path: '/events',
  method: 'GET',
  async handler (req, h) {
    let res = {}

    try {
      const events = await Event.getAll()

      res = {
        data: events,
        statusCode: 200
      }
    } catch (e) {
      res = e
    }

    return h.response(res).code(res.statusCode)
  }
},
{
  path: '/events',
  method: 'POST',
  async handler (req, h) {
    let res = {}

    try {
      const data = req.payload

      const event = await Event.add(data)

      res = {
        data: event,
        statusCode: 201
      }
    } catch (e) {
      res = e
    }

    return h.response(res).code(res.statusCode)
  }
},
{
  path: '/{eventId}',
  method: 'POST',
  async handler (req, h) {
    const eventId = req.params.eventId
    const data = req.payload
    let res = {}

    try {
      const event = new Event(eventId)

      event.get()
        .then(async eventData => {
          if (eventData.webHooks) {
            await Promise.all(eventData.webHooks.map(w => {
              request({
                method: 'POST',
                url: w,
                body: data,
                json: true
              })
            }))
          }

          return io.emit(eventId, data)
        })
        .catch(err => {
          console.log(err)
          throw new Error(err)
        })

      res = {
        data: {
          eventId: eventId,
          body: data
        },
        statusCode: 200
      }
    } catch (e) {
      const err = new Boom(e)
      req.log('error', err)
      res = err.output.payload
    }

    return h.response(res).code(res.statusCode)
  }
}, {
  path: '/events/{eventId}',
  method: 'DELETE',
  async handler (req, h) {
    const { eventId = null } = req.params
    let res = {}

    try {
      const event = new Event(eventId)
      const eventData = await event.remove()

      res = {
        data: eventData,
        statusCode: 200
      }
    } catch (e) {
      console.log(e)
      res = (e.isBoom) ? e : new Boom(e)
    }

    return h.response(res).code(res.statusCode)
  }
}]
