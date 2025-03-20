import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Pause, Play, RefreshCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Direction, Point, GameState, Difficulty, SPEEDS } from './types';

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }];

const getRandomFood = (snake: Point[]): Point => {
  let food: Point;
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
  return food;
};

const initialState: GameState = {
  snake: INITIAL_SNAKE,
  food: getRandomFood(INITIAL_SNAKE),
  direction: 'RIGHT',
  nextDirection: 'RIGHT',
  score: 0,
  highScore: 0,
  isGameOver: false,
  isPaused: false,
  difficulty: 'normal',
  gridSize: GRID_SIZE
};

const Snake: React.FC = () => {
  const [state, setState] = useState<GameState>(initialState);
  const [showControls, setShowControls] = useState(window.innerWidth <= 768);
  const gameLoopRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const moveSnake = useCallback(() => {
    const newSnake = [...state.snake];
    const head = { ...newSnake[0] };

    switch (state.nextDirection) {
      case 'UP':
        head.y = (head.y - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case 'DOWN':
        head.y = (head.y + 1) % GRID_SIZE;
        break;
      case 'LEFT':
        head.x = (head.x - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case 'RIGHT':
        head.x = (head.x + 1) % GRID_SIZE;
        break;
    }

    // Check collision with self
    if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
      setState(prev => ({ ...prev, isGameOver: true }));
      return;
    }

    newSnake.unshift(head);

    // Check if snake ate food
    if (head.x === state.food.x && head.y === state.food.y) {
      setState(prev => ({
        ...prev,
        food: getRandomFood(newSnake),
        score: prev.score + 1,
        highScore: Math.max(prev.score + 1, prev.highScore)
      }));
    } else {
      newSnake.pop();
    }

    setState(prev => ({
      ...prev,
      snake: newSnake,
      direction: prev.nextDirection
    }));
  }, [state.nextDirection, state.food, state.snake]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (state.isGameOver) return;

    const keyDirections: { [key: string]: Direction } = {
      ArrowUp: 'UP',
      ArrowDown: 'DOWN',
      ArrowLeft: 'LEFT',
      ArrowRight: 'RIGHT',
      w: 'UP',
      s: 'DOWN',
      a: 'LEFT',
      d: 'RIGHT'
    };

    const newDirection = keyDirections[e.key];
    if (!newDirection) return;

    const opposites: { [key in Direction]: Direction } = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT'
    };

    if (opposites[newDirection] !== state.direction) {
      setState(prev => ({ ...prev, nextDirection: newDirection }));
    }
  }, [state.direction, state.isGameOver]);

  const handleDirectionClick = (direction: Direction) => {
    if (state.isGameOver) return;

    const opposites: { [key in Direction]: Direction } = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT'
    };

    if (opposites[direction] !== state.direction) {
      setState(prev => ({ ...prev, nextDirection: direction }));
    }
  };

  const togglePause = () => {
    setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const resetGame = () => {
    setState({
      ...initialState,
      highScore: state.highScore,
      difficulty: state.difficulty
    });
  };

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#333333';
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        ctx.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }

    // Draw food
    const gradient = ctx.createRadialGradient(
      state.food.x * cellSize + cellSize / 2,
      state.food.y * cellSize + cellSize / 2,
      0,
      state.food.x * cellSize + cellSize / 2,
      state.food.y * cellSize + cellSize / 2,
      cellSize / 2
    );
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(1, '#990000');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(
      state.food.x * cellSize + cellSize / 2,
      state.food.y * cellSize + cellSize / 2,
      cellSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw snake
    state.snake.forEach((segment, index) => {
      const isHead = index === 0;
      const gradient = ctx.createLinearGradient(
        segment.x * cellSize,
        segment.y * cellSize,
        (segment.x + 1) * cellSize,
        (segment.y + 1) * cellSize
      );
      gradient.addColorStop(0, isHead ? '#4ade80' : '#22c55e');
      gradient.addColorStop(1, isHead ? '#22c55e' : '#16a34a');
      ctx.fillStyle = gradient;
      ctx.fillRect(
        segment.x * cellSize + 1,
        segment.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );

      if (isHead) {
        // Draw eyes
        ctx.fillStyle = '#000000';
        const eyeSize = cellSize / 6;
        const eyeOffset = cellSize / 4;
        
        switch (state.direction) {
          case 'RIGHT':
            ctx.fillRect(segment.x * cellSize + cellSize - eyeOffset, segment.y * cellSize + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(segment.x * cellSize + cellSize - eyeOffset, segment.y * cellSize + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
          case 'LEFT':
            ctx.fillRect(segment.x * cellSize + eyeOffset - eyeSize, segment.y * cellSize + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(segment.x * cellSize + eyeOffset - eyeSize, segment.y * cellSize + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
          case 'UP':
            ctx.fillRect(segment.x * cellSize + eyeOffset, segment.y * cellSize + eyeOffset - eyeSize, eyeSize, eyeSize);
            ctx.fillRect(segment.x * cellSize + cellSize - eyeOffset - eyeSize, segment.y * cellSize + eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
          case 'DOWN':
            ctx.fillRect(segment.x * cellSize + eyeOffset, segment.y * cellSize + cellSize - eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(segment.x * cellSize + cellSize - eyeOffset - eyeSize, segment.y * cellSize + cellSize - eyeOffset, eyeSize, eyeSize);
            break;
        }
      }
    });
  }, [state.snake, state.food, state.direction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const size = Math.min(
        window.innerWidth - 32,
        window.innerHeight - 300
      );
      canvas.width = size;
      canvas.height = size;
      drawGame();
    };

    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [drawGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (state.isGameOver || state.isPaused) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      return;
    }

    let lastTime = 0;
    const gameLoop = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const elapsed = timestamp - lastTime;

      if (elapsed > SPEEDS[state.difficulty]) {
        moveSnake();
        drawGame();
        lastTime = timestamp;
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [state.isGameOver, state.isPaused, state.difficulty, moveSnake, drawGame]);

  useEffect(() => {
    const handleResize = () => {
      setShowControls(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4">
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex gap-4">
          {(['easy', 'normal', 'hard'] as Difficulty[]).map(diff => (
            <button
              key={diff}
              onClick={() => setState(prev => ({ ...prev, difficulty: diff }))}
              className={`px-4 py-2 rounded-lg capitalize transition-colors
                ${state.difficulty === diff
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              {diff}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-lg font-semibold">
            Score: {state.score}
          </div>
          <div className="text-lg font-semibold text-yellow-500">
            High Score: {state.highScore}
          </div>
          <button
            onClick={togglePause}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {state.isPaused ? <Play size={24} /> : <Pause size={24} />}
          </button>
          <button
            onClick={resetGame}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCcw size={24} />
          </button>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className="bg-gray-900 rounded-lg shadow-lg"
        />

        <AnimatePresence>
          {state.isGameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg"
            >
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center">
                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
                <p className="text-lg mb-4">Score: {state.score}</p>
                <button
                  onClick={resetGame}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Play Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showControls && (
        <div className="mt-8 grid grid-cols-3 gap-4 w-48">
          <div />
          <button
            onTouchStart={() => handleDirectionClick('UP')}
            className="p-4 bg-gray-200 dark:bg-gray-700 rounded-lg active:bg-gray-300 dark:active:bg-gray-600 transition-colors"
          >
            <ChevronUp size={24} />
          </button>
          <div />
          <button
            onTouchStart={() => handleDirectionClick('LEFT')}
            className="p-4 bg-gray-200 dark:bg-gray-700 rounded-lg active:bg-gray-300 dark:active:bg-gray-600 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onTouchStart={() => handleDirectionClick('DOWN')}
            className="p-4 bg-gray-200 dark:bg-gray-700 rounded-lg active:bg-gray-300 dark:active:bg-gray-600 transition-colors"
          >
            <ChevronDown size={24} />
          </button>
          <button
            onTouchStart={() => handleDirectionClick('RIGHT')}
            className="p-4 bg-gray-200 dark:bg-gray-700 rounded-lg active:bg-gray-300 dark:active:bg-gray-600 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>Use arrow keys or WASD to control the snake</p>
        <p>Collect the red food to grow and increase your score</p>
        <p>Avoid hitting yourself!</p>
      </div>
    </div>
  );
};

export default Snake;