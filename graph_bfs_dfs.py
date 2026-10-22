import time
import networkx as nx
import random
import matplotlib.pyplot as plt

def generate_random_graph(num_nodes=300, edge_prob=0.05):
    """Generates a random connected graph with given number of nodes."""
    while True:
        G = nx.erdos_renyi_graph(num_nodes, edge_prob)
        if nx.is_connected(G):
            return G

def bfs(graph, start, goal):
    """Breadth-First Search"""
    visited = set()
    queue = [[start]]
    
    if start == goal:
        return [start]
        
    while queue:
        path = queue.pop(0)
        node = path[-1]
        
        if node not in visited:
            neighbors = graph.neighbors(node)
            for neighbor in neighbors:
                new_path = list(path)
                new_path.append(neighbor)
                queue.append(new_path)
                
                if neighbor == goal:
                    return new_path
            visited.add(node)
    return None

def dfs(graph, start, goal):
    """Depth-First Search"""
    visited = set()
    stack = [[start]]
    
    if start == goal:
        return [start]
        
    while stack:
        path = stack.pop()
        node = path[-1]
        
        if node not in visited:
            neighbors = graph.neighbors(node)
            for neighbor in neighbors:
                new_path = list(path)
                new_path.append(neighbor)
                stack.append(new_path)
                
                if neighbor == goal:
                    return new_path
            visited.add(node)
    return None

def main():
    print("Generating random connected graph with ~300 nodes...")
    G = generate_random_graph(300, 0.05)
    print(f"Graph generated: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges.\n")
    
    start_node = list(G.nodes)[0]
    goal_node = list(G.nodes)[-1]
    
    print(f"Finding path from node {start_node} to node {goal_node}...")
    
    # Measure BFS
    start_time = time.perf_counter()
    bfs_path = bfs(G, start_node, goal_node)
    bfs_time = time.perf_counter() - start_time
    
    # Measure DFS
    start_time = time.perf_counter()
    dfs_path = dfs(G, start_node, goal_node)
    dfs_time = time.perf_counter() - start_time
    
    print("-" * 40)
    print("BFS Performance:")
    print(f"Path length: {len(bfs_path) if bfs_path else 0}")
    print(f"Runtime: {bfs_time:.6f} seconds")
    print("-" * 40)
    print("DFS Performance:")
    print(f"Path length: {len(dfs_path) if dfs_path else 0}")
    print(f"Runtime: {dfs_time:.6f} seconds")
    print("-" * 40)

if __name__ == "__main__":
    main()
