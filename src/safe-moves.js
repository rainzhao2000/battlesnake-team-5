function getSafeMoves(gameState) {
  let possibleMoves = {
    up: true,
    down: true,
    left: true,
    right: true
  }
  const myHead = gameState.you.head;

  // Don't hit walls.
  if (myHead.x == 0) possibleMoves.left = false;
  if (myHead.x == gameState.board.width-1) possibleMoves.right = false;
  if (myHead.y == 0) possibleMoves.down = false;
  if (myHead.y == gameState.board.height-1) possibleMoves.up = false;

  // Don't hit any snakes unless they can be eaten
  for (const snake of gameState.board.snakes) {
    // Don't hit any snake bodies
    for (const segment of snake.body) {
      if (segment.y == myHead.y+1) possibleMoves.up = false;
      if (segment.y == myHead.y-1) possibleMoves.down = false;
      if (segment.x == myHead.x-1) possibleMoves.left = false;
      if (segment.x == myHead.x+1) possibleMoves.right = false;
    }
    // Don't hit any snake's necks
    if (snake.head.y == myHead.y+1) possibleMoves.up = false;
    if (snake.head.y == myHead.y-1) possibleMoves.down = false;
    if (snake.head.x == myHead.x-1) possibleMoves.left = false;
    if (snake.head.x == myHead.x+1) possibleMoves.right = false;
    // Don't head on with longer snakes
    if (gameState.you.length <= snake.length) {
      if (snake.head.y == myHead.y+2) possibleMoves.up = false;
      if (snake.head.y == myHead.y-2) possibleMoves.down = false;
      if (snake.head.x == myHead.x-2) possibleMoves.left = false;
      if (snake.head.x == myHead.x+2) possibleMoves.right = false;
    }
  }

  return Object.keys(possibleMoves).filter(key => possibleMoves[key])
}

module.exports = {
  getSafeMoves: getSafeMoves
}