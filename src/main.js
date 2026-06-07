function getInitialSceneFromQuery() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('level') === '1') return 'Level1Scene';
  if (params.get('level') === '2') return 'Level2Scene';
  if (params.get('level') === '3') return 'Level3Scene';
  const KNOWN = ['TitleScene', 'TutorialScene', 'Level1Scene', 'Level2Scene', 'Level3Scene'];
  if (KNOWN.includes(params.get('scene'))) return params.get('scene');
  return 'TitleScene';
}

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#1a1a2e',
  // Fit-scale to any screen (phones included), keep the 16:9 letterboxed.
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  // Allow several simultaneous touches (joystick + draw + buttons).
  input: { activePointers: 4 },
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
