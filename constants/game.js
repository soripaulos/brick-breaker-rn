const BRICK_COLORS = [
  '#cc3311',
  '#dd4411',
  '#ee6611',
  '#ee8811',
  '#dd9911',
  '#ccaa11',
  '#bbaa00',
  '#998811',
];

export const LEVELS = [
  // Level 1: Classic pyramid rows with gaps
  [
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,0,0,1,1,0,0,0,0],
  ],
  // Level 2: Diamond fortress
  [
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,0,0,1,1,0,0,0,0],
  ],
  // Level 3: Checkerboard fortress
  [
    [1,0,1,1,1,1,1,1,0,1],
    [1,1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,1,0,1,1,0,1,1,0],
    [0,1,1,0,1,1,0,1,1,0],
    [0,1,1,1,0,0,1,1,1,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,0,0,0],
  ],
];

export const CANVAS_W = 480;
export const CANVAS_H = 560;
export const PADDLE_W = 72;
export const PADDLE_H = 14;
export const PADDLE_Y = CANVAS_H - 32;
export const PADDLE_SPEED = 7;
export const BALL_R = 6;
export const BRICK_W = 42;
export const BRICK_H = 18;
export const BRICK_PAD = 3;
export const BRICK_ROWS = 8;
export const BRICK_COLS = 10;
export const BRICK_TOP = 70;
export const BRICK_LEFT = (CANVAS_W - (BRICK_COLS * (BRICK_W + BRICK_PAD))) / 2;

export { BRICK_COLORS as COLORS };
