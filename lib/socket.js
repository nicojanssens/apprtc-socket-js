'use strict'

var debug = require('debug')
var events = require('events')
var hash = require('./hash')
var util = require('util')
var Q = require('q')
var W3CWebSocket = require('websocket').w3cwebsocket

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
}

// inherit EventEmitter
util.inherits(AppRtcSocket, events.EventEmitter)

// send message to peer
AppRtcSocket.prototype.send = function (data) {
  var message = {}
  message.cmd = 'send'
  message.msg = data
  this._client.send(JSON.stringify(message))
}

// connect to AppRtc server
AppRtcSocket.prototype.connect = function () {
  // create websocket
  this._client = new W3CWebSocket(url, null, origin)
  // websocket events
  this._client.onopen = this._onOpen.bind(this)
  this._client.onclose = this._onClose.bind(this)
  this._client.onmessage = this._onMessage.bind(this)
  this._client.onerror = this._onFailure.bind(this)
}

// connect to AppRtc server, return promise
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

// close socket
AppRtcSocket.prototype.close = function () {
  this._client.close()
}

// close socket, return promise
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

// connection established
AppRtcSocket.prototype._onOpen = function () {
  debugLog('connected')
  // send register message
  this._register()
}

// send register message to AppRtc server
AppRtcSocket.prototype._register = function () {
  var message = {}
  message.cmd = 'register'
  message.clientId = this.myId
  message.roomId = hash(this.myId, this.peerId)
  this._client.send(JSON.stringify(message))
  var self = this
  this._registrationTimer = setTimeout(function () {
    self.emit('ready')
  }, registrationTimeout)
}

// connection closed
AppRtcSocket.prototype._onClose = function () {
  debugLog('closed')
  // fire close event
  this.emit('close')
}

// incoming message
AppRtcSocket.prototype._onMessage = function (event) {
  // this._log.debug('incoming message')
  if (typeof event.data !== 'string') {
    var binaryErrorMsg = 'not expecting to receive a binary message -- dropping on the floor'
    errorLog(binaryErrorMsg)
    return
  }
  var messageObject = JSON.parse(event.data)
  if (messageObject.msg !== undefined && messageObject.error !== undefined) {
    this._onIncomingApprtcMessage(messageObject.msg, messageObject.error)
  } else {
    var formatErrorMsg = 'received message does not comply with expected format -- dropping on the floor'
    errorLog(formatErrorMsg)
    return
  }
}

// incoming AppRTC message
AppRtcSocket.prototype._onIncomingApprtcMessage = function (message, error) {
  if (error) {
    var errorMsg = 'apprtc error: ' + error
    errorLog(errorMsg)
    this.emit('error', errorMsg)
    return
  }
  this.emit('message', message)
}

// error handler
AppRtcSocket.prototype._onFailure = function (error) {
  // cancel registration timer -- if present
  if (this._registrationTimer) {
    clearTimeout(this._registrationTimer)
  }
  // fire error event
  var errorMsg = 'socket error: ' + error
  errorLog(errorMsg)
  this.emit('error', errorMsg)
}

module.exports = AppRtcSocket
