class Level3Scene extends DebugPortalLevelScene {
  constructor() {
    super('Level3Scene', {
      title: 'LEVEL 3',
      goal: '最终面谈',
      width: 2900,
      groundY: 450,
      startX: 90,
      startY: 380,
      houseX: 2620,
      inkMax: 190,                 // tightest — every bridge must be minimal
      skyTop: 0x120d2e,
      skyBottom: 0x3b2265,
      skylineColor: 0x1a1830,
      platforms: [
        { x: 0,    y: 450, w: 340, h: 60 },   // start
        { x: 430,  y: 450, w: 420, h: 60 },   // ① after the jump-peek wall
        { x: 920,  y: 450, w: 470, h: 60 },   // ② conveyor + KPI run (belt pushes back)
        { x: 1460, y: 450, w: 500, h: 60 },   // ③ blind-spot stealth
        { x: 2030, y: 450, w: 620, h: 60 },   // ④ final stretch + patrol → home
      ],
      walls: [
        { x: 360, y: 380, w: 28, h: 70 },     // ★ jump-peek wall: jump to the apex to shoot over it
        { x: 1660, y: 330, w: 32, h: 120 },   // blind-spot wall: ink the rest of the cone to slip past
      ],
      guards: [
        { x: 1820, y: 422, dir: 'left', range: 330, angle: 36, patrol: 0 },  // behind the stealth wall
        { x: 2380, y: 422, dir: 'right', range: 250, angle: 34, patrol: 90 }, // final patrol
      ],
      conveyors: [
        { x: 920, y: 438, w: 470, h: 26, speed: -3.0 },   // pushes you back while KPIs rain
      ],
      drops: [
        { x: 1040, landY: 450, w: 60, h: 48, text: 'KPI', every: 2400, delay: 800, warn: 850 },
        { x: 1240, landY: 450, w: 60, h: 48, text: 'OKR', every: 2700, delay: 1700, warn: 850 },
        { x: 2230, landY: 450, w: 104, h: 62, text: '绩效锤', fontSize: 16, every: 4200, delay: 1400, warn: 950 },
        { x: 2480, landY: 450, w: 58, h: 48, text: 'DDL', every: 2600, delay: 900, warn: 700, slide: 2.4 },
      ],
    });
  }
}
