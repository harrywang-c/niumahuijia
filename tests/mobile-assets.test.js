const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'mobile-portrait-demo/assets/generated/manifest.json');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    throw err;
  }
}

test('generated mobile demo asset manifest declares all required game art', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.deepEqual(Object.keys(manifest).sort(), [
    'background',
    'house',
    'player',
    'portalBlue',
    'portalOrange',
    'spike',
    'tiles',
    'ui'
  ]);
  assert.deepEqual(Object.keys(manifest.ui).sort(), ['ink', 'jump', 'left', 'portal', 'right']);
});

test('generated asset manifest points to existing PNG files', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const files = [
    manifest.background,
    manifest.house,
    manifest.player,
    manifest.portalBlue,
    manifest.portalOrange,
    manifest.spike,
    manifest.tiles,
    ...Object.values(manifest.ui)
  ];

  for (const file of files) {
    assert.equal(path.extname(file), '.png');
    assert.ok(fs.existsSync(path.join(root, 'mobile-portrait-demo', file)), file);
  }
});
