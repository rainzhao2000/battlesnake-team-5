// reference: Chapter 3 of Russell, S. J., Norvig, P., & Chang, M.-W. (2021). Artificial Intelligence: A modern approach. Pearson.

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

// priority queue implemented as min-heap
class Frontier {
  evalFn;
  #arr;
  #rootIndex = 0;
  constructor(evalFn, initialNode) {
    this.evalFn = evalFn;
    this.#arr = [initialNode];
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
    if (!isValidIndex(i)) return null;
    return 2*i+1;
  }
  // right child of node i
  rightIndex(i) {
    if (!isValidIndex(i)) return null;
    return 2*i+2;
  }
  // parent of node i
  parentIndex(i) {
    if (!isValidIndex(i)) return null;
    return (i-1)/2;
  }
  lastIndex() {
    return this.#arr.length-1;
  }
  isLeaf(i) {
    return this.leftIndex(i) === null && this.rightIndex(i) === null;
  }
  fixUp(k) {
    let parentIdx = this.parentIndex(k);
    while (parentIdx !== null && this.#arr[parentIdx].pathCost > this.#arr[k].pathCost) {
      this.swap(k, parentIdx);
      k = parentIdx;
    }
  }
  fixDown(k) {
    while (!this.isLeaf(k)) {
      // Find the child with the larger key
      const leftIdx = this.leftIndex(k);
      const rightIdx = this.rightIndex(k);
      if (leftIdx !== this.lastIndex() && this.#arr[rightIdx].pathCost < this.#arr[leftIdx].pathCost) {
        leftIdx = rightIdx;
      }
      if (this.#arr[k].pathCost <= this.#arr[leftIdx].pathCost) break;
      this.swap(leftIdx, k);
      k = leftIdx;
    }
  }
}

function expand(problem, node) {
  const s = node.state;
  return problem.getActions(s).map((action) => {
    const s_new = problem.getResult(s, action);
    const cost = node.pathCost + problem.getActionCost(s, action, s_new);
    return new Node(s_new, node, action, cost);
  });
}

function bestFirstSearch(problem, evalFn) {
  let node = new Node(problem.initial);
  const frontier = new Frontier(evalFn, node);
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

module.exports = {
  search: bestFirstSearch
}