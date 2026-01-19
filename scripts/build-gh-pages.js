#!/usr/bin/env node

/**
 * Build script for GitHub Pages inline HTML
 * 
 * Generates a single-file HTML with all JavaScript inlined
 * for GitHub Pages deployment (no build step required on GH Pages)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as esbuild from 'esbuild';
import { minify } from 'html-minifier-terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`[${step}/5]`, 'blue');
  log(` ${message}`, 'dim');
}

(async () => {
try {
  log('\n🚀 Building GitHub Pages inline HTML...\n', 'green');

  // Step 1: Read source files
  logStep(1, 'Reading source files...');
  const constantsJs = readFileSync(join(rootDir, 'src/constants.js'), 'utf-8');
  const inputJs = readFileSync(join(rootDir, 'src/input.js'), 'utf-8');
  const engineConstantsJs = readFileSync(join(rootDir, 'src/engine/constants.js'), 'utf-8');
  const pixelDisplayJs = readFileSync(join(rootDir, 'src/engine/pixel-display.js'), 'utf-8');
  const spritesJs = readFileSync(join(rootDir, 'src/sprites.js'), 'utf-8');
  const pongJs = readFileSync(join(rootDir, 'src/pong.js'), 'utf-8');

  // Step 2: Process JavaScript (remove import/export; strip imports including multiline)
  logStep(2, 'Processing JavaScript modules...');
  const stripExport = (s) => s.replace(/^export\s+/gm, '').trim();
  const stripImports = (s) => s.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?\s*/g, '').trim();
  const stripExportPong = (s) => s.replace(/export\s*\{\s*Pong\s*\}\s*;?\s*/g, '').trim();

  const constantsProcessed = stripExport(constantsJs);
  const inputProcessed = stripExport(inputJs);
  const engineConstantsProcessed = stripExport(engineConstantsJs);
  const pixelDisplayProcessed = stripImports(stripExport(pixelDisplayJs));
  const spritesProcessed = stripExport(spritesJs);
  const pongProcessed = stripExportPong(stripImports(pongJs));

  // Step 3: Combine JavaScript (game constants, input, engine constants, engine pixel-display, sprites, pong)
  logStep(3, 'Combining JavaScript into single bundle...');
  const debugScreens = process.env.DISABLE_DEBUG !== '1' && process.env.DISABLE_DEBUG !== 'true';
  const debugPreamble = `const __DEBUG_SCREENS_ENABLED__ = ${debugScreens};\n\n`;
  let combinedJs = debugPreamble + [constantsProcessed, inputProcessed, engineConstantsProcessed, pixelDisplayProcessed, spritesProcessed, pongProcessed].join('\n\n');
  if (process.env.DISABLE_DEBUG === '1') {
    combinedJs = esbuild.transformSync(combinedJs, { minify: true }).code;
  }

  // Step 4: Generate HTML (and minify when DISABLE_DEBUG=1)
  logStep(4, process.env.DISABLE_DEBUG === '1' ? 'Generating and minifying HTML template...' : 'Generating HTML template...');
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pong - Retro CRT Game</title>
  <meta name="description" content="Classic Pong game with retro CRT pixel display effects">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #000;
      font-family: monospace;
    }
    
    #display {
      display: block;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
  </style>
</head>
<body>
  <canvas id="display"></canvas>
  <script>
${combinedJs}
  </script>
</body>
</html>`;
  if (process.env.DISABLE_DEBUG === '1') {
    html = await minify(html, { minifyJS: false, minifyCSS: true, collapseWhitespace: true, removeComments: true, conservativeCollapse: true });
  }

  // Step 5: Write output file
  logStep(5, 'Writing index.html...');
  writeFileSync(join(rootDir, 'index.html'), html, 'utf-8');

  // Success summary
  const stats = {
    constants: (constantsProcessed.length / 1024).toFixed(1),
    input: (inputProcessed.length / 1024).toFixed(1),
    engineConstants: (engineConstantsProcessed.length / 1024).toFixed(1),
    pixelDisplay: (pixelDisplayProcessed.length / 1024).toFixed(1),
    sprites: (spritesProcessed.length / 1024).toFixed(1),
    pong: (pongProcessed.length / 1024).toFixed(1),
    total: (html.length / 1024).toFixed(1)
  };

  log('\n✓ Build complete!', 'green');
  log(`\n  File sizes:`, 'dim');
  log(`    constants.js:        ${stats.constants} KB`, 'dim');
  log(`    input.js:            ${stats.input} KB`, 'dim');
  log(`    engine/constants.js: ${stats.engineConstants} KB`, 'dim');
  log(`    engine/pixel-display.js: ${stats.pixelDisplay} KB`, 'dim');
  log(`    sprites.js:          ${stats.sprites} KB`, 'dim');
  log(`    pong.js:             ${stats.pong} KB`, 'dim');
  log(`    ─────────────────────────────`, 'dim');
  log(`    index.html:          ${stats.total} KB\n`, 'yellow');

  log(`  Output: ${join(rootDir, 'index.html')}\n`, 'dim');

} catch (error) {
  log('\n✗ Build failed:', 'yellow');
  log(`  ${error.message}\n`, 'dim');
  process.exit(1);
}
})();
