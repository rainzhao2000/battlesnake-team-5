// reference: Chapter 3 of Russell, S. J., Norvig, P., & Chang, M.-W. (2021). Artificial Intelligence: A modern approach. Pearson.

const { getSafeMoves } = require('./safe-moves');
const v8 = require('v8');

const structuredClone = obj => {
  return v8.deserialize(v8.serialize(obj));
};

class Board {
  width;
  height;
  food;
  // hazards;
  snakes;
  constructor(gameBoard) {
    this.width = gameBoard.width;
    this.height = gameBoard.height;
    this.food = gameBoard.food;
    // this.hazards = gameBoard.hazards;
    this.snakes = gameBoard.snakes;
  }
}

class State {
  board;
  you;
  constructor(gameState) {
    this.board = new Board(gameState.board);
    this.you = gameState.you;
  }
}

class Node {
  state;
  parent;
  action;
  pathCost;
  constructor(state, parent, action, pathCost) {
    this.state = state;
    this.parent = parent;
    this.action = action;
    this.pathCost = pathCost;
  }
}

const COLORS = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",
  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",
  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m"
};

function boxChar(color) {
  return `${color}${String.fromCharCode(9632)}${COLORS.Reset}`;
}

function getOutputGrid({ board, you }) {
  const output = [];
  // print grid
  for (let row = 0; row < board.height; ++row) {
    output.push([]);
    for (let col = 0; col < board.width; ++col) {
      output[row].push(boxChar(COLORS.FgBlack));
    }
  }
  // print food
  for (const foo of board.food) {
    output[board.height-1-foo.y][foo.x] = boxChar(COLORS.FgMagenta);
  }
  // print other snakes
  for (const snake of board.snakes) {
    if (snake.id != you.id) {
      for (const segment of snake.body) {
        try {
          output[board.height-1-segment.y][segment.x] = boxChar(COLORS.FgRed);
        } catch (err) {
          console.error(err);
        }
      }
      try {
        output[board.height-1-snake.head.y][snake.head.x] = boxChar(COLORS.FgYellow);
      } catch (err) {
        console.error(err);
      }
    }
  }
  // print you
  for (const segment of you.body) {
    try {
      output[board.height-1-segment.y][segment.x] = boxChar(COLORS.FgGreen);
    } catch (err) {
      console.error(err);
    }
  }
  try {
    output[board.height-1-you.head.y][you.head.x] = boxChar(COLORS.FgWhite);
  } catch (err) {
    console.error(err);
  }
  return output;
}

function printGrid(grid) {
  console.error('-----------------------');
  for (const row of grid) {
    for (const text of row) {
      process.stderr.write(`${text} `);
    }
    process.stderr.write('\n');
  }
  process.stderr.write('\n');
}

function printState(state) {
  printGrid(getOutputGrid(state));
}

function printSearchPath(node) {
  let initial = node;
  while (initial.parent) initial = initial.parent;
  const grid = getOutputGrid(initial.state);
  let curr = node;
  let count = 0;
  const colors = [COLORS.BgBlue, COLORS.BgWhite, COLORS.BgCyan];
  while (curr.parent) {
    const row = grid[node.state.board.height-1-curr.state.you.head.y];
    row[curr.state.you.head.x] = `${colors[count%3]}${row[curr.state.you.head.x]}`;
    curr = curr.parent;
    count += 1;
  }
  printGrid(grid);
}

function getActions(state) {
  return getSafeMoves(state);
}

function isMovingUp(snake) {
  return snake.head.x == snake.body[1].x && snake.head.y == snake.body[1].y+1;
}

function isMovingDown(snake) {
  return snake.head.x == snake.body[1].x && snake.head.y == snake.body[1].y-1;
}

function isMovingLeft(snake) {
  return snake.head.x == snake.body[1].x-1 && snake.head.y == snake.body[1].y;
}

function isMovingRight(snake) {
  return snake.head.x == snake.body[1].x+1 && snake.head.y == snake.body[1].y;
}

