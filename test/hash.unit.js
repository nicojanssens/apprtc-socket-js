// eslint-disable-next-line import/no-extraneous-dependencies
const hat = require('hat');
const hash = require('../lib/hash');
// eslint-disable-next-line import/no-extraneous-dependencies
const chai = require('chai');

const expect = chai.expect;

// eslint-disable-next-line no-undef
describe('#AppRTC-socket utils', () => {
  // eslint-disable-next-line no-undef
  it('hash function should be commutative', () => {
    const value1 = hat();
    const value2 = hat();
    expect(hash(value1, value2)).to.equal(hash(value2, value1));
  });
});
