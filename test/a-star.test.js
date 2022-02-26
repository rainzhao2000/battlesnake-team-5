const { Node, Frontier } = require('../src/a-star')

describe('Min Priority Queue', () => {
  test('should return min', () => {
    const unorderedSequence = [7, 4, 5, 9, 2, 10, 8, 1, 3, 6];
    const evalFn = (node) => node.pathCost;
    const pq = new Frontier(evalFn);
    for (const val of unorderedSequence) {
      pq.insert(new Node(null, null, null, val));
    }
    const orderedSequence = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    for (const val of orderedSequence) {
      expect(evalFn(pq.pop())).toBe(val);
    }
  })
})