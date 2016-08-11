'use strict'

var AppRtcSocket = require('./lib/socket')

module.exports = function createSocket (myId, peerId) {
  return new AppRtcSocket(myId, peerId)
}
