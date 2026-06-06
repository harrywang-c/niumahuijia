function createTextures(scene) {
  // Player/boss come from real spritesheets (assets.js) when available; only
  // generate the procedural versions as a fallback. Environment textures
  // (tiles/portals/house) are always procedural.
  if (!scene.textures.exists('player')) _playerTex(scene);
  if (!scene.textures.exists('boss') && !scene.textures.exists('cowboy')) _cowboyTex(scene);
  if (!scene.textures.exists('grass')) _tileTex(scene);
  if (!scene.textures.exists('portalBlue')) _portalTex(scene);
  if (!scene.textures.exists('house')) _houseTex(scene);
}

function _playerTex(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Ears
  g.fillStyle(0x9a6838);
  g.fillEllipse(10, 3, 8, 9);
  g.fillEllipse(24, 3, 8, 9);
  g.fillStyle(0xe8a870);
  g.fillEllipse(10, 4, 4, 6);
  g.fillEllipse(24, 4, 4, 6);

  // Mane (behind head)
  g.fillStyle(0x3e1a04);
  g.fillEllipse(8, 12, 10, 20);
  g.fillStyle(0x5a2e08);
  g.fillEllipse(9, 10, 7, 15);

  // Head — smooth ellipse
  g.fillStyle(0xa07040);
  g.fillEllipse(17, 10, 22, 18);
  g.fillStyle(0xb89060);
  g.fillEllipse(18, 8, 16, 11);

  // Snout
  g.fillStyle(0xc49060);
  g.fillEllipse(17, 17, 17, 11);
  g.fillStyle(0xd4a878);
  g.fillEllipse(17, 19, 12, 7);

  // Eyes
  g.fillStyle(0xffffff);
  g.fillEllipse(12, 9, 6, 5);
  g.fillEllipse(22, 9, 6, 5);
  g.fillStyle(0x3d2000);
  g.fillEllipse(12, 9, 4, 4);
  g.fillEllipse(22, 9, 4, 4);
  g.fillStyle(0x111111);
  g.fillEllipse(12.5, 9, 2.5, 2.5);
  g.fillEllipse(22.5, 9, 2.5, 2.5);
  g.fillStyle(0xffffff);
  g.fillCircle(13.5, 8, 1);
  g.fillCircle(23.5, 8, 1);
  g.fillStyle(0x7a5020);
  g.fillRect(9, 7, 6, 1);
  g.fillRect(19, 7, 6, 1);

  // Nostrils
  g.fillStyle(0x5a2a0a);
  g.fillEllipse(14, 20, 3, 2);
  g.fillEllipse(20, 20, 3, 2);

  // Neck
  g.fillStyle(0xd4a574);
  g.fillRect(13, 21, 8, 5);

  // Shirt
  g.fillStyle(0xeeeeff);
  g.fillRect(8, 24, 16, 14);
  g.fillStyle(0xd6d6ee);
  g.fillRect(20, 24, 4, 14);
  g.fillStyle(0xffffff);
  g.fillRect(13, 24, 8, 4);
  g.fillStyle(0xcc2222);
  g.fillRect(15, 27, 4, 8);
  g.fillStyle(0x991111);
  g.fillRect(15, 35, 4, 1);
  g.fillRect(16, 36, 2, 2);

  // Left arm + hand
  g.fillStyle(0xeeeeff);
  g.fillRect(3, 25, 6, 4);
  g.fillStyle(0xd4a574);
  g.fillRect(3, 28, 5, 3);

  // Right arm + portal gun
  g.fillStyle(0xeeeeff);
  g.fillRect(24, 25, 4, 4);
  g.fillStyle(0x1a3a88);
  g.fillRect(27, 22, 7, 5);
  g.fillStyle(0x3355cc);
  g.fillRect(28, 20, 6, 3);
  g.fillStyle(0x4477ff);
  g.fillRect(32, 18, 2, 9);
  g.fillStyle(0xaaccff);
  g.fillRect(33, 19, 1, 7);

  // Belt
  g.fillStyle(0x111111);
  g.fillRect(8, 37, 16, 3);
  g.fillStyle(0xddaa22);
  g.fillRect(14, 37, 4, 3);

  // Trousers
  g.fillStyle(0x1e2246);
  g.fillRect(9, 39, 5, 12);
  g.fillRect(18, 39, 5, 12);
  g.fillStyle(0x282e5a);
  g.fillRect(11, 39, 1, 11);
  g.fillRect(20, 39, 1, 11);

  // Shoes
  g.fillStyle(0x111111);
  g.fillRect(8, 50, 7, 4);
  g.fillRect(17, 50, 7, 4);
  g.fillStyle(0x2d2d2d);
  g.fillRect(8, 50, 7, 1);
  g.fillRect(17, 50, 7, 1);

  g.generateTexture('player', 34, 53);
  g.destroy();
}

