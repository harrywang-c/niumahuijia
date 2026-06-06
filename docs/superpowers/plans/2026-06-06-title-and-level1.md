# 牛马回家 Implementation Plan — Title Screen + Level 1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the title screen and Level 1 (tutorial) of 牛马回家 — a pixel-art horizontal-scrolling platformer with ink-drawing platforms, portal teleportation, and cowboy vision-cone guards.

**Architecture:** Phaser 3 with built-in Matter.js physics. All sprites generated programmatically at runtime via Phaser Graphics (no external image files). Three plain ES6 classes — InkSystem, PortalSystem, GuardSystem — are instantiated inside Level1Scene and receive the scene reference to operate on Phaser's physics world.

**Tech Stack:** Phaser 3.87 (downloaded locally to `js/phaser.min.js`), Matter.js (bundled inside Phaser), vanilla ES6 modules via `<script type="module">`

---

### Task 1: Project scaffold + Phaser download

**Files:**
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/scenes/TitleScene.js` (placeholder)
- Create: `src/scenes/Level1Scene.js` (placeholder)
- Create: `js/phaser.min.js` (downloaded)

- [ ] **Step 1: Create directory structure and download Phaser**

```bash
cd "/Users/wht/Desktop/cc/牛马回家"
mkdir -p js src/scenes src/systems
curl -L --max-time 60 -o js/phaser.min.js "https://cdn.jsdelivr.net/npm/phaser@3.87.0/dist/phaser.min.js"
echo "Phaser size: $(wc -c < js/phaser.min.js) bytes"
```

Expected: `js/phaser.min.js` ~1.5MB

- [ ] **Step 2: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>牛马回家</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #111; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
    canvas { image-rendering: pixelated; }
  </style>
</head>
<body>
  <script src="js/phaser.min.js"></script>
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create `src/main.js`**

```javascript
import TitleScene from './scenes/TitleScene.js';
import Level1Scene from './scenes/Level1Scene.js';

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'matter',
    matter: { gravity: { y: 1.5 }, debug: false }
  },
  scene: [TitleScene, Level1Scene]
};

new Phaser.Game(config);
```

- [ ] **Step 4: Create placeholder scenes**

`src/scenes/TitleScene.js`:
```javascript
export default class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }
  create() {
    this.add.text(480, 270, '牛马回家 - Loading...', {
      fontSize: '32px', color: '#ffffff', fontFamily: 'monospace'
    }).setOrigin(0.5);
  }
}
```

`src/scenes/Level1Scene.js`:
```javascript
export default class Level1Scene extends Phaser.Scene {
  constructor() { super('Level1Scene'); }
  create() {}
  update() {}
}
```

- [ ] **Step 5: Verify scaffold**

```bash
cd "/Users/wht/Desktop/cc/牛马回家"
python3 -m http.server 8080
```

Open http://localhost:8080 — expected: dark background, white "牛马回家 - Loading..." centered.

- [ ] **Step 6: Commit**

```bash
cd "/Users/wht/Desktop/cc/牛马回家"
git add index.html src/ js/phaser.min.js
git commit -m "feat: project scaffold with Phaser 3.87"
```

---

### Task 2: Procedural sprite textures

**Files:**
- Create: `src/sprites.js`

All sprites drawn with Phaser Graphics + `generateTexture()`. No image files needed.

- [ ] **Step 1: Create `src/sprites.js`**

```javascript
export function createTextures(scene) {
  _player(scene);
  _cowboy(scene);
  _tiles(scene);
  _portals(scene);
  _house(scene);
}

function _player(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // Torso + limbs (white)
  g.fillStyle(0xffffff);
  g.fillRect(13, 20, 6, 14);   // torso
  g.fillRect(8, 26, 16, 4);    // arms
  g.fillRect(11, 34, 4, 14);   // left leg
  g.fillRect(17, 34, 4, 14);   // right leg
  // Horse head (brown)
  g.fillStyle(0x8B5A2B);
  g.fillRect(10, 4, 12, 14);   // head
  g.fillRect(12, 0, 8, 6);     // snout
  g.fillRect(10, 2, 3, 5);     // left ear
  g.fillRect(19, 2, 3, 5);     // right ear
  // Eyes
  g.fillStyle(0x000000);
  g.fillRect(13, 7, 2, 2);
  g.fillRect(17, 7, 2, 2);
  // Portal gun
  g.fillStyle(0x4455cc);
  g.fillRect(22, 22, 9, 4);
  g.fillStyle(0x88aaff);
  g.fillRect(29, 20, 3, 8);
  g.generateTexture('player', 32, 48);
  g.destroy();
}

function _cowboy(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // Body (dark brown shirt)
  g.fillStyle(0x4a3728);
  g.fillRect(12, 20, 8, 14);
  g.fillRect(8, 26, 16, 4);
  g.fillRect(10, 34, 4, 14);
  g.fillRect(18, 34, 4, 14);
  // Skin
  g.fillStyle(0xd4a574);
  g.fillRect(10, 8, 12, 12);
  // Hat brim + crown
  g.fillStyle(0x8B4513);
  g.fillRect(7, 6, 18, 4);
  g.fillRect(10, 0, 12, 8);
  // Hat detail
  g.fillStyle(0x6B3410);
  g.fillRect(10, 2, 12, 2);
  // Eyes
  g.fillStyle(0x000000);
  g.fillRect(13, 12, 2, 2);
  g.fillRect(17, 12, 2, 2);
  g.generateTexture('cowboy', 32, 48);
  g.destroy();
}

