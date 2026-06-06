const GAME_W = 540;
const GAME_H = 1170;
const THEME = MobileTheme.NIGHT_COMMUTE_THEME;
const P = THEME.palette;

class PortraitPuzzleScene extends Phaser.Scene {
  constructor() {
    super('PortraitPuzzleScene');
  }

  preload() {
    this.load.spritesheet('mobile-player', 'assets/generated/horse-worker-game-strip.png', {
      frameWidth: 128,
      frameHeight: 224
    });
    this.load.image('generated-house', 'assets/generated/warm-home.png');
    this.load.image('generated-spike', 'assets/generated/warning-spike.png');
    this.load.image('generated-portal-blue', 'assets/generated/portal-blue.png');
    this.load.image('generated-portal-orange', 'assets/generated/portal-orange.png');
    this.load.image('generated-ui-icons', 'assets/generated/mobile-ui-icons.png');
  }

  create() {
    this.layout = MobileLayout.createMobileLayout(GAME_W, GAME_H);
    this.levelWidth = 1320;
    this.groundY = 820;
    this.maxInk = 380;
    this.usedInk = 0;
    this.tool = 'ink';
    this.portalShot = 0;
    this.portals = [null, null];
    this.portalVisuals = [null, null];
    this.touchControls = TouchControlState.createTouchControlState();
    this.drawing = false;
    this.drawLast = null;
    this.win = false;

    this.input.addPointer(4);
    this._createTextures();
    this._createPlayerAnimations();
    this._buildWorld();
    this._buildPlayer();
    this._buildHud();
    this._bindInput();

    this.cameras.main.setBounds(0, 0, this.levelWidth, GAME_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.06);
    this.cameras.main.setDeadzone(80, 120);
    this.cameras.main.fadeIn(450);
  }

  _createTextures() {
    if (!this.textures.exists('mobile-player')) {
      const p = this.make.graphics({ x: 0, y: 0, add: false });
      p.fillStyle(0x9b6a3e); p.fillRect(8, 2, 17, 15);
      p.fillStyle(0xd3a06a); p.fillRect(10, 13, 13, 8);
      p.fillStyle(0x5a3115); p.fillRect(8, 2, 3, 18);
      p.fillStyle(0xffffff); p.fillRect(12, 7, 4, 4); p.fillRect(19, 7, 4, 4);
      p.fillStyle(0x1b140c); p.fillRect(13, 8, 2, 2); p.fillRect(20, 8, 2, 2);
      p.fillStyle(0xf1f1ff); p.fillRect(9, 22, 17, 16);
      p.fillStyle(0xe0bb56); p.fillRect(7, 25, 3, 8);
      p.fillStyle(0xc72828); p.fillRect(16, 25, 4, 9);
      p.fillStyle(0x212848); p.fillRect(10, 38, 6, 14); p.fillRect(20, 38, 6, 14);
      p.fillStyle(0x101010); p.fillRect(9, 51, 8, 4); p.fillRect(19, 51, 8, 4);
      p.fillStyle(0x2b57c7); p.fillRect(26, 24, 7, 5); p.fillStyle(0x9fcbff); p.fillRect(32, 22, 2, 8);
      p.generateTexture('mobile-player', 36, 56);
      p.destroy();
    }

    const spike = this.make.graphics({ x: 0, y: 0, add: false });
    spike.fillStyle(0xd8d1c3);
    spike.fillTriangle(0, 24, 12, 0, 24, 24);
    spike.fillStyle(0x746f78); spike.fillRect(0, 21, 24, 3);
    spike.fillStyle(P.warning); spike.fillRect(4, 20, 16, 2);
    spike.generateTexture('mobile-spike', 24, 24);
    spike.destroy();

    const house = this.make.graphics({ x: 0, y: 0, add: false });
    house.fillStyle(0x4d2817); house.fillRect(8, 36, 76, 58);
    house.fillStyle(0xc79a62); house.fillRect(14, 42, 64, 50);
    house.fillStyle(0x7f2118); house.fillTriangle(4, 42, 46, 8, 88, 42);
    house.fillStyle(0x3b2115); house.fillRect(43, 62, 18, 30);
    house.fillStyle(P.homeGlow); house.fillRect(20, 52, 18, 16); house.fillRect(62, 52, 12, 16);
    house.fillStyle(0xfff0ad, 0.8); house.fillRect(23, 54, 12, 6); house.fillRect(64, 54, 8, 6);
    house.generateTexture('mobile-house', 92, 96);
    house.destroy();
  }

