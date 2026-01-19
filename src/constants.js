/**
 * Game and UI constants. Flat list for use by pong.js.
 */

// Game
export const GOALS_TO_WIN = 5;
export const COUNTDOWN_MS = 750;
export const LOGIC_HZ = 60;
export const DT_MS = 1000 / LOGIC_HZ;
export const MAX_FRAME_MS = 200;
export const MAX_UPDATES_PER_FRAME = 5;

// Paddle / ball
export const PADDLE_WIDTH = 2;
export const PADDLE_HEIGHT = 14;
export const PADDLE_SPEED = 1.8;
export const BALL_SPEED = 1.0;
export const PADDLE_EDGE_OFFSET = 2;

// Volley / speed
export const SPEED_INCREASE_PER_VOLLEY = 0.0025;
export const MAX_SPEED_MULTIPLIER = 2.0;

// UI
export const BUTTON_SIZE = 20;
export const BUTTON_PADDING = 30;
export const BUTTON_PADDING_V = 25;
export const BLINK_SPEED = 0.0025;
export const BLINK_CACHE_MS = 16;
export const BLINK_ON_THRESHOLD = 0.7;
export const TRIANGLE_OFFSET = 3;
export const TRIANGLE_EXTRA = 3;
export const SMALL_TRIANGLE_LONG_SIDE = 10;
export const SMALL_TRIANGLE_HEIGHT = 6;

// Font / text scales
export const SCALE_1P = 17 / 12;
export const SCALE_2P_DIGIT = 6 / 5;
export const GAME_OVER_TEXT_SCALE = 1.26;
export const GAME_OVER_CHAR_WIDTH = 10;
export const GAME_OVER_BOUNCE_SPEED = 0.003;
export const GAME_OVER_BOUNCE_AMOUNT = 3;
export const GAME_OVER_BASE_Y_OFFSET = 28;
export const GAME_OVER_WINNER_X_OFFSET = 1;
export const GAME_OVER_LOSE_X_OFFSET = 3;
export const LABEL_SCALE = 2.0;
export const LABEL_GLYPH_COLS = 7;
export const LABEL_GAP_W = 4;
export const LABEL_BOUNCE_SPEED = 0.003;
export const LABEL_BOUNCE_AMOUNT = 3;

// Pause
export const PAUSE_BOUNCE_SPEED = 0.005;
export const PAUSE_BOUNCE_AMOUNT = 0.3;
export const PAUSE_BAR_WIDTH = 3;
export const PAUSE_BAR_HEIGHT = 12;
export const PAUSE_BAR_SPACING = 2;

// Restart arrow
export const RESTART_ARROW_RADIUS = 6;
export const RESTART_ARROW_SPEED = 0.1;
