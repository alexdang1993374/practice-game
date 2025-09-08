import { useState, useEffect, useCallback, useRef } from 'react';

interface MovingBlock {
  id: string;
  x: number;
  y: number;
  speed: number;
}

export default function Game() {
  const [playerX, setPlayerX] = useState(200);
  const [playerY, setPlayerY] = useState(200);
  const [lives, setLives] = useState(3);
  const [movingBlocks, setMovingBlocks] = useState<MovingBlock[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const gameLoopRef = useRef<number | undefined>(undefined);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameOver) return;
    
    const moveDistance = 20;
    
    switch (e.key.toLowerCase()) {
      case 'w':
        setPlayerY(prev => Math.max(0, prev - moveDistance));
        break;
      case 's':
        setPlayerY(prev => Math.min(540, prev + moveDistance)); // 600 - 60 (player height)
        break;
      case 'a':
        setPlayerX(prev => Math.max(0, prev - moveDistance));
        break;
      case 'd':
        setPlayerX(prev => Math.min(740, prev + moveDistance)); // 800 - 60 (player width)
        break;
    }
  }, [gameOver]);

  // Collision detection function
  const checkCollision = useCallback((playerX: number, playerY: number, blockX: number, blockY: number) => {
    const playerSize = 60;
    const blockSize = 40;
    
    return playerX < blockX + blockSize &&
           playerX + playerSize > blockX &&
           playerY < blockY + blockSize &&
           playerY + playerSize > blockY;
  }, []);

  // Game loop for moving blocks and collision detection
  const gameLoop = useCallback(() => {
    if (gameOver) return;

    setMovingBlocks(prevBlocks => {
      const updatedBlocks = prevBlocks
        .map(block => ({ ...block, x: block.x - block.speed }))
        .filter(block => block.x > -40); // Remove blocks that move off screen

      // Check collisions
      updatedBlocks.forEach(block => {
        if (checkCollision(playerX, playerY, block.x, block.y)) {
          setLives(prevLives => {
            const newLives = prevLives - 1;
            if (newLives <= 0) {
              setGameOver(true);
            }
            return newLives;
          });
          // Remove the block that hit the player
          const blockIndex = updatedBlocks.indexOf(block);
          if (blockIndex > -1) {
            updatedBlocks.splice(blockIndex, 1);
          }
        }
      });

      return updatedBlocks;
    });

    // Increment score
    setScore(prev => prev + 1);

    // Spawn new moving block occasionally
    if (Math.random() < 0.02) { // 2% chance each frame
      const newBlock: MovingBlock = {
        id: Date.now().toString(),
        x: 800, // Start from right edge
        y: Math.random() * 560, // Random Y position (600 - 40 for block height)
        speed: 2 + Math.random() * 3 // Speed between 2-5
      };
      setMovingBlocks(prev => [...prev, newBlock]);
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameOver, playerX, playerY, checkCollision]);

  // Restart game function
  const restartGame = useCallback(() => {
    setPlayerX(200);
    setPlayerY(200);
    setLives(3);
    setMovingBlocks([]);
    setGameOver(false);
    setScore(0);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // Start game loop
  useEffect(() => {
    if (!gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop, gameOver]);

  return (
    <div className="flex flex-col items-center p-8 bg-gray-900 min-h-screen">
      <h1 className="text-4xl font-bold text-orange-400 mb-4">Simple Game</h1>
      
      <div className="mb-4 text-white text-center">
        <p>Move with WASD keys</p>
        <div className="flex gap-8 justify-center items-center">
          <p>Lives: <span className="text-red-400 font-bold">{'❤️'.repeat(Math.max(0, lives))}</span></p>
          <p>Score: <span className="text-yellow-400 font-bold">{score}</span></p>
          <p>Position: ({playerX}, {playerY})</p>
          <p>Game Over: {gameOver ? 'TRUE' : 'FALSE'}</p>
        </div>
      </div>
      
      <div
        className="relative bg-gray-800 border-4 border-green-600 overflow-hidden"
        style={{
          width: '800px',
          height: '600px',
          position: 'relative',
          border: '4px solid #16a34a',
        }}
      >
        {/* Moving Blocks */}
        {movingBlocks.map(block => (
          <div
            key={block.id}
            className="bg-purple-600 border-2 border-purple-400"
            style={{
              position: 'absolute',
              left: block.x + 'px',
              top: block.y + 'px',
              width: '40px',
              height: '40px',
              zIndex: 5,
              backgroundColor: '#000000',
            }}
          />
        ))}

        {/* Player Block */}
        <div
          className="bg-red-500 border-4 border-yellow-400"
          style={{
            position: 'absolute',
            left: playerX + 'px',
            top: playerY + 'px',
            width: '60px',
            height: '60px',
            zIndex: 10,
            boxShadow: '0 0 20px rgba(255, 0, 0, 0.8)',
            transform: 'translate3d(0, 0, 0)' // Force hardware acceleration
          }}
        >
          <div className="w-full h-full bg-red-600 flex items-center justify-center text-white font-bold">
            P
          </div>
        </div>
      </div>

      {gameOver && (
        <div className='bg-[#000000] absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center border-4 border-red-500'>
          <h1 className='text-4xl font-bold text-red-500'>GAME OVER</h1>
          <p className='text-xl text-white'>Score: {score}</p>
          <button className='bg-green-500 text-white px-4 py-2 rounded-md' onClick={restartGame}>RESTART</button>
        </div>
      )}
    </div>
  );
}
