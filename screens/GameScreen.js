import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  CANVAS_W, CANVAS_H, PADDLE_W, PADDLE_H, PADDLE_Y, PADDLE_SPEED,
  BALL_R, BRICK_W, BRICK_H, BRICK_PAD, BRICK_TOP, BRICK_LEFT,
  BRICK_COLORS, LEVELS,
} from '../constants/game';

// ─── Brick ───────────────────────────────────────────────────────────────────
function Brick({ x, y }) {
  return (
    <View style={[styles.brick, { left: x, top: y }]}>
      <View style={[styles.mortarH, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
      <View style={[styles.mortarV1, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
      <View style={styles.brickHighlight} />
    </View>
  );
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
function HUD({ lives, score, level }) {
  return (
    <View style={styles.hud}>
      <Text style={styles.hudText}>LIVES: {lives}</Text>
      <Text style={styles.hudText}>LEVEL {level}</Text>
      <Text style={styles.hudText}>SCORE: {score}</Text>
    </View>
  );
}

// ─── Overlay ─────────────────────────────────────────────────────────────────
function Overlay({ title, sub, btnText, onPress }) {
  return (
    <View style={styles.overlay}>
      <Text style={styles.overlayTitle}>{title}</Text>
      {sub && <Text style={styles.overlaySub}>{sub}</Text>}
      <TouchableOpacity style={styles.overlayBtnWrap} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.overlayBtn}>{btnText}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Game ─────────────────────────────────────────────────────────────────────
export default function GameScreen() {
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState('start');
  const [bricks, setBricks] = useState([]);
  const [paddleX, setPaddleX] = useState(CANVAS_W / 2 - PADDLE_W / 2);
  const [ballPos, setBallPos] = useState({ x: CANVAS_W / 2, y: CANVAS_H - 80 });

  // Refs to avoid stale closures in game loop
  const runningRef = useRef(false);
  const animRef = useRef(null);
  const bricksRef = useRef([]);
  const ballRef = useRef({ x: CANVAS_W / 2, y: CANVAS_H - 80, vx: 3.5, vy: -4.5 });
  const paddleXRef = useRef(CANVAS_W / 2 - PADDLE_W / 2);
  const levelRef = useRef(1);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);

  // Left/right key state for physical keyboard
  const keysRef = useRef({ left: false, right: false });
  const keyIntervalRef = useRef(null);

  const buildBricks = useCallback((lvlIdx) => {
    const layout = LEVELS[lvlIdx % LEVELS.length];
    const built = [];
    for (let r = 0; r < layout.length; r++) {
      for (let c = 0; c < layout[r].length; c++) {
        if (!layout[r][c]) continue;
        built.push({
          id: `${r}-${c}`,
          x: BRICK_LEFT + c * (BRICK_W + BRICK_PAD),
          y: BRICK_TOP + r * (BRICK_H + BRICK_PAD),
          color: BRICK_COLORS[r % BRICK_COLORS.length],
          alive: true,
        });
      }
    }
    return built;
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
    setLevel(1);
    setScore(0);
    setLives(3);
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

  // ─── Keyboard handling (for physical keyboard) ────────────────────────────────
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
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [gameState]);

  // Keyboard polling loop
  useEffect(() => {
    keyIntervalRef.current = setInterval(() => {
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
    return () => clearInterval(keyIntervalRef.current);
  }, [gameState]);

  // ─── Game loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== 'playing') return;

    const loop = () => {
      if (!runningRef.current) return;

      const b = ballRef.current;
      b.x += b.vx;
      b.y += b.vy;

      // Wall collisions
      if (b.x - BALL_R < 0) { b.x = BALL_R; b.vx = Math.abs(b.vx); }
      if (b.x + BALL_R > CANVAS_W) { b.x = CANVAS_W - BALL_R; b.vx = -Math.abs(b.vx); }
      if (b.y - BALL_R < 0) { b.y = BALL_R; b.vy = Math.abs(b.vy); }

      // Bottom — lose life
      if (b.y + BALL_R > CANVAS_H) {
        livesRef.current -= 1;
        setLives(livesRef.current);
        if (livesRef.current <= 0) {
          runningRef.current = false;
          setGameState('gameover');
        } else {
          resetBall();
        }
        return;
      }

      // Paddle collision
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

      // Brick collisions
      let hit = false;
      bricksRef.current = bricksRef.current.map((br) => {
        if (!br.alive || hit) return br;
        if (b.x + BALL_R > br.x && b.x - BALL_R < br.x + BRICK_W &&
            b.y + BALL_R > br.y && b.y - BALL_R < br.y + BRICK_H) {
          hit = true;
          scoreRef.current += 10;
          setScore(scoreRef.current);

          const overlapLeft = (b.x + BALL_R) - br.x;
          const overlapRight = (br.x + BRICK_W) - (b.x - BALL_R);
          const overlapTop = (b.y + BALL_R) - br.y;
          const overlapBottom = (br.y + BRICK_H) - (b.y - BALL_R);
          const minX = Math.min(overlapLeft, overlapRight);
          const minY = Math.min(overlapTop, overlapBottom);

          if (minX < minY) { b.vx *= -1; }
          else { b.vy *= -1; }

          return { ...br, alive: false };
        }
        return br;
      });

      if (hit) {
        setBricks([...bricksRef.current]);
        const allDead = bricksRef.current.every(br => !br.alive);
        if (allDead) {
          runningRef.current = false;
          if (levelRef.current >= 3) {
            setGameState('win');
          } else {
            setGameState('levelComplete');
          }
          return;
        }
      }

      setBallPos({ x: b.x, y: b.y });
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameState, resetBall]);

  // Build initial bricks on mount
  useEffect(() => {
    bricksRef.current = buildBricks(0);
    setBricks([...bricksRef.current]);
  }, [buildBricks]);

  // ─── Touch handling ──────────────────────────────────────────────────────────
  const handleTouch = useCallback((evt) => {
    if (gameState !== 'playing') return;
    const x = evt.nativeEvent.locationX;
    const newX = x - PADDLE_W / 2;
    paddleXRef.current = Math.max(0, Math.min(CANVAS_W - PADDLE_W, newX));
    setPaddleX(paddleXRef.current);
  }, [gameState]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <View
          style={[styles.gameArea, { width: CANVAS_W, height: CANVAS_H }]}
          onTouchMove={handleTouch}
          onTouchStart={handleTouch}
        >
          {/* Background */}
          <View style={styles.gameBg} />

          {/* HUD */}
          <HUD lives={lives} score={score} level={level} />

          {/* Bricks */}
          {bricks.map((br) =>
            br.alive ? <Brick key={br.id} x={br.x} y={br.y} /> : null
          )}

          {/* Paddle */}
          <View style={[styles.paddle, { left: paddleX, top: PADDLE_Y }]}>
            <View style={styles.paddleShine} />
          </View>

          {/* Ball */}
          <View
            style={[
              styles.ball,
              { left: ballPos.x - BALL_R, top: ballPos.y - BALL_R },
            ]}
          />

          {/* Overlays */}
          {gameState === 'start' && (
            <Overlay title="BRICK BREAKER" sub="Tap to move paddle" btnText="START" onPress={startGame} />
          )}
          {gameState === 'gameover' && (
            <Overlay title="GAME OVER" sub={`Score: ${score}`} btnText="TRY AGAIN" onPress={startGame} />
          )}
          {gameState === 'levelComplete' && (
            <Overlay title={`LEVEL ${level}`} sub="Get Ready!" btnText="NEXT LEVEL" onPress={startNextLevel} />
          )}
          {gameState === 'win' && (
            <Overlay title="YOU WIN!" sub={`Final Score: ${score}`} btnText="PLAY AGAIN" onPress={startGame} />
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  kav: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gameArea: {
    position: 'relative',
    backgroundColor: '#0d0d1a',
    overflow: 'hidden',
  },
  gameBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#0d0d1a',
  },
  hud: {
    position: 'absolute',
    top: 6, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    zIndex: 5,
  },
  hudText: {
    color: '#666',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
  mortarH: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BRICK_PAD,
  },
  mortarV1: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 1.5,
    height: '100%',
  },
  brickHighlight: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 1,
  },
  paddle: {
    position: 'absolute',
    width: PADDLE_W,
    height: PADDLE_H,
    backgroundColor: '#cc3311',
    borderRadius: 3,
  },
  paddleShine: {
    position: 'absolute',
    top: 2,
    left: 3,
    right: 3,
    height: 4,
    backgroundColor: 'rgba(255,180,150,0.3)',
    borderRadius: 2,
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
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  overlayTitle: {
    fontSize: 30,
    color: '#ff6644',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 4,
    marginBottom: 8,
  },
  overlaySub: {
    fontSize: 14,
    color: '#888',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 24,
  },
  overlayBtnWrap: {
    backgroundColor: '#cc4422',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 4,
  },
  overlayBtn: {
    fontSize: 16,
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    fontWeight: 'bold',
  },
});
