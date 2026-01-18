# Pong - Retro Pixel Edition

A classic Pong game built with a custom retro CRT-style pixel display engine. Features authentic monochrome green CRT aesthetics, smooth animations, and an AI opponent with adjustable difficulty levels.

## Features

### Gameplay
- **Classic Pong Mechanics**: Two-player paddle game with ball physics
- **AI Opponent**: Three difficulty levels (Easy, Normal, Hard) with skill-based behavior
- **Score System**: First to 5 goals wins
- **Dynamic Difficulty**: Ball speed increases gradually with each volley
- **Pause System**: Pause and resume gameplay at any time

### Visual Design
- **Retro CRT Display**: Emulates a classic monochrome CRT monitor with retro green color (`#39ff14`)
- **Pixel Art Graphics**: 160x120 emulated resolution displayed at 800x600
- **CRT Fade Effects**: 
  - Quick fade-in (0.05s) when pixels turn ON
  - Exponential fade-out (~0.2s) with power function `(1-t)^6` for fast drop with faint tail
- **Visible Pixel Separation**: 1px gaps between pixels for authentic retro look
- **Animated UI**: Bouncing title screen, countdown animations, win/lose screens

### Controls
- **Player 1 (Left Paddle)**: Arrow keys (↑↓) or WASD (W/S)
- **Pause**: Press `P` key
- **Menu Navigation**: Arrow keys or WASD to select difficulty
- **Start/Restart**: `Enter` key or click buttons

## Project Structure

```
src/
├── pixel-display.js  # Core retro CRT pixel display engine
├── pong.js          # Main game logic, AI, and UI
└── sprites.js       # Pixel art sprite data (fonts, letters)
```

## Installation

```bash
npm install
```

## Development

Start the development server with auto-reload:

```bash
npm run dev
```

The game will open in your browser at `http://localhost:5173`. The page will automatically reload when you make changes to the code.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

Preview the production build:

```bash
npm run preview
```

## Docker Deployment

### Prerequisites
- Docker installed on your system

### Build the Docker Image

```bash
make build
```

### Run the Container

Run on `http://localhost:8080`:

```bash
make run
```

Run with verbose debug logging:

```bash
make run-debug
```

### Other Makefile Commands

- `make stop` - Stop the running container
- `make logs` - View container logs
- `make clean` - Remove the Docker image
- `make rebuild` - Rebuild from scratch
- `make help` - Show all available commands

## Technical Details

### Rendering Engine
- **Base Resolution**: 160x120 emulated pixels
- **Display Resolution**: 800x600 physical pixels
- **Rendering**: HTML5 Canvas with `requestAnimationFrame` for 60fps
- **Pixel State Management**: Tracks ON/OFF timestamps for fade calculations

### AI System
- **Skill Levels**: 
  - Level 1: 0.25 skill factor
  - Level 2: 0.5 skill factor (default)
  - Level 3: 0.75-0.85 skill factor (scales with game speed)
- **Behavior**: Reaction time delays, acceleration-based movement, speed-limited to 71% of human player speed

### Game States
- `MENU` - Main menu with difficulty selection
- `COUNTDOWN` - 3-2-1 countdown before game starts
- `PLAYING` - Active gameplay
- `PAUSED` - Game paused
- `GAME_OVER` - Win/lose screen

## Architecture

The project consists of three main components:

1. **PixelDisplay** (`pixel-display.js`): Low-level rendering engine that manages pixel states and CRT fade effects
2. **Pong** (`pong.js`): Game logic, physics, AI controller, UI rendering, and state management
3. **Sprites** (`sprites.js`): Pixel art data including fonts, letters, and pre-rendered sprite combinations

## License

MIT
