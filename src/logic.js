const { defaultMove } = require('./a-star');

function info() {
  console.log("INFO")
  const response = {
    apiversion: "1",
    author: "",
    color: "#063c24",
    head: "evil",
    tail: "bolt"
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
    if (gameState.turn < 1) {
      resolve(defaultMove(gameState));
      return;
    }
    pool.runTask({ gameState }, (err, result) => {
      let response = result;
      if (err) {
        console.error(err);
        response = defaultMove(gameState);
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
