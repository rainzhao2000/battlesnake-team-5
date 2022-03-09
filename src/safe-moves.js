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

function isPosWithinBounds(pos, board) {
  return 0 <= pos.x && pos.x < board.width && 0 <= pos.y && pos.y < board.height;
}

function manhattanDistance(a, b) {
  return Math.abs(b.x-a.x) + Math.abs(b.y-a.y);
}

function isSnakeNearFood(snake, food, radius) {
  return food.some((foo) => manhattanDistance(snake.head, foo) <= radius);
}

function isNearOtherDangerousHead(pos, forSnake ,board, radius) {
  return board.snakes.some(
    (snake) => snake.id != forSnake.id && snake.length >= forSnake.length && manhattanDistance(pos, snake.head) <= radius
  );
}

function getAreaAtPos(pos, forSnake, board) {
  if (!isPosWithinBounds(pos, board)) {
    return 0;
  }
  for (const snake of board.snakes) {
    for (const index in snake.body) {
      if (snake.body[index].x == pos.x && snake.body[index].y == pos.y) {
        if (index == snake.body.length-1 &&
          (snake.id == forSnake.id ||
            (manhattanDistance(forSnake.head, snake.body[index]) <= 2 &&
            !isSnakeNearFood(snake, board.food, 2))) &&
          !isNearOtherDangerousHead(pos, forSnake, board, 2)
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

// implemented as flood fill
function getAreaOfFreedom(forSnake, board, move) {
  const headPos = new Position(forSnake.head.x, forSnake.head.y);
  let initial = performMove(headPos, move);
  const frontier = [initial];
  let area = 0;
  const reached = new Set();
  reached.add(JSON.stringify(initial));
  let numSearched = 0;
  while (frontier.length) {
    if (numSearched > forSnake.length * 3) return area;
    let pos = frontier.pop();
    const areaAtPos = getAreaAtPos(pos, forSnake, board);
    numSearched += 1;
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

function getBasicSafeMoves(forSnake, board) {
  const snakes = board.snakes;
  const possibleMoves = new MovesObject(true, true, true, true);
  // Don't hit walls.
  if (forSnake.head.y == board.height-1) possibleMoves.up = false;
  if (forSnake.head.y == 0) possibleMoves.down = false;
  if (forSnake.head.x == 0) possibleMoves.left = false;
  if (forSnake.head.x == board.width-1) possibleMoves.right = false;

  // Don't hit any snake's necks
  possibleMoves.up = possibleMoves.up && snakes.every(
    (snake) => !isUp(snake.head, forSnake.head)
  );
  possibleMoves.down = possibleMoves.down && snakes.every(
    (snake) => !isDown(snake.head, forSnake.head)
  );
  possibleMoves.left = possibleMoves.left && snakes.every(
    (snake) => !isLeft(snake.head, forSnake.head)
  );
  possibleMoves.right = possibleMoves.right && snakes.every(
    (snake) => !isRight(snake.head, forSnake.head)
  );

  // Don't hit any snake bodies except tails
  possibleMoves.up = possibleMoves.up && snakes.every(
    (snake) => snake.body.every(
      (segment, i) => !isUp(segment, forSnake.head) ||
        (i == snake.body.length-1 && !isSnakeNearFood(snake, board.food))
    )
  );
  possibleMoves.down = possibleMoves.down && snakes.every(
    (snake) => snake.body.every(
      (segment, i) => !isDown(segment, forSnake.head) ||
      (i == snake.body.length-1 && !isSnakeNearFood(snake, board.food))
    )
  );
  possibleMoves.left = possibleMoves.left && snakes.every(
    (snake) => snake.body.every(
      (segment, i) => !isLeft(segment, forSnake.head) ||
      (i == snake.body.length-1 && !isSnakeNearFood(snake, board.food))
    )
  );
  possibleMoves.right = possibleMoves.right && snakes.every(
    (snake) => snake.body.every(
      (segment, i) => !isRight(segment, forSnake.head) ||
      (i == snake.body.length-1 && !isSnakeNearFood(snake, board.food))
    )
  );

  // Don't risk head-on unless necesssary
  const isUpRisky = !possibleMoves.up || snakes.some(
    (snake) => (snake.length >= forSnake.length) && (
      (snake.head.x == forSnake.head.x && snake.head.y == forSnake.head.y+2) ||
      isOtherHeadUpLeft(snake.head, forSnake.head) ||
      isOtherHeadUpRight(snake.head, forSnake.head)
    )
  );
  const isDownRisky = !possibleMoves.down || snakes.some(
    (snake) => (snake.length >= forSnake.length) && (
      (snake.head.x == forSnake.head.x && snake.head.y == forSnake.head.y-2) ||
      isOtherHeadDownLeft(snake.head, forSnake.head) ||
      isOtherHeadDownRight(snake.head, forSnake.head)
    )
  );
  const isLeftRisky = !possibleMoves.left || snakes.some(
    (snake) => (snake.length >= forSnake.length) && (
      (snake.head.x == forSnake.head.x-2 && snake.head.y == forSnake.head.y) ||
      isOtherHeadUpLeft(snake.head, forSnake.head) ||
      isOtherHeadDownLeft(snake.head, forSnake.head)
    )
  );
  const isRightRisky = !possibleMoves.right || snakes.some(
    (snake) => (snake.length >= forSnake.length) && (
      (snake.head.x == forSnake.head.x+2 && snake.head.y == forSnake.head.y) ||
      isOtherHeadUpRight(snake.head, forSnake.head) ||
      isOtherHeadDownRight(snake.head, forSnake.head)
    )
  );
  const moves = Object.keys(possibleMoves);
  const riskyMoves = new MovesObject(isUpRisky, isDownRisky, isLeftRisky, isRightRisky);
  const idealMoves = moves.filter((key) => possibleMoves[key] && !riskyMoves[key]);
  return idealMoves.length ? idealMoves : moves.filter((key) => possibleMoves[key]);
}

function canAreaTrapSnake(area, snake) {
  return area < snake.length;
}

function getAdvancedSafeMoves(forSnake, board) {
  const possibleMoves = new MovesObject(true, true, true, true);
  const area = new MovesObject(-1, -1, -1, -1);
  if (!forSnake) return {
    idealMoves: [],
    safeMoves: possibleMoves,
    area
  };
  const moves = Object.keys(possibleMoves);
  const snakes = board.snakes;
  const myHead = forSnake.head;
  for (const move of moves) {
    area[move] = getAreaOfFreedom(forSnake, board, move);
    possibleMoves[move] = area[move] > 0;
  }
  // Don't risk head-on or getting trapped unless necesssary
  const isUpRisky = !possibleMoves.up || snakes.some(
    (snake) => (snake.length >= forSnake.length) && (
      (snake.head.x == myHead.x && snake.head.y == myHead.y+2) ||
      isOtherHeadUpLeft(snake.head, myHead) ||
      isOtherHeadUpRight(snake.head, myHead)
    )
  ) || canAreaTrapSnake(area.up, forSnake);
  const isDownRisky = !possibleMoves.down || snakes.some(
    (snake) => (snake.length >= forSnake.length) && (
      (snake.head.x == myHead.x && snake.head.y == myHead.y-2) ||
      isOtherHeadDownLeft(snake.head, myHead) ||
      isOtherHeadDownRight(snake.head, myHead)
    )
  ) || canAreaTrapSnake(area.down, forSnake);
  const isLeftRisky = !possibleMoves.left || snakes.some(
    (snake) => (snake.length >= forSnake.length) && (
      (snake.head.x == myHead.x-2 && snake.head.y == myHead.y) ||
      isOtherHeadUpLeft(snake.head, myHead) ||
      isOtherHeadDownLeft(snake.head, myHead)
    )
  ) || canAreaTrapSnake(area.left, forSnake);
  const isRightRisky = !possibleMoves.right || snakes.some(
    (snake) => (snake.length >= forSnake.length) && (
      (snake.head.x == myHead.x+2 && snake.head.y == myHead.y) ||
      isOtherHeadUpRight(snake.head, myHead) ||
      isOtherHeadDownRight(snake.head, myHead)
    )
  ) || canAreaTrapSnake(area.right, forSnake);
  const riskyMoves = new MovesObject(isUpRisky, isDownRisky, isLeftRisky, isRightRisky);
  const idealMoves = moves.filter((key) => possibleMoves[key] && !riskyMoves[key]);
  return {
    idealMoves,
    safeMoves: idealMoves.length ? idealMoves : moves.filter((key) => possibleMoves[key]),
    area
  };
}

function getSafeMoves(gameState) {
  return getAdvancedSafeMoves(gameState.you, gameState.board);
}

module.exports = {
  isPosWithinBounds,
  manhattanDistance,
  getBasicSafeMoves,
  getAdvancedSafeMoves,
  getSafeMoves
}