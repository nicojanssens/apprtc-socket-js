'use strict'

var hat = require('hat')
var Socket = require('../lib/socket')

describe('#AppRTC-socket features', function () {
  this.timeout(10000)

  it('two sockets should be able to ping-pong', done => {
    var aliceId = hat()
    var bobId = hat()
    var socketAlice = new Socket(aliceId, bobId)
    var socketBob = new Socket(bobId, aliceId)

    var testQuestion = 'What is the meaning of life?'
    var testAnswer = 'A movie.'
    var testRuns = 10
    var messagesSent = 0

    var sendRequest = () => {
      socketAlice.send(testQuestion)
    }
    var sendReply = () => {
      socketBob.send(testAnswer)
    }

    socketAlice.on('message', message => {
      console.log('alice received response: ' + message)
      if (messagesSent === testRuns) {
        socketAlice.closeP()
          .then(() => socketBob.closeP())
          .then(() => {
            console.log("that's all folks")
            done()
          })
          .catch(error => {
            done(error)
          })
      } else {
        sendRequest()
        messagesSent++
      }
    })
    socketBob.on('message', message => {
      console.log('bob received request: ' + message)
      sendReply()
    })

    socketAlice.on('error', done)
    socketBob.on('error', done)

    socketAlice.connectP()
      .then(() => socketBob.connectP())
      .then(() => {
        sendRequest()
        messagesSent++
      })
      .catch(error => {
        done(error)
      })
  })
})
