'use strict'

var hat = require('hat')
var Socket = require('../src/Socket')

describe('#AppRTC-socket features', function () {
  this.timeout(5000)

  it('two sockets should be able to ping-pong', function (done) {
    var aliceId = hat()
    var bobId = hat()
    var socketAlice = new Socket(aliceId, bobId)
    var socketBob = new Socket(bobId, aliceId)

    var testQuestion = 'What is the meaning of life?'
    var testAnswer = 'A movie.'
    var testRuns = 10
    var messagesSent = 0

    var sendRequest = function () {
      socketAlice.send(testQuestion)
    }

    var sendReply = function () {
      socketBob.send(testAnswer)
    }

    socketAlice.on('message', function (message) {
      console.log('alice received response: ' + message)
      if (messagesSent === testRuns) {
        socketAlice.closeP()
          .then(function () {
            return socketBob.closeP()
          })
          .then(function () {
            console.log("that's all folks")
            done()
          })
          .catch(function (error) {
            done(error)
          })
      } else {
        sendRequest()
        messagesSent++
      }
    })

    socketBob.on('message', function (message) {
      console.log('bob received request: ' + message)
      sendReply()
    })

    socketAlice.on('error', done)
    socketBob.on('error', done)

    socketAlice.connectP()
      .then(function () {
        return socketBob.connectP()
      })
      .then(function () {
        sendRequest()
        messagesSent++
      })
      .catch(function (error) {
        done(error)
      })
  })
})
