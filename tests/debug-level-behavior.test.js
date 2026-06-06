const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function loadClass(file, className) {
  const src = read(file);
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

global.Phaser = {
  Scene: class {
    constructor(key) {
      this.scene = { key };
    }
  },
  Math: {
    DegToRad(value) { return value * Math.PI / 180; }
  },
  Input: {
    Keyboard: {
      KeyCodes: { W: 87, A: 65, D: 68, R: 82, ESC: 27, SPACE: 32 },
      JustDown(key) { return Boolean(key && key.justDown); }
    }
  }
};

const GuardSystem = loadClass('src/systems/GuardSystem.js', 'GuardSystem');
const DebugPortalLevelScene = loadClass('src/scenes/DebugPortalLevelScene.js', 'DebugPortalLevelScene');

test('debug levels expose an ink quota HUD and update it every frame', () => {
  const src = read('src/scenes/DebugPortalLevelScene.js');

  assert.match(src, /_buildInkHUD\(\)/);
  assert.match(src, /_updateInkBar\(this\.inkSystem\.getRatio\(\)\)/);
});

test('debug levels support W as a jump key', () => {
  const src = read('src/scenes/DebugPortalLevelScene.js');

  assert.match(src, /keyW\s*=\s*this\.input\.keyboard\.addKey\(Phaser\.Input\.Keyboard\.KeyCodes\.W\)/);
  assert.match(src, /JustDown\(this\.keyW\)/);
});

test('workload overlap with the player resets the debug level even without collisionstart', () => {
  const scene = new DebugPortalLevelScene('TestScene', {});
  let reset = false;
  scene.player = {
    body: {
      bounds: { min: { x: 90, y: 90 }, max: { x: 130, y: 150 } }
    }
  };
  scene.matter = {
    world: {
      getAllBodies() {
        return [
          {
            label: 'workload',
            bounds: { min: { x: 105, y: 110 }, max: { x: 155, y: 160 } },
            plugin: {}
          }
        ];
      }
    }
  };
  scene._resetLevel = () => { reset = true; };

  scene._checkWorkloadHits();

  assert.equal(reset, true);
});

test('workload swept path resets the debug level when it crosses the player between frames', () => {
  const scene = new DebugPortalLevelScene('TestScene', {});
  let reset = false;
  const workload = {
    label: 'workload',
    bounds: { min: { x: 104, y: 170 }, max: { x: 154, y: 220 } },
    plugin: {
      prevBounds: { min: { x: 104, y: 20 }, max: { x: 154, y: 70 } }
    }
  };
  scene.player = {
    body: {
      bounds: { min: { x: 90, y: 90 }, max: { x: 130, y: 150 } }
    }
  };
  scene.matter = {
    world: {
      getAllBodies() { return [workload]; }
    }
  };
  scene._resetLevel = () => { reset = true; };

  scene._checkWorkloadHits();

  assert.equal(reset, true);
});

test('debug level platforms are registered as sight blockers', () => {
  const src = read('src/scenes/DebugPortalLevelScene.js');

  assert.match(src, /this\.sightBlockers\.push\(\{\s*x,\s*y,\s*width:\s*w,\s*height:\s*h\s*\}\)/);
});

test('guard vision ray distance is clipped by sight-blocking walls', () => {
  const guards = new GuardSystem({
    add: {
      graphics() {
        return {
          setDepth() { return this; },
          clear() { return this; }
        };
      }
    },
    sightBlockers: [
      { x: 140, y: 70, width: 24, height: 80 }
    ]
  });

  assert.equal(guards._clipRayDistance(100, 100, 0, 220), 40);
});

test('debug levels remove explanatory labels and use mechanics-only hints', () => {
  const level2 = read('src/scenes/Level2Scene.js');
  const level3 = read('src/scenes/Level3Scene.js');
  const base = read('src/scenes/DebugPortalLevelScene.js');

  assert.doesNotMatch(level2, /notes:/);
  assert.doesNotMatch(level3, /notes:/);
  assert.doesNotMatch(level2, /label:/);
  assert.doesNotMatch(level3, /label:/);
  assert.doesNotMatch(base, /hint\.label/);
});

test('debug levels can define return conveyors', () => {
  const level2 = read('src/scenes/Level2Scene.js');
  const level3 = read('src/scenes/Level3Scene.js');
  const base = read('src/scenes/DebugPortalLevelScene.js');

  assert.match(base, /_buildConveyors\(\)/);
  assert.match(base, /_applyConveyors\(\)/);
  assert.match(level2, /conveyors:/);
  assert.match(level3, /conveyors:/);
});
