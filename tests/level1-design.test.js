const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'src/scenes/Level1Scene.js'), 'utf8');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    throw err;
  }
}

test('level one is a formal puzzle level without tutorial popups', () => {
  assert.doesNotMatch(src, /this\._initTutorial\(\)/);
  assert.doesNotMatch(src, /_showTip|_checkTutorial|_tips|_tut/);
  assert.doesNotMatch(src, /鼠标左键拖画墨水|Space\s+跳跃|右键 →/);
});

test('level one declares sight-blocking walls for the guard puzzle', () => {
  assert.match(src, /this\.sightBlockers\s*=\s*\[\]/);
  assert.match(src, /label:\s*'wall'/);
  assert.match(src, /this\.sightBlockers\.push/);
  assert.match(src, /this\.guardSystem\.addGuard\(2380,\s*this\.GROUND_Y - 28,\s*'left'/);
});

test('level one tightens resources and teaches ink can block patrol vision', () => {
  assert.match(src, /new InkSystem\(this,\s*340\)/);
  assert.match(src, /this\.guardSystem\.addGuard\(2380,\s*this\.GROUND_Y - 28,\s*'left',\s*260,\s*38,\s*95\)/);
  assert.match(src, /墨水能挡住巡逻视线/);
  assert.match(src, /this\._addSightLessonSign\(\)/);
});