// simulate the next game state
function getResult(state, action) {
  const newBoard = structuredClone(state.board);
  // assume no new food and remove eaten food
  newBoard.food = newBoard.food.filter((foo) => !foo.consumed);
  // update your head pos
  const myHead = structuredClone(state.you.head);
  switch (action) {
    case 'up': myHead.y += 1; break;
    case 'down': myHead.y -= 1; break;
    case 'left': myHead.x -= 1; break;
    case 'right': myHead.x += 1; break;
  }
  // update all snakes before collision
  for (const [i, snake] of state.board.snakes.entries()) {
    const newSnake = newBoard.snakes[i];
    if (snake.id == state.you.id) {
      newSnake.head = myHead;
    } else {
      // assume no intelligence i.e naively move other snake heads forward
      if (isMovingUp(snake)) newSnake.head.y += 1;
      else if (isMovingDown(snake)) newSnake.head.y -= 1;
      else if (isMovingLeft(snake)) newSnake.head.x -= 1;
      else if (isMovingRight(snake)) newSnake.head.x += 1;
      else throw ['fuc> ', snake.head, snake.body];
    }
    // check if food was eaten
    const ateFood = newBoard.food.find((foo) => foo.x == newSnake.head.x && foo.y == newSnake.head.y);
    if (ateFood) {
      // mark eaten food for deletion next tick and increase length
      ateFood.consumed = true;
      newSnake.length += 1;
      newSnake.health = 100;
    } else {
      // remove last body segment
      newSnake.body.pop();
      newSnake.health -= 1;
      if (newSnake.health == 0) {
        newSnake.markedForDeath = true;
        continue;
      }
    }
    // add new body segment where head is
    newSnake.body.unshift(structuredClone(newSnake.head));
  }
  // handle snake collisions
  for (const otherSnake of newBoard.snakes) {
    for (const snake of newBoard.snakes) {
      if (snake.markedForDeath) break;
      // head on head collision
      if (snake.id != otherSnake.id && snake.head.x == otherSnake.head.x && snake.head.y == otherSnake.head.y) {
        if (snake.length < otherSnake.length) {
          snake.markedForDeath = true;
        } else if (snake.length > otherSnake.length) {
          otherSnake.markedForDeath = true;
        } else {
          snake.markedForDeath = true;
          otherSnake.markedForDeath = true;
        }
        break;
      }
      // head on body collision
      for (let j = 1; j < otherSnake.body; ++j) {
        if (snake.head.x == otherSnake.body[j].x && snake.head.y == otherSnake.body[j].y) {
          snake.markedForDeath = true;
          break;
        }
      }
    }
  }
  // kill snakes marked for death
  newBoard.snakes = newBoard.snakes.filter((snake) => !snake.markedForDeath);
  const you = structuredClone(newBoard.snakes.find((snake) => snake.id == state.you.id));
  if (!you) throw 'simulated death';
  return new State({ board: newBoard, you });
}

function getActionCost(state, action, newState) {
  return 1;
}

function hasEscape(node, numEvals = 1) {
  const children = expand(node);
  if (children.length > 1) {
    console.error(`found escape | searched ${numEvals} states`);
    return true;
  }
  if (children.length < 1) {
    console.error(`no escape | searched ${numEvals} states`);
    return false;
  }
  return children.some((child) => hasEscape(child, numEvals+1));
}

function isFoodGoal(node) {
  const me = node.state.you;
  // food and escape goal
  return node.state.board.food.some(
    (foo) => foo.x == me.head.x && foo.y == me.head.y
  ) && hasEscape(node);
}

function isTailGoal(node) {
  const me = node.state.you;
  const dx = me.body[me.length-1].x - me.head.x;
  const dy = me.body[me.length-1].y - me.head.y;
  const tolerance = me.length % 2 == 0 ? 1 : 2;
  return Math.abs(dx) + Math.abs(dy) <= tolerance;
}

