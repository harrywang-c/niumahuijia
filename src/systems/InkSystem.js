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
    this.previewGfx.lineStyle(10, 0x111111, 0.8);
    this.previewGfx.beginPath();
    this.previewGfx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++)
      this.previewGfx.lineTo(this.points[i].x, this.points[i].y);
    this.previewGfx.strokePath();
  }

  _solidify() {
    if (this.points.length < 2) return;
    const THICKNESS = 12;

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

      // Draw permanent ink visual (static graphics, updated each frame)
      const gfx = this.scene.add.graphics().setDepth(5);
      gfx.fillStyle(0x111111, 0.95);
      gfx.fillRect(-segLen / 2 - 1, -THICKNESS / 2 - 1, segLen + 2, THICKNESS + 2);
      // Ink texture noise
      gfx.fillStyle(0x000000, 0.4);
      gfx.fillRect(-segLen / 4, -THICKNESS / 2, segLen / 6, THICKNESS);

      this.inkBodies.push({ body, gfx, segLen, THICKNESS });
    }
  }

  getRatio() {
    return Math.max(0, 1 - this.usedInk / this.maxInk);
  }

  update() {
    // Sync ink visuals with physics body positions
    for (const { body, gfx } of this.inkBodies) {
      if (body && body.position) {
        gfx.setPosition(body.position.x, body.position.y);
        gfx.setRotation(body.angle);
      }
    }
  }
}
