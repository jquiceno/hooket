'use strict'

module.exports = (io, Event) => {
  return [{
    path: '/events/{eventId}',
    method: 'GET',
    async handler ({ params }, h) {
      const { eventId } = params

      const event = new Event(eventId)
      const eventData = await event.get()

      return h.success(eventData)
    }
  },
  {
    path: '/events',
    method: 'GET',
    async handler (req, h) {
      const events = await Event.getAll()
      return h.success(events)
    }
  },
  {
    path: '/events',
    method: 'POST',
    async handler ({ payload }, h) {
      const event = await Event.add(payload)

      return h.success(event)
    }
  },
  {
    path: '/{eventId}',
    method: 'POST',
    async handler ({ params, payload }, h) {
      const { eventId } = params
      const data = payload

      let [eventData] = await Event.getAll({
        where: {
          key: 'event',
          value: eventId
        }
      })

      if (eventData) {
        eventData = await Event.add({
          event: eventId
        })
      }

      const event = new Event(eventData.id)

      io.emit(eventId, data)

      const webHooksSends = await event.webHookSend(data)

      event.update({
        lastUsed: new Date()
      })

      return h.success({
        event: eventId,
        socket: 200,
        webHooks: webHooksSends,
        message: data
      })
    }
  },
  {
    path: '/events/{eventId}',
    method: 'DELETE',
    async handler ({ params }, h) {
      const { eventId } = params
      const event = new Event(eventId)
      const eventData = await event.remove()

      return h.success(eventData)
    }
  },
  {
    path: '/events/{eventId}',
    method: 'PUT',
    async handler (req, h) {
      const { params, payload } = req
      const { eventId = null } = params
      const event = new Event(eventId)
      const eventData = await event.update(payload)

      return h.success(eventData)
    }
  }]
}
