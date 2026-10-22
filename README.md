# AI Mini Projects 🤖

A collection of standalone problem domains implementing core Artificial Intelligence algorithms in Python, focusing on pathfinding, graph traversal, and game trees.

🌐 **Live Interactive Visualizer:** [https://peterscully321.github.io/AIMiniProject/](https://peterscully321.github.io/AIMiniProject/)

## 🌟 Key Implementations

- **A* Pathfinding (`pathfinding_a_star.py`):** Implements the A* search algorithm using the Euclidean distance heuristic to find the shortest path in a 2D grid with randomly generated obstacles.
- **Graph Traversal (`graph_bfs_dfs.py`):** Implements Breadth-First Search (BFS) and Depth-First Search (DFS). Compares algorithm runtimes on randomly generated connected graphs of ~300 nodes.
- **Game Trees (`game_minimax.py`):** Implements the Minimax algorithm with and without Alpha-Beta pruning on simulated game trees. 

## 📊 Performance Metrics

- **Graph Algorithms:** Compared runtimes of BFS and DFS on graphs with ~300 nodes.
- **Alpha-Beta Pruning:** On simulated depth-6, branching-factor-4 game trees with random leaf values, Alpha-Beta pruning reduced Minimax node evaluations by ~74% on average (66–82% across the middle 90% of 2,000 random trials). A single run of `game_minimax.py` varies within that range.

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- pip (Python package installer)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/peterscully321/AIMiniProject.git
   cd AIMiniProject
   ```

2. **Set up a Virtual Environment (Optional but recommended)**
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

### Running the Projects

You can run each standalone script to see the algorithm in action and review the performance metrics.

**1. Run A* Pathfinding (CLI):**
```bash
python pathfinding_a_star.py
```

**2. Launch Interactive A* Web Visualizer (GUI):**
```bash
python run_visualizer.py
```
*Or open `visualizer/index.html` directly in your browser.*

**3. Compare BFS and DFS on ~300 Node Graph:**
```bash
python graph_bfs_dfs.py
```

**4. Evaluate Minimax Alpha-Beta Pruning (~74% average reduction):**
```bash
python game_minimax.py
```

## 📂 Project Structure

```text
AIMiniProject/
├── pathfinding_a_star.py  # A* algorithm implementation
├── graph_bfs_dfs.py       # BFS and DFS runtime comparisons
├── game_minimax.py        # Minimax and Alpha-Beta pruning evaluations
├── run_visualizer.py      # Local launcher for the A* web visualizer
├── visualizer/            # Interactive A* visualizer (HTML, CSS, JavaScript)
├── requirements.txt       # Dependencies (networkx, matplotlib)
└── README.md              # Project documentation
```
