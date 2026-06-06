class GuardSystem {
  constructor(scene) {
    this.scene = scene;
    this.guards = [];
    this.visionGfx = scene.add.graphics().setDepth(6);
  }

  // facing: 'left' | 'right', patrolDist: px each side (0 = stationary)
  addGuard(x, y, facing, visionRange, halfAngleDeg, patrolDist) {
    const sprite = this.scene.add.image(x, y, 'cowboy')
      .setScale(1.5).setDepth(7);
    if (facing === 'left') sprite.setFlipX(true);
    this.guards.push({
      sprite, x, y, facing,
      range: visionRange || 150,
      halfAngle: Phaser.Math.DegToRad(halfAngleDeg || 45),
      startX: x,
      patrolDist: patrolDist || 0,
      patrolSpeed: 0.9,
      patrolDir: facing === 'right' ? 1 : -1
    });
  }

  update() {
    this.visionGfx.clear();
    if (this.scene._winning || this.scene._resetting) return;
    const { x: px, y: py } = this.scene.player;

    for (const g of this.guards) {
      // Patrol movement
      if (g.patrolDist > 0) {
        g.x += g.patrolSpeed * g.patrolDir;
        if (Math.abs(g.x - g.startX) >= g.patrolDist) {
          g.patrolDir *= -1;
          g.facing = g.patrolDir > 0 ? 'right' : 'left';
          g.sprite.setFlipX(g.facing === 'left');
        }
        g.sprite.setX(g.x);
      }

      this._drawCone(g);
      if (this._sees(g, px, py)) {
        this.scene._resetLevel();
        return;
      }
    }
  }

  _drawCone(g) {
    const base = g.facing === 'right' ? 0 : Math.PI;
    const STEPS = 16;
    this.visionGfx.fillStyle(0xffff00, 0.16);
    this.visionGfx.beginPath();
    this.visionGfx.moveTo(g.x, g.y);
    for (let i = 0; i <= STEPS; i++) {
      const a = base - g.halfAngle + (g.halfAngle * 2 * i / STEPS);
      this.visionGfx.lineTo(
        g.x + Math.cos(a) * g.range,
        g.y + Math.sin(a) * g.range
      );
    }
    this.visionGfx.closePath();
    this.visionGfx.fillPath();

    this.visionGfx.lineStyle(1.5, 0xffff00, 0.45);
    this.visionGfx.beginPath();
    this.visionGfx.moveTo(g.x, g.y);
    for (let i = 0; i <= STEPS; i++) {
      const a = base - g.halfAngle + (g.halfAngle * 2 * i / STEPS);
      this.visionGfx.lineTo(
        g.x + Math.cos(a) * g.range,
        g.y + Math.sin(a) * g.range
      );
    }
    this.visionGfx.closePath();
    this.visionGfx.strokePath();
  }

  _sees(g, px, py) {
    const dx = px - g.x, dy = py - g.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > g.range) return false;

    const base = g.facing === 'right' ? 0 : Math.PI;
    let diff = Math.atan2(dy, dx) - base;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > g.halfAngle) return false;

    // Ink occlusion check
    return !this._inkBlocks(g.x, g.y, px, py);
  }

  _inkBlocks(x1, y1, x2, y2) {
    if (!this.scene.inkSystem) return false;
    for (const { body } of this.scene.inkSystem.inkBodies) {
      if (!body || !body.position) continue;
      if (this._segCircle(x1, y1, x2, y2, body.position.x, body.position.y, 20))
        return true;
    }
    return false;
  }

  _segCircle(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1, dy = y2 - y1;
    const fx = x1 - cx, fy = y1 - cy;
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - r * r;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return false;
    const sq = Math.sqrt(disc);
    const t1 = (-b - sq) / (2 * a), t2 = (-b + sq) / (2 * a);
    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
  }
}
