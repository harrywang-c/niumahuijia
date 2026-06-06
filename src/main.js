function getInitialSceneFromQuery() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('level') === '2') return 'Level2Scene';
  if (params.get('level') === '3') return 'Level3Scene';
  if (params.get('scene') === 'Level2Scene') return 'Level2Scene';
  if (params.get('scene') === 'Level3Scene') return 'Level3Scene';
  return 'TitleScene';
}

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'matter',
    matter: { gravity: { y: 1.5 }, debug: false }
  },
  scene: [TitleScene, TutorialScene, Level1Scene, Level2Scene, Level3Scene],
  callbacks: {
    postBoot: (game) => {
      const initialScene = getInitialSceneFromQuery();
      if (initialScene !== 'TitleScene') game.scene.start(initialScene);
    }
  }
};

window._game = new Phaser.Game(config);
