const { randomMove } = require('./a-star');

function info() {
  console.log("INFO")
  const response = {
    apiversion: "1",
    author: "",
    color: "#6eab61",
    head: "evil",
    tail: "bold"
  }
  return response
}

function start(gameState) {
  console.log(`${gameState.game.id} START`)
}

function end(gameState) {
  console.log(`${gameState.game.id} END\n`)
}

function move(pool, gameState) {
  return new Promise((resolve) => {
    if (gameState.turn < 3) {
      resolve(randomMove(gameState));
      return;
    }
    pool.runTask({ gameState }, (err, result) => {
      let response = result;
      if (err) {
        console.error(err);
        response = randomMove(gameState);
      }
      console.log(`${gameState.game.id} MOVE ${gameState.turn}: ${response.move}`);
      resolve(response);
    });
  });
}

module.exports = {
  info: info,
  start: start,
  move: move,
  end: end
}
