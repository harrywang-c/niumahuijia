const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    throw err;
  }
}

test('project no longer contains the mobile portrait prototype', () => {
  assert.equal(fs.existsSync(path.join(root, 'mobile-portrait-demo')), false);
});

test('test suite no longer contains mobile portrait tests', () => {
  const mobileTests = fs.readdirSync(__dirname)
    .filter((file) => file.startsWith('mobile-') && file.endsWith('.test.js'));

  assert.deepEqual(mobileTests, []);
});
