(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MobileLayout = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function createMobileLayout(width, height) {
    const controlHeight = Math.round(height * 0.225);
    const controlsTop = height - controlHeight;
    const pad = Math.round(width * 0.048);
    const button = Math.round(Math.min(width * 0.168, 78));
    const tool = Math.round(Math.min(width * 0.13, 62));
    const bottomY = height - Math.round(controlHeight * 0.46);

    const buttons = {
      left:   circle(pad + button * 0.55, bottomY, button * 0.56),
      right:  circle(pad + button * 1.9, bottomY, button * 0.56),
      jump:   circle(width - pad - button * 0.8, bottomY, button * 0.68),
      portal: circle(width - pad - tool * 0.55, controlsTop - Math.round(tool * 0.72), tool * 0.58),
      ink:    circle(width - pad - tool * 0.55, controlsTop - Math.round(tool * 2.15), tool * 0.58)
    };

    return {
      width,
      height,
      controls: { top: controlsTop, height: controlHeight },
      safe: { top: 24, bottom: 16 },
      buttons,
      isPlayArea(x, y) {
        return y >= 0 && y < controlsTop && getControlAt(buttons, x, y) === null;
      },
      getControlAt(x, y) {
        return getControlAt(buttons, x, y);
      }
    };
  }

  function circle(x, y, r) {
    return { x, y, r };
  }

  function getControlAt(buttons, x, y) {
    for (const name of ['left', 'right', 'jump', 'portal', 'ink']) {
      const c = buttons[name];
      const dx = x - c.x;
      const dy = y - c.y;
      if (Math.sqrt(dx * dx + dy * dy) <= c.r) return name;
    }
    return null;
  }

  return { createMobileLayout };
}));
