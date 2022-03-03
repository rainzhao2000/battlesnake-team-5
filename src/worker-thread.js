const { parentPort } = require('worker_threads');
const { aStarSearch } = require('./a-star');

parentPort.on('message', ({ gameState }) => {
  parentPort.postMessage(aStarSearch(gameState));
});