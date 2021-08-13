'use strict'

const Boom = require('@hapi/boom')
const Db = require('../db')
const dbKey = require('../../../db-key.json')
const axios = require('axios')

const db = Db.init(dbKey, {
  type: 'firestore',
  collection: 'emiters'
})

class Event {
  constructor (id) {
    this.id = id
  }

  static async getAll (params = {}) {
    try {
      let query = db

      if (params.where) {
        query = query.where(params.where.key, '==', params.where.value)
      }

      query = await query.get()

      if (query.empty) return Promise.resolve([])

      const events = []
      query.forEach(eventRef => {
        const eventData = eventRef.data()
        eventData.id = eventRef.id
        events.push(eventData)
      })

      return Promise.resolve(events)
    } catch (error) {
      return Promise.reject(new Boom(error))
    }
  }

  static async add (data) {
    try {
      data.created = new Date()
      data.updated = data.created
      data.lastUsed = false

      const ref = db.doc()
      await ref.set(data)

      data.id = ref.id

      return Promise.resolve(data)
    } catch (e) {
      return Promise.reject(new Boom(e))
    }
  }

  async get () {
    try {
      const events = []
      let eventRef = db.doc(this.id)
      let event = await eventRef.get()
      event = event.data()

      if (!event) {
        eventRef = db
        event = eventRef.where('event', '==', this.id)
        event = await event.get()
        event.forEach(eventRef => {
          const eventData = eventRef.data()
          eventData.id = eventRef.id
          events.push(eventData)
        })

        event = events[0]
      } else {
        event.id = eventRef.id
      }

      if (!event || events.lenght <= 0) {
        throw Boom.badRequest(`Event ${this.id} not found or invalid`)
      }

      return Promise.resolve(event)
    } catch (error) {
      return Promise.reject(new Boom(error))
    }
  }

  async remove () {
    try {
      const eventData = await this.get()
      const eventRef = db.doc(this.id)
      await eventRef.delete()
      return Promise.resolve(eventData)
    } catch (e) {
      return Promise.reject(new Boom(e))
    }
  }

  async webHookSend (message) {
    try {
      const response = {
        success: {},
        error: {}
      }
      const eventData = await this.get()

      if (!eventData.webHooks) {
        return Promise.resolve([])
      }

      for (const key in eventData.webHooks) {
        const url = eventData.webHooks[key]

        try {
          const res = await axios({
            method: 'POST',
            url,
            data: {
              event: eventData.id,
              message
            }
          })

          response.success[url] = res.data.statusCode || res.statusCode || 200
        } catch (e) {
          response.error[url] = e.error.statusCode || e.error.code
        }
      }

      return Promise.resolve(response)
    } catch (e) {
      return Promise.reject(new Boom(e))
    }
  }

  async update (data) {
    try {
      let eventData = await this.get()
      const eventRef = db.doc(eventData.id)
      data.updated = new Date()

      await eventRef.update(data)

      eventData = await this.get()

      return Promise.resolve(eventData)
    } catch (e) {
      return Promise.reject(new Boom(e))
    }
  }
}

module.exports = Event
