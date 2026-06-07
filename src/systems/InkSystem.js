const INK_COLORS = {
  preview: 0x1597ff,
  body: 0x1aaeff,
  shine: 0x8ee8ff,
  shadow: 0x07519c,
};

class InkSystem {
  constructor(scene, maxInk) {
    this.scene = scene;
    this.maxInk = maxInk;
    this.usedInk = 0;
    this.drawing = false;
    this.points = [];
    this.previewGfx = scene.add.graphics().setDepth(10);
    this.permanentGfx = scene.add.graphics().setDepth(5);
    this.inkBodies = [];  // Matter bodies for physics

    this._bindInput();
  }

  _bindInput() {
    const { input } = this.scene;

    input.on('pointerdown', (ptr) => {
      // On touch: only draw in 'ink' mode and not when grabbing an on-screen control.
      const t = this.scene.touch;
      if (t && t.enabled && (t.mode !== 'ink' || t.isOverControl(ptr.x, ptr.y))) return;
      if (ptr.leftButtonDown() && this.usedInk < this.maxInk && !this.scene._winning) {
        this.drawing = true;
        this.points = [];
        const wp = this.scene.cameras.main.getWorldPoint(ptr.x, ptr.y);
        this.points.push({ x: wp.x, y: wp.y });
      }
    });

    input.on('pointermove', (ptr) => {
      if (!this.drawing) return;
      const wp = this.scene.cameras.main.getWorldPoint(ptr.x, ptr.y);
      const last = this.points[this.points.length - 1];
      const dist = Phaser.Math.Distance.Between(last.x, last.y, wp.x, wp.y);
      if (dist > 5) {
        if (this.usedInk + dist > this.maxInk) {
          const remaining = this.maxInk - this.usedInk;
          if (remaining > 0) {
            const ratio = remaining / dist;
            this.points.push({
              x: last.x + (wp.x - last.x) * ratio,
              y: last.y + (wp.y - last.y) * ratio
            });
            this.usedInk = this.maxInk;
          }
          this.drawing = false;
          this._solidify();
          this.points = [];
          this.previewGfx.clear();
          return;
        }
        this.usedInk += dist;
        this.points.push({ x: wp.x, y: wp.y });
        this._drawPreview();
      }
    });

    input.on('pointerup', () => {
      if (this.drawing) {
        this.drawing = false;
        if (this.points.length >= 2) this._solidify();
        this.points = [];
        this.previewGfx.clear();
      }
    });
  }

  _drawPreview() {
    this.previewGfx.clear();
    this.previewGfx.lineStyle(14, INK_COLORS.shadow, 0.48);
    this._strokePreviewPath();
    this.previewGfx.lineStyle(10, INK_COLORS.preview, 0.82);
    this._strokePreviewPath();
    this.previewGfx.lineStyle(4, INK_COLORS.shine, 0.42);
    this._strokePreviewPath();
  }

  _strokePreviewPath() {
    this.previewGfx.beginPath();
    this.previewGfx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++)
      this.previewGfx.lineTo(this.points[i].x, this.points[i].y);
    this.previewGfx.strokePath();
  }

  _solidify() {
    if (this.points.length < 2) return;
    const THICKNESS = 12;

    // Ink is static, so it never moves — draw each segment ONCE into the shared
    // permanent graphics at world coordinates (no per-segment Graphics object,
    // no per-frame re-sync). This keeps long strokes cheap and avoids frame drops.
    for (let i = 0; i < this.points.length - 1; i++) {
      const a = this.points[i], b = this.points[i + 1];
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const segLen = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      if (segLen < 3) continue;

      const body = this.scene.matter.add.rectangle(cx, cy, segLen, THICKNESS, {
        isStatic: true,
        label: 'ink',
        angle,
        friction: 0.9,
        restitution: 0
      });

      const g = this.permanentGfx;
      g.save();
      g.translateCanvas(cx, cy);
      g.rotateCanvas(angle);
      g.fillStyle(INK_COLORS.shadow, 0.92);
      g.fillRoundedRect(-segLen / 2 - 2, -THICKNESS / 2 - 2, segLen + 4, THICKNESS + 4, 7);
      g.fillStyle(INK_COLORS.body, 0.96);
      g.fillRoundedRect(-segLen / 2, -THICKNESS / 2, segLen, THICKNESS, 6);
      g.fillStyle(INK_COLORS.shine, 0.34);
      g.fillRoundedRect(-segLen / 2 + 2, -THICKNESS / 2 + 1, Math.max(4, segLen - 4), 4, 2);
      g.restore();

      this.inkBodies.push({ body });
    }
  }

  getRatio() {
    return Math.max(0, 1 - this.usedInk / this.maxInk);
  }

  update() {
    // Ink bodies are static — nothing to sync per frame.
  }
}
