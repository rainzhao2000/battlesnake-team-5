// reference: Chapter 3 of Russell, S. J., Norvig, P., & Chang, M.-W. (2021). Artificial Intelligence: A modern approach. Pearson.

const { State, Node, COLORS, getOutputGrid, printGrid, printState } = require('./state');
const { Position, MovesObject, isPosWithinBounds, manhattanDistance, getBasicSafeMoves, getAdvancedSafeMoves, getSafeMoves } = require('./safe-moves');
const v8 = require('v8');

const structuredClone = obj => {
  return v8.deserialize(v8.serialize(obj));
};

const PATH_COLORS = [COLORS.BgBlue, COLORS.BgWhite, COLORS.BgCyan];
const printSearchPath = (node) => {
  let initial = node;
  while (initial.parent) initial = initial.parent;
  const grid = getOutputGrid(initial.state);
  let curr = node;
  let count = 0;
  while (curr.parent) {
    const row = grid[node.state.board.height-1-curr.state.you.head.y];
    row[curr.state.you.head.x] = `${PATH_COLORS[count%3]}${row[curr.state.you.head.x]}`;
    curr = curr.parent;
    count += 1;
  }
  printGrid(grid);
}

const getTouchingEdges = (head, board) => {
  const touchingEdges = [];
  if (head.x == 0) touchingEdges.push('left');
  if (head.x == board.width-1) touchingEdges.push('right');
  if (head.y == 0) touchingEdges.push('down');
  if (head.y == board.height-1) touchingEdges.push('up');
  return touchingEdges;
}

let corners;
const isNearCorner = (pos) => {
  for (const corner of corners) {
    if (manhattanDistance(pos, corner) <= 1) return true;
  }
  return false;
}

const getGreedyMoves = (forSnake, state) => {
  let nearestGoal = forSnake.body[forSnake.body.length-1]; // default to own tail goal
  let minDistToFood = Number.MAX_SAFE_INTEGER;
  for (const foo of state.board.food) {
    const d = manhattanDistance(forSnake.head, foo);
    if (d < minDistToFood && !foo.consumed) {
      nearestGoal = foo; // override goal with nearest food
      minDistToFood = d;
    }
  }
  // add goal to track our head if within radius
  let headGoal = null;
  const distToHead = manhattanDistance(forSnake.head, state.you.head);
  if (distToHead <= 3 && minDistToFood > 1) headGoal = state.you.head;
  const moves = new MovesObject(false, false, false, false);
  if (nearestGoal.y > forSnake.head.y) moves.up = true;
  else if (nearestGoal.y < forSnake.head.y) moves.down = true;
  if (nearestGoal.x < forSnake.head.x) moves.left = true;
  else if (nearestGoal.x > forSnake.head.x) moves.right = true;
  if (headGoal) {
    if (headGoal.y > forSnake.head.y) moves.up = true;
    else if (headGoal.y < forSnake.head.y) moves.down = true;
    if (headGoal.x < forSnake.head.x) moves.left = true;
    else if (headGoal.x > forSnake.head.x) moves.right = true;
  }
  return moves;
}

const getMaxAreaMove = (moves, area) => {
  let bestMove;
  let maxArea = -1;
  for (const move of moves) {
    if (area[move] > maxArea) {
      bestMove = move;
      maxArea = area[move];
    }
  }
  return bestMove;
}

const getOpponentMove = (forSnake, state) => {
  const greedyMoves = getGreedyMoves(forSnake, state);
  const { safeMoves, area } = getAdvancedSafeMoves(forSnake, state.board);
  let moves;
  // if I'm at board edge, opponents hug wall to simulate trapping me
  const myTouchingEdges = getTouchingEdges(state.you.head, state.board);
  if (myTouchingEdges.length &&
    manhattanDistance(forSnake.head, state.you.head) <= 3 &&
    !isNearCorner(forSnake.head)
  ) {
    const edgeMoves = new MovesObject(true, true, true, true);
    for (const edge of myTouchingEdges) {
      switch (edge) { // avoid moving away from my edge
        case 'up': edgeMoves.down = false; break;
        case 'down': edgeMoves.up = false; break;
        case 'left': edgeMoves.right = false; break;
        case 'right': edgeMoves.false = false; break;
      }
    }
    // avoid head on with us at edge
    if (forSnake.head.x == state.you.head.x) {
      if (forSnake.head.y > state.you.head.y) edgeMoves.down = false;
      else edgeMoves.up = false;
    } else if (forSnake.head.y == state.you.head.y) {
      if (forSnake.head.x < state.you.head.x) edgeMoves.right = false;
      else edgeMoves.left = false;
    }
    moves = myTouchingEdges.filter((move) => safeMoves.includes(move));
    if (!moves.length) moves = Object.keys(greedyMoves).filter(
      (move) => greedyMoves[move] && edgeMoves[move] && safeMoves.includes(move)
    );
  } else { // else assume other snakes pick a random greedy safe move
    moves = Object.keys(greedyMoves).filter((move) => greedyMoves[move] && safeMoves.includes(move));
  }
  return moves.length ? moves[Math.floor(Math.random() * moves.length)] :
    getMaxAreaMove(safeMoves, area);
}

