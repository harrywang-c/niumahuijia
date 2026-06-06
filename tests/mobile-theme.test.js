const assert = require('node:assert/strict');
const { NIGHT_COMMUTE_THEME } = require('../mobile-portrait-demo/src/theme.js');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    throw err;
  }
}

test('night commute theme exposes a cohesive pixel art palette', () => {
  assert.equal(NIGHT_COMMUTE_THEME.name, 'night-commute');
  assert.deepEqual(Object.keys(NIGHT_COMMUTE_THEME.palette).sort(), [
    'button',
    'buttonActive',
    'city',
    'ground',
    'groundDark',
    'homeGlow',
    'ink',
    'mountainFar',
    'mountainNear',
    'panel',
    'portalBlue',
    'portalOrange',
    'skyBottom',
    'skyTop',
    'text',
    'warning'
  ]);
});

test('night commute theme keeps the strongest accents for portal colors', () => {
  const { palette } = NIGHT_COMMUTE_THEME;

  assert.equal(palette.portalBlue, 0x46a6ff);
  assert.equal(palette.portalOrange, 0xffa332);
  assert.notEqual(palette.homeGlow, palette.warning);
});
