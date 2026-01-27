import React, { useState, useEffect, useRef } from 'react';

const StellarStrike = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [gameState, setGameState] = useState('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [showLevelTransition, setShowLevelTransition] = useState(false);
  const gameLoopRef = useRef(null);
  const gameDataRef = useRef({
    player: { x: 375, y: 500, width: 60, height: 60, speed: 5, maxSpeed: 8 },
    bullets: [],
    enemies: [],
    particles: [],
    powerUps: [],
    keys: {},
    lastEnemySpawn: 0,
    enemySpawnRate: 1500,
    lastPowerUpSpawn: 0,
    powerUpSpawnRate: 15000,
    fireRate: 250,
    lastShot: 0,
    spreadShot: false,
    rapidFire: false,
    shield: false,
    bossSpawned: false
  });

  const imagesRef = useRef({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Level configuration
  const levelConfig = {
    1: { enemiesRequired: 15, spawnRate: 1800, bossLevel: false, name: "Asteroid Belt", difficulty: 1 },
    2: { enemiesRequired: 25, spawnRate: 1400, bossLevel: false, name: "Enemy Scouts", difficulty: 1.3 },
    3: { enemiesRequired: 35, spawnRate: 1100, bossLevel: false, name: "Fighter Squadron", difficulty: 1.6 },
    4: { enemiesRequired: 45, spawnRate: 900, bossLevel: false, name: "Heavy Assault", difficulty: 1.9 },
    5: { enemiesRequired: 55, spawnRate: 700, bossLevel: false, name: "Elite Forces", difficulty: 2.2 },
    6: { enemiesRequired: 1, spawnRate: 5000, bossLevel: true, name: "FINAL BOSS", difficulty: 3 }
  };

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

  // Check for level completion
  useEffect(() => {
    const config = levelConfig[level];
    if (config && enemiesKilled >= config.enemiesRequired) {
      if (level < 6) {
        // Level complete, move to next level
        setShowLevelTransition(true);
        setGameState('levelTransition');
        setTimeout(() => {
          setLevel(l => l + 1);
          setEnemiesKilled(0);
          gameDataRef.current.enemySpawnRate = levelConfig[level + 1].spawnRate;
          gameDataRef.current.bossSpawned = false;
          setShowLevelTransition(false);
          setGameState('playing');
        }, 3000);
      } else {
        // Game complete!
        setGameState('victory');
      }
    }
  }, [enemiesKilled, level]);

  const startGame = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setEnemiesKilled(0);
    gameDataRef.current = {
      player: { x: 375, y: 500, width: 60, height: 60, speed: 5, maxSpeed: 8 },
      bullets: [],
      enemies: [],
      particles: [],
      powerUps: [],
      keys: {},
      lastEnemySpawn: Date.now(),
      enemySpawnRate: levelConfig[1].spawnRate,
      lastPowerUpSpawn: Date.now(),
      powerUpSpawnRate: 15000,
      fireRate: 250,
      lastShot: 0,
      spreadShot: false,
      rapidFire: false,
      shield: false,
      bossSpawned: false
    };
    setGameState('playing');
  };

  const shoot = (game) => {
    const now = Date.now();
    const fireRate = game.rapidFire ? game.fireRate / 2 : game.fireRate;
    
    if (now - game.lastShot < fireRate) return;
    game.lastShot = now;

    if (game.spreadShot) {
      // Triple shot
      for (let angle = -0.3; angle <= 0.3; angle += 0.3) {
        game.bullets.push({
          x: game.player.x + game.player.width / 2 - 2,
          y: game.player.y,
          width: 4,
          height: 12,
          speed: 8,
          angle: angle
        });
      }
    } else {
      game.bullets.push({
        x: game.player.x + game.player.width / 2 - 2,
        y: game.player.y,
        width: 4,
        height: 12,
        speed: 8,
        angle: 0
      });
    }
  };

  const spawnPowerUp = (game, x, y) => {
    const types = ['spreadShot', 'rapidFire', 'shield', 'life'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    game.powerUps.push({
      x,
      y,
      width: 30,
      height: 30,
      speed: 2,
      type
    });
  };

  const spawnEnemy = (game) => {
    const config = levelConfig[level];
    const difficulty = config.difficulty;
    
    // Boss level
    if (config.bossLevel && !game.bossSpawned) {
      game.bossSpawned = true;
      game.enemies.push({
        x: 360,
        y: -120,
        width: 120,
        height: 120,
        speed: 0.5,
        type: 'boss',
        health: 100,
        maxHealth: 100,
        points: 1000,
        isBoss: true,
        shootTimer: 0,
        shootInterval: 2000,
        movePattern: 0,
        moveTimer: 0
      });
      return;
    }
    
    // Regular enemies with difficulty scaling
    const rand = Math.random();
    let type, size, health, speed, points;
    
    if (rand > 0.95 - (difficulty * 0.05)) {
      type = 'enemyBoss';
      size = 80 + (difficulty * 5);
      health = Math.floor(5 * difficulty);
      speed = 1 + (difficulty * 0.3);
      points = 100;
    } else if (rand > 0.7 - (difficulty * 0.1)) {
      type = 'enemyFighter';
      size = 55 + (difficulty * 3);
      health = Math.floor(2 * difficulty);
      speed = 2 + (difficulty * 0.4);
      points = 30;
    } else {
      type = 'enemySmallDrone';
      size = 45 + (difficulty * 2);
      health = Math.floor(1 * difficulty);
      speed = 3 + (difficulty * 0.5);
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
      points,
      isBoss: false
    });
  };

  const createExplosion = (game, x, y, size = 20) => {
    for (let i = 0; i < size; i++) {
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

  const updateBoss = (boss, game) => {
    boss.moveTimer += 16;
    boss.shootTimer += 16;
    
    // Boss movement pattern
    if (boss.moveTimer > 1000) {
      boss.movePattern = (boss.movePattern + 1) % 3;
      boss.moveTimer = 0;
    }
    
    if (boss.movePattern === 0) {
      boss.x += Math.sin(Date.now() * 0.001) * 2;
    } else if (boss.movePattern === 1) {
      boss.x += boss.speed * 2;
      if (boss.x > 700 || boss.x < 0) boss.speed *= -1;
    }
    
    boss.y = Math.min(100, boss.y + 0.3);
    
    // Boss shooting
    if (boss.shootTimer > boss.shootInterval) {
      boss.shootTimer = 0;
      
      // Shoot multiple bullets towards player
      for (let i = -1; i <= 1; i++) {
        const angle = Math.atan2(
          game.player.y - boss.y,
          game.player.x - boss.x
        ) + (i * 0.2);
        
        game.enemies.push({
          x: boss.x + boss.width / 2,
          y: boss.y + boss.height,
          width: 15,
          height: 15,
          speed: 4,
          type: 'bossBullet',
          health: 1,
          maxHealth: 1,
          points: 0,
          angle: angle,
          isBossBullet: true
        });
      }
    }
  };

  const update = (game) => {
    // Player movement
    const currentSpeed = game.shield ? game.maxSpeed * 0.7 : game.player.speed;
    if (game.keys['ArrowLeft']) game.player.x -= currentSpeed;
    if (game.keys['ArrowRight']) game.player.x += currentSpeed;
    if (game.keys['ArrowUp']) game.player.y -= currentSpeed;
    if (game.keys['ArrowDown']) game.player.y += currentSpeed;

    game.player.x = Math.max(0, Math.min(800 - game.player.width, game.player.x));
    game.player.y = Math.max(0, Math.min(600 - game.player.height, game.player.y));

    // Update bullets
    game.bullets = game.bullets.filter(b => {
      b.y -= b.speed;
      if (b.angle) {
        b.x += Math.sin(b.angle) * b.speed;
      }
      return b.y > -b.height && b.x > 0 && b.x < 800;
    });

    // Spawn enemies
    const now = Date.now();
    if (now - game.lastEnemySpawn > game.enemySpawnRate) {
      spawnEnemy(game);
      game.lastEnemySpawn = now;
    }
    
    // Spawn power-ups
    if (now - game.lastPowerUpSpawn > game.powerUpSpawnRate) {
      const randomX = Math.random() * 770;
      spawnPowerUp(game, randomX, -30);
      game.lastPowerUpSpawn = now;
    }

    // Update power-ups
    game.powerUps = game.powerUps.filter(p => {
      p.y += p.speed;
      
      if (checkCollision(game.player, p)) {
        switch(p.type) {
          case 'spreadShot':
            game.spreadShot = true;
            setTimeout(() => game.spreadShot = false, 10000);
            break;
          case 'rapidFire':
            game.rapidFire = true;
            setTimeout(() => game.rapidFire = false, 8000);
            break;
          case 'shield':
            game.shield = true;
            setTimeout(() => game.shield = false, 12000);
            break;
          case 'life':
            setLives(l => Math.min(l + 1, 5));
            break;
        }
        return false;
      }
      
      return p.y < 650;
    });

    // Update enemies
    game.enemies = game.enemies.filter(e => {
      if (e.isBoss) {
        updateBoss(e, game);
      } else if (e.isBossBullet) {
        e.x += Math.cos(e.angle) * e.speed;
        e.y += Math.sin(e.angle) * e.speed;
      } else {
        e.y += e.speed;
      }
      
      // Check bullet collisions
      for (let i = game.bullets.length - 1; i >= 0; i--) {
        if (checkCollision(game.bullets[i], e)) {
          game.bullets.splice(i, 1);
          e.health--;
          if (e.health <= 0) {
            createExplosion(game, e.x + e.width / 2, e.y + e.height / 2, e.isBoss ? 50 : 20);
            setScore(s => s + e.points);
            
            if (!e.isBossBullet) {
              setEnemiesKilled(k => k + 1);
              
              // Chance to drop power-up
              if (Math.random() > 0.85) {
                spawnPowerUp(game, e.x + e.width / 2, e.y + e.height / 2);
              }
            }
            return false;
          }
        }
      }

      // Check player collision
      if (!e.isBossBullet && checkCollision(game.player, e)) {
        if (game.shield) {
          game.shield = false;
          createExplosion(game, e.x + e.width / 2, e.y + e.height / 2, 30);
          return false;
        } else {
          createExplosion(game, e.x + e.width / 2, e.y + e.height / 2, 30);
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) setGameState('gameOver');
            return newLives;
          });
          return false;
        }
      }
      
      // Boss bullet collision with player
      if (e.isBossBullet && checkCollision(game.player, e)) {
        if (game.shield) {
          game.shield = false;
          return false;
        } else {
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) setGameState('gameOver');
            return newLives;
          });
          return false;
        }
      }

      return e.y < 650 && e.y > -e.height;
    });

    // Update particles
    game.particles = game.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      return p.life > 0;
    });
  };

  const render = (ctx, game) => {
    // Background
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, 800, 600);

    // Stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 123) % 800;
      const y = (i * 456 + Date.now() * 0.03 * (1 + i % 3)) % 600;
      const size = 1 + (i % 3);
      ctx.globalAlpha = 0.3 + (i % 7) * 0.1;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    // Player with shield effect
    if (game.shield) {
      ctx.strokeStyle = '#00d9ff';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
      ctx.beginPath();
      ctx.arc(
        game.player.x + game.player.width / 2,
        game.player.y + game.player.height / 2,
        game.player.width / 2 + 10,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const playerImg = imagesRef.current.player;
    if (playerImg?.complete && playerImg.naturalWidth > 0) {
      ctx.drawImage(playerImg, game.player.x, game.player.y, game.player.width, game.player.height);
    } else {
      ctx.fillStyle = '#00d9ff';
      ctx.fillRect(game.player.x, game.player.y, game.player.width, game.player.height);
    }

    // Bullets
    ctx.fillStyle = '#00ff88';
    game.bullets.forEach(b => {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00ff88';
      ctx.fillRect(b.x, b.y, b.width, b.height);
    });
    ctx.shadowBlur = 0;

    // Power-ups
    game.powerUps.forEach(p => {
      const colors = {
        spreadShot: '#ff6b35',
        rapidFire: '#ffd700',
        shield: '#00d9ff',
        life: '#ff0844'
      };
      ctx.fillStyle = colors[p.type];
      ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.globalAlpha = 1;
      
      // Power-up icon
      ctx.fillStyle = '#000';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(p.type[0].toUpperCase(), p.x + p.width / 2, p.y + p.height / 2 + 5);
    });

    // Enemies
    game.enemies.forEach(e => {
      if (e.isBossBullet) {
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(e.x, e.y, e.width, e.height);
        return;
      }
      
      const img = imagesRef.current[e.type] || imagesRef.current.enemyBoss;
      if (e.isBoss) {
        // Boss glow effect
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff00ff';
      }
      
      if (img?.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, e.x, e.y, e.width, e.height);
      } else {
        const colors = {
          enemySmallDrone: '#ff6b35',
          enemyFighter: '#ff0844',
          enemyBoss: '#8b00ff',
          boss: '#ff00ff'
        };
        ctx.fillStyle = colors[e.type] || '#ff0844';
        ctx.fillRect(e.x, e.y, e.width, e.height);
      }
      ctx.shadowBlur = 0;
      
      // Health bar
      if (e.health < e.maxHealth || e.isBoss) {
        const barWidth = e.width;
        const barHeight = e.isBoss ? 8 : 4;
        const healthPercent = e.health / e.maxHealth;
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(e.x, e.y - (e.isBoss ? 15 : 8), barWidth, barHeight);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(e.x, e.y - (e.isBoss ? 15 : 8), barWidth * healthPercent, barHeight);
        
        if (e.isBoss) {
          ctx.fillStyle = '#fff';
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${e.health}/${e.maxHealth}`, e.x + barWidth / 2, e.y - 20);
        }
      }
    });

    // Particles
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

  const getPowerUpIcon = (type) => {
    const icons = {
      spreadShot: '⚡',
      rapidFire: '🔥',
      shield: '🛡️'
    };
    return icons[type] || '';
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen w-full bg-gradient-to-b from-slate-900 to-black p-2 sm:p-4 pt-4">
      <div className="w-full max-w-[800px] space-y-4">
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 text-center tracking-wider animate-pulse">
          STELLAR STRIKE
        </h1>

        {/* HUD - Stats at Top */}
        {(gameState === 'playing' || gameState === 'paused' || gameState === 'levelTransition') && (
          <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-2 border-cyan-500/50 rounded-lg p-3 sm:p-4 shadow-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-3">
              {/* Score */}
              <div className="bg-black/50 px-3 py-2 rounded-lg border border-cyan-500/50">
                <div className="text-xs sm:text-sm text-cyan-400 mb-1">SCORE</div>
                <div className="text-lg sm:text-2xl font-bold text-white">{score}</div>
              </div>

              {/* Lives */}
              <div className="bg-black/50 px-3 py-2 rounded-lg border border-red-500/50">
                <div className="text-xs sm:text-sm text-red-400 mb-1">LIVES</div>
                <div className="flex gap-1 items-center justify-center flex-wrap">
                  {[...Array(lives)].map((_, i) => (
                    <span key={i} className="text-lg sm:text-xl">❤️</span>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div className="bg-black/50 px-3 py-2 rounded-lg border border-purple-500/50">
                <div className="text-xs sm:text-sm text-purple-400 mb-1">LEVEL</div>
                <div className="text-lg sm:text-2xl font-bold text-white">{level}/6</div>
              </div>

              {/* Progress */}
              <div className="bg-black/50 px-3 py-2 rounded-lg border border-yellow-500/50">
                <div className="text-xs sm:text-sm text-yellow-400 mb-1">PROGRESS</div>
                <div className="text-lg sm:text-2xl font-bold text-white">
                  {enemiesKilled}/{levelConfig[level]?.enemiesRequired || 0}
                </div>
              </div>
            </div>

            {/* Level Name */}
            <div className="text-center">
              <div className="text-sm sm:text-lg font-bold text-cyan-300">
                {levelConfig[level]?.name || "Unknown Level"}
              </div>
            </div>

            {/* Active Power-ups */}
            <div className="flex gap-2 justify-center mt-3 flex-wrap">
              {gameDataRef.current.spreadShot && (
                <div className="bg-orange-600/80 px-3 py-1 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1 animate-pulse">
                  ⚡ SPREAD SHOT
                </div>
              )}
              {gameDataRef.current.rapidFire && (
                <div className="bg-yellow-600/80 px-3 py-1 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1 animate-pulse">
                  🔥 RAPID FIRE
                </div>
              )}
              {gameDataRef.current.shield && (
                <div className="bg-cyan-600/80 px-3 py-1 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1 animate-pulse">
                  🛡️ SHIELD
                </div>
              )}
            </div>
          </div>
        )}

        {/* Game Canvas Container */}
        <div ref={containerRef} className="relative w-full">
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border-2 sm:border-4 border-cyan-500 rounded-lg shadow-2xl w-full"
            style={{ 
              display: gameState === 'playing' || gameState === 'paused' || gameState === 'levelTransition' ? 'block' : 'none',
              aspectRatio: '4/3'
            }}
          />

          {/* Level Transition Overlay */}
          {gameState === 'levelTransition' && (
            <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-black/90 rounded-lg backdrop-blur-sm z-10">
              <h2 className="text-4xl sm:text-6xl font-bold text-green-400 mb-4 animate-bounce">
                LEVEL {level} COMPLETE!
              </h2>
              <p className="text-2xl sm:text-3xl text-cyan-300">
                Advancing to Level {level + 1}
              </p>
              <p className="text-xl sm:text-2xl text-purple-400 mt-4">
                {levelConfig[level + 1]?.name}
              </p>
            </div>
          )}

          {/* Pause Overlay */}
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
              <p className="text-cyan-300 text-base sm:text-xl mb-2">Defend the Galaxy</p>
              <p className="text-purple-300 text-sm sm:text-lg mb-6">6 Levels • Epic Boss Battle</p>
              <button
                onClick={startGame}
                className="px-6 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-lg sm:text-2xl font-bold rounded-lg transition-all shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105"
              >
                START GAME
              </button>
              <div className="mt-6 sm:mt-8 text-cyan-300 text-center space-y-2 px-4">
                <p className="text-sm sm:text-lg">⌨️ Arrow Keys - Move | Spacebar - Shoot</p>
                <p className="text-xs sm:text-sm">ESC - Pause Game</p>
                <p className="text-xs sm:text-sm text-purple-300">Collect power-ups for special abilities!</p>
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
                <p className="text-lg sm:text-xl text-purple-400 mt-2 text-center">Level {level}/6</p>
                <p className="text-md sm:text-lg text-yellow-400 mt-1 text-center">
                  Enemies Defeated: {enemiesKilled}
                </p>
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

          {/* Victory Screen */}
          {gameState === 'victory' && (
            <div 
              className="w-full flex flex-col items-center justify-center bg-gradient-to-b from-yellow-900 via-purple-900 to-black border-2 sm:border-4 border-yellow-500 rounded-lg shadow-2xl p-8"
              style={{ aspectRatio: '4/3', minHeight: '400px' }}
            >
              <h2 className="text-4xl sm:text-7xl font-bold text-yellow-400 mb-4 sm:mb-6 animate-bounce">
                🎉 VICTORY! 🎉
              </h2>
              <p className="text-2xl sm:text-3xl text-cyan-300 mb-4">You saved the galaxy!</p>
              <div className="bg-black/50 p-4 sm:p-8 rounded-lg mb-6 sm:mb-8 border border-yellow-500/50">
                <p className="text-2xl sm:text-4xl text-cyan-400 mb-2">Final Score</p>
                <p className="text-4xl sm:text-6xl font-bold text-white text-center">{score}</p>
                <p className="text-lg sm:text-xl text-green-400 mt-2 text-center">All 6 Levels Complete!</p>
                <p className="text-md sm:text-lg text-purple-400 mt-1 text-center">
                  Total Enemies Defeated: {enemiesKilled}
                </p>
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

        {/* Mobile Controls - Below Canvas */}
        {gameState === 'playing' && (
          <div className="flex gap-2 sm:gap-4 w-full px-2 justify-center pb-4">
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
      </div>
    </div>
  );
};

export default StellarStrike;