function _tiles(scene) {
  // Grass 32x32
  const gr = scene.make.graphics({ x: 0, y: 0, add: false });
  gr.fillStyle(0x6B4226); gr.fillRect(0, 0, 32, 32);
  gr.fillStyle(0x228B22); gr.fillRect(0, 0, 32, 10);
  gr.fillStyle(0x1a6e1a);
  for (let i = 0; i < 5; i++) gr.fillRect(i * 7 + 2, 2, 3, 6);
  gr.generateTexture('grass', 32, 32);
  gr.destroy();

  // Brick 32x32
  const br = scene.make.graphics({ x: 0, y: 0, add: false });
  br.fillStyle(0x8B4513); br.fillRect(0, 0, 32, 32);
  br.fillStyle(0x6B3010);
  br.fillRect(0, 15, 32, 2); br.fillRect(16, 0, 2, 15); br.fillRect(0, 17, 16, 2);
  br.generateTexture('brick', 32, 32);
  br.destroy();

  // Spike 16x16
  const sp = scene.make.graphics({ x: 0, y: 0, add: false });
  sp.fillStyle(0xcccccc);
  sp.fillTriangle(0, 16, 8, 0, 16, 16);
  sp.fillStyle(0xaaaaaa);
  sp.fillTriangle(2, 16, 8, 3, 14, 16);
  sp.generateTexture('spike', 16, 16);
  sp.destroy();
}

function _portals(scene) {
  // Blue portal 48x80
  const b = scene.make.graphics({ x: 0, y: 0, add: false });
  b.fillStyle(0x224488, 0.45); b.fillEllipse(24, 40, 18, 68);
  b.lineStyle(4, 0x55aaff, 1); b.strokeEllipse(24, 40, 22, 72);
  b.lineStyle(2, 0xaaddff, 0.6); b.strokeEllipse(24, 40, 14, 58);
  b.generateTexture('portalBlue', 48, 80);
  b.destroy();

  // Orange portal 48x80
  const o = scene.make.graphics({ x: 0, y: 0, add: false });
  o.fillStyle(0x884400, 0.45); o.fillEllipse(24, 40, 18, 68);
  o.lineStyle(4, 0xff8800, 1); o.strokeEllipse(24, 40, 22, 72);
  o.lineStyle(2, 0xffcc88, 0.6); o.strokeEllipse(24, 40, 14, 58);
  o.generateTexture('portalOrange', 48, 80);
  o.destroy();
}

function _house(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // Body
  g.fillStyle(0xf5deb3); g.fillRect(10, 40, 60, 50);
  // Roof
  g.fillStyle(0xcc4444); g.fillTriangle(5, 42, 40, 5, 75, 42);
  g.fillStyle(0xaa2222); g.fillTriangle(5, 42, 40, 8, 75, 42);
  // Door
  g.fillStyle(0x8B4513); g.fillRect(28, 62, 22, 28);
  g.fillStyle(0x6B3410); g.fillRect(29, 63, 10, 26);
  // Windows
  g.fillStyle(0xffffaa); g.fillRect(14, 50, 14, 10); g.fillRect(52, 50, 14, 10);
  g.fillStyle(0xffcc44, 0.4); g.fillRect(14, 50, 14, 10); g.fillRect(52, 50, 14, 10);
  // Chimney
  g.fillStyle(0x888888); g.fillRect(56, 10, 10, 22);
  g.fillStyle(0x666666); g.fillRect(54, 8, 14, 5);
  g.generateTexture('house', 80, 92);
  g.destroy();
}
```

- [ ] **Step 2: Smoke-test textures in TitleScene**

Add temporarily to TitleScene.create():
```javascript
import { createTextures } from '../sprites.js';
// inside create():
createTextures(this);
['player','cowboy','grass','spike','portalBlue','portalOrange','house'].forEach((k,i) => {
  this.add.image(50 + i * 60, 100, k).setScale(2);
});
```

Open http://localhost:8080 — expected: 7 pixel-art sprites across top of screen.

- [ ] **Step 3: Remove smoke-test lines, commit**

```bash
cd "/Users/wht/Desktop/cc/牛马回家"
git add src/sprites.js src/scenes/TitleScene.js
git commit -m "feat: procedural pixel-art sprite textures"
```

---

### Task 3: TitleScene

**Files:**
- Modify: `src/scenes/TitleScene.js`

- [ ] **Step 1: Replace placeholder with full TitleScene**

```javascript
import { createTextures } from '../sprites.js';