  _createPlayerAnimations() {
    if (this.anims.exists('player-walk')) return;
    this.anims.create({
      key: 'player-walk',
      frames: this.anims.generateFrameNumbers('mobile-player', { frames: [1, 2, 3, 2] }),
      frameRate: 8,
      repeat: -1
    });
  }

  _buildWorld() {
    this.physics.world.setBounds(0, 0, this.levelWidth, GAME_H);
    this.solids = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();

    this._background();
    this._platform(0, this.groundY, 245, 90);
    this._platform(430, this.groundY, 260, 90);
    this._platform(840, this.groundY, 460, 90);
    this._platform(562, this.groundY - 112, 96, 28, 0x4a5968);
    this._wall(705, this.groundY - 160, 48, 250);
    this._spikeRow(256, this.groundY - 14, 6);

    this.portalPads = [
      { x: 680, y: this.groundY - 128, nx: -1, ny: 0 },
      { x: 820, y: this.groundY - 128, nx: 1, ny: 0 }
    ];
    this._drawPortalPads();

    this._homeGlow(1195, this.groundY - 64);
    this.house = this.add.image(1195, this.groundY - 68, 'generated-house').setScale(0.26).setDepth(4);
    this.houseTrigger = this.add.zone(1190, this.groundY - 42, 52, 74);
    this.physics.add.existing(this.houseTrigger, true);

    this.add.text(94, 292, '画桥', this._tipStyle()).setOrigin(0.5);
    this.add.text(610, 430, '开门', this._tipStyle()).setOrigin(0.5);
    this.add.text(1110, 622, '回家', this._tipStyle()).setOrigin(0.5);
  }

  _background() {
    const sky = this.add.graphics().setScrollFactor(0).setDepth(-10);
    sky.fillGradientStyle(P.skyTop, P.skyTop, P.skyBottom, P.skyBottom, 1);
    sky.fillRect(0, 0, GAME_W, GAME_H);

    const stars = this.add.graphics().setScrollFactor(0).setDepth(-9);
    const rng = new Phaser.Math.RandomDataGenerator(['night-commute']);
    for (let i = 0; i < 75; i++) {
      stars.fillStyle(0xfff4d1, rng.realInRange(0.22, 0.82));
      stars.fillRect(rng.integerInRange(18, GAME_W - 18), rng.integerInRange(46, 370), rng.pick([1, 1, 2]), rng.pick([1, 1, 2]));
    }
    stars.fillStyle(P.homeGlow, 0.35);
    stars.fillCircle(438, 118, 30);
    stars.fillStyle(P.skyTop, 1);
    stars.fillCircle(426, 109, 27);

    const mts = this.add.graphics().setScrollFactor(0.12).setDepth(-8);
    mts.fillStyle(P.mountainFar);
    for (let x = -80; x < 980; x += 210) {
      mts.fillTriangle(x, 625, x + 110, 420 + (x % 3) * 20, x + 240, 625);
    }
    mts.fillStyle(P.mountainNear);
    for (let x = 0; x < 1080; x += 260) {
      mts.fillTriangle(x - 90, 700, x + 90, 485 + (x % 2) * 26, x + 280, 700);
    }

    const haze = this.add.graphics().setScrollFactor(0.22).setDepth(-7);
    haze.fillStyle(0x91a7c4, 0.16);
    [[80, 190], [310, 245], [515, 168], [760, 222]].forEach(([x, y]) => {
      haze.fillEllipse(x, y, 150, 42);
      haze.fillEllipse(x + 46, y - 13, 82, 30);
      haze.fillEllipse(x - 38, y - 8, 64, 28);
    });

    const city = this.add.graphics().setScrollFactor(0.32).setDepth(-6);
    city.fillStyle(P.city);
    for (let x = -40; x < 1100; x += 76) {
      const top = 650 - (Math.abs(x) % 5) * 18;
      city.fillRect(x, top, 48, 180);
      city.fillStyle(P.homeGlow, 0.45);
      for (let y = top + 22; y < top + 95; y += 28) {
        if ((x + y) % 3 !== 0) city.fillRect(x + 12, y, 6, 9);
        if ((x + y) % 4 !== 0) city.fillRect(x + 29, y, 6, 9);
      }
      city.fillStyle(P.city);
    }
    const roadGlow = this.add.graphics().setScrollFactor(0.45).setDepth(-5);
    roadGlow.fillStyle(P.homeGlow, 0.09);
    roadGlow.fillRect(0, this.groundY - 34, this.levelWidth, 48);
  }

