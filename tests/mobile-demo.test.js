const assert = require('node:assert/strict');
const { createMobileLayout } = require('../mobile-portrait-demo/src/mobileLayout.js');
const { createTouchControlState } = require('../mobile-portrait-demo/src/touchControlState.js');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    throw err;
  }
}

test('mobile layout reserves bottom controls and keeps play touches above them', () => {
  const layout = createMobileLayout(540, 960);

  assert.equal(layout.width, 540);
  assert.equal(layout.height, 960);
  assert.equal(layout.controls.top, 744);
  assert.equal(layout.isPlayArea(270, 420), true);
  assert.equal(layout.isPlayArea(270, 880), false);
});

test('mobile layout classifies the core touch controls', () => {
  const layout = createMobileLayout(540, 960);

  assert.equal(layout.getControlAt(72, 858), 'left');
  assert.equal(layout.getControlAt(178, 858), 'right');
  assert.equal(layout.getControlAt(432, 858), 'jump');
  assert.equal(layout.getControlAt(474, 682), 'portal');
  assert.equal(layout.getControlAt(474, 594), 'ink');
  assert.equal(layout.getControlAt(270, 420), null);
});

test('mobile layout scales controls for a narrow phone viewport', () => {
  const layout = createMobileLayout(390, 844);

  assert.equal(layout.controls.top, 654);
  assert.equal(layout.isPlayArea(195, 620), true);
  assert.equal(layout.isPlayArea(195, 780), false);
  assert.equal(layout.getControlAt(52, 755), 'left');
  assert.equal(layout.getControlAt(314, 755), 'jump');
});

test('touch control state releases the original control even when finger ends elsewhere', () => {
  const state = createTouchControlState();

  assert.equal(state.press(7, 'left'), true);
  assert.equal(state.isDown('left'), true);
  assert.equal(state.release(7), 'left');
  assert.equal(state.isDown('left'), false);
});

test('touch control state keeps separate fingers independent', () => {
  const state = createTouchControlState();

  state.press(1, 'left');
  state.press(2, 'jump');
  state.release(1);

  assert.equal(state.isDown('left'), false);
  assert.equal(state.isDown('jump'), true);
  assert.equal(state.release(2), 'jump');
  assert.equal(state.isDown('jump'), false);
});
