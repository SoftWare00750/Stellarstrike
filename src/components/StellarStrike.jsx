import React, { useState, useEffect, useRef } from 'react';

const StellarStrike = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [gameState, setGameState] = useState('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const gameLoopRef = useRef(null);
  const gameDataRef = useRef({
    player: { x: 375, y: 500, width: 60, height: 60, speed: 5 },
    bullets: [],
    enemies: [],
    particles: [],
    keys: {},
    lastEnemySpawn: 0,
    enemySpawnRate: 1500
  });

  const imagesRef = useRef({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const loadImages = () => {
      const imageUrls = {
        player: './assets/sprites/player-ship-blue.png',
        enemySmallDrone: './assets/sprites/enemy-small-drone.png',
        enemyFighter: './assets/sprites/enemy-alien-fighter.png',
        enemyBoss: './assets/sprites/enemy-boss-ship.png',
        playerAlt: './assets/sprites/player-ship-red.png',
        enemyAlt1: './assets/sprites/enemy-purple-boss.png',
        enemyAlt2: './assets/sprites/enemy-ship-detail.png'
      };

      let loadedCount = 0;
      const totalImages = Object.keys(imageUrls).length;

      Object.entries(imageUrls).forEach(([key, url]) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === totalImages) setImagesLoaded(true);
        };
        img.onerror = () => {
          console.warn(`Failed to load: ${url}`);
          loadedCount++;
          if (loadedCount === totalImages) setImagesLoaded(true);
        };
        img.src = url;
        imagesRef.current[key] = img;
      });
    };

    loadImages();
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const game = gameDataRef.current;

      const gameLoop = () => {
        update(game);
        render(ctx, game);
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      };

      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return () => {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      };
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }
      gameDataRef.current.keys[e.key] = true;
      
      if (e.key === ' ' && gameState === 'playing') {
        shoot(gameDataRef.current);
      }
      if (e.key === 'Escape' && gameState === 'playing') {
        setGameState('paused');
      }
    };

    const handleKeyUp = (e) => {
      gameDataRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    gameDataRef.current = {
      player: { x: 375, y: 500, width: 60, height: 60, speed: 5 },
      bullets: [],
      enemies: [],
      particles: [],
      keys: {},
      lastEnemySpawn: Date.now(),
      enemySpawnRate: 1500
    };
    setGameState('playing');
  };

  const shoot = (game) => {
    game.bullets.push({
      x: game.player.x + game.player.width / 2 - 2,
      y: game.player.y,
      width: 4,
      height: 12,
      speed: 8
    });
  };

  const spawnEnemy = (game) => {
    const rand = Math.random();
    let type, size, health, speed, points;
    
    if (rand > 0.95) {
      type = 'enemyBoss';
      size = 80;
      health = 5;
      speed = 1;
      points = 100;
    } else if (rand > 0.7) {
      type = 'enemyFighter';
      size = 55;
      health = 2;
      speed = 2;
      points = 30;
    } else {
      type = 'enemySmallDrone';
      size = 45;
      health = 1;
      speed = 3;
      points = 10;
    }
    
    game.enemies.push({
      x: Math.random() * (800 - size),
      y: -size,
      width: size,
      height: size,
      speed,
      type,
      health,
      maxHealth: health,
      points
    });
  };

  const createExplosion = (game, x, y) => {
    for (let i = 0; i < 20; i++) {
      game.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 40,
        color: `hsl(${Math.random() * 60 + 10}, 100%, ${50 + Math.random() * 30}%)`
      });
    }
  };

  const checkCollision = (a, b) => {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  };

  const update = (game) => {
    if (game.keys['ArrowLeft']) game.player.x -= game.player.speed;
    if (game.keys['ArrowRight']) game.player.x += game.player.speed;
    if (game.keys['ArrowUp']) game.player.y -= game.player.speed;
    if (game.keys['ArrowDown']) game.player.y += game.player.speed;

    game.player.x = Math.max(0, Math.min(800 - game.player.width, game.player.x));
    game.player.y = Math.max(0, Math.min(600 - game.player.height, game.player.y));

    game.bullets = game.bullets.filter(b => {
      b.y -= b.speed;
      return b.y > -b.height;
    });

    const now = Date.now();
    if (now - game.lastEnemySpawn > game.enemySpawnRate) {
      spawnEnemy(game);
      game.lastEnemySpawn = now;
    }

    game.enemies = game.enemies.filter(e => {
      e.y += e.speed;
      
      for (let i = game.bullets.length - 1; i >= 0; i--) {
        if (checkCollision(game.bullets[i], e)) {
          game.bullets.splice(i, 1);
          e.health--;
          if (e.health <= 0) {
            createExplosion(game, e.x + e.width / 2, e.y + e.height / 2);
            setScore(s => s + e.points);
            return false;
          }
        }
      }

      if (checkCollision(game.player, e)) {
        createExplosion(game, e.x + e.width / 2, e.y + e.height / 2);
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) setGameState('gameOver');
          return newLives;
        });
        return false;
      }

      return e.y < 650;
    });

    game.particles = game.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      return p.life > 0;
    });

    if (score > level * 250) {
      setLevel(l => l + 1);
      game.enemySpawnRate = Math.max(400, game.enemySpawnRate - 100);
    }
  };

  const render = (ctx, game) => {
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 123) % 800;
      const y = (i * 456 + Date.now() * 0.03 * (1 + i % 3)) % 600;
      const size = 1 + (i % 3);
      ctx.globalAlpha = 0.3 + (i % 7) * 0.1;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    const playerImg = imagesRef.current.player;
    if (playerImg?.complete && playerImg.naturalWidth > 0) {
      ctx.drawImage(playerImg, game.player.x, game.player.y, game.player.width, game.player.height);
    } else {
      ctx.fillStyle = '#00d9ff';
      ctx.fillRect(game.player.x, game.player.y, game.player.width, game.player.height);
    }

    ctx.fillStyle = '#00ff88';
    game.bullets.forEach(b => {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00ff88';
      ctx.fillRect(b.x, b.y, b.width, b.height);
    });
    ctx.shadowBlur = 0;

    game.enemies.forEach(e => {
      const img = imagesRef.current[e.type];
      if (img?.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, e.x, e.y, e.width, e.height);
      } else {
        const colors = {
          enemySmallDrone: '#ff6b35',
          enemyFighter: '#ff0844',
          enemyBoss: '#8b00ff'
        };
        ctx.fillStyle = colors[e.type] || '#ff0844';
        ctx.fillRect(e.x, e.y, e.width, e.height);
      }
      
      if (e.health < e.maxHealth) {
        const barWidth = e.width;
        const barHeight = 4;
        const healthPercent = e.health / e.maxHealth;
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(e.x, e.y - 8, barWidth, barHeight);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(e.x, e.y - 8, barWidth * healthPercent, barHeight);
      }
    });

    game.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 40;
      ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1;
  };

  const handleMobileControl = (action) => {
    const game = gameDataRef.current;
    if (action === 'left') game.player.x -= 25;
    if (action === 'right') game.player.x += 25;
    if (action === 'fire') shoot(game);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-b from-slate-900 to-black p-2 sm:p-4">
      <div ref={containerRef} className="relative w-full max-w-[800px]">
        {/* Canvas - Always rendered but hidden when not playing */}
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-2 sm:border-4 border-cyan-500 rounded-lg shadow-2xl w-full"
          style={{ 
            display: gameState === 'playing' || gameState === 'paused' ? 'block' : 'none',
            aspectRatio: '4/3'
          }}
        />

        {/* Pause Overlay - Positioned over canvas */}
        {gameState === 'paused' && (
          <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-black/90 rounded-lg backdrop-blur-sm z-10">
            <h2 className="text-4xl sm:text-6xl font-bold text-cyan-400 mb-8 sm:mb-12">⏸ PAUSED</h2>
            <div className="space-y-3 sm:space-y-4 w-full max-w-xs px-4">
              <button
                onClick={() => setGameState('playing')}
                className="block w-full px-4 sm:px-6 py-2 sm:py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-lg sm:text-xl font-bold rounded-lg transition-all transform hover:scale-105"
              >
                ▶ RESUME
              </button>
              <button
                onClick={startGame}
                className="block w-full px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-500 text-white text-lg sm:text-xl font-bold rounded-lg transition-all transform hover:scale-105"
              >
                🔄 RESTART
              </button>
              <button
                onClick={() => setGameState('start')}
                className="block w-full px-4 sm:px-6 py-2 sm:py-3 bg-slate-600 hover:bg-slate-500 text-white text-lg sm:text-xl font-bold rounded-lg transition-all transform hover:scale-105"
              >
                🏠 MAIN MENU
              </button>
            </div>
          </div>
        )}

        {/* Start Screen */}
        {gameState === 'start' && (
          <div 
            className="w-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-purple-900 to-black border-2 sm:border-4 border-cyan-500 rounded-lg shadow-2xl p-8"
            style={{ aspectRatio: '4/3', minHeight: '400px' }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4 sm:mb-8 tracking-wider animate-pulse px-4 text-center">
              STELLAR STRIKE
            </h1>
            <p className="text-cyan-300 text-base sm:text-xl mb-4 sm:mb-8">Defend the Galaxy</p>
            <button
              onClick={startGame}
              className="px-6 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-lg sm:text-2xl font-bold rounded-lg transition-all shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105"
            >
              START GAME
            </button>
            <div className="mt-6 sm:mt-8 text-cyan-300 text-center space-y-2 px-4">
              <p className="text-sm sm:text-lg">⌨️ Arrow Keys - Move | Spacebar - Shoot</p>
              <p className="text-xs sm:text-sm">ESC - Pause Game</p>
            </div>
            {!imagesLoaded && (
              <p className="mt-4 text-yellow-400 text-xs sm:text-sm">Loading assets...</p>
            )}
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameOver' && (
          <div 
            className="w-full flex flex-col items-center justify-center bg-gradient-to-b from-red-900 via-black to-black border-2 sm:border-4 border-red-500 rounded-lg shadow-2xl p-8"
            style={{ aspectRatio: '4/3', minHeight: '400px' }}
          >
            <h2 className="text-4xl sm:text-7xl font-bold text-red-500 mb-4 sm:mb-6 animate-pulse">GAME OVER</h2>
            <div className="bg-black/50 p-4 sm:p-8 rounded-lg mb-6 sm:mb-8 border border-red-500/50">
              <p className="text-2xl sm:text-4xl text-cyan-400 mb-2">Final Score</p>
              <p className="text-4xl sm:text-6xl font-bold text-white text-center">{score}</p>
              <p className="text-lg sm:text-xl text-purple-400 mt-2 text-center">Level {level}</p>
            </div>
            <div className="space-y-3 sm:space-y-4 w-full max-w-xs">
              <button
                onClick={startGame}
                className="block w-full px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-lg sm:text-xl font-bold rounded-lg transition-all transform hover:scale-105"
              >
                🎮 PLAY AGAIN
              </button>
              <button
                onClick={() => setGameState('start')}
                className="block w-full px-4 sm:px-6 py-2 sm:py-3 bg-slate-600 hover:bg-slate-500 text-white text-lg sm:text-xl font-bold rounded-lg transition-all transform hover:scale-105"
              >
                🏠 MAIN MENU
              </button>
            </div>
          </div>
        )}
      </div>

      {/* HUD and Controls - Only show when playing */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <>
          <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-3 sm:gap-12 text-cyan-400 text-base sm:text-2xl font-bold w-full max-w-[800px] px-2">
            <div className="bg-black/50 px-3 sm:px-6 py-2 sm:py-3 rounded-lg border border-cyan-500/50">
              💎 Score: <span className="text-white">{score}</span>
            </div>
            <div className="bg-black/50 px-3 sm:px-6 py-2 sm:py-3 rounded-lg border border-red-500/50">
              ❤️ Lives: <span className="text-white">{lives}</span>
            </div>
            <div className="bg-black/50 px-3 sm:px-6 py-2 sm:py-3 rounded-lg border border-purple-500/50">
              ⭐ Level: <span className="text-white">{level}</span>
            </div>
          </div>

          {gameState === 'playing' && (
            <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-4 w-full max-w-[800px] px-2 justify-center">
              <button
                onMouseDown={() => handleMobileControl('left')}
                onTouchStart={(e) => { e.preventDefault(); handleMobileControl('left'); }}
                className="px-4 sm:px-8 py-3 sm:py-4 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-sm sm:text-lg font-bold rounded-lg transition-all transform active:scale-95 touch-manipulation"
              >
                ← LEFT
              </button>
              <button
                onMouseDown={() => handleMobileControl('fire')}
                onTouchStart={(e) => { e.preventDefault(); handleMobileControl('fire'); }}
                className="px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 active:from-red-700 active:to-orange-700 text-white text-sm sm:text-lg font-bold rounded-lg transition-all transform active:scale-95 touch-manipulation"
              >
                🔥 FIRE
              </button>
              <button
                onMouseDown={() => handleMobileControl('right')}
                onTouchStart={(e) => { e.preventDefault(); handleMobileControl('right'); }}
                className="px-4 sm:px-8 py-3 sm:py-4 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-sm sm:text-lg font-bold rounded-lg transition-all transform active:scale-95 touch-manipulation"
              >
                RIGHT →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StellarStrike;