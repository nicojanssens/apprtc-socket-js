'use strict'

var hat = require('hat')
var socket = require('../index')

var aliceId = hat()
var bobId = hat()

var socketAlice = socket(aliceId, bobId)
var socketBob = socket(bobId, aliceId)

var testQuestion = 'What is the meaning of life?'
var testAnswer = 'A movie.'

// error handlers
socketAlice.on('error', function (error) {
  console.error(error)
})
socketBob.on('error', function (error) {
  console.error(error)
})

// ready handlers
socketAlice.on('ready', function () {
  console.log("Alice's socket is ready")
  socketBob.connect()
})
socketBob.on('ready', function () {
  console.log("Bob's socket is ready")
  socketAlice.send(testQuestion)
})

// message handlers
socketAlice.on('message', function (message) {
  console.log('Alice received answer: ' + message)
  socketAlice.close()
})
socketBob.on('message', function (message) {
  console.log('Bob received question: ' + message)
  socketBob.send(testAnswer)
})

socketAlice.on('close', function () {
  console.log("Alice's socket has closed")
  socketBob.close()
})
socketBob.on('close', function () {
  console.log("Bob's socket has closed")
})

socketAlice.connect()
