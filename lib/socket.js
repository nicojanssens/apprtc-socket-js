const debug = require('debug');
const events = require('events');
const hash = require('./hash');
const Q = require('q');
const W3CWebSocket = require('websocket').w3cwebsocket;

const debugLog = debug('apprtc-socket');
const errorLog = debug('apprtc-socket:error');
const origin = 'foo://bar';
const url = 'wss://apprtc-ws.webrtc.org:443/ws';
const registrationTimeout = 200; // ms

/**
 * AppRtc socket
 *
 * @constructor
 * @fires AppRtcSocket#ready
 * @fires AppRtcSocket#close
 * @fires AppRtcSocket#error
 * @fires AppRtcSocket#message
 */
class AppRtcSocket extends events.EventEmitter {
  constructor(myId, peerId) {
    super();
    this.myId = myId;
    this.peerId = peerId;
  }

  // send message to peer
  send(data) {
    const message = {};
    message.cmd = 'send';
    message.msg = data;
    this.wsClient.send(JSON.stringify(message));
  }

  // connect to AppRtc server
  connect() {
    // create websocket
    this.wsClient = new W3CWebSocket(url, null, origin);
    // websocket events
    this.wsClient.onopen = this.onOpen.bind(this);
    this.wsClient.onclose = this.onClose.bind(this);
    this.wsClient.onmessage = this.onMessage.bind(this);
    this.wsClient.onerror = this.onFailure.bind(this);
  }

  // connect to AppRtc server, return promise
  connectP() {
    const deferred = Q.defer();
    this.on('ready', () => {
      deferred.resolve();
    });
    this.on('error', (error) => {
      deferred.reject(error);
    });
    this.connect();
    return deferred.promise;
  }

  // close socket
  close() {
    this.wsClient.close();
  }

  // close socket, return promise
  closeP() {
    const deferred = Q.defer();
    this.on('close', () => {
      deferred.resolve();
    });
    this.on('error', (error) => {
      deferred.reject(error);
    });
    this.close();
    return deferred.promise;
  }

  // connection established
  onOpen() {
    debugLog('connected');
    // send register message
    this.register();
  }

  // send register message to AppRtc server
  register() {
    const message = {};
    message.cmd = 'register';
    message.clientId = this.myId;
    message.roomId = hash(this.myId, this.peerId);
    this.wsClient.send(JSON.stringify(message));
    const self = this;
    this.registrationTimer = setTimeout(() => {
      self.emit('ready');
    }, registrationTimeout);
  }

  // connection closed
  onClose() {
    debugLog('closed');
    // fire close event
    this.emit('close');
  }

  // incoming message
  onMessage(event) {
    // this._log.debug('incoming message')
    if (typeof event.data !== 'string') {
      const binaryErrorMsg = 'not expecting to receive a binary message -- dropping on the floor';
      errorLog(binaryErrorMsg);
      return;
    }
    const messageObject = JSON.parse(event.data);
    if (messageObject.msg !== undefined && messageObject.error !== undefined) {
      this.onIncomingApprtcMessage(messageObject.msg, messageObject.error);
    } else {
      const formatErrorMsg = 'received message does not comply with expected format -- dropping on the floor';
      errorLog(formatErrorMsg);
    }
  }

  // incoming AppRTC message
  onIncomingApprtcMessage(message, error) {
    if (error) {
      const errorMsg = `apprtc error: ${error}`;
      errorLog(errorMsg);
      this.emit('error', errorMsg);
      return;
    }
    this.emit('message', message);
  }

  // error handler
  onFailure(error) {
    // cancel registration timer -- if present
    if (this.registrationTimer) {
      clearTimeout(this.registrationTimer);
    }
    // fire error event
    const errorMsg = `socket error: ${error}`;
    errorLog(errorMsg);
    this.emit('error', errorMsg);
  }
}

module.exports = AppRtcSocket;
