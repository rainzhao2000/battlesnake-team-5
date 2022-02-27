// reference: Chapter 3 of Russell, S. J., Norvig, P., & Chang, M.-W. (2021). Artificial Intelligence: A modern approach. Pearson.

const { getSafeMoves } = require('./safe-moves');

function didEatFood(newHead, food) {
  for (const [i, foo] of food.entries()) {
    if (newHead.x == foo.x && newHead.y == foo.y) {
      return { foodIdx: i };
    }
  }
  return false;
}

class Problem {
  initial;
  constructor(state) {
    this.initial = state;
  }
  getActions(state) {
    return getSafeMoves(state);
  }
  // simulate the next game state
  getResult(state, action) {
    // assume no new food
    const newBoard = JSON.parse(JSON.stringify(state.board));
    const me = JSON.parse(JSON.stringify(state.you));
    // update your head pos
    switch (action) {
      case 'up': me.head.y += 1; break;
      case 'down': me.head.y -= 1; break;
      case 'left': me.head.x -= 1; break;
      case 'right': me.head.x += 1; break;
    }
    // update all snakes before collision
    for (const [i, snake] of state.board.snakes.entries()) {
      const newSnake = newBoard.snakes[i];
      // assume no intelligence i.e naively move other snake heads forward
      if (snake.id !== me.id) {
        if (snake.head.y == snake.body[0].y+1) { // moving up
          newSnake.head.y += 1;
        } else if (snake.head.y == snake.body[0].y-1) { // moving down
          newSnake.head.y -= 1;
        } else if (snake.head.x == snake.body[0].x-1) { // moving left
          newSnake.head.x -= 1;
        } else if (snake.head.x == snake.body[0].x+1) { // moving right
          newSnake.head.x += 1;
        }
      }
      // check if food was eaten
      const ateFood = didEatFood(newSnake.head, state.board.food);
      if (ateFood) {
        // remove eaten food and increase length
        newBoard.food.splice(ateFood.foodIdx, 1);
        newSnake.length += 1;
        newSnake.health = 100;
      } else {
        // remove last body segment
        newSnake.body.pop();
        newSnake.health -= 1;
        if (newSnake.health == 0) {
          // kill snake immediately
          newBoard.snakes.splice(i, 1);
          continue;
        }
      }
      // add new body segment where head was
      newSnake.body.unshift(snake.head);
    }
    // handle snake collisions
    for (const snake of newBoard.snakes) {
      for (const otherSnake of newBoard.snakes) {
        if (snake.markedForDeath) break;
        if (snake.head.x == otherSnake.head.x && snake.head.y == otherSnake.head.y) {
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
        for (const segment of otherSnake.body) {
          if (snake.head.x == segment.x && snake.head.y == segment.y) {
            snake.markedForDeath = true;
            break;
          }
        }
      }
    }
    // kill snakes marked for death
    newBoard.snakes = newBoard.snakes.filter((snake) => !snake.markedForDeath);
    return { board: newBoard, you: me };
  }
  getActionCost(state, action, newState) {
    // temporary naive assumption
    return 1;
  }
  isGoal(state) {
    // temporary naive goal
    return state.board.food.some((foo) => {
      const dx = Math.abs(foo.x - state.you.head.x);
      const dy = Math.abs(foo.y - state.you.head.y);
      return dx <= 1 && dy == 0 || dx == 0 && dy <= 1;
    });
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
    return this.#arr.length === 0;
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
    process.stdout.write('Heap:\n');
    let level = 0;
    let sum = 0;
    for (const i in this.#arr) {
      process.stdout.write(`${this.evalFn(this.#arr[i])}\t`);
      if (i == sum) {
        process.stdout.write('\n');
        level++;
        sum += Math.pow(2, level);
      }
    }
    process.stdout.write('\n');
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

function expand(problem, node) {
  const s = node.state;
  return problem.getActions(s).map((action) => {
    const newS = problem.getResult(s, action);
    const cost = node.pathCost + problem.getActionCost(s, action, newS);
    return new Node(newS, node, action, cost);
  });
}

function bestFirstSearch(problem, evalFn) {
  let node = new Node(problem.initial);
  const frontier = new MinHeap(evalFn, node);
  const reached = new Map();
  reached.set(problem.initial, node);
  while (!frontier.isEmpty()) {
    node = frontier.pop();
    if (problem.isGoal(node.state)) return node;
    for (const child of expand(problem, node)) {
      const s = child.state;
      if (!reached.has(s) || child.pathCost < reached.get(s).pathCost) {
        reached.set(s, child);
        frontier.insert(child);
      }
    }
  }
  throw 'failure';
}

function aStarSearch(gameState) {
  const problem = new Problem(gameState);
  try {
    const goal = bestFirstSearch(problem, (node) => {
      return node.pathCost// + heuristicCost(node);
    });
    let node = goal;
    while (node.parent) {
      node = node.parent;
    }
    return { move: node.action };
  } catch (err) {
    console.error(err);
    const actions = problem.getActions(problem.initial);
    return {
        move: actions[Math.floor(Math.random() * actions.length)]
    };
  }
}

module.exports = {
  Problem: Problem,
  Node: Node,
  MinHeap: MinHeap,
  bestFirstSearch: bestFirstSearch,
  aStarSearch: aStarSearch
}