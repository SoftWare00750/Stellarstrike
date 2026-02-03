import React, { useState, useEffect, useRef } from 'react';

const StellarStrike = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [gameState, setGameState] = useState('mainMenu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [showLevelTransition, setShowLevelTransition] = useState(false);
  const [selectedShip, setSelectedShip] = useState(null);
  const gameLoopRef = useRef(null);
  const gameDataRef = useRef({
    player: { x: 482, y: 650, width: 60, height: 60, speed: 5, maxSpeed: 8 },
    bullets: [],
    enemies: [],
    enemyBullets: [],
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
    shieldDuration: 0,
    bossSpawned: false
  });

  const imagesRef = useRef({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Level configuration
  const levelConfig = {
    1: { enemiesRequired: 25, spawnRate: 1200, bossLevel: false, name: "Asteroid Belt", difficulty: 1 },
    2: { enemiesRequired: 40, spawnRate: 900, bossLevel: false, name: "Enemy Scouts", difficulty: 1.3 },
    3: { enemiesRequired: 55, spawnRate: 700, bossLevel: false, name: "Fighter Squadron", difficulty: 1.6 },
    4: { enemiesRequired: 70, spawnRate: 550, bossLevel: false, name: "Heavy Assault", difficulty: 1.9 },
    5: { enemiesRequired: 85, spawnRate: 400, bossLevel: false, name: "Elite Forces", difficulty: 2.2 },
    6: { enemiesRequired: 1, spawnRate: 5000, bossLevel: true, name: "FINAL BOSS", difficulty: 3 }
  };

  useEffect(() => {
    const loadImages = () => {
      const imageUrls = {
        playerBlue: '/assets/sprites/player-ship-blue.png',
        playerRed: '/assets/sprites/player-ship-red.png',
        enemySmallDrone: '/assets/sprites/enemy-small-drone.png',
        enemyFighter: '/assets/sprites/enemy-alien-fighter.png',
        enemyBoss: '/assets/sprites/enemy-boss-ship.png',
        spreadshot: '/assets/sprites/spreadshot.png',
        rapidfire: '/assets/sprites/rapidfire.png',
        shield: '/assets/sprites/shield.png',
        life: '/assets/sprites/life.png'
      };

      let loadedCount = 0;
      const totalImages = Object.keys(imageUrls).length;

      Object.entries(imageUrls).forEach(([key, url]) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            setImagesLoaded(true);
          }
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            setImagesLoaded(true);
          }
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

  useEffect(() => {
    const config = levelConfig[level];
    if (config && enemiesKilled >= config.enemiesRequired) {
      if (level < 6) {
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
        setGameState('victory');
      }
    }
  }, [enemiesKilled, level]);

  const startGame = (ship) => {
    setSelectedShip(ship);
    setScore(0);
    setLives(3);
    setLevel(1);
    setEnemiesKilled(0);
    gameDataRef.current = {
      player: { x: 482, y: 650, width: 60, height: 60, speed: 5, maxSpeed: 8 },
      bullets: [],
      enemies: [],
      enemyBullets: [],
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
      shieldDuration: 0,
      bossSpawned: false
    };
    setGameState('playing');
  };

  const returnToMainMenu = () => {
    setSelectedShip(null);
    setGameState('mainMenu');
    setScore(0);
    setLives(3);
    setLevel(1);
    setEnemiesKilled(0);
  };

  const goToShipSelection = () => {
    setGameState('shipSelection');
  };

  const shoot = (game) => {
    const now = Date.now();
    const fireRate = game.rapidFire ? game.fireRate / 2 : game.fireRate;
    
    if (now - game.lastShot < fireRate) return;
    game.lastShot = now;

    if (game.spreadShot) {
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
    const types = ['spreadshot', 'rapidfire', 'life'];
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
    
    if (config.bossLevel && !game.bossSpawned) {
      game.bossSpawned = true;
      game.enemies.push({
        x: 452,
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
    
    const rand = Math.random();
    let type, size, health, speed, points, canShoot;
    
    if (rand > 0.95 - (difficulty * 0.05)) {
      type = 'enemyBoss';
      size = 80 + (difficulty * 5);
      health = Math.floor(5 * difficulty);
      speed = 1 + (difficulty * 0.3);
      points = 100;
      canShoot = true;
    } else if (rand > 0.7 - (difficulty * 0.1)) {
      type = 'enemyFighter';
      size = 55 + (difficulty * 3);
      health = Math.floor(2 * difficulty);
      speed = 2 + (difficulty * 0.4);
      points = 30;
      canShoot = true;
    } else {
      type = 'enemySmallDrone';
      size = 45 + (difficulty * 2);
      health = Math.floor(1 * difficulty);
      speed = 3 + (difficulty * 0.5);
      points = 10;
      canShoot = false;
    }
    
    const patterns = ['straight', 'zigzag', 'sine', 'diagonal'];
    const movePattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    game.enemies.push({
      x: Math.random() * (1024 - size),
      y: -size,
      width: size,
      height: size,
      speed,
      type,
      health,
      maxHealth: health,
      points,
      isBoss: false,
      canShoot,
      shootTimer: 0,
      shootInterval: 2000 + Math.random() * 2000,
      movePattern: movePattern,
      moveTimer: 0,
      amplitude: 50 + Math.random() * 100,
      frequency: 0.02 + Math.random() * 0.03,
      initialX: Math.random() * (1024 - size),
      zigzagDirection: Math.random() > 0.5 ? 1 : -1
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
    
    if (boss.moveTimer > 1000) {
      boss.movePattern = (boss.movePattern + 1) % 3;
      boss.moveTimer = 0;
    }
    
    if (boss.movePattern === 0) {
      boss.x += Math.sin(Date.now() * 0.001) * 2;
    } else if (boss.movePattern === 1) {
      boss.x += boss.speed * 2;
      if (boss.x > 904 || boss.x < 0) boss.speed *= -1;
    }
    
    boss.y = Math.min(100, boss.y + 0.3);
    
    if (boss.shootTimer > boss.shootInterval) {
      boss.shootTimer = 0;
      
      for (let i = -1; i <= 1; i++) {
        const angle = Math.atan2(
          game.player.y - boss.y,
          game.player.x - boss.x
        ) + (i * 0.2);
        
        game.enemyBullets.push({
          x: boss.x + boss.width / 2,
          y: boss.y + boss.height,
          width: 12,
          height: 12,
          speed: 4,
          angle: angle
        });
      }
    }
  };

  const update = (game) => {
    if (game.keys['ArrowLeft']) game.player.x -= game.player.speed;
    if (game.keys['ArrowRight']) game.player.x += game.player.speed;
    if (game.keys['ArrowUp']) game.player.y -= game.player.speed;
    if (game.keys['ArrowDown']) game.player.y += game.player.speed;

    game.player.x = Math.max(0, Math.min(1024 - game.player.width, game.player.x));
    game.player.y = Math.max(0, Math.min(768 - game.player.height, game.player.y));

    game.bullets = game.bullets.filter(b => {
      b.y -= b.speed;
      if (b.angle) {
        b.x += Math.sin(b.angle) * b.speed;
      }
      return b.y > -b.height && b.x > 0 && b.x < 1024;
    });

    game.enemyBullets = game.enemyBullets.filter(b => {
      b.x += Math.cos(b.angle) * b.speed;
      b.y += Math.sin(b.angle) * b.speed;
      return b.y < 800 && b.y > -b.height && b.x > 0 && b.x < 1024;
    });

    const now = Date.now();
    if (now - game.lastEnemySpawn > game.enemySpawnRate) {
      spawnEnemy(game);
      game.lastEnemySpawn = now;
    }
    
    if (now - game.lastPowerUpSpawn > game.powerUpSpawnRate) {
      const randomX = Math.random() * 994;
      spawnPowerUp(game, randomX, -30);
      game.lastPowerUpSpawn = now;
    }

    game.powerUps = game.powerUps.filter(p => {
      p.y += p.speed;
      
      if (checkCollision(game.player, p)) {
        switch(p.type) {
          case 'spreadshot':
            game.spreadShot = true;
            setTimeout(() => game.spreadShot = false, 10000);
            break;
          case 'rapidfire':
            game.rapidFire = true;
            setTimeout(() => game.rapidFire = false, 8000);
            break;
          case 'life':
            setLives(l => Math.min(l + 1, 5));
            break;
        }
        return false;
      }
      
      return p.y < 800;
    });

    game.enemies = game.enemies.filter(e => {
      if (e.isBoss) {
        updateBoss(e, game);
      } else {
        e.moveTimer += 16;
        
        switch(e.movePattern) {
          case 'straight':
            e.y += e.speed;
            break;
          case 'zigzag':
            e.y += e.speed;
            if (e.moveTimer % 500 < 250) {
              e.x += e.speed * e.zigzagDirection;
            } else {
              e.x -= e.speed * e.zigzagDirection;
            }
            if (e.x < 0 || e.x > 1024 - e.width) {
              e.zigzagDirection *= -1;
            }
            break;
          case 'sine':
            e.y += e.speed;
            e.x = e.initialX + Math.sin(e.y * e.frequency) * e.amplitude;
            e.x = Math.max(0, Math.min(1024 - e.width, e.x));
            break;
          case 'diagonal':
            e.y += e.speed;
            e.x += e.speed * (e.zigzagDirection || 1);
            if (e.x < 0 || e.x > 1024 - e.width) {
              e.zigzagDirection = (e.zigzagDirection || 1) * -1;
            }
            break;
        }
        
        if (e.canShoot && e.y > 0 && e.y < 300) {
          e.shootTimer += 16;
          if (e.shootTimer > e.shootInterval) {
            e.shootTimer = 0;
            const angle = Math.atan2(
              game.player.y - e.y,
              game.player.x - e.x
            );
            game.enemyBullets.push({
              x: e.x + e.width / 2,
              y: e.y + e.height,
              width: 8,
              height: 8,
              speed: 3,
              angle: angle
            });
          }
        }
      }
      
      for (let i = game.bullets.length - 1; i >= 0; i--) {
        if (checkCollision(game.bullets[i], e)) {
          game.bullets.splice(i, 1);
          e.health--;
          if (e.health <= 0) {
            createExplosion(game, e.x + e.width / 2, e.y + e.height / 2, e.isBoss ? 50 : 20);
            setScore(s => s + e.points);
            setEnemiesKilled(k => k + 1);
            
            if (Math.random() > 0.85) {
              spawnPowerUp(game, e.x + e.width / 2, e.y + e.height / 2);
            }
            return false;
          }
        }
      }

      if (checkCollision(game.player, e)) {
        createExplosion(game, e.x + e.width / 2, e.y + e.height / 2, 30);
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) setGameState('gameOver');
          return newLives;
        });
        return false;
      }

      return e.y < 800 && e.y > -e.height;
    });

    for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
      if (checkCollision(game.player, game.enemyBullets[i])) {
        game.enemyBullets.splice(i, 1);
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) setGameState('gameOver');
          return newLives;
        });
      }
    }

    game.particles = game.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      return p.life > 0;
    });
  };

  const render = (ctx, game) => {
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, 1024, 768);

    ctx.save();
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 130; i++) {
      const x = (i * 123) % 1024;
      const y = (i * 456 + Date.now() * 0.03 * (1 + i % 3)) % 768;
      const size = 1 + (i % 3);
      ctx.globalAlpha = 0.3 + (i % 7) * 0.1;
      ctx.fillRect(x, y, size, size);
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#00ff88';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ff88';
    game.bullets.forEach(b => {
      ctx.fillRect(b.x, b.y, b.width, b.height);
    });
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff0055';
    game.enemyBullets.forEach(b => {
      ctx.fillRect(b.x, b.y, b.width, b.height);
    });
    ctx.restore();

    game.powerUps.forEach(p => {
      ctx.save();
      const img = imagesRef.current[p.type];
      if (img?.complete && img.naturalWidth > 0) {
        ctx.globalAlpha = 0.9 + Math.sin(Date.now() * 0.01) * 0.1;
        ctx.drawImage(img, p.x, p.y, p.width, p.height);
      } else {
        const colors = {
          spreadshot: '#ff6b35',
          rapidfire: '#ffd700',
          shield: '#00d9ff',
          life: '#ff0844'
        };
        ctx.fillStyle = colors[p.type];
        ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
        ctx.fillRect(p.x, p.y, p.width, p.height);
      }
      ctx.restore();
    });

    game.enemies.forEach(e => {
      ctx.save();
      const img = imagesRef.current[e.type] || imagesRef.current.enemyBoss;
      if (e.isBoss) {
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
      ctx.restore();
      
      if (e.health < e.maxHealth || e.isBoss) {
        ctx.save();
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
        ctx.restore();
      }
    });

    game.particles.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 40;
      ctx.fillRect(p.x, p.y, 4, 4);
      ctx.restore();
    });

    ctx.save();
    ctx.globalAlpha = 1;
    const playerImg = selectedShip === 'blue' ? imagesRef.current.playerBlue : imagesRef.current.playerRed;
    if (playerImg?.complete && playerImg.naturalWidth > 0) {
      ctx.drawImage(playerImg, game.player.x, game.player.y, game.player.width, game.player.height);
    } else {
      ctx.fillStyle = selectedShip === 'blue' ? '#00d9ff' : '#ff0844';
      ctx.fillRect(game.player.x, game.player.y, game.player.width, game.player.height);
    }
    ctx.restore();
  };

  const handleMobileControl = (action) => {
    const game = gameDataRef.current;
    if (action === 'fire') shoot(game);
  };

  const touchStateRef = useRef({
    isDragging: false,
    touchId: null
  });

  const handleCanvasTouch = (e) => {
    if (gameState !== 'playing') return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const touch = e.touches[0] || e.changedTouches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    
    const game = gameDataRef.current;
    
    game.player.x = x - game.player.width / 2;
    game.player.y = y - game.player.height / 2;
    
    game.player.x = Math.max(0, Math.min(1024 - game.player.width, game.player.x));
    game.player.y = Math.max(0, Math.min(768 - game.player.height, game.player.y));
  };

  const handleCanvasMouseMove = (e) => {
    if (gameState !== 'playing' || !touchStateRef.current.isDragging) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const game = gameDataRef.current;
    
    game.player.x = x - game.player.width / 2;
    game.player.y = y - game.player.height / 2;
    
    game.player.x = Math.max(0, Math.min(1024 - game.player.width, game.player.x));
    game.player.y = Math.max(0, Math.min(768 - game.player.height, game.player.y));
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen w-full bg-gradient-to-b from-slate-900 to-black overflow-x-hidden touch-none p-0 sm:p-2">
      <div className="w-full h-full flex flex-col gap-2 max-w-[1100px]">
        {/* Title */}
        {(gameState === 'mainMenu' || gameState === 'shipSelection' || gameState === 'gameOver' || gameState === 'victory') && (
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 text-center tracking-wider py-2 sm:py-4 flex-shrink-0">
            STELLAR STRIKE
          </h1>
        )}

        {/* HUD */}
        {(gameState === 'playing' || gameState === 'paused' || gameState === 'levelTransition') && (
          <div className="bg-gradient-to-r from-slate-700 via-purple-700 to-slate-700 border border-cyan-400/40 rounded p-2 mx-2 sm:mx-0 flex-shrink-0">
            <div className="grid grid-cols-4 gap-2 text-xs sm:text-sm">
              <div className="bg-black/50 px-2 py-1 rounded border border-cyan-500/50">
                <div className="text-cyan-400 text-[9px] sm:text-xs">SCORE</div>
                <div className="text-sm sm:text-base font-bold text-white">{score}</div>
              </div>
              <div className="bg-black/50 px-2 py-1 rounded border border-red-500/50">
                <div className="text-red-400 text-[9px] sm:text-xs">LIVES</div>
                <div className="flex gap-0.5">
                  {[...Array(lives)].map((_, i) => (
                    <span key={i} className="text-xs sm:text-sm">❤️</span>
                  ))}
                </div>
              </div>
              <div className="bg-black/50 px-2 py-1 rounded border border-purple-500/50">
                <div className="text-purple-400 text-[9px] sm:text-xs">LVL</div>
                <div className="text-sm sm:text-base font-bold text-white">{level}/6</div>
              </div>
              <div className="bg-black/50 px-2 py-1 rounded border border-yellow-500/50">
                <div className="text-yellow-400 text-[9px] sm:text-xs">KILL</div>
                <div className="text-sm sm:text-base font-bold text-white">{enemiesKilled}/{levelConfig[level]?.enemiesRequired}</div>
              </div>
            </div>
            <div className="text-center mt-1">
              <div className="text-xs sm:text-sm font-bold text-cyan-300">{levelConfig[level]?.name}</div>
            </div>
            {(gameDataRef.current.spreadShot || gameDataRef.current.rapidFire) && (
              <div className="flex gap-1 justify-center mt-1 flex-wrap text-[9px] sm:text-xs">
                {gameDataRef.current.spreadShot && <div className="bg-orange-600/80 px-2 py-0.5 rounded-full font-bold">⚡SPREAD</div>}
                {gameDataRef.current.rapidFire && <div className="bg-yellow-600/80 px-2 py-0.5 rounded-full font-bold">🔥RAPID</div>}
              </div>
            )}
          </div>
        )}

        {/* Game Canvas Container - MOBILE OPTIMIZED */}
        <div ref={containerRef} className="relative w-full flex-1 flex items-center justify-center bg-black overflow-hidden mx-2 sm:mx-0 rounded-lg min-h-0">
          <canvas
            ref={canvasRef}
            width={1024}
            height={768}
            className="border-2 border-cyan-500 rounded shadow-2xl w-full h-full max-h-full object-contain touch-none"
            style={{ 
              display: gameState === 'playing' || gameState === 'paused' || gameState === 'levelTransition' ? 'block' : 'none'
            }}
            onTouchStart={handleCanvasTouch}
            onTouchMove={handleCanvasTouch}
            onMouseDown={(e) => {
              touchStateRef.current.isDragging = true;
              handleCanvasMouseMove(e);
            }}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={() => touchStateRef.current.isDragging = false}
            onMouseLeave={() => touchStateRef.current.isDragging = false}
          />

          {/* Level Transition */}
          {gameState === 'levelTransition' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-lg backdrop-blur-sm z-10 p-4">
              <h2 className="text-3xl sm:text-5xl font-bold text-green-400 mb-4 animate-bounce">LEVEL {level} COMPLETE!</h2>
              <p className="text-xl sm:text-2xl text-cyan-300">Advancing to Level {level + 1}</p>
              <p className="text-lg sm:text-xl text-purple-400 mt-2">{levelConfig[level + 1]?.name}</p>
            </div>
          )}

          {/* Pause Screen */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-lg backdrop-blur-sm z-10 p-4">
              <h2 className="text-4xl sm:text-5xl font-bold text-cyan-400 mb-6">⏸ PAUSED</h2>
              <div className="space-y-3 w-full max-w-md px-4">
                <button onClick={() => setGameState('playing')} className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-base sm:text-lg font-bold rounded-lg">▶ RESUME</button>
                <button onClick={() => startGame(selectedShip)} className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white text-base sm:text-lg font-bold rounded-lg">🔄 RESTART</button>
                <button onClick={returnToMainMenu} className="w-full px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white text-base sm:text-lg font-bold rounded-lg">🏠 MENU</button>
              </div>
            </div>
          )}

          {/* Main Menu */}
          {gameState === 'mainMenu' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-purple-900 to-black border-2 border-cyan-500 rounded-lg shadow-2xl p-4 sm:p-8 overflow-y-auto">
              <div className="text-center mb-6 w-full">
                <p className="text-cyan-300 text-base sm:text-lg mb-2">Defend the Galaxy</p>
                <p className="text-purple-300 text-sm sm:text-base mb-4">6 Levels • Epic Boss Battle</p>
              </div>
              
              <div className="w-full max-w-md px-4">
                <button 
                  onClick={goToShipSelection} 
                  className="w-full px-8 py-5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-xl sm:text-2xl font-bold rounded-lg transition-all hover:scale-105 shadow-lg"
                >
                  🚀 START GAME
                </button>
              </div>
              
              <div className="text-cyan-300 text-center space-y-2 text-xs sm:text-sm mt-8 w-full px-4">
                <p>⌨️ Arrow Keys - Move | Spacebar - Shoot</p>
                <p>📱 Touch & Drag - Move | Fire Button - Shoot</p>
                <p>ESC - Pause | Collect power-ups!</p>
              </div>
            </div>
          )}

          {/* Ship Selection */}
          {gameState === 'shipSelection' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-purple-900 to-black border-2 border-cyan-500 rounded-lg shadow-2xl p-4 sm:p-8 overflow-y-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-6">Choose Your Ship</h2>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-8 w-full max-w-2xl px-4">
                <button onClick={() => startGame('blue')} className="flex flex-col items-center p-6 bg-cyan-900/50 border-2 border-cyan-500 rounded-lg hover:bg-cyan-800/50 hover:scale-105 transition-all flex-1">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-5xl sm:text-6xl">🚀</span>
                  </div>
                  <span className="text-cyan-400 font-bold text-lg sm:text-xl">BLUE STRIKER</span>
                  <span className="text-cyan-300 text-sm">Balanced Power</span>
                </button>
                <button onClick={() => startGame('red')} className="flex flex-col items-center p-6 bg-red-900/50 border-2 border-red-500 rounded-lg hover:bg-red-800/50 hover:scale-105 transition-all flex-1">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-red-500/20 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-5xl sm:text-6xl">🔴</span>
                  </div>
                  <span className="text-red-400 font-bold text-lg sm:text-xl">RED PHOENIX</span>
                  <span className="text-red-300 text-sm">High Speed</span>
                </button>
              </div>
              <button 
                onClick={returnToMainMenu} 
                className="px-8 py-3 bg-slate-600 hover:bg-slate-500 text-white text-base sm:text-lg font-bold rounded-lg"
              >
                ← BACK
              </button>
            </div>
          )}

          {/* Game Over */}
          {gameState === 'gameOver' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-red-900 via-black to-black border-2 border-red-500 rounded-lg shadow-2xl p-4 sm:p-8 overflow-y-auto">
              <h2 className="text-4xl sm:text-6xl font-bold text-red-500 mb-6 animate-pulse">GAME OVER</h2>
              <div className="bg-black/50 p-6 rounded-lg mb-6 border border-red-500/50 w-full max-w-md">
                <p className="text-2xl sm:text-3xl text-cyan-400 mb-2">Final Score</p>
                <p className="text-4xl sm:text-5xl font-bold text-white text-center">{score}</p>
                <p className="text-base sm:text-xl text-purple-400 mt-2 text-center">Level {level}/6</p>
                <p className="text-sm sm:text-lg text-yellow-400 text-center">Enemies: {enemiesKilled}</p>
              </div>
              <div className="space-y-3 w-full max-w-md px-4">
                <button onClick={() => startGame(selectedShip)} className="w-full px-6 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-lg font-bold rounded-lg">🎮 PLAY AGAIN</button>
                <button onClick={returnToMainMenu} className="w-full px-6 py-4 bg-slate-600 hover:bg-slate-500 text-white text-lg font-bold rounded-lg">🏠 MENU</button>
              </div>
            </div>
          )}

          {/* Victory */}
          {gameState === 'victory' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-yellow-900 via-purple-900 to-black border-2 border-yellow-500 rounded-lg shadow-2xl p-4 sm:p-8 overflow-y-auto">
              <h2 className="text-4xl sm:text-6xl font-bold text-yellow-400 mb-6 animate-bounce">🎉 VICTORY! 🎉</h2>
              <p className="text-2xl sm:text-3xl text-cyan-300 mb-4">You saved the galaxy!</p>
              <div className="bg-black/50 p-6 rounded-lg mb-6 border border-yellow-500/50 w-full max-w-md">
                <p className="text-2xl sm:text-3xl text-cyan-400 mb-2">Final Score</p>
                <p className="text-4xl sm:text-5xl font-bold text-white text-center">{score}</p>
                <p className="text-base sm:text-xl text-green-400 mt-2 text-center">All 6 Levels Complete!</p>
                <p className="text-sm sm:text-lg text-purple-400 text-center">Total Enemies: {enemiesKilled}</p>
              </div>
              <div className="space-y-3 w-full max-w-md px-4">
                <button onClick={() => startGame(selectedShip)} className="w-full px-6 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-lg font-bold rounded-lg">🎮 PLAY AGAIN</button>
                <button onClick={returnToMainMenu} className="w-full px-6 py-4 bg-slate-600 hover:bg-slate-500 text-white text-lg font-bold rounded-lg">🏠 MENU</button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Fire Button - FIXED TO ALWAYS SHOW */}
        {gameState === 'playing' && (
          <div className="flex justify-between items-center gap-2 px-2 pb-2 sm:pb-4 flex-shrink-0 md:hidden">
            <p className="text-cyan-300 text-xs sm:text-sm flex-1">Touch & drag to move</p>
            <button 
              onTouchStart={(e) => { e.preventDefault(); handleMobileControl('fire'); }}
              onMouseDown={() => handleMobileControl('fire')}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-600 to-orange-600 active:from-red-700 active:to-orange-700 text-white font-bold rounded-full flex flex-col items-center justify-center shadow-lg touch-none select-none flex-shrink-0"
            >
              <span className="text-2xl sm:text-3xl">🔥</span>
              <span className="text-xs sm:text-sm">FIRE</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StellarStrike;