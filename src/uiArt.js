const UI_ART = {
  title: 'ui_title_screen',
  settlement: 'ui_settlement_screen',
  backdrop: 'bg_rain_city',
};

function preloadUiArt(scene) {
  _loadImageIfMissing(scene, UI_ART.title, 'graphics/optimized/ui/title_screen.jpg');
  _loadImageIfMissing(scene, UI_ART.settlement, 'graphics/optimized/ui/settlement_screen.jpg');
  _loadImageIfMissing(scene, UI_ART.backdrop, 'graphics/optimized/背景.jpg');
}

// Rainy-night city backdrop, parallax-tiled across the whole level width.
// Falls back to a gradient (using cfg.skyTop/skyBottom) if the image is missing,
// so scenes never crash even before assets load.
function addRainCityBackdrop(scene, opts = {}) {
  const W = scene.scale.width;
  const H = scene.scale.height;
  const LW = scene.LEVEL_WIDTH || W;
  const factor = 0.45;

  if (scene.textures.exists(UI_ART.backdrop)) {
    const src = scene.textures.get(UI_ART.backdrop).getSourceImage();
    const scale = H / src.height;
    const tileW = src.width * scale;
    const span = LW * factor + W + tileW;
    for (let x = -tileW; x < span; x += tileW - 1) {
      scene.add.image(x, 0, UI_ART.backdrop)
        .setOrigin(0, 0)
        .setScale(scale)
        .setScrollFactor(factor)
        .setDepth(-10);
    }
  } else {
    const top = opts.skyTop || scene.cfg?.skyTop || 0x161228;
    const bot = opts.skyBottom || scene.cfg?.skyBottom || 0x2a2440;
    const g = scene.add.graphics().setScrollFactor(0).setDepth(-10);
    g.fillGradientStyle(top, top, bot, bot, 1);
    g.fillRect(0, 0, W, H);
  }

  // Atmospheric haze fixed to the camera, sits the world a touch further back.
  const haze = scene.add.graphics().setScrollFactor(0).setDepth(-9);
  haze.fillStyle(0x0a0c16, 0.3);
  haze.fillRect(0, 0, W, H);
}

function _loadImageIfMissing(scene, key, url) {
  if (!scene.textures.exists(key)) scene.load.image(key, url);
}

function addCoverImage(scene, key, depth, alpha = 1) {
  const W = scene.scale.width;
  const H = scene.scale.height;
  return scene.add.image(W / 2, H / 2, key)
    .setDisplaySize(W, H)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(alpha);
}

