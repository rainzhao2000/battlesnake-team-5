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

// priority queue implemented as binary heap
class Frontier {
  isEmpty() {}
  pop() {}
  top() {}
  insert() {}
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