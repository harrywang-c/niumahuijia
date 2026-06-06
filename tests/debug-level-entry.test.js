const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    throw err;
  }
}

test('level two and three scenes are loaded and registered for direct debugging', () => {
  const index = read('index.html');
  const main = read('src/main.js');

  assert.match(index, /src\/scenes\/Level2Scene\.js/);
  assert.match(index, /src\/scenes\/Level3Scene\.js/);
  assert.match(main, /scene:\s*\[TitleScene,\s*TutorialScene,\s*Level1Scene,\s*Level2Scene,\s*Level3Scene\]/);
});

test('url level parameter can boot directly into level two or three', () => {
  const main = read('src/main.js');

  assert.match(main, /URLSearchParams\(window\.location\.search\)/);
  assert.match(main, /level['"]?\)\s*===\s*['"]2['"]/);
  assert.match(main, /return\s+['"]Level2Scene['"]/);
  assert.match(main, /level['"]?\)\s*===\s*['"]3['"]/);
  assert.match(main, /return\s+['"]Level3Scene['"]/);
});

test('title screen exposes manual debug buttons for level two and three', () => {
  const title = read('src/scenes/TitleScene.js');

  assert.match(title, /调试第2关/);
  assert.match(title, /makeDebugButton\([^;]+调试第2关[^;]+Level2Scene/);
  assert.match(title, /调试第3关/);
  assert.match(title, /makeDebugButton\([^;]+调试第3关[^;]+Level3Scene/);
  assert.match(title, /this\.scene\.start\(sceneKey\)/);
});

test('level two and three have standalone scene files', () => {
  const level2 = read('src/scenes/Level2Scene.js');
  const level3 = read('src/scenes/Level3Scene.js');

  assert.match(level2, /class\s+Level2Scene\s+extends\s+DebugPortalLevelScene/);
  assert.match(level2, /super\('Level2Scene',/);
  assert.match(level3, /class\s+Level3Scene\s+extends\s+DebugPortalLevelScene/);
  assert.match(level3, /super\('Level3Scene',/);
});
