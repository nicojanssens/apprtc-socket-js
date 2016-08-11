'use strict'

var hat = require('hat')
var hash = require('../lib/hash')

var chai = require('chai')
var expect = chai.expect

describe('#AppRTC-socket utils', function () {
  it('hash function should be commutative', function () {
    var value1 = hat()
    var value2 = hat()
    expect(hash(value1, value2)).to.equal(hash(value2, value1))
  })
})
