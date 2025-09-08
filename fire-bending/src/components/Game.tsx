import { useState, useEffect, useCallback, useRef } from 'react';

interface MovingBlock {
  id: string;
  x: number;
  y: number;
  speed: number;
}

interface BonusBlock {
  id: string;
  x: number;
  y: number;
  speed: number;
}

interface Projectile {
  id: string;
  x: number;
  y: number;
  speed: number;
}

interface Explosion {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
}

export default function Game() {
  const [playerX, setPlayerX] = useState(200);
  const [playerY, setPlayerY] = useState(200);
  const [lives, setLives] = useState(3);
  const [movingBlocks, setMovingBlocks] = useState<MovingBlock[]>([]);
  const [bonusBlocks, setBonusBlocks] = useState<BonusBlock[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speedBoostTimer, setSpeedBoostTimer] = useState(0);
  const gameLoopRef = useRef<number | undefined>(undefined);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameOver) return;
    
    // Increase move distance if speed boost is active
    const baseMoveDistance = 20;
    const boostedMoveDistance = 35;
    const moveDistance = speedBoostTimer > 0 ? boostedMoveDistance : baseMoveDistance;
    
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
      case ' ': {
        // Shoot projectile
        const newProjectile: Projectile = {
          id: Date.now().toString() + '_projectile',
          x: playerX + 60, // Start from right edge of player
          y: playerY + 25, // Center vertically on player
          speed: 8
        };
        setProjectiles(prev => [...prev, newProjectile]);
        e.preventDefault(); // Prevent page scroll
        break;
      }
    }
  }, [gameOver, playerX, playerY, speedBoostTimer]);

  // Collision detection function
  const checkCollision = useCallback((playerX: number, playerY: number, blockX: number, blockY: number) => {
    const playerSize = 60;
    const blockSize = 40;
    
    return playerX < blockX + blockSize &&
           playerX + playerSize > blockX &&
           playerY < blockY + blockSize &&
           playerY + playerSize > blockY;
  }, []);

  // Projectile collision detection function
  const checkProjectileCollision = useCallback((projX: number, projY: number, blockX: number, blockY: number) => {
    const projectileSize = 10;
    const blockSize = 40;
    
    return projX < blockX + blockSize &&
           projX + projectileSize > blockX &&
           projY < blockY + blockSize &&
           projY + projectileSize > blockY;
  }, []);

  // Create explosion effect
  const createExplosion = useCallback((x: number, y: number) => {
    const newExplosion: Explosion = {
      id: Date.now().toString() + '_explosion',
      x: x + 20, // Center on block
      y: y + 20,
      size: 0,
      opacity: 1,
      duration: 30 // frames
    };
    setExplosions(prev => [...prev, newExplosion]);
  }, []);

  // Game loop for moving blocks and collision detection
  const gameLoop = useCallback(() => {
    if (gameOver) return;

    // Handle speed boost timer
    setSpeedBoostTimer(prev => Math.max(0, prev - 1));

    // Handle explosions
    setExplosions(prevExplosions => {
      return prevExplosions
        .map(explosion => ({
          ...explosion,
          size: explosion.size + 3, // Grow explosion
          opacity: explosion.opacity - (1 / explosion.duration), // Fade out
          duration: explosion.duration - 1
        }))
        .filter(explosion => explosion.duration > 0); // Remove finished explosions
    });

    // Handle projectiles
    setProjectiles(prevProjectiles => {
      const updatedProjectiles = prevProjectiles
        .map(projectile => ({ ...projectile, x: projectile.x + projectile.speed }))
        .filter(projectile => projectile.x < 850); // Remove projectiles that move off screen

      return updatedProjectiles;
    });

    // Handle dangerous blocks
    setMovingBlocks(prevBlocks => {
      const updatedBlocks = prevBlocks
        .map(block => ({ ...block, x: block.x - block.speed }))
        .filter(block => block.x > -40); // Remove blocks that move off screen

      // Check collisions with player
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

        // Check projectile collisions with dangerous blocks
        setProjectiles(prevProjectiles => {
          const updatedProjectiles = [...prevProjectiles];
          
          updatedBlocks.forEach(block => {
            updatedProjectiles.forEach(projectile => {
              if (checkProjectileCollision(projectile.x, projectile.y, block.x, block.y)) {
                // Create explosion effect at block position
                createExplosion(block.x, block.y);
                
                // Activate speed boost (3 seconds at 60fps = 180 frames)
                setSpeedBoostTimer(180);
                
                // Remove both the block and projectile
                const blockIndex = updatedBlocks.indexOf(block);
                const projIndex = updatedProjectiles.indexOf(projectile);
                
                if (blockIndex > -1) {
                  updatedBlocks.splice(blockIndex, 1);
                  setScore(prevScore => prevScore + 100); // Bonus points for destroying block
                }
                if (projIndex > -1) {
                  updatedProjectiles.splice(projIndex, 1);
                }
              }
            });
          });
          
          return updatedProjectiles;
        });

      return updatedBlocks;
    });

    // Handle bonus blocks
    setBonusBlocks(prevBlocks => {
      const updatedBlocks = prevBlocks
        .map(block => ({ ...block, x: block.x - block.speed }))
        .filter(block => block.x > -40); // Remove blocks that move off screen

      // Check collisions with bonus blocks
      updatedBlocks.forEach(block => {
        if (checkCollision(playerX, playerY, block.x, block.y)) {
          setScore(prevScore => prevScore + 500); // Add 500 points
          // Remove the collected bonus block
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

    // Spawn new dangerous block occasionally
    if (Math.random() < 0.02) { // 2% chance each frame
      const newBlock: MovingBlock = {
        id: Date.now().toString(),
        x: 800, // Start from right edge
        y: Math.random() * 560, // Random Y position (600 - 40 for block height)
        speed: 2 + Math.random() * 3 // Speed between 2-5
      };
      setMovingBlocks(prev => [...prev, newBlock]);
    }

    // Spawn new bonus block occasionally (less frequent)
    if (Math.random() < 0.005) { // 0.5% chance each frame
      const newBonusBlock: BonusBlock = {
        id: Date.now().toString() + '_bonus',
        x: 800, // Start from right edge
        y: Math.random() * 560, // Random Y position
        speed: 1.5 + Math.random() * 2 // Slightly slower than dangerous blocks
      };
      setBonusBlocks(prev => [...prev, newBonusBlock]);
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameOver, playerX, playerY, checkCollision, checkProjectileCollision, createExplosion]);

  // Restart game function
  const restartGame = useCallback(() => {
    setPlayerX(200);
    setPlayerY(200);
    setLives(3);
    setMovingBlocks([]);
    setBonusBlocks([]);
    setProjectiles([]);
    setExplosions([]);
    // setSpeedBoostTimer(0);
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
        <p>Move: WASD | Shoot: SPACE</p>
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
        {/* Dangerous Moving Blocks */}
        {movingBlocks.map((block, index) => (
          <div
            key={block.id + index}
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

        {/* Bonus Blocks */}
        {bonusBlocks.map((block, index) => (
          <div
          key={block.id + index}
            style={{
              position: 'absolute',
              left: block.x + 'px',
              top: block.y + 'px',
              width: '40px',
              height: '40px',
              zIndex: 5,
              backgroundColor: '#22c55e',
              border: '2px solid #16a34a',
              borderRadius: '4px',
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.6)'
            }}
          >
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '20px'
            }}>
              +
            </div>
          </div>
        ))}

        {/* Projectiles */}
        {projectiles.map((projectile, index) => (
          <div
            key={projectile.id + index}
            style={{
              position: 'absolute',
              left: projectile.x + 'px',
              top: projectile.y + 'px',
              width: '10px',
              height: '10px',
              zIndex: 6,
              backgroundColor: '#fbbf24',
              borderRadius: '50%',
              boxShadow: '0 0 8px rgba(251, 191, 36, 0.8)'
            }}
          />
        ))}

        {/* Explosions */}
        {explosions.map((explosion, index) => (
          <div
            key={explosion.id + index}
            style={{
              position: 'absolute',
              left: (explosion.x - explosion.size / 2) + 'px',
              top: (explosion.y - explosion.size / 2) + 'px',
              width: explosion.size + 'px',
              height: explosion.size + 'px',
              zIndex: 15,
              borderRadius: '50%',
              background: `radial-gradient(circle, #ff4444 0%, #ff8800 40%, #ffaa00 70%, transparent 100%)`,
              opacity: explosion.opacity,
              pointerEvents: 'none',
              boxShadow: `0 0 ${explosion.size}px rgba(255, 68, 68, ${explosion.opacity * 0.8})`
            }}
          />
        ))}

        {/* Player Block */}
        <div
          style={{
            position: 'absolute',
            left: playerX + 'px',
            top: playerY + 'px',
            width: '60px',
            height: '60px',
            zIndex: 10,
            backgroundColor: '#ef4444',
            border: '4px solid ' + (speedBoostTimer > 0 ? '#00ffff' : '#facc15'),
            boxShadow: speedBoostTimer > 0 
              ? '0 0 20px rgba(0, 255, 255, 0.8)' 
              : '0 0 20px rgba(255, 0, 0, 0.8)',
            transform: 'translate3d(0, 0, 0)' // Force hardware acceleration
          }}
        >
          <div className="w-full h-full bg-red-600 flex items-center justify-center text-white font-bold">
            {speedBoostTimer > 0 ? '⚡' : 'P'}
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
