function isOtherHeadUpLeft(otherHead, myHead) {
  return otherHead.x == myHead.x-1 && otherHead.y == myHead.y+1;
}

function isOtherHeadUpRight(otherHead, myHead) {
  return otherHead.x == myHead.x+1 && otherHead.y == myHead.y+1;
}

function isOtherHeadDownLeft(otherHead, myHead) {
  return otherHead.x == myHead.x-1 && otherHead.y == myHead.y-1;
}

function isOtherHeadDownRight(otherHead, myHead) {
  return otherHead.x == myHead.x+1 && otherHead.y == myHead.y-1;
}

function getSafeMoves(gameState) {
  if (!gameState.you) return [];
  let possibleMoves = {
    up: true,
    down: true,
    left: true,
    right: true
  }
  const myHead = gameState.you.head;

  // Don't hit walls.
  if (myHead.y == gameState.board.height-1) possibleMoves.up = false;
  if (myHead.y == 0) possibleMoves.down = false;
  if (myHead.x == 0) possibleMoves.left = false;
  if (myHead.x == gameState.board.width-1) possibleMoves.right = false;

  // Don't hit any snake's necks
  possibleMoves.up = possibleMoves.up && gameState.board.snakes.every(
    (snake) => !(snake.head.x == myHead.x && snake.head.y == myHead.y+1)
  );
  possibleMoves.down = possibleMoves.down && gameState.board.snakes.every(
    (snake) => !(snake.head.x == myHead.x && snake.head.y == myHead.y-1)
  );
  possibleMoves.left = possibleMoves.left && gameState.board.snakes.every(
    (snake) => !(snake.head.x == myHead.x-1 && snake.head.y == myHead.y)
  );
  possibleMoves.right = possibleMoves.right && gameState.board.snakes.every(
    (snake) => !(snake.head.x == myHead.x+1 && snake.head.y == myHead.y)
  );

  // Don't hit any snake bodies
  possibleMoves.up = possibleMoves.up && gameState.board.snakes.every(
    (snake) => snake.body.every(
      (segment) => !(segment.x == myHead.x && segment.y == myHead.y+1)
    )
  );
  possibleMoves.down = possibleMoves.down && gameState.board.snakes.every(
    (snake) => snake.body.every(
      (segment) => !(segment.x == myHead.x && segment.y == myHead.y-1)
    )
  );
  possibleMoves.left = possibleMoves.left && gameState.board.snakes.every(
    (snake) => snake.body.every(
      (segment) => !(segment.x == myHead.x-1 && segment.y == myHead.y)
    )
  );
  possibleMoves.right = possibleMoves.right && gameState.board.snakes.every(
    (snake) => snake.body.every(
      (segment) => !(segment.x == myHead.x+1 && segment.y == myHead.y)
    )
  );

  return Object.keys(possibleMoves).filter(key => possibleMoves[key])
}

module.exports = {
  getSafeMoves: getSafeMoves,
  isOtherHeadUpLeft: isOtherHeadUpLeft,
  isOtherHeadUpRight: isOtherHeadUpRight,
  isOtherHeadDownLeft: isOtherHeadDownLeft,
  isOtherHeadDownRight: isOtherHeadDownRight
}