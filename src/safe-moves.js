function isUp(segment, myHead) {
  return segment.x == myHead.x && segment.y == myHead.y+1;
}

function isDown(segment, myHead) {
  return segment.x == myHead.x && segment.y == myHead.y-1;
}

function isLeft(segment, myHead) {
  return segment.x == myHead.x-1 && segment.y == myHead.y;
}

function isRight(segment, myHead) {
  return segment.x == myHead.x+1 && segment.y == myHead.y;
}

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
  const possibleMoves = {
    up: true,
    down: true,
    left: true,
    right: true
  }
  const myHead = gameState.you.head;
  const snakes = gameState.board.snakes;

  // Don't hit walls.
  if (myHead.y == gameState.board.height-1) possibleMoves.up = false;
  if (myHead.y == 0) possibleMoves.down = false;
  if (myHead.x == 0) possibleMoves.left = false;
  if (myHead.x == gameState.board.width-1) possibleMoves.right = false;

  // Don't hit any snake's necks
  possibleMoves.up = possibleMoves.up && snakes.every(
    (snake) => !isUp(snake.head, myHead)
  );
  possibleMoves.down = possibleMoves.down && snakes.every(
    (snake) => !isDown(snake.head, myHead)
  );
  possibleMoves.left = possibleMoves.left && snakes.every(
    (snake) => !isLeft(snake.head, myHead)
  );
  possibleMoves.right = possibleMoves.right && snakes.every(
    (snake) => !isRight(snake.head, myHead)
  );

  // Don't hit any snake bodies except tails
  possibleMoves.up = possibleMoves.up && snakes.every(
    (snake) => snake.body.every(
      (segment, i) => (i == snake.length-1 && isUp(segment, myHead)) ||
        !isUp(segment, myHead)
    )
  );
  possibleMoves.down = possibleMoves.down && snakes.every(
    (snake) => snake.body.every(
      (segment, i) => (i == snake.length-1 && isDown(segment, myHead)) ||
        !isDown(segment, myHead)
    )
  );
  possibleMoves.left = possibleMoves.left && snakes.every(
    (snake) => snake.body.every(
      (segment, i) => (i == snake.length-1 && isLeft(segment, myHead)) ||
        !isLeft(segment, myHead)
    )
  );
  possibleMoves.right = possibleMoves.right && snakes.every(
    (snake) => snake.body.every(
      (segment, i) => (i == snake.length-1 && isRight(segment, myHead)) ||
        !isRight(segment, myHead)
    )
  );

  // Don't risk head-on unless necesssary
  const isUpRisky = !possibleMoves.up || snakes.some(
    (snake) => (snake.length >= gameState.you.length) && (
      (snake.head.x == myHead.x && snake.head.y == myHead.y+2) ||
      isOtherHeadUpLeft(snake.head, myHead) ||
      isOtherHeadUpRight(snake.head, myHead)
    )
  );
  const isDownRisky = !possibleMoves.down || snakes.some(
    (snake) => (snake.length >= gameState.you.length) && (
      (snake.head.x == myHead.x && snake.head.y == myHead.y-2) ||
      isOtherHeadDownLeft(snake.head, myHead) ||
      isOtherHeadDownRight(snake.head, myHead)
    )
  );
  const isLeftRisky = !possibleMoves.left || snakes.some(
    (snake) => (snake.length >= gameState.you.length) && (
      (snake.head.x == myHead.x-2 && snake.head.y == myHead.y) ||
      isOtherHeadUpLeft(snake.head, myHead) ||
      isOtherHeadDownLeft(snake.head, myHead)
    )
  );
  const isRightRisky = !possibleMoves.right || snakes.some(
    (snake) => (snake.length >= gameState.you.length) && (
      (snake.head.x == myHead.x+2 && snake.head.y == myHead.y) ||
      isOtherHeadUpRight(snake.head, myHead) ||
      isOtherHeadDownRight(snake.head, myHead)
    )
  );
  const riskyMoves = {
    up: isUpRisky,
    down: isDownRisky,
    left: isLeftRisky,
    right: isRightRisky
  };
  const moves = Object.keys(possibleMoves);
  const safeMoves = moves.filter((key) => possibleMoves[key] && !riskyMoves[key]);
  return safeMoves.length ? safeMoves : moves.filter((key) => possibleMoves[key]);
}

module.exports = {
  getSafeMoves
}