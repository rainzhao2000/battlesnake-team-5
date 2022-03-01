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

function printState({ board, you }) {
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
        } catch (err) {}
      }
      try {
        output[board.height-1-snake.head.y][snake.head.x] = boxChar(COLORS.FgYellow);
      } catch (err) {}
    }
  }
  // print you
  for (const segment of you.body) {
    try {
      output[board.height-1-segment.y][segment.x] = boxChar(COLORS.FgGreen);
    } catch (err) {}
  }
  try {
    output[board.height-1-you.head.y][you.head.x] = boxChar(COLORS.FgWhite);
  } catch (err) {}
  console.error('-----------------------');
  for (const row of output) {
    for (const text of row) {
      process.stderr.write(`${text} `);
    }
    process.stderr.write('\n');
  }
  process.stderr.write('\n');
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

function getActions(state) {
  return getSafeMoves(state);
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
      if (snake.head.x == snake.body[1].x && snake.head.y == snake.body[1].y+1) { // moving up
        newSnake.head.y += 1;
      } else if (snake.head.x == snake.body[1].x && snake.head.y == snake.body[1].y-1) { // moving down
        newSnake.head.y -= 1;
      } else if (snake.head.x == snake.body[1].x-1 && snake.head.y == snake.body[1].y) { // moving left
        newSnake.head.x -= 1;
      } else if (snake.head.x == snake.body[1].x+1 && snake.head.y == snake.body[1].y) { // moving right
        newSnake.head.x += 1;
      } else {
        throw ['fuc> ', snake.head, snake.body];
      }
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
  const you = structuredClone(newBoard.snakes.find((snake) => snake.id == state.you.id));
  // kill snakes marked for death
  newBoard.snakes = newBoard.snakes.filter((snake) => !snake.markedForDeath);
  return new State({ board: newBoard, you });
}

function getActionCost(state, action, newState) {
  // temporary naive assumption
  return 1;
}

function isGoal(node) {
  // food and escape goal
  return node.state.board.food.some(
    (foo) => foo.x == node.state.you.head.x && foo.y == node.state.you.head.y
  ) && hasEscape(node);
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
      // Find the child with the larger key
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
    const newS = getResult(s, action);
    const cost = node.pathCost + getActionCost(s, action, newS);
    return new Node(newS, node, action, cost);
  });
}

function bestFirstSearch(state, evalFn, aboutToTimeout) {
  let node = new Node(state, null, null, 0);
  const frontier = new MinHeap(evalFn, node);
  const reached = new Map();
  reached.set(state, node);
  let numSearched = 0;
  while (!frontier.isEmpty()) {
    node = frontier.pop();
    if (aboutToTimeout()) {
      console.error(`search timeout | searched ${numSearched} states`);
      return node;
    }
    numSearched += 1;
    const children = expand(node);
    if (children.length == 0) continue; // dead end
    if (isGoal(node)) return node;
    for (const child of children) {
      const s = child.state;
      if (!reached.has(s) || child.pathCost < reached.get(s).pathCost) {
        reached.set(s, child);
        frontier.insert(child);
      }
    }
  }
  throw `no solution | searched ${numSearched} states`;
}

function randomMove(gameState) {
  console.error('moving randomly...');
  const actions = getActions(new State(gameState));
  return {
      move: actions[Math.floor(Math.random() * actions.length)]
  };
}

function getTimeout() {
  const startTime = new Date();
  return () => {
    const currentTime = new Date();
    return currentTime-startTime > 200;
  }
}

function manhattanDistance(a, b) {
  return Math.abs(b.x-a.x) + Math.abs(b.y-a.y);
}

function heuristicCost(node) {
  const maxDistance = node.state.board.width + node.state.board.height;
  if (!node.state.you) return maxDistance; // we died
  // manhattan distance to nearest food
  if (heuristicCost.nearestFood) { // cached nearest food
    return manhattanDistance(node.state.you.head, heuristicCost.nearestFood);
  }
  let minDistance = maxDistance;
  for (const foo of node.state.board.food) {
    const d = manhattanDistance(node.state.you.head, foo);
    if (d < minDistance) {
      minDistance = d;
      heuristicCost.nearestFood = foo;
    }
  }
  return minDistance;
}

function aStarSearch(gameState) {
  const goal = bestFirstSearch(new State(gameState), (node) => {
    return /*node.pathCost + */heuristicCost(node);
  }, getTimeout());
  // backtrack from goal to find the action taken
  // let pathToGoal = [goal.state]; // for debugging
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

module.exports = {
  State: State,
  Node: Node,
  MinHeap: MinHeap,
  bestFirstSearch: bestFirstSearch,
  randomMove: randomMove,
  aStarSearch: aStarSearch
}