export default class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    createTextures(this);
    const W = this.scale.width, H = this.scale.height;

    // Sky gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0d2b, 0x0d0d2b, 0x1a1a4e, 0x1a1a4e, 1);
    bg.fillRect(0, 0, W, H);

    // Stars
    const starGfx = this.add.graphics();
    for (let i = 0; i < 90; i++) {
      starGfx.fillStyle(0xffffff, Math.random() * 0.5 + 0.3);
      starGfx.fillRect(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(0, H * 0.72),
        2, 2
      );
    }

    // Ground silhouette
    this.add.graphics().fillStyle(0x0a0a1a).fillRect(0, H * 0.75, W, H * 0.25);

    // House silhouette
    const house = this.add.graphics();
    house.fillStyle(0x1a1a33);
    house.fillRect(W - 155, H * 0.58, 110, H * 0.17);
    house.fillTriangle(W - 168, H * 0.58, W - 100, H * 0.4, W - 32, H * 0.58);
    house.fillStyle(0xffcc44, 0.55);
    house.fillRect(W - 138, H * 0.62, 22, 16);
    house.fillRect(W - 102, H * 0.62, 22, 16);

    // Title
    const title = this.add.text(W / 2, H * 0.22, '牛马回家', {
      fontSize: '72px', color: '#ffffff', fontFamily: 'serif',
      stroke: '#000000', strokeThickness: 6,
      shadow: { color: '#000000', blur: 12, fill: true }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title, y: H * 0.22 + 6,
      duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Subtitle
    this.add.text(W / 2, H * 0.37, '用墨水和传送门找到回家的路', {
      fontSize: '20px', color: '#9999bb', fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Ink splats decoration
    const splats = this.add.graphics();
    splats.fillStyle(0x111111, 0.6);
    [[120, 310, 18], [820, 420, 12], [200, 450, 22], [700, 300, 15]].forEach(([x, y, r]) => {
      splats.fillCircle(x, y, r);
      splats.fillEllipse(x + r, y + r * 0.5, r * 0.8, r * 0.4);
    });

    // Walking character
    this.walkerX = -50;
    this.walker = this.add.image(this.walkerX, H * 0.71, 'player').setScale(2.5);

    // Start button
    const btnX = W / 2 - 90, btnY = H * 0.70;
    const btnBg = this.add.graphics();
    const drawBtn = (hover) => {
      btnBg.clear();
      btnBg.fillStyle(hover ? 0x3366cc : 0x224488);
      btnBg.fillRoundedRect(btnX, btnY, 180, 52, 12);
      btnBg.lineStyle(2, hover ? 0x88aaff : 0x4488ff);
      btnBg.strokeRoundedRect(btnX, btnY, 180, 52, 12);
    };
    drawBtn(false);

    const btnText = this.add.text(W / 2, btnY + 26, '开始游戏', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'monospace'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnText.on('pointerover', () => drawBtn(true));
    btnText.on('pointerout',  () => drawBtn(false));
    btnText.on('pointerup', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Level1Scene');
      });
    });

    // Controls hint
    this.add.text(W / 2, H * 0.9, '← → 移动   Space 跳跃   鼠标左键 画墨水   鼠标右键 射传送门', {
      fontSize: '13px', color: '#555577', fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(800);
  }

  update() {
    this.walkerX += 0.8;
    if (this.walkerX > this.scale.width + 60) this.walkerX = -60;
    this.walker.setX(this.walkerX);
    this.walker.setFlipX(false);
  }
}
```

- [ ] **Step 2: Verify title screen**

Open http://localhost:8080. Expected:
- Dark starry night, title "牛马回家" gently bobs
- Horse-head figure walks L→R endlessly
- House silhouette with glowing windows on right
- "开始游戏" button glows on hover
- Controls hint at bottom

- [ ] **Step 3: Commit**

```bash
cd "/Users/wht/Desktop/cc/牛马回家"
git add src/scenes/TitleScene.js
git commit -m "feat: title screen with animation, stars, walking character"
```

---

### Task 4: InkSystem

**Files:**
- Create: `src/systems/InkSystem.js`

- [ ] **Step 1: Create `src/systems/InkSystem.js`**

```javascript
export default class InkSystem {
  constructor(scene, maxInk) {
    this.scene = scene;
    this.maxInk = maxInk;
    this.usedInk = 0;
    this.drawing = false;
    this.points = [];
    this.previewGfx = scene.add.graphics().setDepth(10);
    this.inkBodies = [];   // { body: MatterBody, gfx: Graphics }

    this._bindInput();
  }

  _bindInput() {
    const { input } = this.scene;

    input.on('pointerdown', (ptr) => {
      if (ptr.leftButtonDown() && this.usedInk < this.maxInk && !this.scene._winning) {
        this.drawing = true;
        this.points = [];
        const wp = this.scene.cameras.main.getWorldPoint(ptr.x, ptr.y);
        this.points.push({ x: wp.x, y: wp.y });
      }
    });

    input.on('pointermove', (ptr) => {
      if (!this.drawing) return;
      const wp = this.scene.cameras.main.getWorldPoint(ptr.x, ptr.y);
      const last = this.points[this.points.length - 1];
      const dist = Phaser.Math.Distance.Between(last.x, last.y, wp.x, wp.y);
      if (dist > 5) {
        const remaining = this.maxInk - this.usedInk;
        if (dist > remaining) return;
        this.usedInk += dist;
        this.points.push({ x: wp.x, y: wp.y });
        this._drawPreview();
      }
    });

    input.on('pointerup', (ptr) => {
      if (this.drawing) {
        this.drawing = false;
        if (this.points.length >= 3) this._solidify();
        this.points = [];
        this.previewGfx.clear();
      }
    });
  }

  _drawPreview() {
    this.previewGfx.clear();
    this.previewGfx.lineStyle(10, 0x111111, 0.85);
    this.previewGfx.beginPath();
    this.previewGfx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++)
      this.previewGfx.lineTo(this.points[i].x, this.points[i].y);
    this.previewGfx.strokePath();
  }

  _solidify() {
    const pts = this.points;
    const THICKNESS = 10;

    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const segLen = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      if (segLen < 2) continue;

      const body = this.scene.matter.add.rectangle(cx, cy, segLen, THICKNESS, {
        isStatic: false,
        label: 'ink',
        angle,
        frictionAir: 0.08,
        friction: 0.9,
        restitution: 0.05
      });

      const gfx = this.scene.add.graphics().setDepth(5);
      gfx.fillStyle(0x111111, 0.92);
      gfx.fillRect(-segLen / 2, -THICKNESS / 2, segLen, THICKNESS);

      this.inkBodies.push({ body, gfx, segLen, THICKNESS });
    }
  }

  getRatio() {
    return Math.max(0, 1 - this.usedInk / this.maxInk);
  }

  update() {
    for (const { body, gfx } of this.inkBodies) {
      if (body.position) {
        gfx.setPosition(body.position.x, body.position.y);
        gfx.setRotation(body.angle);
      }
    }
  }
}
```

- [ ] **Step 2: Wire InkSystem into Level1Scene**

Add to Level1Scene.js (do not delete existing code):
```javascript
import InkSystem from '../systems/InkSystem.js';

