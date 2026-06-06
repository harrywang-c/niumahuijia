class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  preload() {
    preloadUiArt(this);
    preloadGameAssets(this);
  }

  create() {
    createTextures(this);
    const W = this.scale.width, H = this.scale.height;
    const CHS = '"Microsoft YaHei","PingFang SC",Arial,sans-serif';

    addTitleScreenArt(this);

    addTitleStartHotspot(this, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TutorialScene'));
    });

    const makeDebugButton = (x, y, label, sceneKey) => {
      const bg = this.add.graphics().setDepth(10);
      const draw = (hover) => {
        bg.clear();
        bg.fillStyle(hover ? 0x3b2b16 : 0x120f0d, hover ? 0.92 : 0.72);
        bg.fillRoundedRect(x - 58, y - 15, 116, 30, 8);
        bg.lineStyle(1, hover ? 0xffd36a : 0x8a6a36, 0.75);
        bg.strokeRoundedRect(x - 58, y - 15, 116, 30, 8);
      };
      draw(false);

      const t = this.add.text(x, y, label, {
        fontSize: '13px',
        color: '#f4e0b8',
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

    makeDebugButton(W - 72, H * 0.875, '调试第2关', 'Level2Scene');
    makeDebugButton(W - 72, H * 0.935, '调试第3关', 'Level3Scene');

    this.add.text(W / 2, H * 0.965,
      '← →  移动    Space  跳跃    鼠标左键  画墨水    鼠标右键  射传送门', {
      fontSize: '12px',
      color: '#c8b68a',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(10);

    this.cameras.main.fadeIn(900);
  }

  update() {
  }
}