function _cowboyTex(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Boots
  g.fillStyle(0x160e06);
  g.fillRect(9, 43, 7, 5);
  g.fillRect(16, 43, 7, 5);
  g.fillStyle(0x281808);
  g.fillRect(8, 40, 8, 5);
  g.fillRect(16, 40, 8, 5);

  // Legs
  g.fillStyle(0x3a2810);
  g.fillRect(10, 30, 5, 12);
  g.fillRect(17, 30, 5, 12);
  g.fillStyle(0x4a3218);
  g.fillRect(11, 30, 1, 11);
  g.fillRect(18, 30, 1, 11);

  // Torso
  g.fillStyle(0x7b1818);
  g.fillRect(10, 18, 12, 13);
  g.fillStyle(0x9b2828);
  g.fillRect(10, 18, 5, 13);

  // Belt
  g.fillStyle(0x111111);
  g.fillRect(10, 29, 12, 3);
  g.fillStyle(0xddaa00);
  g.fillRect(14, 29, 4, 3);

  // Star badge
  g.fillStyle(0xddaa00);
  g.fillRect(14, 22, 2, 5);
  g.fillRect(12, 24, 6, 1);

  // Arms
  g.fillStyle(0x7b1818);
  g.fillRect(5, 18, 5, 4);
  g.fillRect(22, 18, 5, 4);
  g.fillStyle(0xd4a574);
  g.fillRect(5, 21, 5, 4);
  g.fillRect(22, 21, 5, 4);

  // Neck
  g.fillStyle(0xd4a574);
  g.fillRect(14, 14, 4, 5);

  // Head — smooth
  g.fillStyle(0xd4a574);
  g.fillEllipse(16, 12, 16, 14);
  g.fillStyle(0xe0b88a);
  g.fillEllipse(16, 10, 12, 9);

  // Eyes
  g.fillStyle(0x222222);
  g.fillEllipse(13, 11, 3, 3);
  g.fillEllipse(19, 11, 3, 3);
  g.fillStyle(0xffffff);
  g.fillCircle(13.5, 10.5, 1);
  g.fillCircle(19.5, 10.5, 1);

  // Moustache
  g.fillStyle(0x3a2000);
  g.fillEllipse(12, 16, 5, 3);
  g.fillEllipse(20, 16, 5, 3);

  // Hat crown
  g.fillStyle(0x4a2808);
  g.fillRect(9, 1, 14, 9);
  g.fillStyle(0x5e3414);
  g.fillRect(10, 2, 12, 6);

  // Hat brim
  g.fillStyle(0x5a3010);
  g.fillRect(5, 8, 22, 4);
  g.fillStyle(0x3e2008);
  g.fillRect(5, 10, 22, 2);

  // Hat band
  g.fillStyle(0x2a1a08);
  g.fillRect(9, 7, 14, 3);
  g.fillStyle(0xccaa00);
  g.fillRect(13, 8, 6, 1);

  g.generateTexture('cowboy', 32, 48);
  g.destroy();
}

