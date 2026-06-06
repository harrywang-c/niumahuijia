class Level1Scene extends Phaser.Scene {
  constructor() { super('Level1Scene'); }

  create() {
    createTextures(this);
    this.LEVEL_WIDTH = 3200;
    this.GROUND_Y    = 440;
    this._winning    = false;
    this._resetting  = false;
    this.onGround    = false;
    this.sightBlockers = [];

    this.matter.world.setBounds(0, 0, this.LEVEL_WIDTH, 700);
    this.matter.world.on('collisionstart', this._onCollision.bind(this));

    this._buildBackground();
    this._buildPlatforms();
    this._buildHazards();
    this._buildPortalWall();
    this._buildFinalObstacle();
    this._buildHouse();
    this._buildPlayer();

    this.input.mouse.disableContextMenu();
    this.inkSystem    = new InkSystem(this, 340);
    this.portalSystem = new PortalSystem(this);
    this.guardSystem  = new GuardSystem(this);
    this.guardSystem.addGuard(2380, this.GROUND_Y - 28, 'left', 260, 38, 95);

    this.cameras.main.setBounds(0, 0, this.LEVEL_WIDTH, 600);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.fadeIn(700);

    this._buildHUD();
    this._addSightLessonSign();
  }

  // ── Background ────────────────────────────────────────────────────────────────
  _buildBackground() {
    const W = 960, H = 540, GY = this.GROUND_Y, LW = this.LEVEL_WIDTH;

    // Sky — rich gradient top to horizon
    const sky = this.add.graphics().setScrollFactor(0).setDepth(-10);
    sky.fillGradientStyle(0x1a3a6e, 0x1a3a6e, 0x89c8e8, 0x89c8e8, 1);
    sky.fillRect(0, 0, W, H);

    // Distant mountains
    const mts = this.add.graphics().setScrollFactor(0.07).setDepth(-8);
    mts.fillStyle(0x6e7eaa);
    [[180,118],[460,88],[740,130],[1020,76],[1300,110],[1580,94],[1860,124]].forEach(([mx, mh]) => {
      mts.fillTriangle(mx - 110, GY - 52, mx, GY - 52 - mh, mx + 110, GY - 52);
      mts.fillTriangle(mx + 50, GY - 52, mx + 130, GY - 52 - mh * 0.55, mx + 205, GY - 52);
    });
    // Snow caps
    mts.fillStyle(0xddeeff);
    [[180,118],[740,130],[1300,110],[1860,124]].forEach(([mx, mh]) => {
      const cap = mh * 0.3;
      mts.fillTriangle(mx - cap * 0.85, GY - 52 - mh + cap * 1.2, mx, GY - 52 - mh, mx + cap * 0.85, GY - 52 - mh + cap * 1.2);
    });

    // Background trees
    const btrees = this.add.graphics().setScrollFactor(0.28).setDepth(-6);
    for (let i = 0; i < 18; i++) {
      const tx = 60 + i * 95 + (i * 137 * 7 % 55);
      const th = 52 + (i * 137 * 3 % 34);
      const tw = 30 + (i * 137 % 18);
      btrees.fillStyle(0x1e5a1e);
      btrees.fillEllipse(tx - 7, GY - th + 4, tw * 0.68, th * 0.58);
      btrees.fillStyle(0x2a7a2a);
      btrees.fillEllipse(tx, GY - th - 4, tw + 8, th * 0.76);
      btrees.fillStyle(0x3d8a3d);
      btrees.fillEllipse(tx + 7, GY - th - 16, tw * 0.68, th * 0.56);
      btrees.fillStyle(0x5a3318);
      btrees.fillRect(tx - 4, GY - th + Math.floor(tw * 0.32), 8, Math.floor(th - tw * 0.28));
    }

    // Rolling hills at horizon — top sits ABOVE ground, no bleed into pits
    const hills = this.add.graphics().setScrollFactor(0.18).setDepth(-5);
    hills.fillStyle(0x3faa3f);
    for (let x = -80; x < 1700; x += 270)
      hills.fillEllipse(x + 135, GY - 80, 320, 130);
    hills.fillStyle(0x56bb44);
    for (let x = 70; x < 1600; x += 215)
      hills.fillEllipse(x + 108, GY - 60, 254, 88);

    // Ground fill — covers pit areas with dark earth so no bleed-through
    const gfill = this.add.graphics().setDepth(-4);
    gfill.fillStyle(0x3c2112);
    gfill.fillRect(0, GY, LW, 300);
    gfill.fillStyle(0x482818);
    for (let x = 0; x < LW; x += 96)
      for (let yy = GY + 16; yy < GY + 110; yy += 22)
        gfill.fillRect(x + (yy % 48), yy, 30, 6);

    // Clouds — fluffy with drop shadow
    const clouds = this.add.graphics().setScrollFactor(0.38).setDepth(-3);
    [[90,62],[340,42],[600,74],[860,50],[1130,66],[1380,40],[1640,70],[1900,54],[2160,78]].forEach(([cx, cy]) => {
      // shadow
      clouds.fillStyle(0x99bbdd, 0.35);
      clouds.fillEllipse(cx + 8, cy + 10, 134, 52);
      clouds.fillEllipse(cx + 50, cy - 6, 94, 42);
      clouds.fillEllipse(cx - 28, cy, 80, 34);
      // body
      clouds.fillStyle(0xffffff);
      clouds.fillEllipse(cx, cy, 132, 50);
      clouds.fillEllipse(cx + 46, cy - 14, 92, 40);
      clouds.fillEllipse(cx - 26, cy - 8, 78, 34);
      clouds.fillEllipse(cx + 20, cy - 26, 66, 34);
      // bright top
      clouds.fillStyle(0xeef6ff);
      clouds.fillEllipse(cx + 46, cy - 16, 68, 26);
      clouds.fillEllipse(cx + 20, cy - 28, 50, 24);
    });
  }

  // ── Platforms ─────────────────────────────────────────────────────────────────
  _buildPlatforms() {
    const T = 32, GY = this.GROUND_Y;
    const platforms = [
      [0,    GY, 7,  4],   // x 0–224: start area
      [434,  GY, 4,  4],   // x 434–562: island (pit 1 forces ink bridge)
      [800,  GY, 12, 4],   // x 800–1184: post-portal landing
      [1050, GY, 33, 4],   // x 1050–2106: main stretch part 1
      [2160, GY, 33, 4],   // x 2160–3216: main stretch part 2 (60px jump gap before)
    ];

    for (const [px, py, tw, th] of platforms) {
      const pw = tw * T, ph = th * T;
      this._drawPlatform(px, py, pw, ph);
      this.matter.add.rectangle(
        px + pw / 2, py + ph / 2, pw, ph,
        { isStatic: true, label: 'ground', friction: 0.6, restitution: 0 }
      );
    }
  }

  _drawPlatform(px, py, pw, ph) {
    const g = this.add.graphics().setDepth(0);
    // Deep dark earth base
    g.fillStyle(0x2a1508);
    g.fillRect(px, py, pw, ph);
    // Rich mid-earth
    g.fillStyle(0x58300e);
    g.fillRect(px, py + 14, pw, ph - 14);
    // Subtle earth bands
    g.fillStyle(0x6d3c18);
    for (let yy = py + 28; yy < py + ph - 4; yy += 20)
      g.fillRect(px + 14, yy, pw - 28, 9);
    // Grass-earth dark border
    g.fillStyle(0x166618);
    g.fillRect(px, py + 10, pw, 8);
    // Vivid grass surface
    g.fillStyle(0x28cc3e);
    g.fillRect(px, py, pw, 12);
    // Grass highlight
    g.fillStyle(0x5ce870, 0.55);
    g.fillRect(px + 4, py, pw - 8, 5);
    // Edge shadows
    g.fillStyle(0x000000, 0.1);
    g.fillRect(px, py, 5, ph);
    g.fillRect(px + pw - 5, py, 5, ph);
  }

  // ── Hazards ───────────────────────────────────────────────────────────────────
  _buildHazards() {
    // Pit 1: x 224–434 = 210px (too wide to jump, must draw ink bridge)
    this._addPoop(224, 13);
    // Pit 2: x 562–800 = 238px (too wide even with bridge, must use portal)
    this._addPoop(562, 15);
    // Small final jump: x 2106–2160 = 54px — no poop, just a reset pit
    this.matter.add.rectangle(2133, this.GROUND_Y + 40, 60, 20,
      { isStatic: true, isSensor: true, label: 'pit' });
  }

  _addPoop(startX, count) {
    for (let i = 0; i < count; i++) {
      const sx = startX + i * 16 + 8;
      this.add.text(sx, this.GROUND_Y - 2, '💩', {
        fontSize: '13px'
      }).setOrigin(0.5, 1).setDepth(2);
      this.matter.add.rectangle(sx, this.GROUND_Y - 8, 12, 12, {
        isStatic: true, isSensor: true, label: 'spike'
      });
    }
    this.matter.add.rectangle(
      startX + (count * 16) / 2,
      this.GROUND_Y + 64,
      count * 16, 20,
      { isStatic: true, isSensor: true, label: 'pit' }
    );
  }

  // ── Portal Zone ───────────────────────────────────────────────────────────────
  // Pit 2 (x=562–800) is 238px — too wide to bridge. No walls here so portal
  // shots land freely on both pads. Pit itself forces portal usage.
  _buildPortalWall() {
    const GY = this.GROUND_Y;

    // Vertical light beam above each pad (purely visual, no physics)
    this._addPortalBeam(498, GY, 0);   // blue beam on island
    this._addPortalBeam(900, GY, 1);   // orange beam on platform 3

    // Portal pads — glowing floor targets
    this._addPortalPad(498, GY, 0);
    this._addPortalPad(900, GY, 1);
  }

  _addWall(x, groundY, w, h) {
    this.matter.add.rectangle(x + w / 2, groundY - h / 2, w, h, {
      isStatic: true, label: 'wall', friction: 0.4
    });
    this.sightBlockers.push({ x, y: groundY - h, width: w, height: h });

    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x252232);
    g.fillRect(x, groundY - h, w, h);
    g.fillStyle(0x161422, 0.85);
    for (let yy = groundY - h + 14; yy < groundY - 4; yy += 20)
      g.fillRect(x, yy, w, 3);
    g.fillStyle(0x5a5568, 0.5);
    g.fillRect(x, groundY - h, 2, h);
    const stripeH = 10;
    for (let xx = x; xx < x + w; xx += 6) {
      g.fillStyle(xx % 12 < 6 ? 0xdd4400 : 0x111111, 0.75);
      g.fillRect(xx, groundY - stripeH, 6, stripeH);
    }
  }

  _addPortalBeam(x, groundY, portalIdx) {
    const color = portalIdx === 0 ? 0x4488ff : 0xff8800;
    const beam = this.add.graphics().setDepth(2);
    const beamH = 160;
    // Outer glow
    beam.fillStyle(color, 0.06);
    beam.fillRect(x - 18, groundY - beamH, 36, beamH);
    // Mid beam
    beam.fillStyle(color, 0.12);
    beam.fillRect(x - 10, groundY - beamH, 20, beamH);
    // Core
    beam.fillStyle(color, 0.22);
    beam.fillRect(x - 4, groundY - beamH, 8, beamH);
    this.tweens.add({
      targets: beam, alpha: 0.35, duration: portalIdx === 0 ? 1100 : 850,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  _addPortalPad(x, groundY, portalIdx) {
    const color = portalIdx === 0 ? 0x2266ff : 0xff7700;
    const hexCol = portalIdx === 0 ? '#4488ff' : '#ff8800';

    // Glowing floor strip
    const pad = this.add.graphics().setDepth(2);
    pad.fillStyle(color, 0.32);
    pad.fillRect(x - 30, groundY - 6, 60, 6);
    pad.lineStyle(2, color, 0.85);
    pad.strokeRect(x - 30, groundY - 6, 60, 6);
    this.tweens.add({ targets: pad, alpha: 0.5, duration: 750, yoyo: true, repeat: -1 });

    // Bouncing arrow
    const arrow = this.add.text(x, groundY - 28, '⬇', {
      fontSize: '16px', color: hexCol, fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(3);
    this.tweens.add({ targets: arrow, y: groundY - 20, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // ── Final Obstacle ────────────────────────────────────────────────────────────
  // Wall-and-vision puzzle: the slabs are real sight blockers, so the player can
  // use their blind spots while setting up a portal route to the house side.
  _buildFinalObstacle() {
    const GY = this.GROUND_Y;

    this._addWall(2260, GY, 26, 130);
    this._addWall(2460, GY, 26, 110);
    this._addWall(2588, GY, 22, 92);

    this._addPortalBeam(2210, GY, 0);
    this._addPortalBeam(2638, GY, 1);
    this._addPortalPad(2210, GY, 0);
    this._addPortalPad(2638, GY, 1);
  }

  _addSightLessonSign() {
    const CHS = '"Microsoft YaHei","PingFang SC",Arial,sans-serif';
    const x = 2148, y = this.GROUND_Y - 112;

    const sign = this.add.graphics().setDepth(4);
    sign.fillStyle(0x07101e, 0.82);
    sign.fillRoundedRect(x - 118, y - 34, 236, 68, 10);
    sign.lineStyle(1.5, 0x4a7ab8, 0.8);
    sign.strokeRoundedRect(x - 118, y - 34, 236, 68, 10);
    sign.fillStyle(0x111111, 0.9);
    sign.fillRect(x - 102, y + 15, 204, 8);
    sign.fillStyle(0x4a7ab8, 0.8);
    sign.fillRect(x - 104, y + 23, 6, 46);
    sign.fillRect(x + 98, y + 23, 6, 46);

    this.add.text(x, y - 10, '墨水能挡住巡逻视线', {
      fontSize: '17px',
      color: '#ffffff',
      fontFamily: CHS,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(5);

    this.add.text(x, y + 14, '剩下的墨不多，画短一点', {
      fontSize: '12px',
      color: '#a9c8ff',
      fontFamily: CHS,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(5);
  }

  // ── House ─────────────────────────────────────────────────────────────────────
  _buildHouse() {
    const GY = this.GROUND_Y;
    this.add.image(2680, GY - 44, 'house').setScale(1.7).setDepth(4);

    // Trigger sensor at door
    this.matter.add.rectangle(2650, GY - 18, 48, 76, {
      isStatic: true, isSensor: true, label: 'houseTrigger'
    });

    // Welcome mat
    const mat = this.add.graphics().setDepth(3);
    mat.fillStyle(0x885533);
    mat.fillRect(2632, GY - 2, 44, 10);
    mat.fillStyle(0xcc8844, 0.5);
    for (let i = 0; i < 4; i++) mat.fillRect(2634 + i * 10, GY, 6, 8);
  }

  // ── Player ────────────────────────────────────────────────────────────────────
  _buildPlayer() {
    this.player = this.matter.add.image(80, this.GROUND_Y - 60, 'player', null, {
      label: 'player',
      frictionAir: 0.05,
      friction: 0.5,
      restitution: 0,
      fixedRotation: true,
      density: 0.004
    });
    this.player.setFixedRotation();
    this.player.setScale(1.5).setDepth(9);

    this.cursors  = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyA     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  }

  // ── Collisions ────────────────────────────────────────────────────────────────
  _onCollision(event) {
    for (const { bodyA, bodyB } of event.pairs) {
      const a = bodyA.label, b = bodyB.label;
      if (a !== 'player' && b !== 'player') continue;

      if (a === 'ground' || b === 'ground' ||
          a === 'portalWall' || b === 'portalWall' ||
          a === 'ink' || b === 'ink') {
        this.onGround = true;
      }
      if (a === 'spike'        || b === 'spike')        this._resetLevel();
      if (a === 'pit'          || b === 'pit')          this._resetLevel();
      if (a === 'houseTrigger' || b === 'houseTrigger') this._winLevel();
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────────────
  _buildHUD() {
    const W = 960;
    const CHS = '"Microsoft YaHei","PingFang SC",Arial,sans-serif';

    // Left panel — ink + portals
    const panel = this.add.graphics().setScrollFactor(0).setDepth(20);
    panel.fillStyle(0x060c1a, 0.78);
    panel.fillRoundedRect(6, 6, 222, 74, 12);
    panel.lineStyle(1, 0x2d4a7a, 0.6);
    panel.strokeRoundedRect(6, 6, 222, 74, 12);

    // Ink drop icon
    const drop = this.add.graphics().setScrollFactor(0).setDepth(21);
    drop.fillStyle(0x44aaff);
    drop.fillEllipse(22, 38, 13, 17);
    drop.fillTriangle(15, 32, 29, 32, 22, 19);
    drop.fillStyle(0x88ddff, 0.45);
    drop.fillEllipse(19, 34, 5, 7);

    this.add.text(38, 13, '墨  量', {
      fontSize: '13px', color: '#4a88bb', fontFamily: CHS, fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(21);

    // Bar track
    const track = this.add.graphics().setScrollFactor(0).setDepth(21);
    track.fillStyle(0x080f20);
    track.fillRoundedRect(38, 32, 182, 20, 10);
    track.lineStyle(1, 0x1a2e4a, 1);
    track.strokeRoundedRect(38, 32, 182, 20, 10);

    this._inkFill = this.add.graphics().setScrollFactor(0).setDepth(22);
    this._updateInkBar(1);

    // Portal section
    this.add.text(38, 58, '传送门', {
      fontSize: '11px', color: '#4a6e88', fontFamily: CHS
    }).setScrollFactor(0).setDepth(21);

    this._portalDots = [
      this.add.graphics().setScrollFactor(0).setDepth(22),
      this.add.graphics().setScrollFactor(0).setDepth(22)
    ];
    this._drawPortalDots();

    // Right panel — level badge
    const rp = this.add.graphics().setScrollFactor(0).setDepth(20);
    rp.fillStyle(0x060c1a, 0.78);
    rp.fillRoundedRect(W - 112, 6, 106, 46, 12);
    rp.lineStyle(1, 0x2d4a7a, 0.6);
    rp.strokeRoundedRect(W - 112, 6, 106, 46, 12);

    this.add.text(W - 88, 14, 'LEVEL', {
      fontSize: '11px', color: '#3a5e88', fontFamily: 'Arial,sans-serif', fontStyle: 'bold',
      letterSpacing: 3
    }).setScrollFactor(0).setDepth(21);

    this.add.text(W - 59, 34, '1', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'Arial Black,sans-serif', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(21);
  }

  _updateInkBar(ratio) {
    this._inkFill.clear();
    const c = Phaser.Math.Clamp(ratio, 0, 1);
    const w = Math.max(0, 178 * c);
    if (w < 2) return;
    const main  = c > 0.5 ? 0x1188ee : c > 0.2 ? 0xff9900 : 0xff2222;
    const shine = c > 0.5 ? 0x55ccff : c > 0.2 ? 0xffcc44 : 0xff7755;
    this._inkFill.fillStyle(main);
    this._inkFill.fillRoundedRect(40, 34, w, 16, 8);
    this._inkFill.fillStyle(shine, 0.28);
    this._inkFill.fillRoundedRect(40, 34, w, 7, { tl: 8, tr: 8, bl: 0, br: 0 });
    if (w > 18) {
      this._inkFill.fillStyle(shine, 0.35);
      this._inkFill.fillCircle(40 + w - 5, 42, 7);
    }
  }

  _drawPortalDots() {
    const [d0, d1] = this._portalDots;
    d0.clear(); d1.clear();
    const hasB = this.portalSystem?.portals[0] !== null;
    const hasO = this.portalSystem?.portals[1] !== null;

    d0.fillStyle(hasB ? 0x1144ee : 0x182238);
    d0.fillCircle(88, 65, 10);
    d0.lineStyle(2, hasB ? 0x4488ff : 0x2a4466);
    d0.strokeCircle(88, 65, 10);
    if (hasB) { d0.fillStyle(0x88bbff, 0.5); d0.fillCircle(85, 62, 4); }

    d1.fillStyle(hasO ? 0xcc5500 : 0x341a08);
    d1.fillCircle(116, 65, 10);
    d1.lineStyle(2, hasO ? 0xff8833 : 0x663322);
    d1.strokeCircle(116, 65, 10);
    if (hasO) { d1.fillStyle(0xffaa66, 0.5); d1.fillCircle(113, 62, 4); }
  }

  // ── Win / Reset ───────────────────────────────────────────────────────────────
  _resetLevel() {
    if (this._winning || this._resetting) return;
    this._resetting = true;
    this.cameras.main.flash(220, 200, 40, 40);
    this.time.delayedCall(380, () => this.scene.restart());
  }

  _winLevel() {
    if (this._winning) return;
    this._winning = true;
    this.inkSystem.drawing = false;

    // Stop player
    this.matter.body.setVelocity(this.player.body, { x: 0, y: 0 });

    // Ink splash particles
    for (let i = 0; i < 28; i++) {
      const sp = this.add.graphics().setScrollFactor(0).setDepth(28);
      sp.fillStyle(0x111111, Phaser.Math.FloatBetween(0.3, 0.92));
      sp.fillCircle(
        Phaser.Math.Between(250, 710),
        Phaser.Math.Between(120, 420),
        Phaser.Math.Between(3, 18)
      );
      this.tweens.add({ targets: sp, alpha: 0, duration: 1100, delay: i * 45, ease: 'Quad.easeIn' });
    }

    this.time.delayedCall(700, () => {
      this.cameras.main.fadeOut(750, 255, 255, 240);
      this.time.delayedCall(850, () => {
        // Win overlay
        const ov = this.add.graphics().setScrollFactor(0).setDepth(30);
        ov.fillStyle(0xfffff8); ov.fillRect(0, 0, 960, 540);

        const CHS = '"Microsoft YaHei","PingFang SC",Arial,sans-serif';
        this.add.text(480, 150, '🏠  回家了！', {
          fontSize: '64px', color: '#1a1a2e', fontFamily: CHS,
          stroke: '#888', strokeThickness: 1
        }).setOrigin(0.5).setScrollFactor(0).setDepth(31);

        this.add.text(480, 256, '第 一 关  完 成', {
          fontSize: '24px', color: '#445566', fontFamily: CHS, fontStyle: 'bold',
          letterSpacing: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(31);

        // Ink splat signature
        const sig = this.add.graphics().setScrollFactor(0).setDepth(31);
        sig.fillStyle(0x111111, 0.1);
        [[200, 420, 30], [680, 380, 22], [480, 450, 18], [340, 390, 14]].forEach(([x, y, r]) => {
          sig.fillCircle(x, y, r);
          sig.fillEllipse(x + r, y + r * 0.4, r * 1.3, r * 0.5);
        });

        // Graphical button with rounded corners
        const btnBg = this.add.graphics().setScrollFactor(0).setDepth(31);
        const drawBtn = (hover) => {
          btnBg.clear();
          btnBg.fillStyle(hover ? 0x4d8ae0 : 0x2a5fa8);
          btnBg.fillRoundedRect(366, 346, 228, 52, 14);
          btnBg.fillStyle(hover ? 0x7ab0f5 : 0x4d8ae0, 0.35);
          btnBg.fillRoundedRect(366, 346, 228, 22, { tl: 14, tr: 14, bl: 0, br: 0 });
        };
        drawBtn(false);

        const btn = this.add.text(480, 373, '返 回 主 界 面', {
          fontSize: '20px', color: '#ffffff', fontFamily: CHS, fontStyle: 'bold',
          letterSpacing: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(32)
          .setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => drawBtn(true));
        btn.on('pointerout',  () => drawBtn(false));
        btn.on('pointerup', () => {
          btn.disableInteractive();
          this.cameras.main.fadeOut(400, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
        });
      });
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────────
  update() {
    this._move();
    if (this.inkSystem)    this.inkSystem.update();
    if (this.portalSystem) this.portalSystem.update();
    if (this.guardSystem)  this.guardSystem.update();
    this._updateInkBar(this.inkSystem.getRatio());
    this._drawPortalDots();

    // Fall out of world
    if (this.player.y > 640) this._resetLevel();

    // Reset onGround if airborne
    if (Math.abs(this.player.body.velocity.y) > 1.2) this.onGround = false;
  }

  _move() {
    if (this._winning || this._resetting) return;
    const SPEED = 4.5, JUMP = -14;
    const left  = this.cursors.left.isDown  || this.keyA.isDown;
    const right  = this.cursors.right.isDown || this.keyD.isDown;
    const jump   = Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
                   Phaser.Input.Keyboard.JustDown(this.keyW) ||
                   Phaser.Input.Keyboard.JustDown(this.cursors.up);

    if (left) {
      this.player.setVelocityX(-SPEED);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setVelocityX(SPEED);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(this.player.body.velocity.x * 0.72);
    }

    if (jump && this.onGround) {
      this.player.setVelocityY(JUMP);
      this.onGround = false;
    }
  }
}
