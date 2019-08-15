'use strict'

const request = require('request-promise')
const Boom = require('@hapi/boom')

class Cli {
  constructor ({
    url = false,
    fullResponse = false
  }) {
    if (!url) {
      throw Boom.badRequest('Url not found or undefined')
    }

    this.url = url
    this.fullResponse = fullResponse
  }

  async emit (event, data) {
    let response = {}

    try {
      const serverUri = this.url

      const res = await request({
        uri: `${serverUri}/${event}`,
        method: 'POST',
        json: true,
        body: data
      })

      response = (this.fullResponse) ? res : res.data

      return Promise.resolve(response)
    } catch (e) {
      return Promise.reject(new Boom(e))
    }
  }

  async add (data) {
    let response = {}

    try {
      const serverUri = this.url

      const res = await request({
        uri: `${serverUri}/events`,
        method: 'POST',
        json: true,
        body: data
      })

      response = (this.fullResponse) ? res : res.data

      return Promise.resolve(response)
    } catch (e) {
      return Promise.reject(new Boom(e))
    }
  }
}

module.exports = Cli
