import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  CANVAS_W, CANVAS_H, PADDLE_W, PADDLE_H, PADDLE_Y, PADDLE_SPEED,
  BALL_R, BRICK_W, BRICK_H, BRICK_PAD, BRICK_TOP, BRICK_LEFT,
  BRICK_COLORS, LEVELS,
} from './constants/game';

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
  },
  gameArea: {
    position: 'relative',
    width: CANVAS_W,
    height: CANVAS_H,
    backgroundColor: '#0d0d1a',
    overflow: 'hidden',
    cursor: 'none',
  },
  hud: {
    position: 'absolute',
    top: 6, left: 0, right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 14px',
    zIndex: 5,
    pointerEvents: 'none',
  },
  hudText: {
    color: '#666',
    fontSize: 11,
    fontFamily: 'Courier New, monospace',
    letterSpacing: 1,
  },
  brick: {
    position: 'absolute',
    width: BRICK_W,
    height: BRICK_H,
    backgroundColor: '#cc3311',
    borderRadius: 2,
    overflow: 'hidden',
  },
  paddle: {
    position: 'absolute',
    width: PADDLE_W,
    height: PADDLE_H,
    backgroundColor: '#cc3311',
    borderRadius: 3,
  },
  ball: {
    position: 'absolute',
    width: BALL_R * 2,
    height: BALL_R * 2,
    borderRadius: BALL_R,
    backgroundColor: '#ffaa33',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(5,5,20,0.9)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  overlayTitle: {
    fontSize: 30,
    color: '#ff6644',
    fontFamily: 'Courier New, monospace',
    letterSpacing: 4,
    marginBottom: 8,
  },
  overlaySub: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Courier New, monospace',
    marginBottom: 24,
  },
  overlayBtn: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Courier New, monospace',
    backgroundColor: '#cc4422',
    padding: '12px 32px',
    borderRadius: 4,
    cursor: 'pointer',
    letterSpacing: 2,
    fontWeight: 'bold',
    border: 'none',
  },
};

// ─── Brick ───────────────────────────────────────────────────────────────────
function Brick({ x, y }) {
  return (
    <div style={{ ...styles.brick, left: x, top: y }}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: BRICK_PAD, backgroundColor: 'rgba(0,0,0,0.35)' }} />
      <div style={{ position: 'absolute', top: 0, left: '50%', width: 1.5, height: '100%', backgroundColor: 'rgba(0,0,0,0.35)' }} />
      <div style={{ position: 'absolute', top: 2, left: 2, right: 2, height: 3, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 1 }} />
    </div>
  );
}

// ─── Overlay ─────────────────────────────────────────────────────────────────
function Overlay({ title, sub, btnText, onStart }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.overlayTitle}>{title}</div>
      {sub && <div style={styles.overlaySub}>{sub}</div>}
      <button style={styles.overlayBtn} onClick={onStart}>{btnText}</button>
    </div>
  );
}

