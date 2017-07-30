const AppRtcSocket = require('./lib/socket');

const createSocket = (myId, peerId) => (
  new AppRtcSocket(myId, peerId)
);

module.exports = createSocket;
