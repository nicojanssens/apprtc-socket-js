'use strict'

var crypto = require('crypto')

function commutativeHash (value1, value2) {
  var concat = value1 + value2
  if (value1 > value2) {
    concat = value2 + value1
  }
  return crypto.createHash('md5').update(concat).digest('hex')
}

module.exports = commutativeHash
