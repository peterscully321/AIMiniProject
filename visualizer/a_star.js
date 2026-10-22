/**
 * A* Pathfinding Algorithm Engine
 * Faithful to pathfinding_a_star.py with step generator support for visualization.
 */

class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  push(node) {
    this.heap.push(node);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._sinkDown(0);
    }
    return top;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  size() {
    return this.heap.length;
  }

  _bubbleUp(index) {
    const node = this.heap[index];
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIdx];
      if (node.f >= parent.f) break;
      this.heap[index] = parent;
      index = parentIdx;
    }
    this.heap[index] = node;
  }

  _sinkDown(index) {
    const length = this.heap.length;
    const node = this.heap[index];

    while (true) {
      let leftChildIdx = 2 * index + 1;
      let rightChildIdx = 2 * index + 2;
      let swapIdx = null;

      if (leftChildIdx < length) {
        if (this.heap[leftChildIdx].f < node.f) {
          swapIdx = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        if (
          (swapIdx === null && this.heap[rightChildIdx].f < node.f) ||
          (swapIdx !== null && this.heap[rightChildIdx].f < this.heap[leftChildIdx].f)
        ) {
          swapIdx = rightChildIdx;
        }
      }

      if (swapIdx === null) break;
      this.heap[index] = this.heap[swapIdx];
      index = swapIdx;
    }
    this.heap[index] = node;
  }
}

class AStarNode {
  constructor(x, y, cost = 1, parent = null) {
    this.x = x;
    this.y = y;
    this.cost = cost;
    this.parent = parent;
    this.g = 0;
    this.h = 0;
    this.f = 0;
  }
}

const Heuristics = {
  euclidean: (n1, n2) => Math.hypot(n1.x - n2.x, n1.y - n2.y),
  manhattan: (n1, n2) => Math.abs(n1.x - n2.x) + Math.abs(n1.y - n2.y),
  chebyshev: (n1, n2) => Math.max(Math.abs(n1.x - n2.x), Math.abs(n1.y - n2.y)),
  octile: (n1, n2) => {
    const dx = Math.abs(n1.x - n2.x);
    const dy = Math.abs(n1.y - n2.y);
    return Math.SQRT2 * Math.min(dx, dy) + Math.abs(dx - dy);
  }
};

/**
 * Generator that yields search progress events:
 * - 'open': node added to open set
 * - 'visit': node popped from open set and placed in closed set
 * - 'path': shortest path found
 * - 'exhausted': open set empty, no path
 */
function* aStarSearchGenerator(startCoord, goalCoord, grid, width, height, options = {}) {
  const heuristicFn = Heuristics[options.heuristic] || Heuristics.euclidean;
  const allowDiagonals = options.allowDiagonals !== false;

  const directions = allowDiagonals
    ? [
        [0, 1], [1, 0], [0, -1], [-1, 0],
        [1, 1], [-1, -1], [1, -1], [-1, 1]
      ]
    : [
        [0, 1], [1, 0], [0, -1], [-1, 0]
      ];

  const startNode = new AStarNode(startCoord.x, startCoord.y, 0);
  const goalNode = new AStarNode(goalCoord.x, goalCoord.y, 0);

  startNode.h = heuristicFn(startNode, goalNode);
  startNode.f = startNode.g + startNode.h;

  const openQueue = new PriorityQueue();
  // Map of "x,y" => lowest g cost recorded
  const gCosts = new Map();
  // Set of "x,y" in closed set
  const closedSet = new Set();
  // Map of "x,y" to node reference for inspector
  const nodeMap = new Map();

  const key = (x, y) => `${x},${y}`;

  openQueue.push(startNode);
  gCosts.set(key(startNode.x, startNode.y), 0);
  nodeMap.set(key(startNode.x, startNode.y), startNode);

  yield {
    type: 'init',
    startNode,
    goalNode,
    nodeMap
  };

  while (!openQueue.isEmpty()) {
    const current = openQueue.pop();
    const currKey = key(current.x, current.y);

    // If already closed with a better or equal cost, skip
    if (closedSet.has(currKey)) {
      continue;
    }

    closedSet.add(currKey);

    yield {
      type: 'visit',
      current,
      openCount: openQueue.size(),
      closedCount: closedSet.size()
    };

    // Goal Check
    if (current.x === goalNode.x && current.y === goalNode.y) {
      const path = [];
      let temp = current;
      let totalCost = 0;
      while (temp !== null) {
        path.push({ x: temp.x, y: temp.y, g: temp.g, f: temp.f });
        if (temp.parent) {
          totalCost += (temp.x !== temp.parent.x && temp.y !== temp.parent.y) ? Math.SQRT2 : 1;
        }
        temp = temp.parent;
      }
      path.reverse();
      yield {
        type: 'found',
        path,
        totalCost,
        steps: path.length,
        closedCount: closedSet.size()
      };
      return;
    }

    // Neighbors
    for (const [dx, dy] of directions) {
      const nx = current.x + dx;
      const ny = current.y + dy;

      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (grid[ny][nx] === 1) continue; // Obstacle

      // Corner-cutting check for diagonal moves: avoid jumping through touching diagonal corners
      if (dx !== 0 && dy !== 0) {
        if (grid[current.y][nx] === 1 && grid[ny][current.x] === 1) {
          continue;
        }
      }

      const neighborKey = key(nx, ny);
      if (closedSet.has(neighborKey)) continue;

      const stepCost = (dx !== 0 && dy !== 0) ? Math.SQRT2 : 1;
      const tentativeG = current.g + stepCost;

      const prevG = gCosts.get(neighborKey);
      if (prevG === undefined || tentativeG < prevG) {
        gCosts.set(neighborKey, tentativeG);

        const neighborNode = new AStarNode(nx, ny, stepCost, current);
        neighborNode.g = tentativeG;
        neighborNode.h = heuristicFn(neighborNode, goalNode);
        neighborNode.f = neighborNode.g + neighborNode.h;

        nodeMap.set(neighborKey, neighborNode);
        openQueue.push(neighborNode);

        yield {
          type: 'open',
          node: neighborNode,
          openCount: openQueue.size()
        };
      }
    }
  }

  yield {
    type: 'exhausted',
    closedCount: closedSet.size()
  };
}
