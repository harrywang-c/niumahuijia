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

window._game = new Phaser.Game(config);
