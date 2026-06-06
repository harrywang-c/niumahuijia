(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TouchControlState = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function createTouchControlState() {
    const active = new Map();
    const downCounts = new Map();

    return {
      press(pointerId, control) {
        if (!control || active.has(pointerId)) return false;
        active.set(pointerId, control);
        downCounts.set(control, (downCounts.get(control) || 0) + 1);
        return true;
      },
      release(pointerId) {
        if (!active.has(pointerId)) return null;
        const control = active.get(pointerId);
        active.delete(pointerId);
        const next = (downCounts.get(control) || 1) - 1;
        if (next > 0) downCounts.set(control, next);
        else downCounts.delete(control);
        return control;
      },
      isDown(control) {
        return (downCounts.get(control) || 0) > 0;
      }
    };
  }

  return { createTouchControlState };
}));