// ─── Game ─────────────────────────────────────────────────────────────────────
export default function Game() {
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState('start');
  const [bricks, setBricks] = useState([]);
  const [paddleX, setPaddleX] = useState(CANVAS_W / 2 - PADDLE_W / 2);
  const [ballPos, setBallPos] = useState({ x: CANVAS_W / 2, y: CANVAS_H - 80 });

  const runningRef = useRef(false);
  const animRef = useRef(null);
  const bricksRef = useRef([]);
  const ballRef = useRef({ x: CANVAS_W / 2, y: CANVAS_H - 80, vx: 3.5, vy: -4.5 });
  const paddleXRef = useRef(CANVAS_W / 2 - PADDLE_W / 2);
  const levelRef = useRef(1);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const keysRef = useRef({ left: false, right: false });

  const buildBricks = useCallback((lvlIdx) => {
    const layout = LEVELS[lvlIdx % LEVELS.length];
    return layout.flatMap((row, r) =>
      row.map((cell, c) => cell ? {
        id: `${r}-${c}`,
        x: BRICK_LEFT + c * (BRICK_W + BRICK_PAD),
        y: BRICK_TOP + r * (BRICK_H + BRICK_PAD),
        alive: true,
      } : null).filter(Boolean)
    );
  }, []);

  const resetBall = useCallback(() => {
    const sign = () => Math.random() > 0.5 ? 1 : -1;
    const bx = CANVAS_W / 2;
    const by = CANVAS_H - 80;
    ballRef.current = { x: bx, y: by, vx: sign() * 3.5, vy: -4.5 };
    setBallPos({ x: bx, y: by });
  }, []);

  const startGame = useCallback(() => {
    levelRef.current = 1;
    scoreRef.current = 0;
    livesRef.current = 3;
    bricksRef.current = buildBricks(0);
    paddleXRef.current = CANVAS_W / 2 - PADDLE_W / 2;
    setLevel(1); setScore(0); setLives(3);
    setBricks([...bricksRef.current]);
    setPaddleX(paddleXRef.current);
    resetBall();
    runningRef.current = true;
    setGameState('playing');
  }, [buildBricks, resetBall]);

  const startNextLevel = useCallback(() => {
    levelRef.current += 1;
    bricksRef.current = buildBricks(levelRef.current - 1);
    setLevel(levelRef.current);
    setBricks([...bricksRef.current]);
    paddleXRef.current = CANVAS_W / 2 - PADDLE_W / 2;
    setPaddleX(paddleXRef.current);
    resetBall();
    runningRef.current = true;
    setGameState('playing');
  }, [buildBricks, resetBall]);

  // ─── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e) => {
      if (gameState !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
    };
    const up = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [gameState]);

  // Keyboard polling
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameState !== 'playing') return;
      if (keysRef.current.left) {
        paddleXRef.current = Math.max(0, paddleXRef.current - PADDLE_SPEED);
        setPaddleX(paddleXRef.current);
      }
      if (keysRef.current.right) {
        paddleXRef.current = Math.min(CANVAS_W - PADDLE_W, paddleXRef.current + PADDLE_SPEED);
        setPaddleX(paddleXRef.current);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [gameState]);

  // ─── Game loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== 'playing') return;

    const loop = () => {
      if (!runningRef.current) return;

      const b = ballRef.current;
      b.x += b.vx;
      b.y += b.vy;

      if (b.x - BALL_R < 0) { b.x = BALL_R; b.vx = Math.abs(b.vx); }
      if (b.x + BALL_R > CANVAS_W) { b.x = CANVAS_W - BALL_R; b.vx = -Math.abs(b.vx); }
      if (b.y - BALL_R < 0) { b.y = BALL_R; b.vy = Math.abs(b.vy); }

      if (b.y + BALL_R > CANVAS_H) {
        livesRef.current -= 1;
        setLives(livesRef.current);
        if (livesRef.current <= 0) { runningRef.current = false; setGameState('gameover'); }
        else { resetBall(); }
        return;
      }

      if (b.vy > 0 &&
          b.y + BALL_R >= PADDLE_Y &&
          b.y - BALL_R <= PADDLE_Y + PADDLE_H &&
          b.x >= paddleXRef.current &&
          b.x <= paddleXRef.current + PADDLE_W) {
        const hitPos = (b.x - paddleXRef.current) / PADDLE_W;
        const angle = (hitPos - 0.5) * Math.PI * 0.75;
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        const newSpeed = Math.min(speed * 1.01, 9);
        b.vx = newSpeed * Math.sin(angle);
        b.vy = -Math.abs(newSpeed * Math.cos(angle));
        b.y = PADDLE_Y - BALL_R;
      }

      let hit = false;
      bricksRef.current = bricksRef.current.map((br) => {
        if (!br.alive || hit) return br;
        if (b.x + BALL_R > br.x && b.x - BALL_R < br.x + BRICK_W &&
            b.y + BALL_R > br.y && b.y - BALL_R < br.y + BRICK_H) {
          hit = true;
          scoreRef.current += 10;
          setScore(scoreRef.current);
          const ol = (b.x + BALL_R) - br.x;
          const or_ = (br.x + BRICK_W) - (b.x - BALL_R);
          const ot = (b.y + BALL_R) - br.y;
          const ob = (br.y + BRICK_H) - (b.y - BALL_R);
          if (Math.min(ol, or_) < Math.min(ot, ob)) { b.vx *= -1; }
          else { b.vy *= -1; }
          return { ...br, alive: false };
        }
        return br;
      });

      if (hit) {
        setBricks([...bricksRef.current]);
        if (bricksRef.current.every(br => !br.alive)) {
          runningRef.current = false;
          setGameState(levelRef.current >= 3 ? 'win' : 'levelComplete');
          return;
        }
      }

      setBallPos({ x: b.x, y: b.y });
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameState, resetBall]);

  useEffect(() => {
    bricksRef.current = buildBricks(0);
    setBricks([...bricksRef.current]);
  }, [buildBricks]);

  // Touch handling
  const handleTouch = useCallback((e) => {
    if (gameState !== 'playing') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    paddleXRef.current = Math.max(0, Math.min(CANVAS_W - PADDLE_W, x - PADDLE_W / 2));
    setPaddleX(paddleXRef.current);
  }, [gameState]);

  return (
    <div style={styles.container}>
      <div
        style={styles.gameArea}
        onTouchMove={handleTouch}
        onTouchStart={handleTouch}
        onMouseMove={handleTouch}
      >
        {/* HUD */}
        <div style={styles.hud}>
          <span style={styles.hudText}>LIVES: {lives}</span>
          <span style={styles.hudText}>LEVEL {level}</span>
          <span style={styles.hudText}>SCORE: {score}</span>
        </div>

        {/* Bricks */}
        {bricks.map((br) => br.alive ? <Brick key={br.id} x={br.x} y={br.y} /> : null)}

        {/* Paddle */}
        <div style={{ ...styles.paddle, left: paddleX, top: PADDLE_Y }}>
          <div style={{ position: 'absolute', top: 2, left: 3, right: 3, height: 4, backgroundColor: 'rgba(255,180,150,0.3)', borderRadius: 2 }} />
        </div>

        {/* Ball */}
        <div style={{ ...styles.ball, left: ballPos.x - BALL_R, top: ballPos.y - BALL_R }} />

        {/* Overlays */}
        {gameState === 'start' && <Overlay title="BRICK BREAKER" sub="Arrow keys or tap/drag to move" btnText="START" onStart={startGame} />}
        {gameState === 'gameover' && <Overlay title="GAME OVER" sub={`Score: ${score}`} btnText="TRY AGAIN" onStart={startGame} />}
        {gameState === 'levelComplete' && <Overlay title={`LEVEL ${level}`} sub="Get Ready!" btnText="NEXT LEVEL" onStart={startNextLevel} />}
        {gameState === 'win' && <Overlay title="YOU WIN!" sub={`Final Score: ${score}`} btnText="PLAY AGAIN" onStart={startGame} />}
      </div>
    </div>
  );
}
