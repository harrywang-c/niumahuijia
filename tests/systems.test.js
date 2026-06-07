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
  },
  Math: {
    Clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    },
    DegToRad(value) {
      return value * Math.PI / 180;
    },
    Distance: {
      Between(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
      }
    }
  }
};

function loadClass(file, className) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInThisContext(`${src}\nglobal.${className} = ${className};`, { filename: file });
  return global[className];
}

const PortalSystem = loadClass('src/systems/PortalSystem.js', 'PortalSystem');
const InkSystem = loadClass('src/systems/InkSystem.js', 'InkSystem');
const GuardSystem = loadClass('src/systems/GuardSystem.js', 'GuardSystem');
const Level1Scene = loadClass('src/scenes/Level1Scene.js', 'Level1Scene');

function makeScene() {
  const scene = {
    _winning: false,
    input: { on() {} },
    cameras: {
      main: {
        flash() {},
        getWorldPoint(x, y) { return { x, y }; }
      }
    },
    time: {
      delayedCall(_delay, cb) {
        scene._delayedCalls.push(cb);
      }
    },
    add: {
      graphics() {
        return {
          setDepth() { return this; },
          clear() { this.cleared = true; return this; },
          lineStyle() { return this; },
          beginPath() { return this; },
          moveTo() { return this; },
          lineTo() { return this; },
          strokePath() { return this; },
          fillStyle() { return this; },
          fillRect() { return this; },
          fillCircle() { return this; },
          fillRoundedRect() { return this; },
          setPosition() { return this; },
          setRotation() { return this; },
          save() { return this; },
          restore() { return this; },
          translateCanvas() { return this; },
          rotateCanvas() { return this; },
          fillTriangle() { return this; }
        };
      },
      image() {
        return {
          setRotation() { return this; },
          setDepth() { return this; },
          setAlpha() { return this; },
          destroy() {}
        };
      }
    },
    tweens: { add() {} },
    matter: {
      body: {
        setPosition(body, pos) {
          body.position = pos;
          scene.player.x = pos.x;
          scene.player.y = pos.y;
        },
        setVelocity(body, vel) {
          body.velocity = vel;
        }
      },
      add: {
        rectangle(x, y, width, height, options) {
          return {
            position: { x, y },
            angle: options.angle || 0,
            width,
            height,
            label: options.label,
            isStatic: options.isStatic
          };
        }
      },
      world: {
        getAllBodies() { return []; }
      }
    },
    player: {
      x: 180,
      y: 100,
      body: {
        velocity: { x: 2, y: 0 },
        position: { x: 180, y: 100 }
      }
    },
    _delayedCalls: []
  };
  return scene;
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

test('portal triggers from the reachable side and exits outside the destination wall', () => {
  const scene = makeScene();
  const portals = new PortalSystem(scene);
  portals.portals = [
    { x: 200, y: 100, nx: -1, ny: 0 },
    { x: 500, y: 100, nx: -1, ny: 0 }
  ];

  portals.update();

  assert.equal(scene.player.x, 464);
  assert.equal(scene.player.y, 100);
  // Momentum-preserving exit: slow entry exits along the normal at the min speed.
  assert.deepEqual(scene.player.body.velocity, { x: -3, y: 0 });
});

test('portal on the level wall triggers when the player touches the visible portal face', () => {
  const scene = makeScene();
  const portals = new PortalSystem(scene);
  scene.player.x = 732;
  scene.player.y = 312;
  scene.player.body.velocity = { x: 0, y: 0 };
  portals.portals = [
    { x: 752, y: 312, nx: -1, ny: 0 },
    { x: 500, y: 408, nx: 0, ny: -1 }
  ];

  portals.update();

  assert.equal(scene.player.x, 500);
  assert.equal(scene.player.y, 372);
  assert.deepEqual(scene.player.body.velocity, { x: 0, y: -3 });
});

test('portal ignores the blocked side of a wall portal', () => {
  const scene = makeScene();
  const portals = new PortalSystem(scene);
  scene.player.x = 772;
  scene.player.y = 312;
  portals.portals = [
    { x: 752, y: 312, nx: -1, ny: 0 },
    { x: 500, y: 408, nx: 0, ny: -1 }
  ];

  portals.update();

  assert.equal(scene.player.x, 772);
  assert.equal(scene.player.y, 312);
});

test('portal triggers along the visible portal height, not only at the center point', () => {
  const scene = makeScene();
  const portals = new PortalSystem(scene);
  scene.player.x = 732;
  scene.player.y = 258;
  portals.portals = [
    { x: 752, y: 312, nx: -1, ny: 0 },
    { x: 500, y: 408, nx: 0, ny: -1 }
  ];

  portals.update();

  assert.equal(scene.player.x, 500);
  assert.equal(scene.player.y, 372);
});

test('ink consumption clamps to the maximum and clears preview when exhausted mid-stroke', () => {
  const scene = makeScene();
  const pointers = {};
  scene.input = {
    on(event, cb) {
      pointers[event] = cb;
    }
  };

  const ink = new InkSystem(scene, 10);

  pointers.pointerdown({ leftButtonDown: () => true, x: 0, y: 0 });
  pointers.pointermove({ x: 20, y: 0 });

  assert.equal(ink.drawing, false);
  assert.equal(ink.usedInk, 10);
  assert.equal(ink.getRatio(), 0);
  assert.equal(ink.previewGfx.cleared, true);
});

test('ink visuals use blue strokes instead of black ink', () => {
  const src = fs.readFileSync(path.join(root, 'src/systems/InkSystem.js'), 'utf8');

  assert.match(src, /INK_COLORS/);
  assert.match(src, /preview:\s*0x1597ff/);
  assert.match(src, /shadow:\s*0x07519c/);
  assert.doesNotMatch(src, /lineStyle\(10,\s*0x111111/);
  assert.doesNotMatch(src, /fillStyle\(0x111111/);
});

test('ink HUD redraws the remaining ink bar using the supplied ratio', () => {
  const scene = new Level1Scene();
  let lastRoundedRect = null;
  scene.add = {
    text(_x, _y, text) {
      return {
        text,
        setOrigin() { return this; },
        setScrollFactor() { return this; },
        setDepth() { return this; },
        setText(next) { this.text = next; return this; }
      };
    },
    graphics() {
      return {
        clear() { return this; },
        setScrollFactor() { return this; },
        setDepth() { return this; },
        fillStyle() { return this; },
        fillEllipse() { return this; },
        fillTriangle() { return this; },
        fillRoundedRect(x, y, w, h) { lastRoundedRect = { x, y, w, h }; return this; },
        fillCircle() { return this; },
        lineStyle() { return this; },
        strokeRoundedRect() { return this; },
        strokeCircle() { return this; }
      };
    }
  };

  scene._buildHUD();
  scene._updateInkBar(0.25);

  assert.equal(lastRoundedRect.x, 40);
  assert.equal(lastRoundedRect.y, 34);
  assert.equal(lastRoundedRect.w, 44.5);
});

test('guard vision is blocked by solid level walls', () => {
  const scene = makeScene();
  scene.sightBlockers = [
    { x: 140, y: 60, width: 24, height: 120 }
  ];

  const guards = new GuardSystem(scene);
  const guard = {
    x: 100,
    y: 100,
    facing: 'right',
    range: 220,
    halfAngle: Math.PI / 4
  };

  assert.equal(guards._sees(guard, 190, 100), false);
});

test('guard vision still catches the player when no wall crosses the sight line', () => {
  const scene = makeScene();
  scene.sightBlockers = [
    { x: 140, y: 150, width: 24, height: 40 }
  ];

  const guards = new GuardSystem(scene);
  const guard = {
    x: 100,
    y: 100,
    facing: 'right',
    range: 220,
    halfAngle: Math.PI / 4
  };

  assert.equal(guards._sees(guard, 190, 100), true);
});
