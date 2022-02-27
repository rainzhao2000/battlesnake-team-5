const { aStarSearch } = require('./a-star')

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
    const response = aStarSearch(gameState);

    console.log(`${gameState.game.id} MOVE ${gameState.turn}: ${response.move}`)
    return response
}

module.exports = {
    info: info,
    start: start,
    move: move,
    end: end
}
