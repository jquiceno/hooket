'use strict'

const admin = require('firebase-admin')
const Error = require('@hapi/boom')

class Firebase {
  constructor (serviceAccount) {
    try {
      this.app = null

      const appName = `pimex-${serviceAccount.project_id}`

      const dbConfig = {
        credential: admin.credential.cert(serviceAccount),
        databaseURL: serviceAccount.databaseURL
      }

      if (!admin.apps.length) {
        admin.initializeApp(dbConfig)
      }

      try {
        this.app = admin.app(appName)
      } catch (e) {
        admin.initializeApp(dbConfig, appName)
        admin.app(appName).firestore().settings({ timestampsInSnapshots: true })
      }

      this.app = admin.app(appName)
    } catch (e) {
      return new Error(e)
    }
  }

  firestore (collection = false) {
    try {
      const db = this.app.firestore()

      if (collection) {
        return db.collection(collection)
      }

      return db
    } catch (e) {
      return new Error(e)
    }
  }

  firebase (collection = false) {
    try {
      const db = admin.database(this.app)

      if (collection) {
        return db.ref(`/${collection}`)
      }

      return db
    } catch (e) {
      return new Error(e)
    }
  }

  static init (serviceAccount, params = false) {
    try {
      const db = new Firebase(serviceAccount)

      if (params.type === 'firestore') {
        return db.firestore(params.collection)
      }

      return db.firebase(params.collection)
    } catch (e) {
      return new Error(e)
    }
  }
}

module.exports = Firebase