// Inside create(), after _buildPlayer():
this.inkSystem = new InkSystem(this, 400);

// Inside update():
this.inkSystem.update();
this._updateInkBar(this.inkSystem.getRatio());
```

- [ ] **Step 3: Verify ink drawing**

Click "开始游戏", hold left mouse button and draw. Expected:
- Black stroke previews while drawing
- Release → stroke solidifies, falls to ground under gravity
- Horizontal stroke → player can stand on it
- Ink bar depletes as you draw

- [ ] **Step 4: Commit**

```bash
cd "/Users/wht/Desktop/cc/牛马回家"
git add src/systems/InkSystem.js src/scenes/Level1Scene.js
git commit -m "feat: ink drawing system with physics solidification"
```

---

### Task 5: PortalSystem

**Files:**
- Create: `src/systems/PortalSystem.js`

- [ ] **Step 1: Create `src/systems/PortalSystem.js`**

```javascript
export default class PortalSystem {
  constructor(scene) {
    this.scene = scene;
    this.portals = [null, null];      // [{x,y,nx,ny}, ...]
    this.visuals = [null, null];
    this.shotCount = 0;
    this._cooldown = false;
    this._teleportLock = false;

    scene.input.on('pointerdown', (ptr) => {
      if (ptr.rightButtonDown()) this._shoot(ptr);
    });
  }

  _shoot(ptr) {
    if (this._cooldown || this.scene._winning) return;
    this._cooldown = true;
    this.scene.time.delayedCall(250, () => this._cooldown = false);

    const cam = this.scene.cameras.main;
    const wp = cam.getWorldPoint(ptr.x, ptr.y);
    const player = this.scene.player.sprite;

    const dx = wp.x - player.x, dy = wp.y - player.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const hit = this._raycast(player.x, player.y, dx / len, dy / len);
    if (!hit) return;

    const idx = this.shotCount % 2;
    this.shotCount++;
    this._placePortal(idx, hit.x, hit.y, hit.nx, hit.ny);
  }

  _raycast(ox, oy, dx, dy) {
    let bestT = 2000, bestHit = null;

    for (const body of this.scene.matter.world.getAllBodies()) {
      if (body.label === 'player') continue;
      if (!body.isStatic && body.label !== 'ink') continue;

      const hit = this._rayVsAABB(ox, oy, dx, dy, body.bounds);
      if (hit && hit.t > 0 && hit.t < bestT) {
        bestT = hit.t;
        bestHit = { x: ox + dx * hit.t, y: oy + dy * hit.t, nx: hit.nx, ny: hit.ny };
      }
    }
    return bestHit;
  }

  _rayVsAABB(ox, oy, dx, dy, bounds) {
    const { min, max } = bounds;
    let tmin = 0, tmax = Infinity, nx = 0, ny = 0;

    // X slab
    if (Math.abs(dx) > 1e-8) {
      let t1 = (min.x - ox) / dx, t2 = (max.x - ox) / dx;
      let snx = -Math.sign(dx);
      if (t1 > t2) { [t1, t2] = [t2, t1]; snx = -snx; }
      if (t1 > tmin) { tmin = t1; nx = snx; ny = 0; }
      tmax = Math.min(tmax, t2);
    } else if (ox < min.x || ox > max.x) return null;

    // Y slab
    if (Math.abs(dy) > 1e-8) {
      let t1 = (min.y - oy) / dy, t2 = (max.y - oy) / dy;
      let sny = -Math.sign(dy);
      if (t1 > t2) { [t1, t2] = [t2, t1]; sny = -sny; }
      if (t1 > tmin) { tmin = t1; nx = 0; ny = sny; }
      tmax = Math.min(tmax, t2);
    } else if (oy < min.y || oy > max.y) return null;

    if (tmax < tmin || tmax < 0) return null;
    return { t: tmin < 0 ? tmax : tmin, nx, ny };
  }

