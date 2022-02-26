const { Node, Frontier } = require('../src/a-star')

describe('Min Priority Queue', () => {
  test('should return min', () => {
    const unorderedSequence = [7, 4, 5, 9, 2, 10, 8, 1, 3, 6];
    const pq = new Frontier((node) => node.pathCost, new Node(null, null, null, unorderedSequence[0]));
    for (const val of unorderedSequence.slice(1)) {
      pq.insert(new Node(null, null, null, val));
    }
    const orderedSequence = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    for (const val of orderedSequence) {
      expect(pq.pop().pathCost).toBe(val);
    }
  })
})