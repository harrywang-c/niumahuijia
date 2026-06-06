class TutorialScene extends Phaser.Scene {
  constructor() { super('TutorialScene'); }

  preload() {
    preloadUiArt(this);
    preloadGameAssets(this);
  }

  create() {
    createTextures(this);
    createGameAnimations(this);
    this.LEVEL_WIDTH = 2300;
    this.GROUND_Y = 440;
    this._winning = false;
    this._resetting = false;
    this.onGround = false;
    this._startTime = this.time.now;

    this.matter.world.setBounds(0, 0, this.LEVEL_WIDTH, 700);
    this.matter.world.on('collisionstart', this._onCollision.bind(this));
    this.matter.world.on('collisionactive', this._onCollision.bind(this));

    this._buildBackground();
    this._buildPlatforms();
    this._buildPortalPractice();
    this._buildHouse();
    this._buildPlayer();

    this.input.mouse.disableContextMenu();
    this.inkSystem = new InkSystem(this, 520);
    this.portalSystem = new PortalSystem(this);
    // One gentle, well-telegraphed drop to teach "watch the sky".
    this.workloadSystem = new WorkloadSystem(this, [
      { x: 900, landY: 440, w: 56, h: 46, text: 'KPI', every: 3600, delay: 1800, warn: 1200 },
    ]);

    this.cameras.main.setBounds(0, 0, this.LEVEL_WIDTH, 600);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.fadeIn(700);

    this._buildHUD();
    this._buildTutorial();
  }

  _buildBackground() {
    const GY = this.GROUND_Y, LW = this.LEVEL_WIDTH;
    addRainCityBackdrop(this);
    const gfill = this.add.graphics().setDepth(-4);
    gfill.fillStyle(0x111114, 0.92);
    gfill.fillRect(0, GY + 70, LW, 280);
  }

  _buildPlatforms() {
    const GY = this.GROUND_Y;
    const platforms = [
      [0, GY, 420, 128],
      [500, GY - 62, 160, 40],
      [720, GY, 360, 128],
      [1160, GY, 240, 128],
      [1580, GY, 720, 128],
    ];

    for (const [x, y, w, h] of platforms) {
      this._drawPlatform(x, y, w, h);
      this.matter.add.rectangle(x + w / 2, y + h / 2, w, h, {
        isStatic: true,
        label: 'ground',
        friction: 0.6,
        restitution: 0
      });
    }

    this._addPitSensor(420, 660);
    this._addPitSensor(1080, 1580);
  }

  _drawPlatform(px, py, pw, ph) {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x151417);
    g.fillRect(px, py, pw, ph);
    g.fillStyle(0x3d3b3d);
    g.fillRect(px, py + 12, pw, ph - 12);
    g.fillStyle(0x2f3032);
    g.fillRect(px, py, pw, 10);
    g.fillStyle(0xd1a343, 0.5);
    g.fillRect(px + 4, py + 2, pw - 8, 3);
    g.fillStyle(0x000000, 0.18);
    g.fillRect(px, py, 4, ph);
    g.fillRect(px + pw - 4, py, 4, ph);
  }

  _addPitSensor(left, right) {
    const width = right - left;
    this.matter.add.rectangle(left + width / 2, this.GROUND_Y + 64, width, 20, {
      isStatic: true,
      isSensor: true,
      label: 'pit'
    });
  }

  _buildPortalPractice() {
    this._addPortalPad(1220, 0);
    this._addPortalPad(1680, 1);
  }

  _addPortalPad(x, portalIdx) {
    const color = portalIdx === 0 ? 0x2266ff : 0xff7700;
    const hexCol = portalIdx === 0 ? '#4488ff' : '#ff8800';
    const GY = this.GROUND_Y;

    const beam = this.add.graphics().setDepth(2);
    beam.fillStyle(color, 0.06);
    beam.fillRect(x - 18, GY - 160, 36, 160);
    beam.fillStyle(color, 0.16);
    beam.fillRect(x - 8, GY - 160, 16, 160);
    this.tweens.add({ targets: beam, alpha: 0.42, duration: 900, yoyo: true, repeat: -1 });

    const pad = this.add.graphics().setDepth(3);
    pad.fillStyle(color, 0.34);
    pad.fillRect(x - 30, GY - 6, 60, 6);
    pad.lineStyle(2, color, 0.9);
    pad.strokeRect(x - 30, GY - 6, 60, 6);

    this.add.text(x, GY - 34, portalIdx === 0 ? '蓝门' : '橙门', {
      fontSize: '13px',
      color: hexCol,
      fontFamily: '"Microsoft YaHei","PingFang SC",Arial,sans-serif',
      stroke: '#001020',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(4);
  }

  _buildHouse() {
    const GY = this.GROUND_Y;
    this.add.image(2140, GY - 44, 'house').setScale(1.7).setDepth(4);
    this.matter.add.rectangle(2110, GY - 18, 48, 76, {
      isStatic: true,
      isSensor: true,
      label: 'houseTrigger'
    });

    const mat = this.add.graphics().setDepth(3);
    mat.fillStyle(0x885533);
    mat.fillRect(2092, GY - 2, 44, 10);
    mat.fillStyle(0xcc8844, 0.5);
    for (let i = 0; i < 4; i++) mat.fillRect(2094 + i * 10, GY, 6, 8);
  }

  _buildPlayer() {
    this.player = addPlayerSprite(this, 82, this.GROUND_Y - 60, { depth: 9 });
    this.playerAnim = new PlayerAnim(this, this.player);
    this._lastShot = 0;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  }

  _onCollision(event) {
    for (const { bodyA, bodyB } of event.pairs) {
      const a = bodyA.label, b = bodyB.label;
      if (a !== 'player' && b !== 'player') continue;

      if (a === 'ground' || b === 'ground' || a === 'ink' || b === 'ink') this.onGround = true;
      if (a === 'pit' || b === 'pit') this._resetLevel();
      if (a === 'houseTrigger' || b === 'houseTrigger') this._finishTutorial();
    }
  }

  _buildHUD() {
    const CHS = '"Microsoft YaHei","PingFang SC",Arial,sans-serif';
    const panel = this.add.graphics().setScrollFactor(0).setDepth(20);
    panel.fillStyle(0x060c1a, 0.78);
    panel.fillRoundedRect(6, 6, 302, 74, 12);
    panel.lineStyle(1, 0x2d4a7a, 0.6);
    panel.strokeRoundedRect(6, 6, 302, 74, 12);

    this.add.text(22, 14, '教程关', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: CHS,
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(21);

    this.add.text(22, 44, '目标：走到家里面', {
      fontSize: '15px',
      color: '#cce4ff',
      fontFamily: CHS
    }).setScrollFactor(0).setDepth(21);

    this._inkFill = this.add.graphics().setScrollFactor(0).setDepth(22);
    this.add.text(820, 18, '墨量', {
      fontSize: '13px',
      color: '#4a88bb',
      fontFamily: CHS,
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(21);

    const track = this.add.graphics().setScrollFactor(0).setDepth(21);
    track.fillStyle(0x080f20);
    track.fillRoundedRect(820, 40, 126, 16, 8);
    track.lineStyle(1, 0x1a2e4a, 1);
    track.strokeRoundedRect(820, 40, 126, 16, 8);
    this._updateInkBar(1);
  }

  _updateInkBar(ratio) {
    this._inkFill.clear();
    const c = Phaser.Math.Clamp(ratio, 0, 1);
    const w = Math.max(0, 122 * c);
    if (w < 2) return;
    this._inkFill.fillStyle(c > 0.25 ? 0x1188ee : 0xff2222);
    this._inkFill.fillRoundedRect(822, 42, w, 12, 6);
    this._inkFill.fillStyle(0x55ccff, 0.28);
    this._inkFill.fillRoundedRect(822, 42, w, 5, { tl: 6, tr: 6, bl: 0, br: 0 });
  }

  _buildTutorial() {
    const GY = this.GROUND_Y;
    this._tips = [
      {
        triggerX: 0,
        x: 120,
        y: GY - 100,
        text: '目标：走到家里面\n先用 A/D 或 ← → 左右移动'
      },
      {
        triggerX: 310,
        x: 480,
        y: GY - 150,
        text: '按 Space 或 ↑ 跳跃\n跳上这个小台阶'
      },
      {
        triggerX: 640,
        x: 780,
        y: GY - 110,
        text: '鼠标左键拖拽画墨水\n把墨水当桥走过去'
      },
      {
        triggerX: 820,
        x: 980,
        y: GY - 150,
        text: '小心头顶！KPI 会砸下来\n看到红框就躲开'
      },
      {
        triggerX: 1080,
        x: 1250,
        y: GY - 130,
        text: '鼠标右键射传送门\n先点蓝色光柱，再点远处橙色光柱'
      },
      {
        triggerX: 1580,
        x: 1780,
        y: GY - 110,
        text: '走进蓝门，会从橙门出来\n最后一直往右回家'
      },
    ];
    this._tipIndex = -1;
    this._tipContainer = null;
    this._showTip(0);
  }

  _showTip(idx) {
    if (this._tipContainer) this._tipContainer.destroy();
    if (idx >= this._tips.length) return;
    this._tipIndex = idx;

    const tip = this._tips[idx];
    const CHS = '"Microsoft YaHei","PingFang SC",Arial,sans-serif';
    const lines = tip.text.split('\n').length;
    const TW = 292, TH = 24 + lines * 24;
    const container = this.add.container(tip.x, tip.y - TH - 18).setDepth(16);
    this._tipContainer = container;

    const bg = this.add.graphics();
    bg.fillStyle(0x060d1e, 0.92);
    bg.fillRoundedRect(-TW / 2, 0, TW, TH, 10);
    bg.lineStyle(1.5, 0x4488ff, 0.75);
    bg.strokeRoundedRect(-TW / 2, 0, TW, TH, 10);
    bg.lineStyle(2.5, 0x4488ff, 1);
    bg.beginPath();
    bg.moveTo(-TW / 2 + 14, 1);
    bg.lineTo(TW / 2 - 14, 1);
    bg.strokePath();

    const label = this.add.text(0, TH / 2, tip.text, {
      fontSize: '15px',
      color: '#cce4ff',
      fontFamily: CHS,
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5);

    const arrow = this.add.graphics();
    arrow.fillStyle(0x4488ff, 1);
    arrow.fillTriangle(-9, TH + 3, 9, TH + 3, 0, TH + 15);

    container.add([bg, label, arrow]);
    this.tweens.add({
      targets: container,
      y: container.y - 8,
      duration: 950,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  _checkTutorial() {
    if (this._tipIndex >= this._tips.length - 1) return;
    const next = this._tips[this._tipIndex + 1];
    if (this.player.x > next.triggerX) this._showTip(this._tipIndex + 1);
  }

  _resetLevel() {
    if (this._winning || this._resetting) return;
    this._resetting = true;
    this.cameras.main.flash(220, 200, 40, 40);
    this.time.delayedCall(380, () => this.scene.restart());
  }

  _finishTutorial() {
    if (this._winning) return;
    this._winning = true;
    this.inkSystem.drawing = false;
    this.matter.body.setVelocity(this.player.body, { x: 0, y: 0 });
    const runStats = computeRunStats(this);

    this.cameras.main.flash(160, 255, 245, 190);
    this.time.delayedCall(420, () => {
      addSettlementWinScreen(this, {
        stats: runStats,
        onPrimary: () => {
          this.cameras.main.fadeOut(400, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Level1Scene'));
        },
        onSecondary: () => {
          this.cameras.main.fadeOut(400, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
        }
      });
    });
  }

  update() {
    this._move();
    if (this.inkSystem) this.inkSystem.update();
    if (this.portalSystem) this.portalSystem.update();
    if (this.workloadSystem) this.workloadSystem.update();
    if (this.playerAnim) {
      if (this.portalSystem && this.portalSystem.shotCount !== this._lastShot) {
        this._lastShot = this.portalSystem.shotCount;
        this.playerAnim.flashPortal();
      }
      if (this.inkSystem && this.inkSystem.drawing) this.playerAnim.setInk(true);
      this.playerAnim.update(this.game.loop.delta);
    }
    if (this._inkFill && this.inkSystem) this._updateInkBar(this.inkSystem.getRatio());
    this._checkTutorial();

    if (this.player.y > 640) this._resetLevel();
    if (Math.abs(this.player.body.velocity.y) > 1.2) this.onGround = false;
  }

  _move() {
    if (this._winning || this._resetting) return;
    const SPEED = 4.5, JUMP = -14;
    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    const jump = Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
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