function _tileTex(scene) {
  // Grass 32x32 — vibrant pixel art style
  const gr = scene.make.graphics({ x: 0, y: 0, add: false });
  // Dirt base
  gr.fillStyle(0x5a3820); gr.fillRect(0, 0, 32, 32);
  // Lighter dirt patches
  gr.fillStyle(0x6b4530);
  gr.fillRect(0, 10, 8, 5);   gr.fillRect(12, 14, 10, 4);
  gr.fillRect(24, 11, 8, 5);  gr.fillRect(6, 20, 12, 5);
  gr.fillRect(20, 22, 10, 4);
  // Grass-to-dirt edge (dark)
  gr.fillStyle(0x1e6614); gr.fillRect(0, 7, 32, 3);
  // Grass top
  gr.fillStyle(0x33bb33); gr.fillRect(0, 0, 32, 8);
  // Bright blade highlights
  gr.fillStyle(0x55dd55);
  [1,7,13,19,25].forEach(x => gr.fillRect(x, 0, 2, 5 + (x % 3)));
  // Darker accent blades
  gr.fillStyle(0x1a8822);
  [4,11,18,27].forEach(x => gr.fillRect(x, 1, 1, 4));
  // Tip shine
  gr.fillStyle(0x88ff88);
  gr.fillRect(1, 0, 1, 2); gr.fillRect(13, 0, 1, 2); gr.fillRect(25, 0, 1, 2);
  gr.generateTexture('grass', 32, 32);
  gr.destroy();

  // Brick 32x32
  const br = scene.make.graphics({ x: 0, y: 0, add: false });
  br.fillStyle(0x6B2B0A); br.fillRect(0, 0, 32, 32);
  br.fillStyle(0x8B3A10);
  br.fillRect(1, 1, 14, 13); br.fillRect(17, 1, 14, 13);
  br.fillRect(1, 17, 8, 13); br.fillRect(11, 17, 20, 13);
  br.fillStyle(0x5a2008);
  br.fillRect(0, 15, 32, 2); br.fillRect(16, 0, 2, 15); br.fillRect(10, 15, 2, 17);
  br.generateTexture('brick', 32, 32);
  br.destroy();

  // Spike 16x16 — metallic with 3-tone shading
  const sp = scene.make.graphics({ x: 0, y: 0, add: false });
  sp.fillStyle(0x7a7a8a);
  sp.fillTriangle(1, 16, 8, 1, 15, 16);
  sp.fillStyle(0x555566);
  sp.fillTriangle(1, 16, 4, 9, 8, 1);
  sp.fillStyle(0xb4b4c8);
  sp.fillTriangle(8, 1, 12, 9, 15, 16);
  sp.fillStyle(0xe0e0f0);
  sp.fillTriangle(7, 3, 9, 3, 8, 1);
  sp.fillStyle(0x444455);
  sp.fillRect(1, 14, 14, 2);
  sp.generateTexture('spike', 16, 16);
  sp.destroy();
}

function _portalTex(scene) {
  // Blue portal 48x80
  const b = scene.make.graphics({ x: 0, y: 0, add: false });
  b.fillStyle(0x0a1a44, 0.5); b.fillEllipse(24, 40, 20, 70);
  b.lineStyle(5, 0x2266ff, 1); b.strokeEllipse(24, 40, 24, 74);
  b.lineStyle(2, 0x88bbff, 0.8); b.strokeEllipse(24, 40, 14, 58);
  b.fillStyle(0xaaddff, 0.15); b.fillEllipse(24, 40, 10, 50);
  b.generateTexture('portalBlue', 48, 80);
  b.destroy();

  // Orange portal 48x80
  const o = scene.make.graphics({ x: 0, y: 0, add: false });
  o.fillStyle(0x441800, 0.5); o.fillEllipse(24, 40, 20, 70);
  o.lineStyle(5, 0xff7700, 1); o.strokeEllipse(24, 40, 24, 74);
  o.lineStyle(2, 0xffbb66, 0.8); o.strokeEllipse(24, 40, 14, 58);
  o.fillStyle(0xffddaa, 0.15); o.fillEllipse(24, 40, 10, 50);
  o.generateTexture('portalOrange', 48, 80);
  o.destroy();
}

