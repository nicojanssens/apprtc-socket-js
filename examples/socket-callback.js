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
socketAlice.on('error', error => {
  console.error(error)
})
socketBob.on('error', error => {
  console.error(error)
})

// ready handlers
socketAlice.on('ready', () => {
  console.log("Alice's socket is ready")
  socketBob.connect()
})
socketBob.on('ready', () => {
  console.log("Bob's socket is ready")
  socketAlice.send(testQuestion)
})

// message handlers
socketAlice.on('message', message => {
  console.log('Alice received answer: ' + message)
  socketAlice.close()
})
socketBob.on('message', message => {
  console.log('Bob received question: ' + message)
  socketBob.send(testAnswer)
})

socketAlice.on('close', () => {
  console.log("Alice's socket has closed")
  socketBob.close()
})
socketBob.on('close', () => {
  console.log("Bob's socket has closed")
})

socketAlice.connect()
