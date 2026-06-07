class PortalSystem {
  constructor(scene) {
    this.scene = scene;
    this.portals = [null, null];    // [{x,y,nx,ny}, null]
    this.visuals = [null, null];
    this.shotCount = 0;
    this._shootCooldown = false;
    this._teleportLock = false;
    this._stickPortal = null;       // the just-exited portal, disarmed until player slides off it

    scene.input.on('pointerdown', (ptr) => {
      if (ptr.rightButtonDown()) { this._shoot(ptr); return; }
      // On touch: a tap in 'portal' mode (not on a control) fires a portal.
      const t = this.scene.touch;
      if (t && t.enabled && t.mode === 'portal' && !t.isOverControl(ptr.x, ptr.y)) this._shoot(ptr);
    });
  }

  _shoot(ptr) {
    if (this._shootCooldown || this.scene._winning) return;
    this._shootCooldown = true;
    this.scene.time.delayedCall(280, () => { this._shootCooldown = false; });

    const cam = this.scene.cameras.main;
    const wp  = cam.getWorldPoint(ptr.x, ptr.y);
    const player = this.scene.player;
    const dx = wp.x - player.x, dy = wp.y - player.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const hit = this._raycast(player.x, player.y, dx / len, dy / len);
    if (!hit) return;

    // View-limit: can only shoot portals to surfaces visible on screen
    const margin = 60;
    if (hit.x < cam.scrollX - margin || hit.x > cam.scrollX + cam.width  + margin ||
        hit.y < cam.scrollY - margin || hit.y > cam.scrollY + cam.height + margin) {
      // Out of visible range — flash red and abort
      cam.flash(140, 160, 30, 30);
      return;
    }

    const idx = this.shotCount % 2;
    this.shotCount++;
    this._shootEffect(player.x, player.y - 10, hit.x, hit.y, idx);
    this._placePortal(idx, hit.x, hit.y, hit.nx, hit.ny);
  }

  _shootEffect(fromX, fromY, toX, toY, portalIdx) {
    const color = portalIdx === 0 ? 0x4488ff : 0xff8800;
    const gfx = this.scene.add.graphics().setDepth(12);
    // Beam
    gfx.lineStyle(2, color, 0.85);
    gfx.beginPath();
    gfx.moveTo(fromX, fromY);
    gfx.lineTo(toX, toY);
    gfx.strokePath();
    // Impact burst
    gfx.fillStyle(color, 0.9);
    gfx.fillCircle(toX, toY, 7);
    gfx.fillStyle(0xffffff, 0.7);
    gfx.fillCircle(toX, toY, 3);
    // Small sparks
    const ang = Math.atan2(toY - fromY, toX - fromX);
    for (let i = 0; i < 5; i++) {
      const sa = ang + (i - 2) * 0.5;
      gfx.fillStyle(color, 0.6);
      gfx.fillRect(toX + Math.cos(sa) * 6, toY + Math.sin(sa) * 6, 4, 4);
    }
    this.scene.tweens.add({
      targets: gfx, alpha: 0, duration: 260,
      ease: 'Quad.easeOut', onComplete: () => gfx.destroy()
    });
  }

  _raycast(ox, oy, dx, dy) {
    let bestT = 2200, bestHit = null;
    for (const body of this.scene.matter.world.getAllBodies()) {
      if (body.label === 'player') continue;
      if (!body.isStatic && body.label !== 'ink') continue;
      if (body.isSensor) continue;          // spikes/pits don't block portal shots
      // 'wall' bodies block portal shots just like ground — no skip here
      const hit = this._rayVsAABB(ox, oy, dx, dy, body.bounds);
      if (hit && hit.t > 5 && hit.t < bestT) {
        bestT = hit.t;
        bestHit = {
          x: ox + dx * hit.t,
          y: oy + dy * hit.t,
          nx: hit.nx, ny: hit.ny
        };
      }
    }
    return bestHit;
  }

  _rayVsAABB(ox, oy, dx, dy, bounds) {
    const { min, max } = bounds;
    let tmin = 0, tmax = Infinity, nx = 0, ny = 0;

    if (Math.abs(dx) > 1e-8) {
      let t1 = (min.x - ox) / dx, t2 = (max.x - ox) / dx;
      let snx = dx > 0 ? -1 : 1;
      if (t1 > t2) { [t1, t2] = [t2, t1]; snx = -snx; }
      if (t1 > tmin) { tmin = t1; nx = snx; ny = 0; }
      tmax = Math.min(tmax, t2);
    } else if (ox < min.x || ox > max.x) return null;

    if (Math.abs(dy) > 1e-8) {
      let t1 = (min.y - oy) / dy, t2 = (max.y - oy) / dy;
      let sny = dy > 0 ? -1 : 1;
      if (t1 > t2) { [t1, t2] = [t2, t1]; sny = -sny; }
      if (t1 > tmin) { tmin = t1; nx = 0; ny = sny; }
      tmax = Math.min(tmax, t2);
    } else if (oy < min.y || oy > max.y) return null;

    if (tmax < tmin || tmax < 0) return null;
    return { t: tmin < 0 ? tmax : tmin, nx, ny };
  }

  _placePortal(idx, x, y, nx, ny) {
    if (this.visuals[idx]) this.visuals[idx].destroy();
    this.portals[idx] = { x, y, nx, ny };

    const key   = idx === 0 ? 'portalBlue' : 'portalOrange';
    const angle = Math.atan2(ny, nx) + Math.PI / 2;
    const img   = this.scene.add.image(x, y, key)
      .setRotation(angle).setDepth(8).setAlpha(0).setScale(0.4);
    this.visuals[idx] = img;

    // Pop-in then pulse
    this.scene.tweens.add({
      targets: img, alpha: 0.95, scaleX: 1.15, scaleY: 1.15,
      duration: 180, ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: img, scaleX: 1.0, scaleY: 1.0,
          duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
      }
    });

    const flashR = idx === 0 ? 40 : 200;
    const flashG = idx === 0 ? 100 : 80;
    this.scene.cameras.main.flash(90, flashR, flashG, 255);
  }

  update() {
    if (!this.portals[0] || !this.portals[1]) { this._stickPortal = null; return; }
    const player = this.scene.player;

    // Re-arm the just-exited portal only after the player has slid off it (out of
    // its area). This kills the ping-pong: after teleporting onto a floor portal
    // you'd fall right back into it, but it stays disarmed until you walk away.
    if (this._stickPortal !== null && !this._nearPortal(this.portals[this._stickPortal], 84, 64)) {
      this._stickPortal = null;
    }

    let inside = null;
    if (this._isPlayerTouchingPortal(this.portals[0])) inside = 0;
    else if (this._isPlayerTouchingPortal(this.portals[1])) inside = 1;

    if (inside !== null && inside !== this._stickPortal && !this._teleportLock) {
      const p = this.portals[inside];
      const other = this.portals[1 - inside];
      this._teleportLock = true;
      this.scene.time.delayedCall(150, () => { this._teleportLock = false; });

      // Momentum-preserving teleport: speed INTO the entry surface is re-emitted
      // OUT along the exit normal; tangential speed is carried to the exit tangent.
      const v = player.body.velocity;
      const forward = -(v.x * p.nx + v.y * p.ny);
      const tang = v.x * (-p.ny) + v.y * p.nx;
      const outSpeed = Math.max(forward, 3);
      const otx = -other.ny, oty = other.nx;

      this.scene.matter.body.setPosition(player.body, {
        x: other.x + other.nx * 44,
        y: other.y + other.ny * 44
      });
      this.scene.matter.body.setVelocity(player.body, {
        x: other.nx * outSpeed + otx * tang,
        y: other.ny * outSpeed + oty * tang
      });

      this.scene.cameras.main.flash(100, 80, 60, 220);
      this._stickPortal = 1 - inside;  // disarm the exit until the player slides off it
    }
  }

  // Is the player within an expanded area around this portal (normal & tangent)?
  _nearPortal(portal, nMax, tMax) {
    const player = this.scene.player;
    const dx = player.x - portal.x;
    const dy = player.y - portal.y;
    const nd = dx * portal.nx + dy * portal.ny;
    const td = dx * -portal.ny + dy * portal.nx;
    return nd >= -12 && nd <= nMax && Math.abs(td) <= tMax;
  }

  _isPlayerTouchingPortal(portal) {
    const player = this.scene.player;
    const dx = player.x - portal.x;
    const dy = player.y - portal.y;
    const normalDist = dx * portal.nx + dy * portal.ny;
    const tangentDist = dx * -portal.ny + dy * portal.nx;

    return normalDist >= 0 &&
           normalDist <= 40 &&
           Math.abs(tangentDist) <= 56;
  }
}
