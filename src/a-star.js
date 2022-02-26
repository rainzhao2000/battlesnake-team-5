// reference: Chapter 3 of Russell, S. J., Norvig, P., & Chang, M.-W. (2021). Artificial Intelligence: A modern approach. Pearson.

const { getSafeMoves } = require('./safe-moves');

class Problem {
  initial;
  constructor(state) {
    this.initial = state;
  }
  getActions(state) {
    return getSafeMoves(state);
  }
  // simulate next turn with same food positions
  getResult(state, action) {
    const boardNew = structuredClone(state.board);
    const youNew = structuredClone(state.you);
    // update your head pos
    const stateNew = { boardNew, youNew };
  }
  getActionCost(state, action, stateNew) {}
  isGoal(state) {}
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
    const sNew = problem.getResult(s, action);
    const cost = node.pathCost + problem.getActionCost(s, action, sNew);
    return new Node(sNew, node, action, cost);
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
      return node.pathCost// + heuristic(node);
    });
    return goal;
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