function addTitleScreenArt(scene) {
  const W = scene.scale.width;
  const H = scene.scale.height;
  const CHS = '"Microsoft YaHei","PingFang SC",Arial,sans-serif';

  if (scene.textures.exists(UI_ART.title)) {
    addCoverImage(scene, UI_ART.title, 0);
    return;
  }

  const bg = scene.add.graphics().setDepth(0);
  bg.fillGradientStyle(0x101018, 0x101018, 0x27222b, 0x27222b, 1);
  bg.fillRect(0, 0, W, H);

  scene.add.text(W / 2, H * 0.25, '牛马回家', {
    fontSize: '82px',
    color: '#fff2cf',
    fontFamily: CHS,
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 10
  }).setOrigin(0.5).setDepth(1);

  const btn = scene.add.graphics().setDepth(1);
  btn.fillStyle(0xd9902f, 0.95);
  btn.fillRoundedRect(W / 2 - 150, H * 0.72, 300, 74, 16);
  btn.lineStyle(2, 0xffd36a, 0.9);
  btn.strokeRoundedRect(W / 2 - 150, H * 0.72, 300, 74, 16);

  scene.add.text(W / 2, H * 0.72 + 37, '下班回家', {
    fontSize: '38px',
    color: '#1b1208',
    fontFamily: CHS,
    fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(2);
}

function addTitleStartHotspot(scene, onStart) {
  const W = scene.scale.width;
  const H = scene.scale.height;
  const glow = scene.add.graphics().setDepth(2);
  // Aligned to the painted "下班回家" button in the title art (center ~470,450).
  const x = 470;
  const y = 450;
  const w = 270;
  const h = 94;

  const drawGlow = (hover) => {
    glow.clear();
    if (!hover) return;
    glow.lineStyle(4, 0xffd36a, 0.72);
    glow.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 18);
    glow.fillStyle(0xffc24a, 0.08);
    glow.fillRoundedRect(x - w / 2, y - h / 2, w, h, 18);
  };

  const zone = scene.add.zone(x, y, w, h)
    .setDepth(3)
    .setInteractive({ useHandCursor: true });
  zone.on('pointerover', () => drawGlow(true));
  zone.on('pointerout', () => drawGlow(false));
  zone.on('pointerup', () => {
    zone.disableInteractive();
    drawGlow(false);
    onStart();
  });

  return zone;
}

function addSettlementWinScreen(scene, options) {
  const {
    onPrimary,
    onSecondary,
    primaryHotspot = { x: 480, y: 372, w: 330, h: 86 },
    secondaryHotspot = { x: 480, y: 462, w: 240, h: 56 },
  } = options;

  if (scene.textures.exists(UI_ART.settlement)) {
    addCoverImage(scene, UI_ART.settlement, 40);
    if (options.stats) _drawSettlementStats(scene, options.stats);
  } else {
    const ov = scene.add.graphics().setScrollFactor(0).setDepth(40);
    ov.fillStyle(0x17151a, 0.96);
    ov.fillRect(0, 0, 960, 540);
  }

  _addHotspot(scene, primaryHotspot, 42, onPrimary);
  if (onSecondary) _addHotspot(scene, secondaryHotspot, 42, onSecondary);
}

// Compute the run stats shown on the settlement screen.
function computeRunStats(scene) {
  const ms = scene._startTime != null ? (scene.time.now - scene._startTime) : 0;
  const sec = Math.max(0, Math.floor(ms / 1000));
  const tears = scene.inkSystem ? Math.round(scene.inkSystem.getRatio() * 100) : 0;
  const portals = scene.portalSystem ? (scene.portalSystem.shotCount || 0) : 0;

  let rating;
  if (sec <= 35 && tears >= 45) rating = '下班达人';
  else if (sec <= 70) rating = '准点下班';
  else rating = '加班狗';

  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return { time: `${mm}:${ss}`, tears: `${tears}%`, portals: `${portals}`, rating };
}

// Cover the sample numbers baked into the settlement art and print real ones.
function _drawSettlementStats(scene, stats) {
  const CHS = '"Microsoft YaHei","PingFang SC",Arial,sans-serif';
  const rows = [
    { y: 184, val: stats.time, color: '#2a2018' },
    { y: 219, val: stats.tears, color: '#2a2018' },
    { y: 254, val: stats.portals, color: '#2a2018' },
    { y: 289, val: stats.rating, color: '#9c2b1f' },
  ];
  const patch = scene.add.graphics().setScrollFactor(0).setDepth(41);
  patch.fillStyle(0xdac9a4, 1);
  for (const r of rows) patch.fillRect(486, r.y - 15, 138, 30);
  for (const r of rows) {
    scene.add.text(600, r.y, r.val, {
      fontSize: '22px', color: r.color, fontFamily: CHS, fontStyle: 'bold',
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(42);
  }
}

function _addHotspot(scene, bounds, depth, callback) {
  const glow = scene.add.graphics().setScrollFactor(0).setDepth(depth);
  const draw = (hover) => {
    glow.clear();
    if (!hover) return;
    glow.lineStyle(3, 0xffd36a, 0.72);
    glow.strokeRoundedRect(bounds.x - bounds.w / 2, bounds.y - bounds.h / 2, bounds.w, bounds.h, 14);
    glow.fillStyle(0xffc24a, 0.07);
    glow.fillRoundedRect(bounds.x - bounds.w / 2, bounds.y - bounds.h / 2, bounds.w, bounds.h, 14);
  };

  const zone = scene.add.zone(bounds.x, bounds.y, bounds.w, bounds.h)
    .setScrollFactor(0)
    .setDepth(depth + 1)
    .setInteractive({ useHandCursor: true });
  zone.on('pointerover', () => draw(true));
  zone.on('pointerout', () => draw(false));
  zone.on('pointerup', () => {
    zone.disableInteractive();
    draw(false);
    callback();
  });
  return zone;
}
