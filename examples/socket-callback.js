// eslint-disable-next-line import/no-extraneous-dependencies
const hat = require('hat');
const socket = require('../index');

const aliceId = hat();
const bobId = hat();

const socketAlice = socket(aliceId, bobId);
const socketBob = socket(bobId, aliceId);

const testQuestion = 'What is the meaning of life?';
const testAnswer = 'A movie.';

// error handlers
socketAlice.on('error', (error) => {
  console.error(error);
});
socketBob.on('error', (error) => {
  console.error(error);
});

// ready handlers
socketAlice.on('ready', () => {
  console.log("Alice's socket is ready");
  socketBob.connect();
});
socketBob.on('ready', () => {
  console.log("Bob's socket is ready");
  socketAlice.send(testQuestion);
});

// message handlers
socketAlice.on('message', (message) => {
  console.log(`Alice received answer: ${message}`);
  socketAlice.close();
});
socketBob.on('message', (message) => {
  console.log(`Bob received question: ${message}`);
  socketBob.send(testAnswer);
});

socketAlice.on('close', () => {
  console.log("Alice's socket has closed");
  socketBob.close();
});
socketBob.on('close', () => {
  console.log("Bob's socket has closed");
});

socketAlice.connect();
