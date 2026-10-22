/**
 * Interactive Application Controller for A* Pathfinding Visualizer
 */

(function () {
  // Grid Dimensions (50x50 to match pathfinding_a_star.py)
  const COLS = 50;
  const ROWS = 50;

  // Grid Data: 0 = empty, 1 = obstacle
  let grid = [];
  let startPos = { x: 2, y: 2 };
  let goalPos = { x: COLS - 3, y: ROWS - 3 };

  // Search State Maps
  let openSet = new Set();
  let closedSet = new Set();
  let pathCells = [];
  let nodeLookup = new Map();

  // Execution & Animation Engine
  let activeGenerator = null;
  let isRunning = false;
  let animationFrameId = null;
  let searchCompleted = false;

  // Dragging & Interaction State
  let isPointerDown = false;
  let pointerMode = null; // 'draw-wall', 'erase-wall', 'drag-start', 'drag-goal'
  let hoveredCoord = null;

  // DOM Elements
  const canvas = document.getElementById('gridCanvas');
  const ctx = canvas.getContext('2d');
  const canvasWrapper = document.getElementById('canvasWrapper');

  const btnVisualize = document.getElementById('btnVisualize');
  const btnStep = document.getElementById('btnStep');
  const btnClearPath = document.getElementById('btnClearPath');
  const btnClearWalls = document.getElementById('btnClearWalls');
  const btnResetAll = document.getElementById('btnResetAll');

  const heuristicSelect = document.getElementById('heuristicSelect');
  const movementSelect = document.getElementById('movementSelect');
  const mazeSelect = document.getElementById('mazeSelect');
  const speedSlider = document.getElementById('speedSlider');
  const speedDisplay = document.getElementById('speedDisplay');

  const statusPill = document.getElementById('statusPill');
  const statusText = document.getElementById('statusText');

  const metricStatus = document.getElementById('metricStatus');
  const metricTime = document.getElementById('metricTime');
  const metricLength = document.getElementById('metricLength');
  const metricCost = document.getElementById('metricCost');
  const metricOpen = document.getElementById('metricOpen');
  const metricClosed = document.getElementById('metricClosed');

  const inspCoord = document.getElementById('inspCoord');
  const inspState = document.getElementById('inspState');
  const inspG = document.getElementById('inspG');
  const inspH = document.getElementById('inspH');
  const inspF = document.getElementById('inspF');

  // Dimension scaling
  let cellSize = 16;
  let dpr = window.devicePixelRatio || 1;

  // Speeds config (steps per frame)
  const speedSettings = {
    1: { label: 'Step / Very Slow', stepsPerFrame: 1, intervalMs: 120 },
    2: { label: 'Slow', stepsPerFrame: 2, intervalMs: 40 },
    3: { label: 'Normal', stepsPerFrame: 6, intervalMs: 16 },
    4: { label: 'Fast', stepsPerFrame: 20, intervalMs: 16 },
    5: { label: 'Instant', stepsPerFrame: 999999, intervalMs: 0 }
  };

  function initGrid() {
    grid = [];
    for (let y = 0; y < ROWS; y++) {
      const row = [];
      for (let x = 0; x < COLS; x++) {
        row.push(0);
      }
      grid.push(row);
    }
    clearSearchState();
  }

  function clearSearchState() {
    openSet.clear();
    closedSet.clear();
    pathCells = [];
    nodeLookup.clear();
    activeGenerator = null;
    searchCompleted = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    isRunning = false;
    setStatus('ready', 'Ready');
    updateMetrics({ status: 'Ready', time: 0, length: 0, cost: 0, open: 0, closed: 0 });
    render();
  }

  function setStatus(type, text) {
    statusPill.className = `status-pill ${type}`;
    statusText.textContent = text;
    metricStatus.textContent = text;
  }

  function updateMetrics(data) {
    if (data.status !== undefined) metricStatus.textContent = data.status;
    if (data.time !== undefined) metricTime.textContent = `${data.time.toFixed(2)} ms`;
    if (data.length !== undefined) metricLength.textContent = `${data.length} steps`;
    if (data.cost !== undefined) metricCost.textContent = data.cost.toFixed(2);
    if (data.open !== undefined) metricOpen.textContent = data.open;
    if (data.closed !== undefined) metricClosed.textContent = data.closed;
  }

  function resizeCanvas() {
    const rect = canvasWrapper.getBoundingClientRect();
    const padding = 32;
    const availWidth = rect.width - padding;
    const availHeight = rect.height - padding;

    // Calculate maximum integer or clean cell size that fits
    const cellW = Math.floor(availWidth / COLS);
    const cellH = Math.floor(availHeight / ROWS);
    cellSize = Math.max(10, Math.min(cellW, cellH));

    const totalWidth = cellSize * COLS;
    const totalHeight = cellSize * ROWS;

    dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${totalHeight}px`;

    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);

    render();
  }

  // Color Palette for rendering
  const COLORS = {
    canvasBg: '#090e1a',
    gridBorder: 'rgba(255, 255, 255, 0.05)',
    wall: '#1e293b',
    wallBorder: '#334155',
    open: '#38bdf8',
    openBorder: '#0284c7',
    closed: '#4f46e5',
    closedBorder: '#6366f1',
    path: '#fbbf24',
    pathGlow: 'rgba(251, 191, 36, 0.45)',
    start: '#10b981',
    goal: '#f43f5e'
  };

  function render() {
    ctx.fillStyle = COLORS.canvasBg;
    ctx.fillRect(0, 0, COLS * cellSize, ROWS * cellSize);

    // 1. Draw Grid lines and empty cells
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const px = x * cellSize;
        const py = y * cellSize;
        const key = `${x},${y}`;

        const isWall = grid[y][x] === 1;
        const isClosed = closedSet.has(key);
        const isOpen = openSet.has(key);

        if (isWall) {
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(px, py, cellSize, cellSize);
          ctx.strokeStyle = COLORS.wallBorder;
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
        } else if (isClosed) {
          ctx.fillStyle = COLORS.closed;
          ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
        } else if (isOpen) {
          ctx.fillStyle = COLORS.open;
          ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
        }

        // Grid border
        ctx.strokeStyle = COLORS.gridBorder;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, cellSize, cellSize);
      }
    }

    // 2. Draw Final Path (highlighted cells & center guide-line)
    if (pathCells.length > 0) {
      // Fill path cells
      ctx.fillStyle = COLORS.path;
      for (const pt of pathCells) {
        const px = pt.x * cellSize;
        const py = pt.y * cellSize;
        ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
      }

      // Draw path spline
      ctx.beginPath();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2, Math.floor(cellSize / 4));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 0; i < pathCells.length; i++) {
        const cx = pathCells[i].x * cellSize + cellSize / 2;
        const cy = pathCells[i].y * cellSize + cellSize / 2;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // 3. Draw Start Node
    drawNodeMarker(startPos.x, startPos.y, COLORS.start, 'S');

    // 4. Draw Goal Node
    drawNodeMarker(goalPos.x, goalPos.y, COLORS.goal, 'G');

    // 5. Draw Hover indicator
    if (hoveredCoord) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(
        hoveredCoord.x * cellSize + 0.5,
        hoveredCoord.y * cellSize + 0.5,
        cellSize - 1,
        cellSize - 1
      );
    }
  }

  function drawNodeMarker(x, y, color, label) {
    const cx = x * cellSize + cellSize / 2;
    const cy = y * cellSize + cellSize / 2;
    const radius = Math.floor(cellSize * 0.42);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Text Label
    if (cellSize >= 14) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(9, Math.floor(cellSize * 0.55))}px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, cy + 0.5);
    }
    ctx.restore();
  }

  // Maze Generators
  function generateRandomObstacles(density = 0.2) {
    clearSearchState();
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if ((x === startPos.x && y === startPos.y) || (x === goalPos.x && y === goalPos.y)) {
          grid[y][x] = 0;
        } else {
          grid[y][x] = Math.random() < density ? 1 : 0;
        }
      }
    }
    render();
  }

  function generateRecursiveMaze() {
    clearSearchState();
    // Fill with empty
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        grid[y][x] = 0;
      }
    }

    // Border walls
    for (let x = 0; x < COLS; x++) {
      grid[0][x] = 1;
      grid[ROWS - 1][x] = 1;
    }
    for (let y = 0; y < ROWS; y++) {
      grid[y][0] = 1;
      grid[y][COLS - 1] = 1;
    }

    function divide(x, y, w, h, orientation) {
      if (w < 4 || h < 4) return;

      const isHorizontal = orientation === 'H';
      let wx = x + (isHorizontal ? 0 : Math.floor(Math.random() * (w - 2)) + 1);
      let wy = y + (isHorizontal ? Math.floor(Math.random() * (h - 2)) + 1 : 0);

      const px = wx + (isHorizontal ? Math.floor(Math.random() * w) : 0);
      const py = wy + (isHorizontal ? 0 : Math.floor(Math.random() * h));

      const dx = isHorizontal ? 1 : 0;
      const dy = isHorizontal ? 0 : 1;
      const length = isHorizontal ? w : h;

      for (let i = 0; i < length; i++) {
        const curX = wx + dx * i;
        const curY = wy + dy * i;
        if (curX !== px || curY !== py) {
          if ((curX !== startPos.x || curY !== startPos.y) && (curX !== goalPos.x || curY !== goalPos.y)) {
            grid[curY][curX] = 1;
          }
        }
      }

      const nextOrient = (newW, newH) => (newW < newH ? 'H' : 'V');

      if (isHorizontal) {
        divide(x, y, w, wy - y, nextOrient(w, wy - y));
        divide(x, wy + 1, w, y + h - wy - 1, nextOrient(w, y + h - wy - 1));
      } else {
        divide(x, y, wx - x, h, nextOrient(wx - x, h));
        divide(wx + 1, y, x + w - wx - 1, h, nextOrient(x + w - wx - 1, h));
      }
    }

    divide(1, 1, COLS - 2, ROWS - 2, COLS < ROWS ? 'H' : 'V');
    grid[startPos.y][startPos.x] = 0;
    grid[goalPos.y][goalPos.x] = 0;
    render();
  }

  function generateCanyons() {
    clearSearchState();
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        grid[y][x] = 0;
      }
    }

    for (let x = 4; x < COLS - 4; x += 5) {
      const openGap = Math.floor(Math.random() * (ROWS - 10)) + 5;
      for (let y = 0; y < ROWS; y++) {
        if (Math.abs(y - openGap) > 3) {
          if ((x !== startPos.x || y !== startPos.y) && (x !== goalPos.x || y !== goalPos.y)) {
            grid[y][x] = 1;
          }
        }
      }
    }
    render();
  }

  // Algorithm Execution Flow
  function startSearch(instant = false) {
    if (isRunning) return;

    // Reset visual path states
    openSet.clear();
    closedSet.clear();
    pathCells = [];
    nodeLookup.clear();
    searchCompleted = false;

    const heuristic = heuristicSelect.value;
    const allowDiagonals = movementSelect.value === '8';

    activeGenerator = aStarSearchGenerator(startPos, goalPos, grid, COLS, ROWS, {
      heuristic,
      allowDiagonals
    });

    isRunning = true;
    setStatus('running', 'Searching...');
    const startTime = performance.now();

    const speedVal = parseInt(speedSlider.value, 10);
    const speed = speedSettings[speedVal] || speedSettings[4];

    if (instant || speedVal === 5) {
      // Run synchronously to completion
      let event;
      let lastVisited = 0;
      let lastOpen = 0;
      while ((event = activeGenerator.next()) && !event.done) {
        const val = event.value;
        if (val.type === 'init') {
          nodeLookup = val.nodeMap;
        } else if (val.type === 'visit') {
          closedSet.add(`${val.current.x},${val.current.y}`);
          openSet.delete(`${val.current.x},${val.current.y}`);
          lastVisited = val.closedCount;
          lastOpen = val.openCount;
        } else if (val.type === 'open') {
          openSet.add(`${val.node.x},${val.node.y}`);
          lastOpen = val.openCount;
        } else if (val.type === 'found') {
          pathCells = val.path;
          const searchTime = performance.now() - startTime;
          setStatus('success', 'Path Found');
          updateMetrics({
            status: 'Path Found',
            time: searchTime,
            length: val.steps,
            cost: val.totalCost,
            open: lastOpen,
            closed: val.closedCount
          });
          isRunning = false;
          searchCompleted = true;
          render();
          return;
        } else if (val.type === 'exhausted') {
          const searchTime = performance.now() - startTime;
          setStatus('blocked', 'No Path (Blocked)');
          updateMetrics({
            status: 'No Path',
            time: searchTime,
            length: 0,
            cost: 0,
            open: 0,
            closed: val.closedCount
          });
          isRunning = false;
          searchCompleted = true;
          render();
          return;
        }
      }
    } else {
      // Animated search loop
      let lastTimestamp = performance.now();

      function stepLoop(currentTimestamp) {
        if (!isRunning) return;

        const delta = currentTimestamp - lastTimestamp;
        if (delta >= (speed.intervalMs || 0)) {
          lastTimestamp = currentTimestamp;

          for (let i = 0; i < speed.stepsPerFrame; i++) {
            const next = activeGenerator.next();
            if (next.done) {
              isRunning = false;
              return;
            }

            const event = next.value;
            if (event.type === 'init') {
              nodeLookup = event.nodeMap;
            } else if (event.type === 'visit') {
              closedSet.add(`${event.current.x},${event.current.y}`);
              openSet.delete(`${event.current.x},${event.current.y}`);
              updateMetrics({
                open: event.openCount,
                closed: event.closedCount,
                time: performance.now() - startTime
              });
            } else if (event.type === 'open') {
              openSet.add(`${event.node.x},${event.node.y}`);
              updateMetrics({ open: event.openCount });
            } else if (event.type === 'found') {
              pathCells = event.path;
              const totalElapsed = performance.now() - startTime;
              setStatus('success', 'Path Found');
              updateMetrics({
                status: 'Path Found',
                time: totalElapsed,
                length: event.steps,
                cost: event.totalCost,
                closed: event.closedCount
              });
              isRunning = false;
              searchCompleted = true;
              render();
              return;
            } else if (event.type === 'exhausted') {
              const totalElapsed = performance.now() - startTime;
              setStatus('blocked', 'No Path (Blocked)');
              updateMetrics({
                status: 'No Path',
                time: totalElapsed,
                length: 0,
                cost: 0,
                open: 0,
                closed: event.closedCount
              });
              isRunning = false;
              searchCompleted = true;
              render();
              return;
            }
          }
          render();
        }

        animationFrameId = requestAnimationFrame(stepLoop);
      }

      animationFrameId = requestAnimationFrame(stepLoop);
    }
  }

  function stepOnce() {
    if (isRunning) return;

    if (!activeGenerator || searchCompleted) {
      const heuristic = heuristicSelect.value;
      const allowDiagonals = movementSelect.value === '8';
      openSet.clear();
      closedSet.clear();
      pathCells = [];
      nodeLookup.clear();
      activeGenerator = aStarSearchGenerator(startPos, goalPos, grid, COLS, ROWS, {
        heuristic,
        allowDiagonals
      });
      searchCompleted = false;
      setStatus('running', 'Stepping...');
    }

    const next = activeGenerator.next();
    if (next.done) return;

    const event = next.value;
    if (event.type === 'init') {
      nodeLookup = event.nodeMap;
    } else if (event.type === 'visit') {
      closedSet.add(`${event.current.x},${event.current.y}`);
      openSet.delete(`${event.current.x},${event.current.y}`);
      updateMetrics({ open: event.openCount, closed: event.closedCount });
    } else if (event.type === 'open') {
      openSet.add(`${event.node.x},${event.node.y}`);
      updateMetrics({ open: event.openCount });
    } else if (event.type === 'found') {
      pathCells = event.path;
      setStatus('success', 'Path Found');
      updateMetrics({
        status: 'Path Found',
        length: event.steps,
        cost: event.totalCost,
        closed: event.closedCount
      });
      searchCompleted = true;
    } else if (event.type === 'exhausted') {
      setStatus('blocked', 'No Path (Blocked)');
      updateMetrics({ status: 'No Path', open: 0, closed: event.closedCount });
      searchCompleted = true;
    }

    render();
  }

  // Pointer & Drag Coordinates Helper
  function getCanvasCoord(event) {
    const rect = canvas.getBoundingClientRect();
    const clientX = event.clientX;
    const clientY = event.clientY;

    const x = Math.floor((clientX - rect.left) / cellSize);
    const y = Math.floor((clientY - rect.top) / cellSize);

    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
      return { x, y };
    }
    return null;
  }

  function updateInspector(coord) {
    if (!coord) {
      inspCoord.textContent = '(—, —)';
      inspState.textContent = 'Empty';
      inspG.textContent = '—';
      inspH.textContent = '—';
      inspF.textContent = '—';
      return;
    }

    inspCoord.textContent = `(${coord.x}, ${coord.y})`;
    const key = `${coord.x},${coord.y}`;
    const isStart = coord.x === startPos.x && coord.y === startPos.y;
    const isGoal = coord.x === goalPos.x && coord.y === goalPos.y;
    const isWall = grid[coord.y][coord.x] === 1;
    const isPath = pathCells.some(p => p.x === coord.x && p.y === coord.y);
    const isClosed = closedSet.has(key);
    const isOpen = openSet.has(key);

    let stateLabel = 'Empty';
    if (isStart) stateLabel = 'Start Node (S)';
    else if (isGoal) stateLabel = 'Goal Node (G)';
    else if (isWall) stateLabel = 'Obstacle / Wall';
    else if (isPath) stateLabel = 'Optimal Path';
    else if (isClosed) stateLabel = 'Closed (Visited)';
    else if (isOpen) stateLabel = 'Open (Frontier)';
    inspState.textContent = stateLabel;

    const node = nodeLookup.get(key);
    if (node) {
      inspG.textContent = node.g.toFixed(2);
      inspH.textContent = node.h.toFixed(2);
      inspF.textContent = node.f.toFixed(2);
    } else {
      inspG.textContent = '—';
      inspH.textContent = '—';
      inspF.textContent = '—';
    }
  }

  // Canvas Mouse & Touch Event Handlers
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('mousedown', e => {
    const coord = getCanvasCoord(e);
    if (!coord) return;

    isPointerDown = true;

    // Check if dragging Start or Goal
    if (coord.x === startPos.x && coord.y === startPos.y) {
      pointerMode = 'drag-start';
    } else if (coord.x === goalPos.x && coord.y === goalPos.y) {
      pointerMode = 'drag-goal';
    } else if (e.button === 2) {
      // Right click: Erase
      pointerMode = 'erase-wall';
      grid[coord.y][coord.x] = 0;
      if (searchCompleted) startSearch(true);
      else render();
    } else {
      // Left click: Toggle / Draw wall
      pointerMode = grid[coord.y][coord.x] === 1 ? 'erase-wall' : 'draw-wall';
      grid[coord.y][coord.x] = pointerMode === 'draw-wall' ? 1 : 0;
      if (searchCompleted) startSearch(true);
      else render();
    }
  });

  window.addEventListener('mousemove', e => {
    const coord = getCanvasCoord(e);
    hoveredCoord = coord;
    updateInspector(coord);

    if (!isPointerDown || !coord) {
      render();
      return;
    }

    if (pointerMode === 'drag-start') {
      if (coord.x !== goalPos.x || coord.y !== goalPos.y) {
        startPos = { x: coord.x, y: coord.y };
        grid[coord.y][coord.x] = 0;
        if (searchCompleted) startSearch(true);
        else render();
      }
    } else if (pointerMode === 'drag-goal') {
      if (coord.x !== startPos.x || coord.y !== startPos.y) {
        goalPos = { x: coord.x, y: coord.y };
        grid[coord.y][coord.x] = 0;
        if (searchCompleted) startSearch(true);
        else render();
      }
    } else if (pointerMode === 'draw-wall') {
      if (
        (coord.x !== startPos.x || coord.y !== startPos.y) &&
        (coord.x !== goalPos.x || coord.y !== goalPos.y)
      ) {
        grid[coord.y][coord.x] = 1;
        if (searchCompleted) startSearch(true);
        else render();
      }
    } else if (pointerMode === 'erase-wall') {
      grid[coord.y][coord.x] = 0;
      if (searchCompleted) startSearch(true);
      else render();
    }
  });

  window.addEventListener('mouseup', () => {
    isPointerDown = false;
    pointerMode = null;
  });

  // UI Button Listeners
  btnVisualize.addEventListener('click', () => {
    startSearch(false);
  });

  btnStep.addEventListener('click', () => {
    stepOnce();
  });

  btnClearPath.addEventListener('click', () => {
    clearSearchState();
  });

  btnClearWalls.addEventListener('click', () => {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        grid[y][x] = 0;
      }
    }
    clearSearchState();
  });

  btnResetAll.addEventListener('click', () => {
    startPos = { x: 2, y: 2 };
    goalPos = { x: COLS - 3, y: ROWS - 3 };
    initGrid();
    mazeSelect.value = '';
    render();
  });

  mazeSelect.addEventListener('change', () => {
    const val = mazeSelect.value;
    if (val === 'random') generateRandomObstacles(0.2);
    else if (val === 'dense') generateRandomObstacles(0.35);
    else if (val === 'recursive') generateRecursiveMaze();
    else if (val === 'canyon') generateCanyons();
    mazeSelect.value = '';
  });

  speedSlider.addEventListener('input', () => {
    const val = parseInt(speedSlider.value, 10);
    const setting = speedSettings[val] || speedSettings[4];
    speedDisplay.textContent = setting.label.split('/')[0].trim();
  });

  window.addEventListener('resize', resizeCanvas);

  // Initialize
  initGrid();
  // Generate initial random 20% obstacles matching pathfinding_a_star.py defaults
  generateRandomObstacles(0.2);
  resizeCanvas();
})();
