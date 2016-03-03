'use strict'

var events = require('events')
var hash = require('./hash')
var util = require('util')
var Q = require('q')
var WebSocketClient = require('websocket').client

var debug = require('debug')
var debugLog = debug('apprtc-socket')
var errorLog = debug('apprtc-socket:error')

var origin = 'foo://bar'
var url = 'wss://apprtc-ws.webrtc.org:443/ws'
var registrationTimeout = 200 // ms

/**
 * AppRtc socket
 *
 * @constructor
 * @fires AppRtcSocket#ready
 * @fires AppRtcSocket#close
 * @fires AppRtcSocket#error
 * @fires AppRtcSocket#message
 */
var AppRtcSocket = function (myId, peerId) {
  this.myId = myId
  this.peerId = peerId
  this._ws = new WebSocketClient()
  // on websocket failure
  this._ws.on('connectionFailed', this._onFailure())
  // on websocket connection
  var self = this
  this._ws.on('connect', function (connection) {
    debugLog('connected')
    self._connection = connection
    // on connection error
    self._connection.on('error', self._onFailure())
    // on connection closed
    self._connection.on('close', self._onConnectionClosed())
    // on message arrival
    self._connection.on('message', self._onIncomingMessage())
    // send register message
    self._register()
  })
}

// Inherit EventEmitter
util.inherits(AppRtcSocket, events.EventEmitter)

AppRtcSocket.prototype.connect = function () {
  // create websocket connection
  this._ws.connect(url, null, origin, null, null)
}

AppRtcSocket.prototype.connectP = function () {
  var deferred = Q.defer()
  this.on('ready', function () {
    deferred.resolve()
  })
  this.on('error', function (error) {
    deferred.reject(error)
  })
  this.connect()
  return deferred.promise
}

AppRtcSocket.prototype.close = function () {
  this._connection.close()
}

AppRtcSocket.prototype.closeP = function () {
  var deferred = Q.defer()
  this.on('close', function () {
    deferred.resolve()
  })
  this.on('error', function (error) {
    deferred.reject(error)
  })
  this.close()
  return deferred.promise
}

AppRtcSocket.prototype.send = function (data) {
  var message = {}
  message.cmd = 'send'
  message.msg = data
  this._connection.sendUTF(JSON.stringify(message))
}

AppRtcSocket.prototype._register = function () {
  var message = {}
  message.cmd = 'register'
  message.clientId = this.myId
  message.roomId = hash(this.myId, this.peerId)
  this._connection.sendUTF(JSON.stringify(message))
  var self = this
  this._registrationTimer = setTimeout(function () {
    self.emit('ready')
  }, registrationTimeout)
}

// Incoming message handler
AppRtcSocket.prototype._onIncomingMessage = function () {
  var self = this
  return function (message) {
    debugLog('incoming message')
    if (message.type === 'binary') {
      var binaryErrorMsg = 'not expecting to receive a binary message -- dropping on the floor'
      errorLog(binaryErrorMsg)
      return
    }
    if (message.type === 'utf8') {
      var messageObject = JSON.parse(message.utf8Data)
      if (messageObject.msg !== undefined && messageObject.error !== undefined) {
        self._onIncomingApprtcMessage(messageObject.msg, messageObject.error)
      } else {
        var formatErrorMsg = 'received message does not comply with expected format -- dropping on the floor'
        errorLog(formatErrorMsg)
        return
      }
    }
  }
}

// Incoming AppRTC message
AppRtcSocket.prototype._onIncomingApprtcMessage = function (message, error) {
  if (error) {
    var errorMsg = 'apprtc error: ' + error
    errorLog(errorMsg)
    this.emit('error', errorMsg)
    return
  }
  this.emit('message', message)
}

// Error handler
AppRtcSocket.prototype._onFailure = function () {
  var self = this
  return function (error) {
    // cancel registration timer -- if present
    if (self._registrationTimer) {
      clearTimeout(self._registrationTimer)
    }
    // fire error event
    var errorMsg = 'socket error: ' + error
    errorLog(errorMsg)
    self.emit('error', errorMsg)
  }
}

// Connection closed handler
AppRtcSocket.prototype._onConnectionClosed = function () {
  var self = this
  return function () {
    self.emit('close')
  }
}

module.exports = AppRtcSocket
