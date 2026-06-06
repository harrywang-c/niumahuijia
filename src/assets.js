// 真·手绘资源加载 + 帧动画 + 玩家精灵工厂。
// 参考图经 tools/extract_sprites.py 抠成等距 spritesheet：
//   graphics/sprites/player.png  9 帧 (432x352)
//   graphics/sprites/boss.png   13 帧 (264x326)
// 运行时只负责加载与播放；抠图失败时 sprites.js 的 procedural 纹理兜底。

const PLAYER_SHEET = { key: 'player', url: 'graphics/sprites/player.png', fw: 432, fh: 352 };
const BOSS_SHEET   = { key: 'boss',   url: 'graphics/sprites/boss.png',   fw: 264, fh: 326 };

// 帧索引（与 extract_sprites.py 的 names 顺序一致）
const PLAYER_FRAMES = {
  idle: 0, run1: 1, run2: 2, run3: 3, run4: 4, run5: 5,
  portal_shoot: 6, ink_cast: 7, jump: 8,
};
const BOSS_FRAMES = {
  idle_right: 0, walk_right1: 1, walk_right2: 2, walk_right3: 3, walk_right4: 4, walk_right5: 5,
  alert: 6,
  idle_left: 7, walk_left1: 8, walk_left2: 9, walk_left3: 10, walk_left4: 11, walk_left5: 12,
};

// 游戏内显示标定
const PLAYER_SCALE = 0.23;          // 432x352 → 约 99x81 显示
const PLAYER_BODY  = { w: 30, h: 78 };
const BOSS_SCALE   = 0.28;          // 264x326 → 约 74x91 显示
const BOSS_BODY    = { w: 42, h: 86 };

function preloadGameAssets(scene) {
  if (!scene.textures.exists(PLAYER_SHEET.key))
    scene.load.spritesheet(PLAYER_SHEET.key, PLAYER_SHEET.url,
      { frameWidth: PLAYER_SHEET.fw, frameHeight: PLAYER_SHEET.fh });
  if (!scene.textures.exists(BOSS_SHEET.key))
    scene.load.spritesheet(BOSS_SHEET.key, BOSS_SHEET.url,
      { frameWidth: BOSS_SHEET.fw, frameHeight: BOSS_SHEET.fh });
}

// 是否成功加载了真·序列帧（多帧才算，单帧说明加载失败/回退）
function hasRealPlayer(scene) {
  return scene.textures.exists('player') && scene.textures.get('player').frameTotal > 2;
}
function hasRealBoss(scene) {
  return scene.textures.exists('boss') && scene.textures.get('boss').frameTotal > 2;
}

function createGameAnimations(scene) {
  const mk = (key, frames, frameRate, repeat) => {
    if (scene.anims.exists(key)) return;
    scene.anims.create({
      key,
      frames: frames.map(f => ({ key: f.sheet, frame: f.frame })),
      frameRate, repeat,
    });
  };
  const P = (n) => ({ sheet: 'player', frame: PLAYER_FRAMES[n] });
  const B = (n) => ({ sheet: 'boss', frame: BOSS_FRAMES[n] });

  if (hasRealPlayer(scene)) {
    mk('player_idle', [P('idle')], 1, -1);
    mk('player_run', [P('run1'), P('run2'), P('run3'), P('run4'), P('run5')], 12, -1);
    mk('player_jump', [P('jump')], 1, -1);
    mk('player_ink', [P('ink_cast')], 1, -1);
    mk('player_portal', [P('portal_shoot')], 1, -1);
  }
  if (hasRealBoss(scene)) {
    mk('boss_idle', [B('idle_right')], 1, -1);
    mk('boss_walk', [B('walk_right1'), B('walk_right2'), B('walk_right3'), B('walk_right4'), B('walk_right5')], 8, -1);
    mk('boss_alert', [B('alert')], 1, -1);
  }
}

// 统一的玩家精灵工厂：真图用 sprite+动画，回退用 procedural image。
// 物理体显式设小，避免用整张大单元格当碰撞体。
function addPlayerSprite(scene, x, y, opts = {}) {
  const depth = opts.depth ?? 9;
  if (hasRealPlayer(scene)) {
    const p = scene.matter.add.sprite(x, y, 'player', PLAYER_FRAMES.idle);
    // setScale also scales the physics body, so size the body in UNSCALED texture
    // units (display size / scale) — after setScale it lands at PLAYER_BODY px.
    p.setRectangle(PLAYER_BODY.w / PLAYER_SCALE, PLAYER_BODY.h / PLAYER_SCALE, {
      label: 'player', frictionAir: opts.frictionAir ?? 0.05,
      friction: opts.friction ?? 0.5, restitution: 0,
    });
    p.setFixedRotation();
    p.body.label = 'player';
    p.setScale(PLAYER_SCALE).setDepth(depth);
    if (scene.anims.exists('player_idle')) p.play('player_idle');
    p._real = true;
    return p;
  }
  // 回退：procedural 'player' 纹理（34x53）
  const p = scene.matter.add.sprite(x, y, 'player', null, {
    label: 'player', frictionAir: opts.frictionAir ?? 0.05,
    friction: opts.friction ?? 0.5, restitution: 0,
  });
  p.setFixedRotation();
  p.body.label = 'player';
  p.setScale(opts.fallbackScale ?? 1.5).setDepth(depth);
  p._real = false;
  return p;
}

// 玩家动画状态机：每帧按状态切动画。瞬时动作（射门/吐墨）有最短持续时间。
class PlayerAnim {
  constructor(scene, sprite) {
    this.scene = scene;
    this.sprite = sprite;
    this.lock = 0;            // 锁定到某动作的剩余毫秒
    this.lockedKey = null;
  }
  // 外部事件：射传送门 / 开始画墨
  flashPortal() { this._lockTo('player_portal', 260); }
  setInk(drawing) {
    if (drawing) this._lockTo('player_ink', 120);
  }
  _lockTo(key, ms) {
    if (!this.sprite._real || !this.scene.anims.exists(key)) return;
    this.lockedKey = key; this.lock = ms;
    this.sprite.play(key, true);
  }
  update(dt) {
    const s = this.sprite;
    if (!s._real) return;
    if (this.lock > 0) { this.lock -= dt; return; }
    const onGround = this.scene.onGround;
    const vx = s.body.velocity.x, vy = s.body.velocity.y;
    let key = 'player_idle';
    if (!onGround && Math.abs(vy) > 1.4) key = 'player_jump';
    else if (Math.abs(vx) > 0.6) key = 'player_run';
    if (this.scene.anims.exists(key)) s.play(key, true);
  }
}

// 老板精灵工厂（GuardSystem 用）
function addBossSprite(scene, x, y) {
  if (hasRealBoss(scene)) {
    const b = scene.add.sprite(x, y, 'boss', BOSS_FRAMES.idle_right)
      .setScale(BOSS_SCALE).setDepth(7);
    if (scene.anims.exists('boss_idle')) b.play('boss_idle');
    b._real = true;
    return b;
  }
  const key = scene.textures.exists('cowboy') ? 'cowboy' : 'boss';
  const b = scene.add.image(x, y, key).setScale(1.5).setDepth(7);
  b._real = false;
  return b;
}
