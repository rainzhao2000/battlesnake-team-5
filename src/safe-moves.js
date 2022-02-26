function getSafeMoves(gameState) {
  let possibleMoves = {
    up: true,
    down: true,
    left: true,
    right: true
  }

  // Step 0: Don't let your Battlesnake move back on its own neck
  const myHead = gameState.you.head
  const myNeck = gameState.you.body[1]
  if (myNeck.x < myHead.x) {
    possibleMoves.left = false
  } else if (myNeck.x > myHead.x) {
    possibleMoves.right = false
  } else if (myNeck.y < myHead.y) {
    possibleMoves.down = false
  } else if (myNeck.y > myHead.y) {
    possibleMoves.up = false
  }

  // TODO: Step 1 - Don't hit walls.
  // Use information in gameState to prevent your Battlesnake from moving beyond the boundaries of the board.
  // const boardWidth = gameState.board.width
  // const boardHeight = gameState.board.height

  // TODO: Step 2 - Don't hit yourself.
  // Use information in gameState to prevent your Battlesnake from colliding with itself.
  // const mybody = gameState.you.body

  // TODO: Step 3 - Don't collide with others.
  // Use information in gameState to prevent your Battlesnake from colliding with others.

  return Object.keys(possibleMoves).filter(key => possibleMoves[key])
}

module.exports = {
  getSafeMoves: getSafeMoves
}