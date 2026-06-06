const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

global.Phaser = {
  Scene: class {
    constructor(key) {
      this.scene = { key };
    }
  }
};

function loadClass(file, className) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInThisContext(`${src}\nglobal.${className} = ${className};`, { filename: file });
  return global[className];
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

test('tutorial scene is registered between title and level one', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const main = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');

  assert.match(index, /src\/scenes\/TutorialScene\.js/);
  assert.match(main, /scene:\s*\[TitleScene,\s*TutorialScene,\s*Level1Scene/);
});

test('title screen starts the tutorial before the first real level', () => {
  const title = fs.readFileSync(path.join(root, 'src/scenes/TitleScene.js'), 'utf8');

  assert.match(title, /this\.scene\.start\('TutorialScene'\)/);
});

test('tutorial scene explains the goal and core mechanics', () => {
  const TutorialScene = loadClass('src/scenes/TutorialScene.js', 'TutorialScene');
  const scene = new TutorialScene();
  const src = fs.readFileSync(path.join(root, 'src/scenes/TutorialScene.js'), 'utf8');

  assert.equal(scene.scene.key, 'TutorialScene');
  assert.match(src, /目标：走到家里面/);
  assert.match(src, /左右移动/);
  assert.match(src, /跳跃/);
  assert.match(src, /画墨水/);
  assert.match(src, /传送门/);
  assert.match(src, /scene\.start\('Level1Scene'\)/);
});
