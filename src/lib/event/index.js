'use strict'

const Boom = require('@hapi/boom')
const Db = require('../db')
const dbKey = require('../../../db-key.json')
const Moment = require('moment')

const db = Db.init(dbKey, {
  type: 'firestore',
  collection: 'emiters'
})

class Event {
  constructor (id) {
    this.id = id
  }

  static async getAll () {
    try {
      const events = []
      const query = await db.get()

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
      data.created = Moment().unix()
      data.updated = data.created
      data.lastUsed = data.created

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
}

module.exports = Event
