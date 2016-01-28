'use strict'

var AppRtcSocket = require('./src/socket')

module.exports = function createSocket (myId, peerId) {
  return new AppRtcSocket(myId, peerId)
}