let turn = 0;
const SIMULATED_DEATH = 69;
let simulatedDeaths = 0;

// simulate the next game state
const getResult = (state, action) => {
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
      newSnake.killedSnake = null; // reset tag if search continues
    } else {
      const move = getOpponentMove(snake, state);
      switch (move) {
        case 'up': newSnake.head.y += 1; break;
        case 'down': newSnake.head.y -= 1; break;
        case 'left': newSnake.head.x -= 1; break;
        case 'right': newSnake.head.x += 1; break;
        default: newSnake.markedForDeath = true;
      }
    }
    // remove last body segment
    newSnake.body.pop();
    // add new body segment where head is
    newSnake.body.unshift(structuredClone(newSnake.head));
    // check if food was eaten
    const ateFood = newBoard.food.find((foo) => foo.x == newSnake.head.x && foo.y == newSnake.head.y);
    if (ateFood) {
      // mark eaten food for deletion next tick and increase length
      ateFood.consumed = true;
      newSnake.length += 1;
      newSnake.health = 100;
      newSnake.body.push(structuredClone(newSnake.body[newSnake.body.length-1]));
    } else {
      newSnake.health -= 1;
      if (newSnake.health == 0) {
        newSnake.markedForDeath = true;
      }
    }
  }
  // handle snake collisions
  for (const otherSnake of newBoard.snakes) {
    for (const snake of newBoard.snakes) {
      if (snake.markedForDeath) break;
      // wall collision
      if (!isPosWithinBounds(snake.head, newBoard)) {
        snake.markedForDeath = true;
        break;
      }
      // head on head collision
      if (snake.id != otherSnake.id && snake.head.x == otherSnake.head.x && snake.head.y == otherSnake.head.y) {
        if (snake.length < otherSnake.length) {
          snake.markedForDeath = true;
          if (otherSnake.id == state.you.id) otherSnake.killedSnake = snake.name; // tag for kill goal
        } else if (snake.length > otherSnake.length) {
          otherSnake.markedForDeath = true;
          if (snake.id == state.you.id) snake.killedSnake = otherSnake.name; // tag for kill goal
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
  if (!you) {
    simulatedDeaths += 1;
    throw SIMULATED_DEATH;
  }
  return new State({ board: newBoard, you });
}

const getActionCost = (state, action, newState) => {
  return getTouchingEdges(newState.you.head, newState.board).length ? 2 : 1;
}

const hasEscape = (node) => {
  const me = node.state.you;
  if (node.state.board.snakes.some(
    (snake) => snake.id != me.id &&
      manhattanDistance(me.head, snake.head) <= 2 &&
      (snake.length >= me.length ||
        (getTouchingEdges(me.head, node.state.board).length &&
        !getTouchingEdges(snake.head, node.state.board).length))
  )) return false;
  const { idealMoves, area } = getSafeMoves(node.state);
  const canEscape = idealMoves.length > 0;
  if (canEscape) console.log(me.head, 'has escape:', idealMoves, area);
  return canEscape;
}

const isFoodGoal = (node) => {
  const me = node.state.you;
  const foundGoal = node.state.board.food.some(
    (foo) => foo.x == me.head.x && foo.y == me.head.y
  ) && hasEscape(node);
  if (foundGoal) console.log('found food goal');
  return foundGoal;
}

const isKillGoal = (node) => {
  const foundGoal = node.state.you.killedSnake && hasEscape(node);
  if (foundGoal) console.log(`found kill goal on ${node.state.you.killedSnake}`);
  return !!foundGoal;
}

const isTailGoal = (node) => {
  const me = node.state.you;
  const foundGoal = manhattanDistance(me.head, me.body[me.body.length-1]) <= 1 &&
    hasEscape(node);
  if (foundGoal) console.log('found tail goal');
  return foundGoal;
}

const isFoodOrKillGoal = (node) => {
  return isFoodGoal(node) || isKillGoal(node);
}

const isKillOrTailGoal = (node) => {
  return isKillGoal(node) || isTailGoal(node);
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

const expand = (node) => {
  const s = node.state;
  const { riskyMoves, safeMoves, area } = getSafeMoves(s);
  // if (safeMoves.every((move) => riskyMoves[move])) return [];
  if (!node.parent) console.log(safeMoves, area);
  return safeMoves.map((action) => {
    let newS;
    try {
      newS = getResult(s, action);
    } catch (err) {
      if (err !== SIMULATED_DEATH) console.error(err);
      return null;
    }
    const cost = node.pathCost + getActionCost(s, action, newS);
    return new Node(newS, node, action, cost);
  }).filter((node) => node != null);
}

const bestFirstSearch = (state, isGoal, evalFn, aboutToTimeout) => {
  let node = new Node(state, null, null, 0);
  const frontier = new MinHeap(evalFn, node);
  const reached = new Map();
  reached.set(JSON.stringify(state), node);
  let numSearched = 0;
  while (!frontier.isEmpty()) {
    node = frontier.pop();
    // printState(node.state);
    // printSearchPath(node);
    if (aboutToTimeout()) {
      console.log(`search timeout | searched ${numSearched} states`);
      return node;
    }
    numSearched += 1;
    const children = expand(node);
    if (children.length == 0) continue; // dead end
    if (isGoal(node)) {
      console.log(`found goal | searched ${numSearched} states`);
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

const getTimeout = (tolerance) => {
  const startTime = new Date();
  return () => {
    const currentTime = new Date();
    return currentTime-startTime > tolerance;
  }
}

const isHungry = ({ board, you }) => {
  // let maxLength = 0;
  // for (const snake of board.snakes) {
  //   if (snake.id != you.id && snake.length > maxLength) maxLength = snake.length;
  // }
  // return you.length < maxLength+2 || you.health < 50;
  return true;
}

const setupFoodHeuristicCost = () => {
  let nearestFood;
  return (node) => {
    if (nearestFood) return manhattanDistance(node.state.you.head, nearestFood);
    let minDistance = Number.MAX_SAFE_INTEGER;
    for (const foo of node.state.board.food) {
      const d = manhattanDistance(node.state.you.head, foo);
      if (d < minDistance) {
        nearestFood = foo;
        minDistance = d;
      }
    }
    return minDistance;
  }
}

const tailHeuristicCost = (node) => {
  const me = node.state.you;
  return manhattanDistance(me.head, me.body[me.body.length-1]);
}

const aStarSearch = (gameState) => {
  turn = gameState.turn;
  corners = [
    new Position(0, 0),
    new Position(0, gameState.board.height-1),
    new Position(gameState.board.width-1, 0),
    new Position(gameState.board.width-1, gameState.board.height-1)
  ];
  simulatedDeaths = 0;
  let isGoal;
  let heuristicCost;
  if (isHungry(gameState)) {
    console.log('hungry');
    isGoal = isFoodOrKillGoal;
    heuristicCost = setupFoodHeuristicCost();
  } else {
    console.log('full');
    isGoal = isKillOrTailGoal;
    heuristicCost = tailHeuristicCost;
  }
  const aboutToTimeout = getTimeout(400);
  let goal;
  try {
    goal = bestFirstSearch(
      new State(gameState),
      isGoal,
      (node) => node.pathCost + heuristicCost(node),
      aboutToTimeout
    );
  } catch (err) {
    throw err;
  } finally {
    console.log(`simulated ${simulatedDeaths} deaths`);
  }
  // backtrack from goal to find the action taken
  // const pathToGoal = [goal.state]; // for debugging
  let node = goal;
  while (node.parent && node.parent.parent) {
    node = node.parent;
    // pathToGoal.push(node.state);
  }
  // let j = 0;
  // while (j < 6 && pathToGoal.length) {
  //   printState(pathToGoal.pop());
  //   j += 1;
  // }
  // printSearchPath(goal);
  if (node.action == null) throw 'already at goal';
  return { move: node.action };
}

const defaultMove = (gameState) => {
  const { safeMoves, area } = getSafeMoves(new State(gameState));
  console.log(safeMoves, area);
  console.log('default move to largest area');
  return { move: getMaxAreaMove(safeMoves, area) };
}

module.exports = {
  State,
  Node,
  MinHeap,
  bestFirstSearch,
  aStarSearch,
  defaultMove
}