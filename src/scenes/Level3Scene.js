class Level3Scene extends DebugPortalLevelScene {
  constructor() {
    super('Level3Scene', {
      title: 'LEVEL 3',
      goal: 'FINAL REVIEW',
      width: 2850,
      groundY: 450,
      startX: 110,
      startY: 265,
      houseX: 2720,
      inkMax: 225,
      skyTop: 0x120d2e,
      skyBottom: 0x3b2265,
      skylineColor: 0x1a1830,
      platforms: [
        { x: 0, y: 342, w: 320, h: 58 },
        { x: 440, y: 520, w: 300, h: 58, kind: 'portal-surface' },
        { x: 900, y: 380, w: 330, h: 58 },
        { x: 1400, y: 450, w: 420, h: 58, kind: 'portal-surface' },
        { x: 1940, y: 450, w: 300, h: 58 },
        { x: 2320, y: 450, w: 560, h: 58 },
        { x: 1840, y: 318, w: 310, h: 50, kind: 'portal-surface' },
        { x: 2380, y: 314, w: 240, h: 50 }
      ],
      walls: [
        { x: 370, y: 300, w: 34, h: 220 },
        { x: 820, y: 300, w: 36, h: 220 },
        { x: 1320, y: 320, w: 42, h: 130 },
        { x: 2260, y: 342, w: 44, h: 108 }
      ],
      guards: [
        { x: 1640, y: 422, dir: 'left', range: 260, angle: 36, patrol: 0 },
        { x: 2460, y: 422, dir: 'right', range: 240, angle: 34, patrol: 70 }
      ],
      portalHints: [
        { x: 470, y: 520, color: 'blue' },
        { x: 1040, y: 380, color: 'orange' },
        { x: 1510, y: 450, color: 'orange' },
        { x: 1990, y: 318, color: 'blue' }
      ],
      conveyors: [
        { x: 460, y: 510, w: 260, h: 28, speed: -3.6 },
        { x: 1948, y: 306, w: 230, h: 26, speed: -2.8 },
        { x: 2328, y: 438, w: 260, h: 26, speed: -2.5 }
      ],
      drops: [
        { x: 520, landY: 520, w: 64, h: 50, text: 'KPI', every: 2800, delay: 700, warn: 750 },
        { x: 1510, landY: 450, w: 108, h: 62, text: '绩效锤', fontSize: 16, every: 4200, delay: 1300, warn: 950 },
        { x: 2050, landY: 318, w: 82, h: 54, text: 'DDL', every: 3600, delay: 900, warn: 650, slide: 2.7 },
        { x: 2460, landY: 450, w: 58, h: 48, text: 'OKR', every: 2500, delay: 1700, warn: 650 }
      ]
    });
  }
}