  _placePortal(idx, x, y, nx, ny) {
    if (this.visuals[idx]) { this.visuals[idx].destroy(); }

    this.portals[idx] = { x, y, nx, ny };
    const key = idx === 0 ? 'portalBlue' : 'portalOrange';
    const angle = Math.atan2(ny, nx) + Math.PI / 2;

    this.visuals[idx] = this.scene.add.image(x, y, key).setRotation(angle).setDepth(8);
    this.scene.tweens.add({
      targets: this.visuals[idx],
      scaleX: 1.12, scaleY: 1.12,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Muzzle flash
    this.scene.cameras.main.flash(80, 100, 150, 255);
  }

  update() {
    if (!this.portals[0] || !this.portals[1]) return;
    if (this._teleportLock) return;

    const player = this.scene.player.sprite;
    const THRESHOLD = 28;

    for (let i = 0; i < 2; i++) {
      const p = this.portals[i];
      if (Phaser.Math.Distance.Between(player.x, player.y, p.x, p.y) < THRESHOLD) {
        const other = this.portals[1 - i];
        this._teleportLock = true;
        this.scene.time.delayedCall(350, () => this._teleportLock = false);

        const vel = player.body.velocity;
        const speed = Math.max(Math.sqrt(vel.x * vel.x + vel.y * vel.y), 6);

        // Place player at exit, offset by exit normal
        this.scene.matter.body.setPosition(player.body, {
          x: other.x - other.nx * 32,
          y: other.y - other.ny * 32
        });

        // Redirect velocity along exit normal (away from wall)
        this.scene.matter.body.setVelocity(player.body, {
          x: -other.nx * speed,
          y: -other.ny * speed
        });

        this.scene.cameras.main.flash(120, 80, 180, 255);
        break;
      }
    }
  }
}
```

- [ ] **Step 2: Wire PortalSystem into Level1Scene**

```javascript
import PortalSystem from '../systems/PortalSystem.js';

// Inside create(), after inkSystem:
this.input.mouse.disableContextMenu();
this.portalSystem = new PortalSystem(this);

// Inside update():
this.portalSystem.update();
```

- [ ] **Step 3: Verify portal system**

Right-click toward the brick wall. Expected:
- Blue portal appears on wall surface, pulses gently
- Right-click again on other side → orange portal appears
- Walk into blue → teleport out of orange with flash
- Third right-click → blue portal moves

- [ ] **Step 4: Commit**

```bash
cd "/Users/wht/Desktop/cc/牛马回家"
git add src/systems/PortalSystem.js src/scenes/Level1Scene.js
git commit -m "feat: portal system with AABB raycast and momentum teleport"
```

---

### Task 6: GuardSystem

**Files:**
- Create: `src/systems/GuardSystem.js`

- [ ] **Step 1: Create `src/systems/GuardSystem.js`**

```javascript
export default class GuardSystem {
  constructor(scene) {
    this.scene = scene;
    this.guards = [];
    this.visionGfx = scene.add.graphics().setDepth(6);
    this._setup();
  }

  _setup() {
    // Level 1: one static guard facing left at house entrance
    this._addGuard(1200, this.scene.GROUND_Y - 28, 'left');
  }

  _addGuard(x, y, facing) {
    const sprite = this.scene.add.image(x, y, 'cowboy').setScale(1.5).setDepth(7);
    if (facing === 'left') sprite.setFlipX(true);
    this.guards.push({ sprite, x, y, facing, range: 220, halfAngle: Math.PI / 3 });
  }

  update() {
    this.visionGfx.clear();
    if (this.scene._winning) return;
    const { x: px, y: py } = this.scene.player.sprite;

    for (const g of this.guards) {
      this._drawCone(g);
      if (this._sees(g, px, py)) {
        this.scene._resetLevel();
        return;
      }
    }
  }

  _drawCone(g) {
    const baseAngle = g.facing === 'right' ? 0 : Math.PI;
    const STEPS = 14;
    this.visionGfx.fillStyle(0xffff00, 0.18);
    this.visionGfx.lineStyle(1, 0xffff00, 0.5);
    this.visionGfx.beginPath();
    this.visionGfx.moveTo(g.x, g.y);
    for (let i = 0; i <= STEPS; i++) {
      const a = baseAngle - g.halfAngle + (g.halfAngle * 2 * i / STEPS);
      this.visionGfx.lineTo(g.x + Math.cos(a) * g.range, g.y + Math.sin(a) * g.range);
    }
    this.visionGfx.closePath();
    this.visionGfx.fillPath();
    this.visionGfx.strokePath();
  }

  _sees(g, px, py) {
    const dx = px - g.x, dy = py - g.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > g.range) return false;

    const baseAngle = g.facing === 'right' ? 0 : Math.PI;
    let diff = Math.atan2(dy, dx) - baseAngle;
    while (diff > Math.PI)  diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > g.halfAngle) return false;

    // Check ink occlusion
    return !this._inkBlocks(g.x, g.y, px, py);
  }

