// KPI/OKR/DDL 从天而降系统（从 DebugPortalLevelScene 抽出，全关卡通用）。
// 用法：new WorkloadSystem(scene, dropsConfig)；在 scene.update() 里调 update()。
// 砸中玩家 → scene._resetLevel()。掉落物 body 的 label 为 'workload'（传送带逻辑会识别）。
class WorkloadSystem {
  constructor(scene, drops) {
    this.scene = scene;
    this.drops = drops || [];
    this.timers = [];
    for (const d of this.drops) this._schedule(d);
  }

  _schedule(drop) {
    const spawn = () => {
      if (this.scene._winning || this.scene._resetting) return;
      this._warn(drop);
      this.scene.time.delayedCall(drop.warn || 850, () => this._spawn(drop));
    };
    this.scene.time.delayedCall(drop.delay || 500, spawn);
    this.timers.push(this.scene.time.addEvent({
      delay: drop.every, loop: true, callback: spawn,
    }));
  }

  _warn(drop) {
    this._maybeShowHint();
    const marker = this.scene.add.graphics().setDepth(6);
    const x0 = drop.x - drop.w / 2;
    marker.fillStyle(0xff3030, 0.28);
    marker.fillRect(x0, drop.landY - 6, drop.w, 6);
    marker.lineStyle(2, 0xff5050, 0.9);
    marker.strokeRect(x0, drop.landY - 6, drop.w, 6);
    const cy = drop.landY - 40;
    marker.fillStyle(0xff5050, 0.9);
    marker.fillTriangle(drop.x - 9, cy, drop.x + 9, cy, drop.x, cy + 12);
    this.scene.tweens.add({
      targets: marker, alpha: 0.15, duration: (drop.warn || 850) / 3, yoyo: true, repeat: -1,
    });
    this.scene.time.delayedCall(drop.warn || 850, () => marker.destroy());
  }

  // One-time per session: warn the player about falling workload.
  _maybeShowHint() {
    if (window.__dropHintShown) return;
    window.__dropHintShown = true;
    const W = this.scene.scale.width;
    const CHS = '"Microsoft YaHei","PingFang SC",Arial,sans-serif';
    const t = this.scene.add.text(W / 2, 92, '⚠ 当心头顶！别被砸下来的 KPI 砸到', {
      fontSize: '20px', color: '#ffd7d7', fontFamily: CHS, fontStyle: 'bold',
      backgroundColor: '#3a0d0dcc', padding: { left: 14, right: 14, top: 8, bottom: 8 },
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
    this.scene.tweens.add({ targets: t, alpha: 0, delay: 3000, duration: 800, onComplete: () => t.destroy() });
  }

  _spawn(drop) {
    if (this.scene._winning || this.scene._resetting) return;
    const body = this.scene.matter.add.rectangle(drop.x, -40, drop.w, drop.h, {
      label: 'workload', friction: 0.04, restitution: 0.08,
    });
    const text = this.scene.add.text(drop.x, -40, drop.text, {
      fontSize: `${drop.fontSize || 17}px`,
      color: '#cc2222',
      fontFamily: 'Arial Black,Arial,sans-serif',
      backgroundColor: '#f6dfb8',
      padding: { left: 6, right: 6, top: 3, bottom: 3 },
      stroke: '#5a2600',
      strokeThickness: 1,
    }).setOrigin(0.5).setDepth(8);

    body.plugin = body.plugin || {};
    body.plugin.debugText = text;
    body.plugin.kind = 'workload';
    body.plugin.slide = drop.slide || 0;
    body.plugin.prevBounds = this._cloneBounds(body.bounds);
    if (drop.slide) this.scene.matter.body.setVelocity(body, { x: drop.slide, y: 0 });

    this.scene.time.delayedCall(drop.life || 4600, () => {
      if (text && !text.destroyed) text.destroy();
      if (body && !body.isDestroyed) this.scene.matter.world.remove(body);
    });
  }

  update() {
    this._sync();
    this._checkHits();
  }

  _sync() {
    for (const body of this.scene.matter.world.getAllBodies()) {
      const text = body.plugin && body.plugin.debugText;
      if (!text || text.destroyed) continue;
      text.setPosition(body.position.x, body.position.y);
      text.setRotation(body.angle);
      if (body.plugin.slide && Math.abs(body.velocity.x) < Math.abs(body.plugin.slide) * 0.35) {
        this.scene.matter.body.setVelocity(body, { x: body.plugin.slide, y: body.velocity.y });
      }
    }
  }

  _checkHits() {
    const pb = this.scene.player && this.scene.player.body;
    if (!pb || !pb.bounds) return;
    for (const body of this.scene.matter.world.getAllBodies()) {
      if (body.label !== 'workload' || !body.bounds) continue;
      const swept = body.plugin && body.plugin.prevBounds
        ? this._boundsUnion(body.plugin.prevBounds, body.bounds)
        : body.bounds;
      if (this._boundsOverlap(pb.bounds, body.bounds) || this._boundsOverlap(pb.bounds, swept)) {
        this.scene._resetLevel();
        return;
      }
      body.plugin = body.plugin || {};
      body.plugin.prevBounds = this._cloneBounds(body.bounds);
    }
  }

  _boundsOverlap(a, b) {
    return a.min.x <= b.max.x && a.max.x >= b.min.x &&
           a.min.y <= b.max.y && a.max.y >= b.min.y;
  }
  _boundsUnion(a, b) {
    return {
      min: { x: Math.min(a.min.x, b.min.x), y: Math.min(a.min.y, b.min.y) },
      max: { x: Math.max(a.max.x, b.max.x), y: Math.max(a.max.y, b.max.y) },
    };
  }
  _cloneBounds(b) {
    return { min: { x: b.min.x, y: b.min.y }, max: { x: b.max.x, y: b.max.y } };
  }
}