class MinHeap {
  evalFn;
  #arr;
  #rootIndex = 0;
  constructor(evalFn, initialNode = undefined) {
    this.evalFn = evalFn;
    this.#arr = initialNode ? [initialNode] : [];
  }
  // interface methods
  isEmpty() {
    return this.#arr.length == 0;
  }
  pop() {
    this.swap(this.#rootIndex, this.lastIndex());
    const result = this.#arr.pop();
    this.fixDown(this.#rootIndex);
    return result;
  }
  top() {
    return this.#arr[this.#rootIndex];
  }
  insert(node) {
    this.#arr.push(node);
    this.fixUp(this.lastIndex());
  }
  // helper methods below this point
  printHeap() {
    process.stderr.write('Heap:\n');
    let level = 0;
    let sum = 0;
    for (const i in this.#arr) {
      process.stderr.write(`${this.evalFn(this.#arr[i])}\t`);
      if (i == sum) {
        process.stderr.write('\n');
        level++;
        sum += Math.pow(2, level);
      }
    }
    process.stderr.write('\n');
  }
  // swap nodes indexed i and j
  swap(i, j) {
    const temp = this.#arr[i];
    this.#arr[i] = this.#arr[j];
    this.#arr[j] = temp;
  }
  isValidIndex(i) {
    return 0 <= i && i < this.#arr.length;
  }
  // left child of node i
  leftIndex(i) {
    const idx = 2 * i + 1;
    if (!this.isValidIndex(idx)) return null;
    return idx;
  }
  // right child of node i
  rightIndex(i) {
    const idx = 2 * i + 2
    if (!this.isValidIndex(idx)) return null;
    return idx;
  }
  // parent of node i
  parentIndex(i) {
    const idx = Math.floor((i - 1) / 2);
    if (!this.isValidIndex(idx)) return null;
    return idx;
  }
  lastIndex() {
    return this.#arr.length - 1;
  }
  isLeaf(i) {
    return this.leftIndex(i) == null && this.rightIndex(i) == null;
  }
  fixUp(k) {
    while (this.parentIndex(k) != null && this.evalFn(this.#arr[this.parentIndex(k)]) > this.evalFn(this.#arr[k])) {
      this.swap(k, this.parentIndex(k));
      k = this.parentIndex(k);
    }
  }
  fixDown(k) {
    while (!this.isLeaf(k)) {
      // Find the child with the smaller key
      let leftIdx = this.leftIndex(k);
      const rightIdx = this.rightIndex(k);
      if (leftIdx != this.lastIndex() && this.evalFn(this.#arr[rightIdx]) < this.evalFn(this.#arr[leftIdx])) {
        leftIdx = rightIdx;
      }
      if (this.evalFn(this.#arr[k]) <= this.evalFn(this.#arr[leftIdx])) break;
      this.swap(leftIdx, k);
      k = leftIdx;
    }
  }
}

function expand(node) {
  const s = node.state;
  return getActions(s).map((action) => {
    let newS;
    try {
      newS = getResult(s, action);
    } catch (err) {
      return null;
    }
    const cost = node.pathCost + getActionCost(s, action, newS);
    return new Node(newS, node, action, cost);
  }).filter((node) => node != null);
}

function bestFirstSearch(state, isGoal, evalFn, aboutToTimeout) {
  let node = new Node(state, null, null, 0);
  const frontier = new MinHeap(evalFn, node);
  const reached = new Map();
  reached.set(JSON.stringify(state), node);
  let numSearched = 0;
  while (!frontier.isEmpty()) {
    node = frontier.pop();
    // printSearchPath(node);
    if (aboutToTimeout()) {
      console.error(`search timeout | searched ${numSearched} states`);
      return node;
    }
    numSearched += 1;
    const children = expand(node);
    if (children.length == 0) continue; // dead end
    if (isGoal(node)) {
      console.error(`found goal | searched ${numSearched} states`);
      return node;
    }
    for (const child of children) {
      const s = JSON.stringify(child.state);
      if (!reached.has(s) || child.pathCost < reached.get(s).pathCost) {
        reached.set(s, child);
        frontier.insert(child);
      }
    }
  }
  throw `no solution | searched ${numSearched} states`;
}

function getTimeout(tolerance) {
  const startTime = new Date();
  return () => {
    const currentTime = new Date();
    return currentTime-startTime > tolerance;
  }
}

function manhattanDistance(a, b) {
  return Math.abs(b.x-a.x) + Math.abs(b.y-a.y);
}

function setupFoodHeuristicCost() {
  let nearestFood;
  return (node) => {
    if (nearestFood) return manhattanDistance(node.state.you.head, nearestFood);
    let minDistance = node.state.board.width + node.state.board.height;
    for (const foo of node.state.board.food) {
      const d = manhattanDistance(node.state.you.head, foo);
      if (d < minDistance) {
        nearestFood = foo;
        minDistance = d;
      }
    }
  }
}

function tailHeuristicCost(node) {
  const me = node.state.you;
  return manhattanDistance(me.head, me.body[me.length-1]);
}

function aStarSearch(gameState) {
  let isGoal;
  let heuristicCost;
  if (gameState.you.health < 70) {
    console.error('hungry');
    isGoal = isFoodGoal;
    heuristicCost = setupFoodHeuristicCost();
  } else {
    console.error('full');
    isGoal = isTailGoal;
    heuristicCost = tailHeuristicCost;
  }
  const aboutToTimeout = getTimeout(400);
  const goal = bestFirstSearch(
    new State(gameState),
    isGoal,
    (node) => /*node.pathCost + */heuristicCost(node),
    aboutToTimeout
  );
  // backtrack from goal to find the action taken
  // const pathToGoal = [goal.state]; // for debugging
  let node = goal;
  while (node.parent && node.parent.parent) {
    node = node.parent;
    // pathToGoal.push(node.state);
  }
  // while (pathToGoal.length) {
  //   printState(pathToGoal.pop());
  // }
  if (node.action == null) throw 'already at goal';
  return { move: node.action };
}

function defaultMove(gameState) {
  // try to move forward, otherwise random
  let move;
  const actions = getActions(new State(gameState));
  console.error('trying to move forward...');
  if (actions.includes('up') && isMovingUp(gameState.you)) move = 'up';
  else if (actions.includes('down') && isMovingDown(gameState.you)) move = 'down';
  else if (actions.includes('left') && isMovingLeft(gameState.you)) move = 'left';
  else if (actions.includes('right') && isMovingRight(gameState.you)) move = 'right';
  else {
    console.error('moving randomly...');
    move = actions[Math.floor(Math.random() * actions.length)];
  }
  return { move };
}

module.exports = {
  State,
  Node,
  MinHeap,
  bestFirstSearch,
  aStarSearch,
  defaultMove
}