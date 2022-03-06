class Position {
  x;
  y;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

function performMove(pos, move) {
  let newPos = new Position(pos.x, pos.y)
  switch(move) {
    case 'up': newPos.y += 1; break;
    case 'down': newPos.y -= 1; break;
    case 'left': newPos.x -= 1; break;
    case 'right': newPos.x += 1; break;
  }
  return newPos;
}

function expandPosition(pos){
return [
  new Position(pos.x, pos.y + 1),
  new Position(pos.x, pos.y -1),
  new Position(pos.x + 1, pos.y),
  new Position(pos.x - 1, pos.y),
]
}

function getAreaOfFreedom(state, move) {
  // console.log('move', move)
  const headPos = new Position(state.you.head.x, state.you.head.y);
  // console.log('headNode', headNode)
  let initial = performMove(headPos, move);
  // console.log('initial', initial)
  const frontier = [initial];
  let area = 0;
  const reached = new Set();
  reached.add(JSON.stringify(initial));
  while (frontier.length) {
    // console.log(reached, area)
    let pos = frontier.pop();
    // console.log(pos)
    if (0 <= pos.x && pos.x < state.board.width && 0 <= pos.y && pos.y < state.board.height) {
      // console.log('within board boundary')
    }
    if (0 <= pos.x && pos.x < state.board.width && 0 <= pos.y && pos.y < state.board.height
      && state.board.snakes.every(
        (snake) => snake.body.every((segment) => {
          return !(segment.x == pos.x && segment.y == pos.y);
        } )
    )) {
      area += 1;
      for (const child of expandPosition(pos)) {
        let key = JSON.stringify(child);
        if (!reached.has(key)) {
          reached.add(key);
          frontier.push(child);
        }
      }
    }
  }
  return area;
}

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

function isSnakeNearFood(snake, food) {
  return food.some((foo) => {
    const dx = foo.x - snake.head.x;
    const dy = foo.y - snake.head.y;
    return Math.abs(dx) + Math.abs(dy) == 1;
  });
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
      (segment, i) => (i == snake.length-1 && isUp(segment, myHead) && !isSnakeNearFood(snake, gameState.board.food)) ||
        !isUp(segment, myHead)
    )
  );
  possibleMoves.down = possibleMoves.down && snakes.every(
    (snake) => snake.body.every(
      (segment, i) => (i == snake.length-1 && isDown(segment, myHead) && !isSnakeNearFood(snake, gameState.board.food)) ||
        !isDown(segment, myHead)
    )
  );
  possibleMoves.left = possibleMoves.left && snakes.every(
    (snake) => snake.body.every(
      (segment, i) => (i == snake.length-1 && isLeft(segment, myHead) && !isSnakeNearFood(snake, gameState.board.food)) ||
        !isLeft(segment, myHead)
    )
  );
  possibleMoves.right = possibleMoves.right && snakes.every(
    (snake) => snake.body.every(
      (segment, i) => (i == snake.length-1 && isRight(segment, myHead) && !isSnakeNearFood(snake, gameState.board.food)) ||
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
  ) || getAreaOfFreedom(gameState, 'up') < gameState.you.length;
  const isDownRisky = !possibleMoves.down || snakes.some(
    (snake) => (snake.length >= gameState.you.length) && (
      (snake.head.x == myHead.x && snake.head.y == myHead.y-2) ||
      isOtherHeadDownLeft(snake.head, myHead) ||
      isOtherHeadDownRight(snake.head, myHead)
    )
  ) || getAreaOfFreedom(gameState, 'down') < gameState.you.length;
  const isLeftRisky = !possibleMoves.left || snakes.some(
    (snake) => (snake.length >= gameState.you.length) && (
      (snake.head.x == myHead.x-2 && snake.head.y == myHead.y) ||
      isOtherHeadUpLeft(snake.head, myHead) ||
      isOtherHeadDownLeft(snake.head, myHead)
    )
  ) || getAreaOfFreedom(gameState, 'left') < gameState.you.length;
  const isRightRisky = !possibleMoves.right || snakes.some(
    (snake) => (snake.length >= gameState.you.length) && (
      (snake.head.x == myHead.x+2 && snake.head.y == myHead.y) ||
      isOtherHeadUpRight(snake.head, myHead) ||
      isOtherHeadDownRight(snake.head, myHead)
    )
  ) || getAreaOfFreedom(gameState, 'right') < gameState.you.length;
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