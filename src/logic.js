const { Worker } = require('worker_threads');
const { randomMove } = require('./a-star');

function info() {
  console.log("INFO")
  const response = {
    apiversion: "1",
    author: "",
    color: "#6eab61",
    head: "rbc-bowler",
    tail: "rbc-necktie"
  }
  return response
}

function start(gameState) {
  console.log(`${gameState.game.id} START`)
}

function end(gameState) {
  console.log(`${gameState.game.id} END\n`)
}

function move(gameState) {
  return new Promise((resolve) => {
    const worker = new Worker('./src/worker-thread.js', {
      workerData: gameState
    });
    worker.on('message', resolve);
    worker.on('error', (error) => {
      console.error(error);
      resolve(randomMove(gameState));
    });
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(new Error(`Worker stopped with exit code ${code}`));
        resolve(randomMove(gameState));
      }
    });
  });
}

module.exports = {
  info: info,
  start: start,
  move: move,
  end: end
}
