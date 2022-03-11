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

const isUp = (segment, myHead) => {
  return segment.x == myHead.x && segment.y == myHead.y+1;
}

const isDown = (segment, myHead) => {
  return segment.x == myHead.x && segment.y == myHead.y-1;
}

const isLeft = (segment, myHead) => {
  return segment.x == myHead.x-1 && segment.y == myHead.y;
}

const isRight = (segment, myHead) => {
  return segment.x == myHead.x+1 && segment.y == myHead.y;
}

const isOtherHeadUpLeft = (otherHead, myHead) => {
  return otherHead.x == myHead.x-1 && otherHead.y == myHead.y+1;
}

const isOtherHeadUpRight = (otherHead, myHead) => {
  return otherHead.x == myHead.x+1 && otherHead.y == myHead.y+1;
}

const isOtherHeadDownLeft = (otherHead, myHead) => {
  return otherHead.x == myHead.x-1 && otherHead.y == myHead.y-1;
}

const isOtherHeadDownRight = (otherHead, myHead) => {
  return otherHead.x == myHead.x+1 && otherHead.y == myHead.y-1;
}

const isPosWithinBounds = (pos, board) => {
  return 0 <= pos.x && pos.x < board.width && 0 <= pos.y && pos.y < board.height;
}

const manhattanDistance = (a, b) => {
  return Math.abs(b.x-a.x) + Math.abs(b.y-a.y);
}

const isSnakeNearFood = (snake, food, radius) => {
  return food.some((foo) => manhattanDistance(snake.head, foo) <= radius);
}

const isNearOtherDangerousHead = (pos, forSnake ,board, radius) => {
  return board.snakes.some(
    (snake) => snake.id != forSnake.id &&
    snake.length >= forSnake.length &&
    manhattanDistance(pos, snake.head) <= radius
  );
}

const isTailStacked = (snake) => {
  const secondLast = snake.body[snake.body.length-2];
  const tail = snake.body[snake.body.length-1];
  return secondLast.x == tail.x && secondLast.y == tail.y;
}

const isTail = (index, snake) => {
  return (index == snake.body.length-2 && isTailStacked(snake)) ||
  index == snake.body.length-1;
}

const getAreaAtPos = (pos, forSnake, board) => {
  if (!isPosWithinBounds(pos, board)) return 0;
  for (const snake of board.snakes) {
    for (const index in snake.body) {
      const segment = snake.body[index];
      if (segment.x == pos.x && segment.y == pos.y) {
        if (isTail(index, snake) && !(manhattanDistance(forSnake.head, segment) <= 1 && isTailStacked(snake))) {
          return isNearOtherDangerousHead(pos, forSnake, board, 2) ? 1 : snake.body.length;
        }
        return 0;
      }
    }
  }
  return 1;
}

const expandPosition = (pos) => {
  return [
    new Position(pos.x, pos.y + 1),
    new Position(pos.x, pos.y -1),
    new Position(pos.x + 1, pos.y),
    new Position(pos.x - 1, pos.y),
  ];
}

// implemented as flood fill
const getAreaOfFreedom = (forSnake, board, move) => {
  const headPos = new Position(forSnake.head.x, forSnake.head.y);
  let initial;
  switch(move) {
    case 'up': initial = new Position(headPos.x, headPos.y+1); break;
    case 'down': initial = new Position(headPos.x, headPos.y-1); break;
    case 'left': initial = new Position(headPos.x-1, headPos.y); break;
    case 'right': initial = new Position(headPos.x+1, headPos.y); break;
  }
  const frontier = [initial];
  let area = 0;
  const reached = new Set();
  reached.add(JSON.stringify(initial));
  let numSearched = 0;
  while (frontier.length) {
    // only flood fill enough to gaurantee safety
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

const getBasicSafeMoves = (forSnake, board) => {
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
        (isTail(i, snake) && !isSnakeNearFood(snake, board.food, 1))
    )
  );
  possibleMoves.down = possibleMoves.down && snakes.every(
    (snake) => snake.body.every(
      (segment, i) => !isDown(segment, forSnake.head) ||
      (isTail(i, snake) && !isSnakeNearFood(snake, board.food, 1))
    )
  );
  possibleMoves.left = possibleMoves.left && snakes.every(
    (snake) => snake.body.every(
      (segment, i) => !isLeft(segment, forSnake.head) ||
      (isTail(i, snake) && !isSnakeNearFood(snake, board.food, 1))
    )
  );
  possibleMoves.right = possibleMoves.right && snakes.every(
    (snake) => snake.body.every(
      (segment, i) => !isRight(segment, forSnake.head) ||
      (isTail(i, snake) && !isSnakeNearFood(snake, board.food, 1))
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

const canAreaTrapSnake = (area, snake) => {
  return area < snake.length+2; // 2 is just an arbitrary buffer for food
}

const getAdvancedSafeMoves = (forSnake, board) => {
  const possibleMoves = new MovesObject(true, true, true, true);
  const moves = Object.keys(possibleMoves);
  const area = new MovesObject(-1, -1, -1, -1);
  if (!forSnake) return {
    idealMoves: [],
    safeMoves: moves,
    area
  };
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
    riskyMoves,
    idealMoves,
    safeMoves: idealMoves.length ? idealMoves : moves.filter((key) => possibleMoves[key]),
    area
  };
}

const getSafeMoves = (gameState) => {
  return getAdvancedSafeMoves(gameState.you, gameState.board);
}

module.exports = {
  MovesObject,
  isPosWithinBounds,
  manhattanDistance,
  getBasicSafeMoves,
  getAdvancedSafeMoves,
  getSafeMoves
}