class Level1Scene extends Phaser.Scene {
  constructor() { super('Level1Scene'); }

  preload() {
    preloadUiArt(this);
    preloadGameAssets(this);
  }

  create() {
    createTextures(this);
    createGameAnimations(this);
    this.LEVEL_WIDTH = 3200;
    this.GROUND_Y    = 440;
    this._winning    = false;
    this._resetting  = false;
    this.onGround    = false;
    this.sightBlockers = [];
    this._startTime  = this.time.now;

    // No TOP wall — workload drops spawn above the screen and must fall IN.
    this.matter.world.setBounds(0, 0, this.LEVEL_WIDTH, 700, 128, true, true, false, true);
    this.matter.world.on('collisionstart', this._onCollision.bind(this));
    // collisionactive keeps onGround true while resting on thin ink/platforms,
    // so jumping off ink works (collisionstart alone fires only once on landing).
    this.matter.world.on('collisionactive', this._onCollision.bind(this));

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

    // KPI gauntlet — fills the long empty mid-stretch (x 800–2148) with dodgeable
    // workload drops so it's a tense run, not dead walking.
    const GY = this.GROUND_Y;
    this.workloadSystem = new WorkloadSystem(this, [
      { x: 1180, landY: GY, w: 56, h: 46, text: 'KPI', every: 2600, delay: 1200, warn: 900 },
      { x: 1460, landY: GY, w: 56, h: 46, text: 'OKR', every: 3000, delay: 2200, warn: 900 },
      { x: 1740, landY: GY, w: 64, h: 48, text: 'DDL', every: 3400, delay: 1700, warn: 850, slide: 2 },
      { x: 1990, landY: GY, w: 56, h: 46, text: 'KPI', every: 2800, delay: 2800, warn: 850 },
    ]);

    this.cameras.main.setBounds(0, 0, this.LEVEL_WIDTH, 600);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.fadeIn(700);

    this._buildHUD();
    this._addSightLessonSign();
  }

  // ── Background ────────────────────────────────────────────────────────────────
  _buildBackground() {
    const GY = this.GROUND_Y, LW = this.LEVEL_WIDTH;

    // Rainy-night city (shared backdrop, unified with Level 2/3).
    addRainCityBackdrop(this);

    // Dark wet asphalt fill under the platforms / over the pits.
    const gfill = this.add.graphics().setDepth(-4);
    gfill.fillStyle(0x111114, 0.92);
    gfill.fillRect(0, GY + 70, LW, 280);
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
    // Dark concrete body (matches the rainy-city platforms in Level 2/3).
    g.fillStyle(0x151417);
    g.fillRect(px, py, pw, ph);
    g.fillStyle(0x3d3b3d);
    g.fillRect(px, py + 12, pw, ph - 12);
    // Curb top + faint wet highlight
    g.fillStyle(0x2f3032);
    g.fillRect(px, py, pw, 10);
    g.fillStyle(0xd1a343, 0.5);
    g.fillRect(px + 4, py + 2, pw - 8, 3);
    // Edge shadows
    g.fillStyle(0x000000, 0.18);
    g.fillRect(px, py, 4, ph);
    g.fillRect(px + pw - 4, py, 4, ph);
  }

  // ── Hazards ───────────────────────────────────────────────────────────────────
  _buildHazards() {
    // Pit 1: x 224–434 = 210px (too wide to jump, must draw ink bridge)
    this._addSewerPit(224, 13);
    // Pit 2: x 562–800 = 238px (too wide even with bridge, must use portal)
    this._addSewerPit(562, 15);
    // Small final jump: x 2106–2160 = 54px — no poop, just a reset pit
    this.matter.add.rectangle(2133, this.GROUND_Y + 40, 60, 20,
      { isStatic: true, isSensor: true, label: 'pit' });
  }

  _addSewerPit(startX, count) {
    const GY = this.GROUND_Y;
    const w = count * 16;
    const g = this.add.graphics().setDepth(2);
    // Open sewer trench — dark recessed hole.
    g.fillStyle(0x07080a, 0.96);
    g.fillRect(startX, GY - 4, w, 40);
    g.fillStyle(0x0c0f14, 0.9);
    g.fillRect(startX, GY - 4, w, 10);
    // Hazard-striped lip on the near edge.
    for (let xx = startX; xx < startX + w; xx += 14) {
      g.fillStyle(((xx - startX) / 14) % 2 < 1 ? 0xc8a23a : 0x1a1a1e, 0.95);
      g.fillRect(xx, GY - 6, 14, 4);
    }
    // A couple of manhole rims poking out of the dark.
    g.fillStyle(0x2b2b30);
    for (let k = 0; k < count; k += 6) {
      const cx = startX + k * 16 + 20;
      g.fillEllipse(cx, GY + 2, 22, 7);
      g.fillStyle(0x17171b);
      g.fillEllipse(cx, GY + 2, 14, 4);
      g.fillStyle(0x2b2b30);
    }
    // Only falling INTO the hole kills — no invisible edge-touch death (that
    // felt unfair/weird). The gap has no floor, so missing the bridge = fall in.
    this.matter.add.rectangle(startX + w / 2, GY + 64, w, 20, {
      isStatic: true, isSensor: true, label: 'pit'
    });
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
    this.player = addPlayerSprite(this, 80, this.GROUND_Y - 60, { depth: 9 });
    this.playerAnim = new PlayerAnim(this, this.player);
    this._lastShot = 0;

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
    const runStats = computeRunStats(this);

    // Stop player
    this.matter.body.setVelocity(this.player.body, { x: 0, y: 0 });

    // Ink splash particles
    for (let i = 0; i < 28; i++) {
      const sp = this.add.graphics().setScrollFactor(0).setDepth(28);
      sp.fillStyle(0x1aaeff, Phaser.Math.FloatBetween(0.3, 0.92));
      sp.fillCircle(
        Phaser.Math.Between(250, 710),
        Phaser.Math.Between(120, 420),
        Phaser.Math.Between(3, 18)
      );
      this.tweens.add({ targets: sp, alpha: 0, duration: 1100, delay: i * 45, ease: 'Quad.easeIn' });
    }

    // Brief white flash for juice, then show the settlement directly.
    // (Do NOT fadeOut-to-white here — a held fade overlay would cover the
    //  settlement screen and leave the player stuck on a white screen.)
    this.cameras.main.flash(260, 255, 255, 240);
    this.time.delayedCall(900, () => {
      addSettlementWinScreen(this, {
        stats: runStats,
        onPrimary: () => {
          this.cameras.main.fadeOut(400, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Level2Scene'));
        },
        onSecondary: () => {
          this.cameras.main.fadeOut(400, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
        }
      });
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────────
  update() {
    this._move();
    if (this.inkSystem)    this.inkSystem.update();
    if (this.portalSystem) this.portalSystem.update();
    if (this.guardSystem)  this.guardSystem.update();
    if (this.workloadSystem) this.workloadSystem.update();
    if (this.playerAnim) {
      if (this.portalSystem && this.portalSystem.shotCount !== this._lastShot) {
        this._lastShot = this.portalSystem.shotCount;
        this.playerAnim.flashPortal();
      }
      if (this.inkSystem && this.inkSystem.drawing) this.playerAnim.setInk(true);
      this.playerAnim.update(this.game.loop.delta);
    }
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