  _platform(left, top, width, height, color = 0x704422) {
    const body = this.add.rectangle(left + width / 2, top + height / 2, width, height, color === 0x704422 ? P.ground : color).setDepth(1);
    this.physics.add.existing(body, true);
    this.solids.add(body);

    this.add.rectangle(left + width / 2, top + height - 8, width, 16, P.groundDark).setDepth(2);
    const grass = this.add.rectangle(left + width / 2, top + 7, width, 14, 0x2f5b54).setDepth(2);
    for (let x = left + 8; x < left + width; x += 18) {
      this.add.rectangle(x, top + 3, 5, 8, 0xa2c36e).setDepth(3);
    }
    return grass;
  }

  _wall(left, top, width, height) {
    const wall = this.add.rectangle(left + width / 2, top + height / 2, width, height, 0x3d4659).setDepth(2);
    this.physics.add.existing(wall, true);
    this.solids.add(wall);
    for (let y = top + 14; y < top + height; y += 32) {
      this.add.rectangle(left + width / 2, y, width - 8, 3, 0x20283b).setDepth(3);
    }
  }

  _spikeRow(x, y, count) {
    for (let i = 0; i < count; i++) {
      const spike = this.add.image(x + i * 24, y + 2, 'generated-spike').setScale(0.048).setDepth(3);
      this.physics.add.existing(spike, true);
      spike.body.setSize(18, 16).setOffset(3, 8);
      this.spikes.add(spike);
    }
  }

  _drawPortalPads() {
    this.padGfx = this.add.graphics().setDepth(5);
    for (const pad of this.portalPads) {
      this.padGfx.fillStyle(P.portalBlue, 0.08);
      this.padGfx.fillEllipse(pad.x, pad.y, 56, 112);
      this.padGfx.lineStyle(3, P.portalBlue, 0.86);
      this.padGfx.strokeEllipse(pad.x, pad.y, 42, 96);
      this.padGfx.lineStyle(1, P.text, 0.45);
      this.padGfx.strokeEllipse(pad.x, pad.y, 25, 70);
    }
  }

  _homeGlow(x, y) {
    const glow = this.add.graphics().setDepth(3);
    glow.fillStyle(P.homeGlow, 0.18);
    glow.fillCircle(x, y, 96);
    glow.fillStyle(P.homeGlow, 0.12);
    glow.fillCircle(x, y, 150);
  }

  _buildPlayer() {
    this.player = this.physics.add.sprite(84, this.groundY - 58, 'mobile-player', 0)
      .setDepth(8)
      .setScale(0.48)
      .setCollideWorldBounds(true);
    this.player.body.setSize(52, 132).setOffset(38, 82);
    this.physics.add.collider(this.player, this.solids);
    this.physics.add.overlap(this.player, this.spikes, () => this._reset());
    this.physics.add.overlap(this.player, this.houseTrigger, () => this._complete());
    this.keys = this.input.keyboard.createCursorKeys();
  }

