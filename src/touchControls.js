// 移动端触控:左下虚拟摇杆(左右)、右下跳跃键、墨水/传送门模式切换键。
// 只在触摸设备激活(IS_TOUCH);电脑端 enabled=false,完全不影响键鼠。
// 关卡 _move() 读 this.left/right/consumeJump();InkSystem/PortalSystem 读 mode + isOverControl 来区分屏幕触摸是画墨还是射门。
const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const CHS_FONT = '"Microsoft YaHei","PingFang SC",Arial,sans-serif';

class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.axis = 0;            // -1 (左) .. 1 (右)
    this.mode = 'ink';        // 'ink' | 'portal'
    this.enabled = IS_TOUCH;
    this._jump = false;       // 待消费的跳跃
    this._joyId = null;
    this._jumpId = null;
    this._zones = [];
    if (this.enabled) this._build();
  }

  _build() {
    const W = this.scene.scale.width, H = this.scene.scale.height;
    const D = 100;

    // 摇杆(左下)
    this._joy = { x: 96, y: H - 92, r: 60 };
    const base = this.scene.add.graphics().setScrollFactor(0).setDepth(D);
    base.fillStyle(0x000000, 0.26); base.fillCircle(this._joy.x, this._joy.y, this._joy.r);
    base.lineStyle(3, 0xf4e0b8, 0.45); base.strokeCircle(this._joy.x, this._joy.y, this._joy.r);
    this._thumb = this.scene.add.graphics().setScrollFactor(0).setDepth(D + 1);
    this._drawThumb(this._joy.x, this._joy.y);

    // 跳跃键(右下)
    this._jumpBtn = { x: W - 94, y: H - 92, r: 52 };
    this._jumpG = this.scene.add.graphics().setScrollFactor(0).setDepth(D);
    this._drawJump(false);
    this._jumpTxt = this.scene.add.text(this._jumpBtn.x, this._jumpBtn.y, '跳', {
      fontSize: '24px', color: '#1b1208', fontFamily: CHS_FONT, fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);

    // 模式切换键(右下,跳跃键上方)
    this._toggleBtn = { x: W - 94, y: H - 188, r: 44 };
    this._toggleG = this.scene.add.graphics().setScrollFactor(0).setDepth(D);
    this._toggleTxt = this.scene.add.text(this._toggleBtn.x, this._toggleBtn.y, '', {
      fontSize: '20px', fontFamily: CHS_FONT, fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);
    this._drawToggle();

    this._zones = [this._joy, this._jumpBtn, this._toggleBtn];
    this._bind();
  }

  _drawThumb(x, y) {
    this._thumb.clear();
    this._thumb.fillStyle(0xf4e0b8, 0.85); this._thumb.fillCircle(x, y, 28);
  }
  _drawJump(pressed) {
    const b = this._jumpBtn;
    this._jumpG.clear();
    this._jumpG.fillStyle(pressed ? 0xffd36a : 0xd9902f, 0.85); this._jumpG.fillCircle(b.x, b.y, b.r);
    this._jumpG.lineStyle(3, 0xffd36a, 0.7); this._jumpG.strokeCircle(b.x, b.y, b.r);
  }
  _drawToggle() {
    const b = this._toggleBtn;
    const col = this.mode === 'ink' ? 0x1aaeff : 0xff8800;
    this._toggleG.clear();
    this._toggleG.fillStyle(0x06101f, 0.82); this._toggleG.fillCircle(b.x, b.y, b.r);
    this._toggleG.lineStyle(5, col, 0.95); this._toggleG.strokeCircle(b.x, b.y, b.r);
    this._toggleTxt.setText(this.mode === 'ink' ? '墨' : '门');
    this._toggleTxt.setColor(this.mode === 'ink' ? '#9be8ff' : '#ffcb8a');
  }

  _inCircle(x, y, c) { const dx = x - c.x, dy = y - c.y; return dx * dx + dy * dy <= c.r * c.r; }

  // 屏幕点是否落在某个控件上(让画墨/射门忽略这种触摸)
  isOverControl(x, y) {
    if (!this.enabled) return false;
    return this._zones.some(c => this._inCircle(x, y, c));
  }

  _bind() {
    const input = this.scene.input;
    input.on('pointerdown', (p) => {
      if (this._inCircle(p.x, p.y, this._joy)) { this._joyId = p.id; this._updateAxis(p); }
      else if (this._inCircle(p.x, p.y, this._jumpBtn)) { this._jump = true; this._jumpId = p.id; this._drawJump(true); }
      else if (this._inCircle(p.x, p.y, this._toggleBtn)) { this.mode = (this.mode === 'ink') ? 'portal' : 'ink'; this._drawToggle(); }
    });
    input.on('pointermove', (p) => { if (p.id === this._joyId) this._updateAxis(p); });
    input.on('pointerup', (p) => {
      if (p.id === this._joyId) { this._joyId = null; this.axis = 0; this._drawThumb(this._joy.x, this._joy.y); }
      if (p.id === this._jumpId) { this._jumpId = null; this._drawJump(false); }
    });
  }

  _updateAxis(p) {
    const dx = p.x - this._joy.x;
    const cx = Phaser.Math.Clamp(dx, -this._joy.r, this._joy.r);
    const cy = Phaser.Math.Clamp(p.y - this._joy.y, -this._joy.r, this._joy.r);
    this.axis = Math.abs(dx) < 12 ? 0 : cx / this._joy.r;
    this._drawThumb(this._joy.x + cx, this._joy.y + cy);
  }

  consumeJump() { const j = this._jump; this._jump = false; return j; }
  get left() { return this.axis < -0.25; }
  get right() { return this.axis > 0.25; }
}
