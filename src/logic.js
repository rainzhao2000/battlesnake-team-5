const { Worker } = require('worker_threads');

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
  return new Promise((resolve, reject) => {
    const worker = new Worker('./src/worker-thread.js', {
      workerData: gameState
    });
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}

module.exports = {
  info: info,
  start: start,
  move: move,
  end: end
}
