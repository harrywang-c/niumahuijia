const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const mainPath = path.join(root, 'mobile-portrait-demo/src/main.js');
const playerAsset = path.join(root, 'mobile-portrait-demo/assets/generated/horse-worker-game-strip.png');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    throw err;
  }
}

test('generated horse worker strip is available for the mobile demo', () => {
  assert.ok(fs.existsSync(playerAsset));
});

test('mobile demo loads the generated horse worker as a spritesheet', () => {
  const src = fs.readFileSync(mainPath, 'utf8');

  assert.match(src, /preload\(\)/);
  assert.match(src, /this\.load\.spritesheet\('mobile-player'/);
  assert.match(src, /horse-worker-game-strip\.png/);
  assert.match(src, /frameWidth:\s*128/);
  assert.match(src, /frameHeight:\s*224/);
  assert.match(src, /\.setScale\(0\.48\)/);
});
