import math
import time

class GameTree:
    """A simulated game tree to evaluate Minimax with Alpha-Beta pruning."""
    def __init__(self, depth, branching_factor):
        self.depth = depth
        self.branching_factor = branching_factor
        self.nodes_evaluated = 0

    def heuristic_value(self, depth, is_maximizing):
        """Simulate a heuristic evaluation at a leaf node."""
        import random
        return random.randint(-100, 100)

    def minimax(self, depth, is_maximizing):
        """Standard Minimax algorithm without pruning."""
        self.nodes_evaluated += 1
        
        if depth == 0:
            return self.heuristic_value(depth, is_maximizing)
            
        if is_maximizing:
            best_val = -math.inf
            for _ in range(self.branching_factor):
                val = self.minimax(depth - 1, False)
                best_val = max(best_val, val)
            return best_val
        else:
            best_val = math.inf
            for _ in range(self.branching_factor):
                val = self.minimax(depth - 1, True)
                best_val = min(best_val, val)
            return best_val

    def alphabeta(self, depth, alpha, beta, is_maximizing):
        """Minimax algorithm with Alpha-Beta pruning."""
        self.nodes_evaluated += 1
        
        if depth == 0:
            return self.heuristic_value(depth, is_maximizing)
            
        if is_maximizing:
            best_val = -math.inf
            for _ in range(self.branching_factor):
                val = self.alphabeta(depth - 1, alpha, beta, False)
                best_val = max(best_val, val)
                alpha = max(alpha, best_val)
                if beta <= alpha:
                    break # Beta cut-off
            return best_val
        else:
            best_val = math.inf
            for _ in range(self.branching_factor):
                val = self.alphabeta(depth - 1, alpha, beta, True)
                best_val = min(best_val, val)
                beta = min(beta, best_val)
                if beta <= alpha:
                    break # Alpha cut-off
            return best_val

def main():
    DEPTH = 6
    BRANCHING_FACTOR = 4
    
    print(f"Simulating Game Tree: Depth={DEPTH}, Branching Factor={BRANCHING_FACTOR}")
    
    # 1. Standard Minimax
    tree1 = GameTree(DEPTH, BRANCHING_FACTOR)
    start_time = time.perf_counter()
    val1 = tree1.minimax(DEPTH, True)
    minimax_time = time.perf_counter() - start_time
    minimax_nodes = tree1.nodes_evaluated
    
    # 2. Alpha-Beta Pruning
    tree2 = GameTree(DEPTH, BRANCHING_FACTOR)
    start_time = time.perf_counter()
    val2 = tree2.alphabeta(DEPTH, -math.inf, math.inf, True)
    ab_time = time.perf_counter() - start_time
    ab_nodes = tree2.nodes_evaluated
    
    # 3. Calculations
    reduction = ((minimax_nodes - ab_nodes) / minimax_nodes) * 100
    
    print("-" * 40)
    print("Standard Minimax:")
    print(f"Nodes Evaluated: {minimax_nodes}")
    print(f"Time Taken: {minimax_time:.6f} seconds")
    
    print("-" * 40)
    print("Minimax with Alpha-Beta Pruning:")
    print(f"Nodes Evaluated: {ab_nodes}")
    print(f"Time Taken: {ab_time:.6f} seconds")
    
    print("-" * 40)
    print(f"Evaluation Reduction: {reduction:.2f}%")
    print("(Leaf values are random, so the reduction varies from run to run.)")
    
if __name__ == "__main__":
    main()