  _inkBlocks(x1, y1, x2, y2) {
    if (!this.scene.inkSystem) return false;
    for (const { body } of this.scene.inkSystem.inkBodies) {
      if (!body.position) continue;
      if (this._segHitsCircle(x1, y1, x2, y2, body.position.x, body.position.y, 18))
        return true;
    }
    return false;
  }

  _segHitsCircle(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1, dy = y2 - y1;
    const fx = x1 - cx, fy = y1 - cy;
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - r * r;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return false;
    const sq = Math.sqrt(disc);
    const t1 = (-b - sq) / (2 * a), t2 = (-b + sq) / (2 * a);
    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
  }
}
```

- [ ] **Step 2: Wire GuardSystem into Level1Scene**

```javascript
import GuardSystem from '../systems/GuardSystem.js';

// Inside create(), after portalSystem:
this.guardSystem = new GuardSystem(this);

// Inside update():
this.guardSystem.update();
```

- [ ] **Step 3: Verify guard**

Walk player to right side of level. Expected:
- Cowboy sprite visible near house entrance
- Yellow semi-transparent cone extending left
- Entering cone → red screen flash → level resets
- Drawing ink wall between player and guard → cone does not trigger

- [ ] **Step 4: Commit**

```bash
cd "/Users/wht/Desktop/cc/牛马回家"
git add src/systems/GuardSystem.js src/scenes/Level1Scene.js
git commit -m "feat: guard system with vision cone and ink occlusion"
```

---

### Task 7: Full Level1Scene — world, player, HUD, tutorial, win

**Files:**
- Modify: `src/scenes/Level1Scene.js`

This task writes the complete Level1Scene combining all systems. Replace the entire file.

- [ ] **Step 1: Replace Level1Scene.js with full implementation**

```javascript
import { createTextures } from '../sprites.js';
import InkSystem from '../systems/InkSystem.js';
import PortalSystem from '../systems/PortalSystem.js';
import GuardSystem from '../systems/GuardSystem.js';

export default class Level1Scene extends Phaser.Scene {
  constructor() { super('Level1Scene'); }

  create() {
    createTextures(this);
    this.LEVEL_WIDTH = 3840;
    this.GROUND_Y = 460;
    this._winning = false;

    this.matter.world.setBounds(0, 0, this.LEVEL_WIDTH, 700);
    this.matter.world.on('collisionstart', this._onCollision.bind(this));

    this._buildBackground();
    this._buildPlatforms();
    this._buildHazards();
    this._buildPortalWall();
    this._buildHouse();
    this._buildPlayer();

    this.input.mouse.disableContextMenu();
    this.inkSystem    = new InkSystem(this, 400);
    this.portalSystem = new PortalSystem(this);
    this.guardSystem  = new GuardSystem(this);

    this.cameras.main.setBounds(0, 0, this.LEVEL_WIDTH, 600);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(600);

    this._buildHUD();
    this._buildTutorial();
  }

  // ── Background ──────────────────────────────────────────────────────────────
  _buildBackground() {
    const W = this.LEVEL_WIDTH, H = 600;
    const sky = this.add.graphics().setScrollFactor(0);
    sky.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xe8f4fd, 0xe8f4fd, 1);
    sky.fillRect(0, 0, 960, 540);

    const hills = this.add.graphics().setScrollFactor(0.25);
    hills.fillStyle(0x90ee90, 0.45);
    for (let x = 0; x < W; x += 280) hills.fillEllipse(x + 140, this.GROUND_Y + 10, 320, 100);

