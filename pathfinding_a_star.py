import heapq
import time
import math
import random

class Node:
    def __init__(self, x, y, cost, parent=None):
        self.x = x
        self.y = y
        self.cost = cost
        self.parent = parent
        self.g = 0
        self.h = 0
        self.f = 0

    def __lt__(self, other):
        return self.f < other.f

def heuristic(node1, node2):
    # Euclidean distance
    return math.hypot(node1.x - node2.x, node1.y - node2.y)

def get_neighbors(node, grid, width, height):
    neighbors = []
    directions = [(0, 1), (1, 0), (0, -1), (-1, 0), (1, 1), (-1, -1), (1, -1), (-1, 1)]
    for dx, dy in directions:
        nx, ny = node.x + dx, node.y + dy
        if 0 <= nx < width and 0 <= ny < height and grid[ny][nx] == 0:
            neighbors.append(Node(nx, ny, 1))
    return neighbors

def a_star(start_coord, goal_coord, grid, width, height):
    start_node = Node(*start_coord, 0)
    goal_node = Node(*goal_coord, 0)
    
    open_list = []
    closed_set = set()
    
    heapq.heappush(open_list, start_node)
    
    while open_list:
        current_node = heapq.heappop(open_list)
        closed_set.add((current_node.x, current_node.y))
        
        if current_node.x == goal_node.x and current_node.y == goal_node.y:
            path = []
            while current_node is not None:
                path.append((current_node.x, current_node.y))
                current_node = current_node.parent
            return path[::-1] # Return reversed path
            
        neighbors = get_neighbors(current_node, grid, width, height)
        for neighbor in neighbors:
            if (neighbor.x, neighbor.y) in closed_set:
                continue
                
            neighbor.g = current_node.g + neighbor.cost
            neighbor.h = heuristic(neighbor, goal_node)
            neighbor.f = neighbor.g + neighbor.h
            neighbor.parent = current_node
            
            # Check if neighbor is in open list and if it has a better f value
            # For simplicity, we just push it (Python's heapq doesn't easily support updating values)
            heapq.heappush(open_list, neighbor)
            
    return None # No path found

def main():
    width, height = 50, 50
    # Create grid with random obstacles (0 = free, 1 = obstacle)
    print(f"Generating a {width}x{height} grid for A* pathfinding...")
    grid = [[0 if random.random() > 0.2 else 1 for _ in range(width)] for _ in range(height)]
    
    # Ensure start and goal are free
    start = (0, 0)
    goal = (width - 1, height - 1)
    grid[0][0] = 0
    grid[height - 1][width - 1] = 0
    
    print(f"Starting A* search from {start} to {goal}...")
    start_time = time.perf_counter()
    path = a_star(start, goal, grid, width, height)
    end_time = time.perf_counter()
    
    if path:
        print(f"Path found! Length: {len(path)} steps.")
        print(f"Runtime: {end_time - start_time:.6f} seconds.")
    else:
        print("No path found (blocked by obstacles).")

if __name__ == "__main__":
    main()
