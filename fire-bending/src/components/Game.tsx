import { useState, useEffect, useCallback } from 'react';

export default function Game() {
  const [playerX, setPlayerX] = useState(200);
  const [playerY, setPlayerY] = useState(200);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    const moveDistance = 20;
    
    switch (e.key.toLowerCase()) {
      case 'w':
        setPlayerY(prev => Math.max(0, prev - moveDistance));
        break;
      case 's':
        setPlayerY(prev => Math.min(560, prev + moveDistance));
        break;
      case 'a':
        setPlayerX(prev => Math.max(0, prev - moveDistance));
        break;
      case 'd':
        setPlayerX(prev => Math.min(760, prev + moveDistance));
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <div className="flex flex-col items-center p-8 bg-gray-900 min-h-screen">
      <h1 className="text-4xl font-bold text-orange-400 mb-4">Simple Game</h1>
      
      <div className="mb-4 text-white text-center">
        <p>Move with WASD keys</p>
        <p>Position: ({playerX}, {playerY})</p>
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
    </div>
  );
}