    const clouds = this.add.graphics().setScrollFactor(0.5);
    clouds.fillStyle(0xffffff, 0.7);
    [[150, 80], [400, 60], [700, 90], [950, 55], [1200, 75]].forEach(([x, y]) => {
      clouds.fillEllipse(x, y, 100, 40);
      clouds.fillEllipse(x + 40, y - 15, 80, 35);
      clouds.fillEllipse(x - 30, y - 10, 70, 30);
    });
  }

  // ── Platforms ────────────────────────────────────────────────────────────────
  _buildPlatforms() {
    const T = 32, GY = this.GROUND_Y;

    // Each entry: [worldX, worldY, tilesWide, tilesDeep, texture]
    const platforms = [
      [0,    GY, 7,  4, 'grass'],  // start
      [370,  GY, 4,  4, 'grass'],  // mid-island
      [820,  GY, 14, 4, 'grass'],  // after portal wall
      [1050, GY, 60, 4, 'grass'],  // home stretch
    ];

    for (const [px, py, tw, th, tex] of platforms) {
      // Visual tiles
      for (let i = 0; i < tw; i++)
        for (let j = 0; j < th; j++)
          this.add.image(px + i * T + T / 2, py + j * T + T / 2, tex);
      // One static physics body per platform
      this.matter.add.rectangle(
        px + (tw * T) / 2, py + (th * T) / 2,
        tw * T, th * T,
        { isStatic: true, label: 'ground', friction: 0.5 }
      );
    }
  }

  // ── Hazards ──────────────────────────────────────────────────────────────────
  _buildHazards() {
    // Pit 1: x=224–370, spikes at y=430
    this._placeSpikes(224, this.GROUND_Y - 36, 9);
    // Pit 2: x=498–820, spikes
    this._placeSpikes(498, this.GROUND_Y - 36, 20);
  }

  _placeSpikes(startX, y, count) {
    for (let i = 0; i < count; i++) {
      const sx = startX + i * 16 + 8;
      this.add.image(sx, y, 'spike');
      this.matter.add.rectangle(sx, y + 4, 10, 8, {
        isStatic: true, isSensor: true, label: 'spike'
      });
    }
  }

  // ── Portal Wall ──────────────────────────────────────────────────────────────
  _buildPortalWall() {
    const T = 32, wx = 786, wy = this.GROUND_Y - 160;
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 8; j++)
        this.add.image(wx + i * T + T / 2, wy + j * T + T / 2, 'brick');

    this.matter.add.rectangle(wx + T, wy + 128, T * 2, T * 8, {
      isStatic: true, label: 'portalWall', friction: 0.3
    });

    // Glowing portal-wall marker
    const marker = this.add.graphics();
    marker.lineStyle(3, 0x4488ff, 0.7);
    marker.strokeRect(wx + 2, wy + 2, T * 2 - 4, T * 8 - 4);
    this.tweens.add({ targets: marker, alpha: 0.3, duration: 900, yoyo: true, repeat: -1 });
  }

  // ── House + trigger ───────────────────────────────────────────────────────────
  _buildHouse() {
    const GY = this.GROUND_Y;
    this.add.image(1340, GY - 46, 'house').setScale(1.6);
    this.houseSensor = this.matter.add.rectangle(1310, GY - 20, 50, 80, {
      isStatic: true, isSensor: true, label: 'houseTrigger'
    });
  }

  // ── Player ───────────────────────────────────────────────────────────────────
  _buildPlayer() {
    this.player = this.matter.add.image(80, this.GROUND_Y - 50, 'player', null, {
      label: 'player',
      frictionAir: 0.04,
      friction: 0.5,
      restitution: 0,
      fixedRotation: true
    });
    this.player.setFixedRotation();
    this.player.setScale(1.5).setDepth(9);

    this.onGround = false;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  }

  // ── Collision ─────────────────────────────────────────────────────────────────
  _onCollision(event) {
    for (const { bodyA, bodyB } of event.pairs) {
      const labels = [bodyA.label, bodyB.label];
      if (!labels.includes('player')) continue;

      if (labels.includes('ground') || labels.includes('portalWall') || labels.includes('ink'))
        this.onGround = true;

      if (labels.includes('spike'))        this._resetLevel();
      if (labels.includes('houseTrigger')) this._winLevel();
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────────────
  _buildHUD() {
    this.add.text(12, 10, '墨量', { fontSize: '13px', color: '#333', fontFamily: 'monospace' }).setScrollFactor(0).setDepth(20);
    this._inkBg   = this.add.graphics().setScrollFactor(0).setDepth(20);
    this._inkFill = this.add.graphics().setScrollFactor(0).setDepth(20);
    this._inkBg.fillStyle(0x444444).fillRect(10, 26, 130, 12);

    this.add.text(870, 10, 'L E V E L  1', { fontSize: '13px', color: '#333', fontFamily: 'monospace' }).setScrollFactor(0).setDepth(20);
  }

  _updateInkBar(ratio) {
    this._inkFill.clear();
    const r = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x111111),
      Phaser.Display.Color.ValueToColor(0x444444),
      100, Math.round(ratio * 100)
    );
    this._inkFill.fillStyle(Phaser.Display.Color.GetColor(r.r, r.g, r.b));
    this._inkFill.fillRect(10, 26, 130 * ratio, 12);
  }

  // ── Tutorial ──────────────────────────────────────────────────────────────────
  _buildTutorial() {
    this._tutStep = 0;
    this._tutTips = [
      { triggerX: 60,  worldX: 80,   y: this.GROUND_Y - 80, text: '← → 移动\nSpace 跳跃' },
      { triggerX: 180, worldX: 280,  y: this.GROUND_Y - 90, text: '↓ 按住左键画墨水\n搭桥过坑！' },
      { triggerX: 420, worldX: 600,  y: this.GROUND_Y - 90, text: '墨量有限！\n右键射传送门→' },
      { triggerX: 820, worldX: 1000, y: this.GROUND_Y - 80, text: '注意！门口有牛仔\n用传送门绕过去' },
    ];
    this._tutLabel = null;
    this._showTip(0);
  }

  _showTip(idx) {
    if (this._tutLabel) this._tutLabel.destroy();
    if (idx >= this._tutTips.length) return;
    const tip = this._tutTips[idx];
    this._tutLabel = this.add.text(tip.worldX, tip.y, tip.text, {
      fontSize: '15px', color: '#ffff33', fontFamily: 'monospace',
      backgroundColor: '#000000cc', padding: { x: 8, y: 6 }, align: 'center'
    }).setOrigin(0.5).setDepth(15);

    // Subtle bounce
    this.tweens.add({ targets: this._tutLabel, y: tip.y - 5, duration: 800, yoyo: true, repeat: -1 });
  }

  _checkTutorial() {
    if (this._tutStep >= this._tutTips.length) return;
    const next = this._tutTips[this._tutStep + 1];
    if (next && this.player.x > next.triggerX) {
      this._tutStep++;
      this._showTip(this._tutStep);
    }
  }

  // ── Win / Reset ───────────────────────────────────────────────────────────────
  _resetLevel() {
    if (this._winning || this._resetting) return;
    this._resetting = true;
    this.cameras.main.flash(180, 220, 50, 50);
    this.time.delayedCall(350, () => this.scene.restart());
  }

  _winLevel() {
    if (this._winning) return;
    this._winning = true;
    this.inkSystem.drawing = false;

    // Ink splash celebration
    for (let i = 0; i < 24; i++) {
      const splash = this.add.graphics().setDepth(25).setScrollFactor(0);
      splash.fillStyle(0x111111, Phaser.Math.FloatBetween(0.3, 0.9));
      splash.fillCircle(
        Phaser.Math.Between(300, 660),
        Phaser.Math.Between(150, 390),
        Phaser.Math.Between(4, 16)
      );
      this.tweens.add({ targets: splash, alpha: 0, duration: 900, delay: i * 40 });
    }

    this.time.delayedCall(700, () => {
      this.cameras.main.fadeOut(700, 255, 255, 240);
      this.time.delayedCall(800, () => {
        const ov = this.add.graphics().setScrollFactor(0).setDepth(30);
        ov.fillStyle(0xfffff0); ov.fillRect(0, 0, 960, 540);

        this.add.text(480, 180, '回家了！', {
          fontSize: '68px', color: '#222', fontFamily: 'serif',
          stroke: '#888', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(31);

        this.add.text(480, 280, '第一关  完成', {
          fontSize: '26px', color: '#555', fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(31);

        const btn = this.add.text(480, 380, '返回主界面', {
          fontSize: '24px', color: '#224488', fontFamily: 'monospace',
          backgroundColor: '#ddeeff', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(31).setInteractive({ useHandCursor: true });
        btn.on('pointerup', () => {
          this.cameras.main.fadeOut(400, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
        });
      });
    });
  }

  // ── Update loop ───────────────────────────────────────────────────────────────
  update() {
    this._move();
    this.inkSystem.update();
    this.portalSystem.update();
    this.guardSystem.update();
    this._updateInkBar(this.inkSystem.getRatio());
    this._checkTutorial();

    // Kill zone: fell out of world
    if (this.player.y > 620) this._resetLevel();
  }

  _move() {
    const SPEED = 4.5, JUMP = -13;
    const left  = this.cursors.left.isDown  || this.keyA.isDown;
    const right  = this.cursors.right.isDown || this.keyD.isDown;
    const jump   = Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
                   Phaser.Input.Keyboard.JustDown(this.cursors.up);

    if (left)  { this.player.setVelocityX(-SPEED); this.player.setFlipX(true);  }
    else if (right) { this.player.setVelocityX(SPEED);  this.player.setFlipX(false); }
    else { this.player.setVelocityX(this.player.body.velocity.x * 0.75); }

    if (jump && this.onGround) {
      this.player.setVelocityY(JUMP);
      this.onGround = false;
    }

    // Reset onGround each frame; collision event sets it back if touching ground
    if (Math.abs(this.player.body.velocity.y) > 0.8) this.onGround = false;
  }
}
```

- [ ] **Step 2: Full playthrough verification**

Open http://localhost:8080, click "开始游戏". Verify each step:

1. Tutorial tip 1 shows at start ("← → 移动 / Space 跳跃")
2. Player walks right, tutorial tip 2 appears near Pit 1 ("按住左键画墨水")
3. Drawing ink creates physical platform — player can stand on it over Pit 1
4. Approaching Pit 2 shows tip 3 ("右键射传送门")
5. Right-clicking wall creates blue portal; second click creates orange; walking through teleports
6. Portal wall (brick) blocks direct path; portals allow passing through
7. Approaching house shows tip 4 ("门口有牛仔")
8. Guard's yellow cone extends leftward from house
9. Entering cone → red flash → level resets
10. Opening portal on side wall to bypass guard → reach house door → win screen
11. "返回主界面" button returns to title

- [ ] **Step 3: Fix any issues found**

Common issues:
- Player clips through ground on first spawn → increase `frictionAir` to 0.06
- Ink body not syncing visually → confirm `body.position` is a Matter vector (not undefined)
- Portal teleport loop → verify `_teleportLock` delay is 350ms+
- Tutorial tips in wrong position → adjust `worldX`/`y` values by playtesting

- [ ] **Step 4: Final commit**

```bash
cd "/Users/wht/Desktop/cc/牛马回家"
git add src/
git commit -m "feat: level 1 complete — ink, portals, guard, tutorial, win"
```
