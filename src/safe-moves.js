const { printState } = require('./state');

class Position {
  x; y;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class MovesObject {
  up; down; left; right;
  constructor(up, down, left, right) {
    this.up = up;
    this.down = down;
    this.left = left;
    this.right = right;
  }
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

function manhattanDistance(a, b) {
  return Math.abs(b.x-a.x) + Math.abs(b.y-a.y);
}

function isSnakeNearFood(snake, food, radius) {
  return food.some((foo) => manhattanDistance(snake.head, foo) <= radius);
}

function isNearOtherHead(pos, state, radius) {
  return state.board.snakes.some(
    (snake) => snake.id != state.you.id && manhattanDistance(pos, snake.head) <= radius
  );
}

function getAreaAtPos(pos, state) {
  if (!(0 <= pos.x && pos.x < state.board.width && 0 <= pos.y && pos.y < state.board.height)) {
    return 0;
  }
  for (const snake of state.board.snakes) {
    for (const index in snake.body) {
      if (snake.body[index].x == pos.x && snake.body[index].y == pos.y) {
        if (index == snake.body.length-1 &&
          !isSnakeNearFood(snake, state.board.food, 2) &&
          !isNearOtherHead(pos, state, 2)
        ) {
          return snake.body.length;
        }
        return 0;
      }
    }
  }
  return 1;
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
  ];
}

function getAreaOfFreedom(state, move) {
  const headPos = new Position(state.you.head.x, state.you.head.y);
  let initial = performMove(headPos, move);
  const frontier = [initial];
  let area = 0;
  const reached = new Set();
  reached.add(JSON.stringify(initial));
  while (frontier.length) {
    let pos = frontier.pop();
    const areaAtPos = getAreaAtPos(pos, state);
    if (areaAtPos > 0) {
      area += areaAtPos;
      for (const child of expandPosition(pos)) {
        let key = JSON.stringify(child);
        if (!reached.has(key)) {
          reached.add(key);
          frontier.push(child);
        }
      }
    }
  }
  // console.error('move', move, 'area', area);
  // printState(state);
  return area;
}

function getSafeMoves(gameState) {
  if (!gameState.you) return [];
  const possibleMoves = new MovesObject(true, true, true, true);
  const moves = Object.keys(possibleMoves);
  const myHead = gameState.you.head;
  const snakes = gameState.board.snakes;
  /*
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
      (segment, i) => (i == snake.body.length-1 && isUp(segment, myHead) && !isSnakeNearFood(snake, gameState.board.food)) ||
        !isUp(segment, myHead)
    )
  );
  possibleMoves.down = possibleMoves.down && snakes.every(
    (snake) => snake.body.every(
      (segment, i) => (i == snake.body.length-1 && isDown(segment, myHead) && !isSnakeNearFood(snake, gameState.board.food)) ||
        !isDown(segment, myHead)
    )
  );
  possibleMoves.left = possibleMoves.left && snakes.every(
    (snake) => snake.body.every(
      (segment, i) => (i == snake.body.length-1 && isLeft(segment, myHead) && !isSnakeNearFood(snake, gameState.board.food)) ||
        !isLeft(segment, myHead)
    )
  );
  possibleMoves.right = possibleMoves.right && snakes.every(
    (snake) => snake.body.every(
      (segment, i) => (i == snake.body.length-1 && isRight(segment, myHead) && !isSnakeNearFood(snake, gameState.board.food)) ||
        !isRight(segment, myHead)
    )
  );
  */
  const area = new MovesObject(-1, -1, -1, -1);
  for (const move of moves) {
    area[move] = getAreaOfFreedom(gameState, move);
    possibleMoves[move] = area[move] > 0;
  }

  // Don't risk head-on unless necesssary
  const isUpRisky = !possibleMoves.up || snakes.some(
    (snake) => (snake.length >= gameState.you.length) && (
      (snake.head.x == myHead.x && snake.head.y == myHead.y+2) ||
      isOtherHeadUpLeft(snake.head, myHead) ||
      isOtherHeadUpRight(snake.head, myHead)
    )
  ) || area.up < gameState.you.body.length;
  const isDownRisky = !possibleMoves.down || snakes.some(
    (snake) => (snake.length >= gameState.you.length) && (
      (snake.head.x == myHead.x && snake.head.y == myHead.y-2) ||
      isOtherHeadDownLeft(snake.head, myHead) ||
      isOtherHeadDownRight(snake.head, myHead)
    )
  ) || area.down < gameState.you.body.length;
  const isLeftRisky = !possibleMoves.left || snakes.some(
    (snake) => (snake.length >= gameState.you.length) && (
      (snake.head.x == myHead.x-2 && snake.head.y == myHead.y) ||
      isOtherHeadUpLeft(snake.head, myHead) ||
      isOtherHeadDownLeft(snake.head, myHead)
    )
  ) || area.left < gameState.you.body.length;
  const isRightRisky = !possibleMoves.right || snakes.some(
    (snake) => (snake.length >= gameState.you.length) && (
      (snake.head.x == myHead.x+2 && snake.head.y == myHead.y) ||
      isOtherHeadUpRight(snake.head, myHead) ||
      isOtherHeadDownRight(snake.head, myHead)
    )
  ) || area.right < gameState.you.body.length;
  const riskyMoves = new MovesObject(isUpRisky, isDownRisky, isLeftRisky, isRightRisky);
  const safeMoves = moves.filter((key) => possibleMoves[key] && !riskyMoves[key]);
  // console.error('safeMoves', safeMoves);
  return safeMoves.length ? safeMoves : moves.filter((key) => possibleMoves[key]);
}

module.exports = {
  manhattanDistance,
  getSafeMoves
}