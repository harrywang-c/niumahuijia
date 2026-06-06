class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  preload() {
    this.load.image('conceptArt', 'docs/concept-art-reference.png');
  }

  create() {
    createTextures(this);
    const W = this.scale.width, H = this.scale.height;
    const CHS = '"Microsoft YaHei","PingFang SC",Arial,sans-serif';

    // ── Concept art — full-screen background ──────────────────────────────────
    if (this.textures.exists('conceptArt')) {
      this.add.image(W / 2, H / 2, 'conceptArt')
        .setDisplaySize(W, H)
        .setDepth(0);
    } else {
      // Fallback: dark gradient if image fails to load
      const bg = this.add.graphics().setDepth(0);
      bg.fillGradientStyle(0x080820, 0x080820, 0x1a1a4e, 0x1a1a4e, 1);
      bg.fillRect(0, 0, W, H);
    }

    // Gradient vignette — darken edges so text is always readable
    const vignette = this.add.graphics().setDepth(1);
    // Bottom half dark gradient for button/controls readability
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.72, 0.72);
    vignette.fillRect(0, H * 0.5, W, H * 0.5);
    // Top edge darkening for title readability
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.55, 0.55, 0, 0);
    vignette.fillRect(0, 0, W, H * 0.35);
    // Side edges
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.3, 0, 0.3, 0);
    vignette.fillRect(0, 0, W * 0.18, H);
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0.3, 0, 0.3);
    vignette.fillRect(W * 0.82, 0, W * 0.18, H);

    // ── Title ──────────────────────────────────────────────────────────────────
    const title = this.add.text(W / 2, H * 0.17, '牛马回家', {
      fontSize: '82px',
      color: '#ffffff',
      fontFamily: CHS,
      stroke: '#000022',
      strokeThickness: 10,
      shadow: { color: '#2244ff', blur: 28, fill: true, offsetX: 0, offsetY: 0 }
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: title, y: H * 0.17 + 8,
      duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Subtitle
    this.add.text(W / 2, H * 0.34, '用墨水和传送门，找到回家的路', {
      fontSize: '19px', color: '#b8ccee',
      fontFamily: CHS,
      stroke: '#000', strokeThickness: 3,
      shadow: { color: '#000022', blur: 8, fill: true }
    }).setOrigin(0.5).setDepth(10);

    // ── Start button ───────────────────────────────────────────────────────────
    const btnW = 200, btnH = 58, btnX = W / 2 - btnW / 2, btnY = H * 0.68;
    const btnBg = this.add.graphics().setDepth(10);

    const drawBtn = (hover) => {
      btnBg.clear();
      // Glow
      if (hover) {
        btnBg.fillStyle(0x4477ff, 0.22);
        btnBg.fillRoundedRect(btnX - 6, btnY - 6, btnW + 12, btnH + 12, 18);
      }
      // Body
      btnBg.fillStyle(hover ? 0x2255cc : 0x0d2266, hover ? 0.95 : 0.88);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 14);
      // Top shine
      btnBg.fillStyle(0xffffff, hover ? 0.15 : 0.08);
      btnBg.fillRoundedRect(btnX + 4, btnY + 4, btnW - 8, btnH * 0.4, { tl: 12, tr: 12, bl: 0, br: 0 });
      // Border
      btnBg.lineStyle(1.5, hover ? 0x88aaff : 0x3355aa, 0.9);
      btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 14);
    };
    drawBtn(false);

    const btnText = this.add.text(W / 2, btnY + btnH / 2, '下 班 回 家', {
      fontSize: '30px', color: '#eeeeff',
      fontFamily: CHS, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });

    btnText.on('pointerover', () => drawBtn(true));
    btnText.on('pointerout',  () => drawBtn(false));
    btnText.on('pointerup', () => {
      btnText.disableInteractive();
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TutorialScene'));
    });

    // Pulse the button gently
    this.tweens.add({
      targets: btnText, y: btnY + btnH / 2 - 3,
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    const makeDebugButton = (x, y, label, sceneKey) => {
      const bg = this.add.graphics().setDepth(10);
      const draw = (hover) => {
        bg.clear();
        bg.fillStyle(hover ? 0x3a4f7a : 0x101b33, hover ? 0.9 : 0.76);
        bg.fillRoundedRect(x - 76, y - 17, 152, 34, 8);
        bg.lineStyle(1, hover ? 0x9bbcff : 0x3f5f88, 0.75);
        bg.strokeRoundedRect(x - 76, y - 17, 152, 34, 8);
      };
      draw(false);

      const t = this.add.text(x, y, label, {
        fontSize: '15px',
        color: '#dbe8ff',
        fontFamily: CHS,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });

      t.on('pointerover', () => draw(true));
      t.on('pointerout', () => draw(false));
      t.on('pointerup', () => {
        t.disableInteractive();
        this.cameras.main.fadeOut(260, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(sceneKey));
      });
    };

    makeDebugButton(W / 2 - 86, H * 0.815, '调试第2关', 'Level2Scene');
    makeDebugButton(W / 2 + 86, H * 0.815, '调试第3关', 'Level3Scene');

    // ── Controls hint ──────────────────────────────────────────────────────────
    this.add.text(W / 2, H * 0.9,
      '← →  移动    Space  跳跃    鼠标左键  画墨水    鼠标右键  射传送门', {
      fontSize: '12px', color: '#88aacc99', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(10);

    // Walking character (subtle, bottom of screen)
    this.walkerX = -60;
    this.walker = this.add.image(this.walkerX, H * 0.79, 'player')
      .setScale(2.2).setDepth(9).setAlpha(0.75);

    this.cameras.main.fadeIn(900);
  }

  update() {
    this.walkerX += 0.65;
    if (this.walkerX > this.scale.width + 70) this.walkerX = -70;
    this.walker.setX(this.walkerX);
  }
}