  _buildHud() {
    this.hud = this.add.graphics().setScrollFactor(0).setDepth(30);
    this.inkText = this.add.text(24, 30, '', {
      fontSize: '18px',
      color: '#fff0c2',
      fontFamily: 'monospace',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(31);
    this.toolText = this.add.text(GAME_W / 2, 30, '', {
      fontSize: '16px',
      color: '#fff0c2',
      fontFamily: 'monospace',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(31);
    this.buttonLabels = {};
    for (const [name, label] of Object.entries({ left: '<', right: '>', jump: '跳', ink: '墨', portal: '门' })) {
      const c = this.layout.buttons[name];
      this.buttonLabels[name] = this.add.text(c.x, c.y, label, {
        fontSize: name === 'portal' || name === 'ink' ? '18px' : '24px',
        color: '#121624',
        fontFamily: 'monospace',
        fontStyle: 'bold'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(31);
    }
    this.winText = null;
    this._drawHud();
  }

  _bindInput() {
    this.input.on('pointerdown', (ptr) => {
      const control = this.layout.getControlAt(ptr.x, ptr.y);
      if (control) {
        this._pressControl(ptr.id, control);
        return;
      }
      if (!this.layout.isPlayArea(ptr.x, ptr.y) || this.win) return;
      if (this.tool === 'ink') this._startInk(ptr);
      if (this.tool === 'portal') this._shootPortal(ptr);
    });

    this.input.on('pointermove', (ptr) => {
      if (this.drawing) this._continueInk(ptr);
    });

    this.input.on('pointerup', (ptr) => {
      this._releaseControl(ptr.id);
      if (this.drawing) this._endInk();
    });

    this.input.keyboard.on('keydown-ONE', () => { this.tool = 'ink'; this._drawHud(); });
    this.input.keyboard.on('keydown-TWO', () => { this.tool = 'portal'; this._drawHud(); });
  }

  _pressControl(pointerId, control) {
    if (control === 'left' || control === 'right' || control === 'jump') {
      this.touchControls.press(pointerId, control);
    }
    if (control === 'ink' || control === 'portal') this.tool = control;
    this._drawHud();
  }

  _releaseControl(pointerId) {
    const released = this.touchControls.release(pointerId);
    if (released) this._drawHud();
  }

  _startInk(ptr) {
    if (this.usedInk >= this.maxInk) return;
    const p = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
    this.drawing = true;
    this.drawLast = p;
    this._inkTile(p.x, p.y);
  }

  _continueInk(ptr) {
    if (!this.layout.isPlayArea(ptr.x, ptr.y)) {
      this._endInk();
      return;
    }
    const p = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
    const dist = Phaser.Math.Distance.Between(this.drawLast.x, this.drawLast.y, p.x, p.y);
    if (dist < 13) return;
    const steps = Math.floor(dist / 13);
    for (let i = 1; i <= steps; i++) {
      if (this.usedInk >= this.maxInk) {
        this._endInk();
        return;
      }
      const t = i / steps;
      const x = Phaser.Math.Linear(this.drawLast.x, p.x, t);
      const y = Phaser.Math.Linear(this.drawLast.y, p.y, t);
      this._inkTile(x, y);
      this.usedInk = Math.min(this.maxInk, this.usedInk + 13);
    }
    this.drawLast = p;
    this._drawHud();
  }

  _endInk() {
    this.drawing = false;
    this.drawLast = null;
  }

  _inkTile(x, y) {
    const tile = this.add.rectangle(x, y, 20, 16, 0x090909).setDepth(6);
    this.physics.add.existing(tile, true);
    tile.body.setSize(20, 16);
    this.solids.add(tile);
    this.add.circle(x + Phaser.Math.Between(-5, 5), y + Phaser.Math.Between(-4, 4), Phaser.Math.Between(2, 4), P.ink, 0.42).setDepth(7);
  }

  _shootPortal(ptr) {
    const p = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
    let best = null;
    let bestDist = Infinity;
    for (const pad of this.portalPads) {
      const d = Phaser.Math.Distance.Between(p.x, p.y, pad.x, pad.y);
      if (d < bestDist) {
        bestDist = d;
        best = pad;
      }
    }
    if (!best || bestDist > 180) return;

    const idx = this.portalShot % 2;
    this.portalShot++;
    this._placePortal(idx, best);
  }

  _placePortal(idx, pad) {
    if (this.portalVisuals[idx]) this.portalVisuals[idx].destroy();
    const key = idx === 0 ? 'generated-portal-blue' : 'generated-portal-orange';
    this.portalVisuals[idx] = this.add.image(pad.x, pad.y, key).setScale(0.18).setDepth(7);
    this.portals[idx] = { x: pad.x, y: pad.y, nx: pad.nx, ny: pad.ny };
    this.cameras.main.flash(80, idx === 0 ? 40 : 255, idx === 0 ? 110 : 120, idx === 0 ? 255 : 30);
    this._drawHud();
  }

  _tryTeleport() {
    if (!this.portals[0] || !this.portals[1] || this.teleportLock) return;
    for (let i = 0; i < 2; i++) {
      const p = this.portals[i];
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, p.x, p.y) < 44) {
        const other = this.portals[1 - i];
        this.teleportLock = true;
        this.time.delayedCall(650, () => { this.teleportLock = false; });
        this.player.setPosition(other.x + other.nx * 52, other.y + other.ny * 8);
        this.player.setVelocity(other.nx * 260, -80);
        this.cameras.main.flash(120, 80, 60, 220);
        break;
      }
    }
  }

  _drawHud() {
    this.hud.clear();
    this.hud.fillStyle(P.panel, 0.76).fillRoundedRect(16, 18, 182, 48, 8);
    this.hud.lineStyle(2, 0x314061, 0.9).strokeRoundedRect(16, 18, 182, 48, 8);
    this.hud.fillStyle(P.ink).fillRoundedRect(78, 37, 108, 10, 3);
    const ratio = Phaser.Math.Clamp(1 - this.usedInk / this.maxInk, 0, 1);
    this.hud.fillStyle(ratio > 0.28 ? 0xd8d0be : P.warning).fillRoundedRect(80, 39, 104 * ratio, 6, 2);
    this.hud.fillStyle(P.ink).fillCircle(44, 42, 12);
    this.hud.fillStyle(P.text, 0.88).fillRect(38, 29, 12, 7);
    this.inkText.setText(`${Math.round(ratio * 100)}%`);

    this.hud.fillStyle(P.panel, 0.64).fillRoundedRect(222, 18, 156, 48, 8);
    this.hud.lineStyle(2, this.tool === 'ink' ? P.ink : P.portalBlue, 0.78).strokeRoundedRect(222, 18, 156, 48, 8);
    this.toolText.setText(this.tool === 'ink' ? '墨水' : 'Portal');

    const shadeTop = this.layout.controls.top;
    this.hud.fillGradientStyle(0x111827, 0x111827, 0x070a14, 0x070a14, 0.22, 0.22, 0.92, 0.92);
    this.hud.fillRect(0, shadeTop, GAME_W, this.layout.controls.height);
    this.hud.lineStyle(2, 0x3a4660, 0.5).lineBetween(0, shadeTop, GAME_W, shadeTop);
    this._drawButton('left', '<');
    this._drawButton('right', '>');
    this._drawButton('jump', '↑');
    this._drawButton('ink', '墨', this.tool === 'ink');
    this._drawButton('portal', '门', this.tool === 'portal');
  }

  _drawButton(name, label, selected = false) {
    const c = this.layout.buttons[name];
    const active = this.touchControls.isDown(name) || selected;
    this.hud.fillStyle(0x000000, 0.22);
    this.hud.fillCircle(c.x + 4, c.y + 6, c.r);
    this.hud.fillStyle(active ? P.buttonActive : P.button, active ? 0.96 : 0.72);
    this.hud.fillCircle(c.x, c.y, c.r);
    this.hud.lineStyle(3, active ? P.homeGlow : 0x5c667d, 0.9);
    this.hud.strokeCircle(c.x, c.y, c.r);
    if (name === 'portal') {
      this.hud.lineStyle(3, P.portalBlue, 0.75).strokeEllipse(c.x, c.y, c.r * 0.7, c.r * 1.12);
      this.hud.lineStyle(3, P.portalOrange, 0.75).strokeEllipse(c.x + 5, c.y, c.r * 0.7, c.r * 1.12);
    } else if (name === 'ink') {
      this.hud.fillStyle(P.ink, 1).fillRoundedRect(c.x - 12, c.y - 18, 24, 34, 5);
      this.hud.fillStyle(P.text, 0.9).fillRect(c.x - 8, c.y - 28, 16, 10);
    }
    if (this.buttonLabels && this.buttonLabels[name]) {
      this.buttonLabels[name].setText(name === 'ink' || name === 'portal' ? '' : label);
    }
  }

  _tipStyle() {
    return {
      fontSize: '18px',
      color: '#fff0c2',
      fontFamily: 'monospace',
      backgroundColor: '#101827cc',
      padding: { x: 10, y: 7 }
    };
  }

  _reset() {
    if (this.win) return;
    this.cameras.main.flash(180, 180, 40, 40);
    this.time.delayedCall(260, () => this.scene.restart());
  }

  _complete() {
    if (this.win) return;
    this.win = true;
    this.player.setVelocity(0, 0);
    this.cameras.main.flash(160, 255, 245, 190);
    this.winText = this.add.text(this.player.x, 260, '回家了！\n竖屏 Demo 完成', {
      fontSize: '34px',
      color: '#17130c',
      fontFamily: 'serif',
      fontStyle: 'bold',
      align: 'center',
      backgroundColor: '#fff4d9dd',
      padding: { x: 18, y: 14 }
    }).setOrigin(0.5).setDepth(40);
  }

  update() {
    if (this.win) return;
    const left = this.touchControls.isDown('left') || this.keys.left.isDown;
    const right = this.touchControls.isDown('right') || this.keys.right.isDown;
    const jump = this.touchControls.isDown('jump') || this.keys.up.isDown || this.keys.space.isDown;
    const speed = 210;

    if (left) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      if (this.player.body.blocked.down) this.player.play('player-walk', true);
    } else if (right) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
      if (this.player.body.blocked.down) this.player.play('player-walk', true);
    } else {
      this.player.setVelocityX(this.player.body.velocity.x * 0.76);
      if (this.player.body.blocked.down) {
        this.player.stop();
        this.player.setFrame(0);
      }
    }

    if (jump && this.player.body.blocked.down) {
      this.player.setVelocityY(-560);
    }
    if (!this.player.body.blocked.down && this.player.body.velocity.y < -20) {
      this.player.stop();
      this.player.setFrame(4);
    }

    if (this.player.y > this.layout.controls.top + 30) this._reset();
    this._tryTeleport();
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game-shell',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#070a1f',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1380 },
      debug: false
    }
  },
  scene: [PortraitPuzzleScene]
};

window._portraitDemo = new Phaser.Game(config);