function _houseTex(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // Canvas 84x88 — cozy pixel art house

  // Foundation (stone)
  g.fillStyle(0x888888); g.fillRect(6, 82, 72, 6);
  g.fillStyle(0x999999); g.fillRect(6, 82, 72, 2);
  g.fillStyle(0x666666);
  g.fillRect(6, 84, 20, 2); g.fillRect(30, 84, 22, 2); g.fillRect(56, 84, 22, 2);

  // Walls — warm cream
  g.fillStyle(0xf2dea8); g.fillRect(8, 42, 68, 42);
  // Wall shadow right
  g.fillStyle(0xdcca8e); g.fillRect(68, 42, 8, 42);
  // Wall planks (subtle horizontal lines)
  g.fillStyle(0xe8d498);
  for (let y = 48; y < 82; y += 10) g.fillRect(8, y, 68, 1);
  // Top wall trim
  g.fillStyle(0x8b5a14); g.fillRect(8, 42, 68, 3);

  // Left window frame + glass
  g.fillStyle(0x7a4e10); g.fillRect(12, 52, 22, 18);
  g.fillStyle(0x226688); g.fillRect(14, 54, 18, 14);
  // Window warm glow
  g.fillStyle(0xffee88); g.fillRect(14, 54, 8, 6);
  g.fillStyle(0xffdd66); g.fillRect(22, 54, 10, 6);
  g.fillStyle(0xffcc44); g.fillRect(14, 60, 18, 8);
  // Window crossbar
  g.fillStyle(0x7a4e10);
  g.fillRect(14, 60, 18, 2); g.fillRect(22, 54, 2, 14);

  // Right window frame + glass
  g.fillStyle(0x7a4e10); g.fillRect(50, 52, 22, 18);
  g.fillStyle(0x226688); g.fillRect(52, 54, 18, 14);
  g.fillStyle(0xffee88); g.fillRect(52, 54, 8, 6);
  g.fillStyle(0xffdd66); g.fillRect(60, 54, 10, 6);
  g.fillStyle(0xffcc44); g.fillRect(52, 60, 18, 8);
  g.fillStyle(0x7a4e10);
  g.fillRect(52, 60, 18, 2); g.fillRect(60, 54, 2, 14);

  // Door
  g.fillStyle(0x7a3e10); g.fillRect(30, 62, 24, 24);
  // Door panels
  g.fillStyle(0x8b4e18);
  g.fillRect(31, 63, 10, 9); g.fillRect(43, 63, 10, 9);
  g.fillRect(31, 74, 10, 10); g.fillRect(43, 74, 10, 10);
  g.fillStyle(0x5a2e08); g.fillRect(41, 62, 2, 24); g.fillRect(30, 73, 24, 2);
  // Door knob
  g.fillStyle(0xddaa00); g.fillRect(51, 75, 3, 3);
  g.fillStyle(0xffcc22); g.fillRect(51, 75, 1, 1);

  // Roof — red with tile detail
  g.fillStyle(0xcc3333); g.fillTriangle(2, 44, 42, 4, 82, 44);
  g.fillStyle(0x882222); g.fillRect(2, 42, 80, 4);
  // Roof tiles
  g.fillStyle(0xaa2222);
  for (let row = 0; row < 4; row++) {
    const ry = 12 + row * 8, rw = 16 + row * 16, rx = 42 - rw / 2;
    const cols = 2 + row;
    for (let c = 0; c < cols; c++)
      g.fillRect(rx + c * Math.floor(rw / cols) + 1, ry, Math.floor(rw / cols) - 2, 6);
  }
  // Roof eave detail
  g.fillStyle(0xdd5555);
  for (let x = 4; x < 80; x += 14) g.fillRect(x, 40, 10, 4);
  // Ridge
  g.fillStyle(0xee6666); g.fillRect(36, 3, 12, 4);

  // Chimney
  g.fillStyle(0x7a7a7a); g.fillRect(58, 6, 14, 26);
  g.fillStyle(0x666666); g.fillRect(58, 14, 5, 18); // shadow side
  g.fillStyle(0x555555); g.fillRect(56, 4, 18, 5);  // cap
  g.fillStyle(0x888888); g.fillRect(56, 4, 18, 2);  // cap highlight
  // Mortar lines on chimney
  g.fillStyle(0x555555);
  g.fillRect(58, 10, 14, 1); g.fillRect(58, 18, 14, 1); g.fillRect(65, 6, 1, 24);

  // Smoke puffs
  g.fillStyle(0xbbbbbb);
  g.fillRect(61, 1, 5, 4); g.fillRect(63, 0, 4, 2);
  g.fillStyle(0xdddddd);
  g.fillRect(62, 0, 3, 2);

  g.generateTexture('house', 84, 88);
  g.destroy();
}
