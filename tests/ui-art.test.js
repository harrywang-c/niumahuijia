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

test('shared UI art helper is loaded before scenes', () => {
  const index = read('index.html');
  assert.match(index, /src\/uiArt\.js/);
  assert.ok(index.indexOf('src/uiArt.js') < index.indexOf('src/scenes/DebugPortalLevelScene.js'));
});

test('title scene uses the illustrated title screen as the playable entry', () => {
  const src = read('src/scenes/TitleScene.js');
  assert.match(src, /preloadUiArt\(this\)/);
  assert.match(src, /addTitleScreenArt\(this\)/);
  assert.match(src, /addTitleStartHotspot\(this,\s*\(\)\s*=>/);
  assert.doesNotMatch(src, /conceptArt/);
});

test('level scenes use the rain-city backdrop and illustrated win screen', () => {
  const shared = read('src/uiArt.js');
  assert.match(shared, /graphics\/optimized\/ui\/title_screen\.jpg/);
  assert.match(shared, /graphics\/optimized\/ui\/settlement_screen\.jpg/);
  assert.doesNotMatch(shared, /graphics\/optimized\/进入页面\.jpg/);
  assert.doesNotMatch(shared, /graphics\/optimized\/结算页面\.jpg/);

  // The rainy-night backdrop helper must exist and load the city art, so level
  // scenes that call it (DebugPortalLevelScene → Level2/3) don't crash.
  assert.match(shared, /function addRainCityBackdrop/);
  assert.match(shared, /graphics\/optimized\/背景\.jpg/);

  for (const file of ['src/scenes/Level1Scene.js', 'src/scenes/DebugPortalLevelScene.js']) {
    const src = read(file);
    assert.match(src, /preloadUiArt\(this\)/);
    assert.match(src, /addSettlementWinScreen\(this/);
  }

  // The debug level base must actually call the (now defined) backdrop helper.
  assert.match(read('src/scenes/DebugPortalLevelScene.js'), /addRainCityBackdrop\(this/);
});

test('level one shows the settlement screen and continues into level two', () => {
  const src = read('src/scenes/Level1Scene.js');
  assert.match(src, /addSettlementWinScreen\(this/);
  assert.match(src, /Level2Scene/);
});
