const { isMainThread, parentPort, workerData } = require('worker_threads');
const { aStarSearch } = require('./a-star');

if (!isMainThread) {
  const gameState = workerData;
  const response = aStarSearch(gameState);
  parentPort.postMessage(response);
}