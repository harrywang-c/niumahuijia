class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    createTextures(this);
    const W = this.scale.width, H = this.scale.height;

    // Sky gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x080820, 0x080820, 0x1a1a4e, 0x1a1a4e, 1);
    bg.fillRect(0, 0, W, H);

    // Stars
    const starGfx = this.add.graphics();
    const rng = new Phaser.Math.RandomDataGenerator(['牛马回家']);
    for (let i = 0; i < 100; i++) {
      const alpha = rng.realInRange(0.3, 0.9);
      const sz = rng.pick([1, 1, 1, 2]);
      starGfx.fillStyle(0xffffff, alpha);
      starGfx.fillRect(rng.integerInRange(0, W), rng.integerInRange(0, H * 0.78), sz, sz);
    }

    // Ground silhouette
    this.add.graphics().fillStyle(0x080814).fillRect(0, H * 0.78, W, H * 0.22);

    // Distant hills silhouette
    const hills = this.add.graphics();
    hills.fillStyle(0x0f0f28);
    hills.fillEllipse(120, H * 0.79, 260, 90);
    hills.fillEllipse(350, H * 0.79, 200, 70);
    hills.fillEllipse(600, H * 0.79, 300, 100);
    hills.fillEllipse(850, H * 0.79, 220, 75);

    // House silhouette (far right, warm glow)
    const hg = this.add.graphics();
    hg.fillStyle(0x151528);
    hg.fillRect(W - 148, H * 0.59, 108, H * 0.19);
    hg.fillTriangle(W - 162, H * 0.60, W - 94, H * 0.41, W - 26, H * 0.60);
    hg.fillStyle(0xffcc44, 0.55); hg.fillRect(W - 132, H * 0.63, 20, 15);
    hg.fillStyle(0xffdd88, 0.35); hg.fillRect(W - 102, H * 0.63, 20, 15);
    // Door glow
    hg.fillStyle(0xffaa22, 0.4); hg.fillRect(W - 110, H * 0.72, 20, H * 0.06);

    // Moon
    const moon = this.add.graphics();
    moon.fillStyle(0xfffff0, 0.9); moon.fillCircle(W * 0.15, H * 0.14, 28);
    moon.fillStyle(0x1a1a4e, 1);  moon.fillCircle(W * 0.15 + 10, H * 0.14 - 5, 22);

    // Title
    const title = this.add.text(W / 2, H * 0.23, '牛马回家', {
      fontSize: '76px', color: '#ffffff', fontFamily: 'serif',
      stroke: '#000022', strokeThickness: 8,
      shadow: { color: '#3344ff', blur: 18, fill: true, offsetX: 0, offsetY: 0 }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title, y: H * 0.23 + 7,
      duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Ink splat decorations
    const splats = this.add.graphics();
    splats.fillStyle(0x111111, 0.55);
    [[80, 340, 14, 0.7], [760, 430, 10, 0.5], [180, 460, 18, 0.65], [650, 310, 12, 0.6]].forEach(([x, y, r, a]) => {
      splats.fillStyle(0x111111, a);
      splats.fillCircle(x, y, r);
      splats.fillEllipse(x + r * 0.8, y + r * 0.5, r * 1.2, r * 0.5);
      splats.fillCircle(x - r * 0.6, y + r * 0.7, r * 0.4);
    });

    // Subtitle
    this.add.text(W / 2, H * 0.39, '用墨水和传送门，找到回家的路', {
      fontSize: '19px', color: '#8899cc', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    // Walking character
    this.walkerX = -60;
    this.walker = this.add.image(this.walkerX, H * 0.725, 'player').setScale(2.5).setDepth(5);

    // Blue portal trace following walker
    this.portalTrail = this.add.graphics().setDepth(4);

    // Start button
    const btnW = 190, btnH = 54, btnX = W / 2 - btnW / 2, btnY = H * 0.70;
    const btnBg = this.add.graphics();
    const drawBtn = (hover) => {
      btnBg.clear();
      btnBg.fillStyle(hover ? 0x3366dd : 0x1a3388, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 14);
      btnBg.lineStyle(2, hover ? 0x99bbff : 0x5577cc);
      btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 14);
    };
    drawBtn(false);

    const btnText = this.add.text(W / 2, btnY + btnH / 2, '开 始 游 戏', {
      fontSize: '28px', color: '#eeeeff', fontFamily: 'monospace'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnText.on('pointerover', () => drawBtn(true));
    btnText.on('pointerout',  () => drawBtn(false));
    btnText.on('pointerup', () => {
      btnText.disableInteractive();
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Level1Scene'));
    });

    // Controls hint
    this.add.text(W / 2, H * 0.9, '← →  移动    Space  跳跃    鼠标左键  画墨水    鼠标右键  射传送门', {
      fontSize: '12px', color: '#44446688', fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(900);
  }

  update() {
    this.walkerX += 0.7;
    if (this.walkerX > this.scale.width + 70) {
      this.walkerX = -70;
      this.portalTrail.clear();
    }
    this.walker.setX(this.walkerX);

    // Leave faint portal ring trail
    if (Math.floor(this.walkerX) % 90 === 0) {
      this.portalTrail.lineStyle(2, 0x4466ff, 0.25);
      this.portalTrail.strokeEllipse(this.walkerX, this.walker.y, 14, 40);
    }
  }
}
