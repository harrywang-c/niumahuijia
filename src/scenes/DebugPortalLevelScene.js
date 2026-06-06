class DebugPortalLevelScene extends Phaser.Scene {
  constructor(key, cfg) {
    super(key);
    this.cfg = cfg;
  }

  preload() {
    preloadUiArt(this);
    preloadGameAssets(this);
  }

  create() {
    createTextures(this);
    createGameAnimations(this);
    this.LEVEL_WIDTH = this.cfg.width;
    this.GROUND_Y = this.cfg.groundY || 440;
    this._winning = false;
    this._resetting = false;
    this.onGround = false;
    this.sightBlockers = [];
    this._dropTimers = [];
    this._startTime = this.time.now;

    this.matter.world.setBounds(0, 0, this.LEVEL_WIDTH, 720);
    this.matter.world.on('collisionstart', this._onCollision.bind(this));
    this.matter.world.on('collisionactive', this._onCollision.bind(this));

    this._buildBackground();
    this._buildPlatforms();
    this._buildConveyors();
    this._buildPortalHints();
    this._buildHouse();
    this._buildPlayer();
    this._buildSystems();
    this._buildDebugHUD();
    this._buildInkHUD();

    this.input.mouse.disableContextMenu();
    this.cameras.main.setBounds(0, 0, this.LEVEL_WIDTH, 600);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.fadeIn(350);
  }

  _buildBackground() {
    addRainCityBackdrop(this);

    const floor = this.add.graphics().setDepth(-4);
    floor.fillStyle(0x121114, 0.9);
    floor.fillRect(0, this.GROUND_Y + 80, this.LEVEL_WIDTH, 260);
  }

  _buildPlatforms() {
    for (const p of this.cfg.platforms) {
      this._addPlatform(p.x, p.y, p.w, p.h || 48, p.kind || 'ground');
    }

    for (const wall of this.cfg.walls || []) {
      this._addWall(wall.x, wall.y, wall.w, wall.h);
    }
  }

  _addPlatform(x, y, w, h, label) {
    this.sightBlockers.push({ x, y, width: w, height: h });

    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x151417);
    g.fillRect(x, y, w, h);
    g.fillStyle(0x3d3b3d);
    g.fillRect(x, y + 12, w, h - 12);
    // Uniform city-platform look — the old blue "portal-surface" tint was a
    // meaningless hint (any surface accepts portals), so all platforms match.
    g.fillStyle(0x2f3032);
    g.fillRect(x, y, w, 10);
    g.fillStyle(0xd1a343, 0.55);
    g.fillRect(x + 4, y + 2, w - 8, 4);

    this.matter.add.rectangle(x + w / 2, y + h / 2, w, h, {
      isStatic: true,
      label: label === 'wall' ? 'wall' : 'ground',
      friction: 0.7,
      restitution: 0
    });
  }

  _addWall(x, y, w, h) {
    this.sightBlockers.push({ x, y, width: w, height: h });
    this.matter.add.rectangle(x + w / 2, y + h / 2, w, h, {
      isStatic: true,
      label: 'wall',
      friction: 0.5
    });

    // Solid concrete pillar that reads as part of the city (not a hint marker).
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x26262b);
    g.fillRect(x, y, w, h);
    g.fillStyle(0x2f2f35);                 // lit left edge
    g.fillRect(x, y, Math.min(4, w), h);
    g.fillStyle(0x1b1b1f);                  // shadowed right edge
    g.fillRect(x + w - Math.min(4, w), y, Math.min(4, w), h);
    g.fillStyle(0x18181c, 0.7);             // concrete seams
    for (let yy = y + 16; yy < y + h; yy += 22) g.fillRect(x, yy, w, 2);
    // hazard stripe cap so it still signals "obstacle"
    for (let xx = x; xx < x + w; xx += 8) {
      g.fillStyle(((xx - x) / 8) % 2 < 1 ? 0xc8a23a : 0x202024, 0.8);
      g.fillRect(xx, y, 8, 4);
    }
  }

  _buildPortalHints() {
    // Portal-hint pillars removed — they were decorative only (no mechanical
    // effect) and read as meaningless light blocks. Portals can target any
    // visible surface, so no hint markers are needed.
  }

  _buildHouse() {
    const x = this.cfg.houseX;
    this.house = this.add.image(x, this.GROUND_Y - 88, 'house').setScale(0.75).setDepth(4);
    this.matter.add.rectangle(x, this.GROUND_Y - 60, 84, 112, {
      isStatic: true,
      isSensor: true,
      label: 'house'
    });
  }

  _buildPlayer() {
    this.player = addPlayerSprite(this, this.cfg.startX, this.cfg.startY, {
      depth: 7, friction: 0.02, frictionAir: 0.015, fallbackScale: 0.72,
    });
    this.playerAnim = new PlayerAnim(this, this.player);
    this._lastShot = 0;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  _buildSystems() {
    this.inkSystem = new InkSystem(this, this.cfg.inkMax);
    this.portalSystem = new PortalSystem(this);
    this.guardSystem = new GuardSystem(this);
    for (const guard of this.cfg.guards || []) {
      this.guardSystem.addGuard(guard.x, guard.y, guard.dir, guard.range, guard.angle, guard.patrol || 0);
    }

    this.workloadSystem = new WorkloadSystem(this, this.cfg.drops);
  }

  _scheduleDrop(drop) {
    const spawn = () => {
      if (this._winning || this._resetting) return;
      this._warnDrop(drop);
      this.time.delayedCall(drop.warn || 850, () => this._spawnDrop(drop));
    };
    this.time.delayedCall(drop.delay || 500, spawn);
    this._dropTimers.push(this.time.addEvent({
      delay: drop.every,
      loop: true,
      callback: spawn
    }));
  }

  _warnDrop(drop) {
    // Landing-zone telegraph (no full-height line): a blinking danger patch on
    // the ground plus a small downward chevron, so the player reads "something
    // lands HERE" without a confusing beam from the sky.
    const marker = this.add.graphics().setDepth(6);
    const x0 = drop.x - drop.w / 2;
    marker.fillStyle(0xff3030, 0.28);
    marker.fillRect(x0, drop.landY - 6, drop.w, 6);
    marker.lineStyle(2, 0xff5050, 0.9);
    marker.strokeRect(x0, drop.landY - 6, drop.w, 6);
    // downward chevron hovering above the zone
    const cy = drop.landY - 40;
    marker.fillStyle(0xff5050, 0.9);
    marker.fillTriangle(drop.x - 9, cy, drop.x + 9, cy, drop.x, cy + 12);
    this.tweens.add({
      targets: marker, alpha: 0.15, duration: (drop.warn || 850) / 3,
      yoyo: true, repeat: -1
    });
    this.time.delayedCall(drop.warn || 850, () => marker.destroy());
  }

  _spawnDrop(drop) {
    if (this._winning || this._resetting) return;
    const body = this.matter.add.rectangle(drop.x, -40, drop.w, drop.h, {
      label: 'workload',
      friction: 0.04,
      restitution: 0.08
    });
    const text = this.add.text(drop.x, -40, drop.text, {
      fontSize: `${drop.fontSize || 17}px`,
      color: '#cc2222',
      fontFamily: 'Arial Black,Arial,sans-serif',
      backgroundColor: '#f6dfb8',
      padding: { left: 6, right: 6, top: 3, bottom: 3 },
      stroke: '#5a2600',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(8);

    body.plugin = body.plugin || {};
    body.plugin.debugText = text;
    body.plugin.kind = 'workload';
    body.plugin.slide = drop.slide || 0;
    body.plugin.prevBounds = this._cloneBounds(body.bounds);
    if (drop.slide) this.matter.body.setVelocity(body, { x: drop.slide, y: 0 });

    this.time.delayedCall(drop.life || 4600, () => {
      if (text && !text.destroyed) text.destroy();
      if (body && !body.isDestroyed) this.matter.world.remove(body);
    });
  }

  _buildDebugHUD() {
    const CHS = '"Microsoft YaHei","PingFang SC",Arial,sans-serif';
    const panel = this.add.graphics().setScrollFactor(0).setDepth(30);
    panel.fillStyle(0x06101f, 0.82);
    panel.fillRoundedRect(10, 8, 336, 66, 10);
    panel.lineStyle(1, 0x4a6eaa, 0.6);
    panel.strokeRoundedRect(10, 8, 336, 66, 10);

    this.add.text(22, 16, this.cfg.title, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: CHS,
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(31);

    this.add.text(22, 43, this.cfg.goal, {
      fontSize: '12px',
      color: '#aac8ff',
      fontFamily: CHS
    }).setScrollFactor(0).setDepth(31);

    this.add.text(22, 63, 'R 重开    Esc 返回标题    W/Space/↑ 跳跃', {
      fontSize: '11px',
      color: '#7f9fbb',
      fontFamily: CHS
    }).setScrollFactor(0).setDepth(31);
  }

  _buildInkHUD() {
    const CHS = '"Microsoft YaHei","PingFang SC",Arial,sans-serif';
    const x = 370, y = 15, w = 180, h = 42;
    const panel = this.add.graphics().setScrollFactor(0).setDepth(30);
    panel.fillStyle(0x06101f, 0.74);
    panel.fillRoundedRect(x, y, w, h, 10);
    panel.lineStyle(1, 0x4a6eaa, 0.55);
    panel.strokeRoundedRect(x, y, w, h, 10);

    this.add.text(x + 14, y + 8, '墨量', {
      fontSize: '12px',
      color: '#8fb5d8',
      fontFamily: CHS,
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(31);

    const track = this.add.graphics().setScrollFactor(0).setDepth(31);
    track.fillStyle(0x08101d);
    track.fillRoundedRect(x + 56, y + 11, 108, 18, 9);
    track.lineStyle(1, 0x203855, 0.8);
    track.strokeRoundedRect(x + 56, y + 11, 108, 18, 9);

    this._inkFill = this.add.graphics().setScrollFactor(0).setDepth(32);
    this._updateInkBar(1);
  }

  _updateInkBar(ratio) {
    if (!this._inkFill) return;
    this._inkFill.clear();
    const c = Phaser.Math.Clamp(ratio, 0, 1);
    const w = Math.max(0, 104 * c);
    if (w < 2) return;
    const main = c > 0.5 ? 0x1188ee : c > 0.2 ? 0xff9900 : 0xff2222;
    const shine = c > 0.5 ? 0x55ccff : c > 0.2 ? 0xffcc44 : 0xff7755;
    this._inkFill.fillStyle(main);
    this._inkFill.fillRoundedRect(428, 28, w, 14, 7);
    this._inkFill.fillStyle(shine, 0.28);
    this._inkFill.fillRoundedRect(428, 28, w, 6, { tl: 7, tr: 7, bl: 0, br: 0 });
  }

  _onCollision(evt) {
    for (const pair of evt.pairs) {
      const a = pair.bodyA, b = pair.bodyB;
      const labels = [a.label, b.label];
      if (labels.includes('player') && (labels.includes('ground') || labels.includes('wall') || labels.includes('ink'))) {
        const other = a.label === 'player' ? b : a;
        if (other.position.y > this.player.y + 16) this.onGround = true;
      }
      if (labels.includes('player') && labels.includes('workload')) this._resetLevel();
      if (labels.includes('player') && labels.includes('house')) this._winLevel();
    }
  }

  _resetLevel() {
    if (this._winning || this._resetting) return;
    this._resetting = true;
    this.cameras.main.flash(220, 200, 40, 40);
    this.time.delayedCall(320, () => this.scene.restart());
  }

  _winLevel() {
    if (this._winning) return;
    this._winning = true;
    this.matter.body.setVelocity(this.player.body, { x: 0, y: 0 });
    const runStats = computeRunStats(this);

    const nextScene = this.scene.key === 'Level2Scene' ? 'Level3Scene' : 'TitleScene';
    addSettlementWinScreen(this, {
      stats: runStats,
      onPrimary: () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(nextScene));
      },
      onSecondary: () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
      }
    });
  }

  update() {
    this._move();
    if (this.inkSystem) this.inkSystem.update();
    if (this.portalSystem) this.portalSystem.update();
    if (this.guardSystem) this.guardSystem.update();
    this._updatePlayerAnim();
    if (this.workloadSystem) this.workloadSystem.update();
    this._applyConveyors();
    if (this.inkSystem) this._updateInkBar(this.inkSystem.getRatio());

    if (this.player.y > 650) this._resetLevel();
    if (Phaser.Input.Keyboard.JustDown(this.keyR)) this.scene.restart();
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) this.scene.start('TitleScene');
    if (Math.abs(this.player.body.velocity.y) > 1.2) this.onGround = false;
  }

  _updatePlayerAnim() {
    if (!this.playerAnim) return;
    if (this.portalSystem && this.portalSystem.shotCount !== this._lastShot) {
      this._lastShot = this.portalSystem.shotCount;
      this.playerAnim.flashPortal();
    }
    if (this.inkSystem && this.inkSystem.drawing) this.playerAnim.setInk(true);
    this.playerAnim.update(this.game.loop.delta);
  }

  _syncDrops() {
    for (const body of this.matter.world.getAllBodies()) {
      const text = body.plugin && body.plugin.debugText;
      if (!text || text.destroyed) continue;
      text.setPosition(body.position.x, body.position.y);
      text.setRotation(body.angle);
      if (body.plugin.slide && Math.abs(body.velocity.x) < Math.abs(body.plugin.slide) * 0.35) {
        this.matter.body.setVelocity(body, { x: body.plugin.slide, y: body.velocity.y });
      }
    }
  }

  _checkWorkloadHits() {
    const pb = this.player && this.player.body;
    if (!pb || !pb.bounds) return;
    for (const body of this.matter.world.getAllBodies()) {
      if (body.label !== 'workload' || !body.bounds) continue;
      const swept = body.plugin && body.plugin.prevBounds
        ? this._boundsUnion(body.plugin.prevBounds, body.bounds)
        : body.bounds;
      if (this._boundsOverlap(pb.bounds, body.bounds) || this._boundsOverlap(pb.bounds, swept)) {
        this._resetLevel();
        return;
      }
      body.plugin = body.plugin || {};
      body.plugin.prevBounds = this._cloneBounds(body.bounds);
    }
  }

  _boundsOverlap(a, b) {
    return a.min.x <= b.max.x && a.max.x >= b.min.x &&
           a.min.y <= b.max.y && a.max.y >= b.min.y;
  }

  _boundsUnion(a, b) {
    return {
      min: {
        x: Math.min(a.min.x, b.min.x),
        y: Math.min(a.min.y, b.min.y)
      },
      max: {
        x: Math.max(a.max.x, b.max.x),
        y: Math.max(a.max.y, b.max.y)
      }
    };
  }

  _cloneBounds(bounds) {
    return {
      min: { x: bounds.min.x, y: bounds.min.y },
      max: { x: bounds.max.x, y: bounds.max.y }
    };
  }

  _buildConveyors() {
    this._conveyors = [];
    for (const c of this.cfg.conveyors || []) {
      this._conveyors.push(c);
      const g = this.add.graphics().setDepth(2);
      g.fillStyle(0x17283a, 0.72);
      g.fillRect(c.x, c.y, c.w, c.h);
      g.lineStyle(1, 0x6bbcff, 0.65);
      g.strokeRect(c.x, c.y, c.w, c.h);
      g.fillStyle(0x6bbcff, 0.7);
      const arrow = c.speed < 0 ? -1 : 1;
      for (let x = c.x + 18; x < c.x + c.w - 8; x += 34) {
        g.fillTriangle(x - 7 * arrow, c.y + c.h / 2 - 6, x - 7 * arrow, c.y + c.h / 2 + 6, x + 8 * arrow, c.y + c.h / 2);
      }
    }
  }

  // Belt influence is a gentle DRIFT added to the player's own movement (see
  // _move) instead of overwriting velocity — so the player can still walk against
  // the belt, and it no longer feels sticky or too fast.
  _applyConveyors() {
    this._playerBelt = 0;
    if (!this._conveyors || !this._conveyors.length) return;

    const BELT_FACTOR = 0.4;
    const pb = this.player && this.player.body;
    if (pb && pb.bounds) {
      const c = this._beltUnder(pb);
      if (c) this._playerBelt = c.speed * BELT_FACTOR;
    }
    // Loose workload gets a softened push so it still slides off the belt.
    for (const body of this.matter.world.getAllBodies()) {
      if (body.label !== 'workload' || !body.bounds) continue;
      const c = this._beltUnder(body);
      if (c) this.matter.body.setVelocity(body, {
        x: c.speed * 0.6,
        y: body.velocity ? body.velocity.y : 0
      });
    }
  }

  _beltUnder(body) {
    for (const c of this._conveyors) {
      // Extend the belt zone upward so a body standing on top counts as "on belt".
      const zone = { min: { x: c.x, y: c.y - 30 }, max: { x: c.x + c.w, y: c.y + c.h } };
      if (this._boundsOverlap(body.bounds, zone)) return c;
    }
    return null;
  }

  _move() {
    if (this._resetting) return;
    const SPEED = 4.5, JUMP = -14;
    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    const jump = Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
                 Phaser.Input.Keyboard.JustDown(this.keyW) ||
                 Phaser.Input.Keyboard.JustDown(this.cursors.up);

    const belt = this._playerBelt || 0;
    if (left) {
      this.player.setVelocityX(-SPEED + belt);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setVelocityX(SPEED + belt);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(this.player.body.velocity.x * 0.82 + belt);
    }

    if (jump && this.onGround) {
      this.player.setVelocityY(JUMP);
      this.onGround = false;
    }
  }
}
