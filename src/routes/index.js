'use strict'

const Event = require('../lib/event')
const Boom = require('@hapi/boom')
const Moment = require('moment')

function errorHandler (error, req = false, h) {
  error = new Boom(error)
  // req.log(('error', error))
  console.error('error', error)
  const res = error.output.payload

  return h.response(res).code(res.statusCode)
}

module.exports = io => {
  return [{
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
      try {
        const events = await Event.getAll()

        const res = {
          data: events,
          statusCode: 200
        }

        return h.response(res).code(res.statusCode)
      } catch (e) {
        return errorHandler(e, req, h)
      }
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
      try {
        const eventId = req.params.eventId
        const data = req.payload

        const events = await Event.getAll({
          where: {
            key: 'event',
            value: eventId
          }
        })

        const eventData = (!events.length) ? await Event.add({
          event: eventId
        }) : events[0]

        const event = new Event(eventData.id)

        io.emit(eventId, data)

        const webHooksSends = await event.webHookSend(data)

        await event.update({
          lastUsed: Moment().unix()
        })

        const res = {
          data: {
            event: eventId,
            socket: 200,
            webHooks: webHooksSends,
            message: data
          },
          statusCode: 200
        }

        return h.response(res).code(res.statusCode)
      } catch (e) {
        return errorHandler(e, req, h)
      }
    }
  },
  {
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
  },
  {
    path: '/events/{eventId}',
    method: 'PUT',
    async handler (req, h) {
      try {
        const { params, payload } = req
        const { eventId = null } = params
        const event = new Event(eventId)
        const eventData = await event.update(payload)

        const res = {
          data: eventData,
          statusCode: 200
        }

        return h.response(res).code(res.statusCode)
      } catch (e) {
        return errorHandler(e, req, h)
      }
    }
  }]
}
