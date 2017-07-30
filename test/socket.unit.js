// eslint-disable-next-line import/no-extraneous-dependencies
const hat = require('hat');
const Socket = require('../lib/socket');

// eslint-disable-next-line no-undef
describe('#AppRTC-socket features', () => {
  this.timeout(10000);

  // eslint-disable-next-line no-undef
  it('two sockets should be able to ping-pong', (done) => {
    const aliceId = hat();
    const bobId = hat();
    const socketAlice = new Socket(aliceId, bobId);
    const socketBob = new Socket(bobId, aliceId);

    const testQuestion = 'What is the meaning of life?';
    const testAnswer = 'A movie.';
    const testRuns = 10;
    let messagesSent = 0;

    const sendRequest = () => {
      socketAlice.send(testQuestion);
    };
    const sendReply = () => {
      socketBob.send(testAnswer);
    };

    socketAlice.on('message', (message) => {
      console.log(`alice received response: ${message}`);
      if (messagesSent === testRuns) {
        socketAlice.closeP()
          .then(() => socketBob.closeP())
          .then(() => {
            console.log("that's all folks");
            done();
          })
          .catch((error) => {
            done(error);
          });
      } else {
        sendRequest();
        messagesSent += 1;
      }
    });
    socketBob.on('message', (message) => {
      console.log(`bob received request: ${message}`);
      sendReply();
    });

    socketAlice.on('error', done);
    socketBob.on('error', done);

    socketAlice.connectP()
      .then(() => socketBob.connectP())
      .then(() => {
        sendRequest();
        messagesSent += 1;
      })
      .catch((error) => {
        done(error);
      });
  });
});
