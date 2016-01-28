'use strict'

var hat = require('hat')
var socket = require('../index')
var winston = require('winston')

var aliceId = hat()
var bobId = hat()

var socketAlice = socket(aliceId, bobId)
var socketBob = socket(bobId, aliceId)

var testQuestion = 'What is the meaning of life?'
var testAnswer = 'A movie.'

// error handlers
socketAlice.on('error', function (error) {
  winston.error(error)
})
socketBob.on('error', function (error) {
  winston.error(error)
})

// ready handlers
socketAlice.on('ready', function () {
  winston.info("Alice's socket is ready")
  socketBob.connect()
})
socketBob.on('ready', function () {
  winston.info("Bob's socket is ready")
  socketAlice.send(testQuestion)
})

// message handlers
socketAlice.on('message', function (message) {
  winston.info('Alice received answer: ' + message)
  socketAlice.close()
})
socketBob.on('message', function (message) {
  winston.info('Bob received question: ' + message)
  socketBob.send(testAnswer)
})

socketAlice.on('close', function () {
  winston.info("Alice's socket has closed")
  socketBob.close()
})
socketBob.on('close', function () {
  winston.info("Bob's socket has closed")
})

socketAlice.connect()
