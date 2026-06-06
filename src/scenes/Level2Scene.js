class Level2Scene extends DebugPortalLevelScene {
  constructor() {
    super('Level2Scene', {
      title: 'LEVEL 2',
      goal: 'KPI RAIN',
      width: 2400,
      groundY: 440,
      startX: 95,
      startY: 360,
      houseX: 2260,
      inkMax: 260,
      skyTop: 0x25215a,
      skyBottom: 0xf3a14b,
      skylineColor: 0x423066,
      platforms: [
        { x: 0, y: 440, w: 380, h: 72 },
        { x: 520, y: 440, w: 350, h: 72 },
        { x: 1000, y: 440, w: 360, h: 72 },
        { x: 1510, y: 440, w: 420, h: 72 },
        { x: 2050, y: 440, w: 390, h: 72 },
        { x: 720, y: 330, w: 340, h: 52, kind: 'portal-surface' },
        { x: 1220, y: 288, w: 360, h: 52 },
        { x: 1700, y: 320, w: 300, h: 52, kind: 'portal-surface' },
        { x: 420, y: 520, w: 520, h: 54, kind: 'portal-surface' }
      ],
      walls: [
        { x: 945, y: 330, w: 38, h: 110 },
        { x: 1435, y: 288, w: 34, h: 152 }
      ],
      guards: [
        { x: 630, y: 412, dir: 'right', range: 290, angle: 38, patrol: 0 },
        { x: 1730, y: 292, dir: 'left', range: 250, angle: 38, patrol: 90 }
      ],
      portalHints: [
        { x: 680, y: 440, color: 'blue' },
        { x: 1320, y: 288, color: 'orange' },
        { x: 1840, y: 320, color: 'blue' }
      ],
      conveyors: [
        { x: 440, y: 510, w: 500, h: 28, speed: -3.2 },
        { x: 1010, y: 430, w: 300, h: 26, speed: -2.4 }
      ],
      drops: [
        { x: 560, landY: 440, w: 58, h: 48, text: 'KPI', every: 2300, delay: 600, warn: 950 },
        { x: 820, landY: 440, w: 58, h: 48, text: 'OKR', every: 2700, delay: 1200, warn: 900 },
        { x: 1180, landY: 440, w: 72, h: 50, text: 'DDL', every: 3400, delay: 1500, warn: 850, slide: 2.3 },
        { x: 1660, landY: 440, w: 58, h: 48, text: 'KPI', every: 2600, delay: 900, warn: 850 }
      ]
    });
  }
}
