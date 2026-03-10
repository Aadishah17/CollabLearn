const test = require('node:test');
const assert = require('node:assert/strict');

const access = require('../src/config/access');

test('default super-admin email always receives admin access', () => {
  const profile = access.getAccessProfile('shahaadi285@gmail.com', 'user');

  assert.equal(profile.isSuperAdmin, true);
  assert.equal(profile.role, 'admin');
  assert.equal(profile.accessLevel, 'super-admin');
});

test('non-privileged emails keep requested user access', () => {
  const profile = access.getAccessProfile('learner@example.com', 'user');

  assert.equal(profile.isSuperAdmin, false);
  assert.equal(profile.role, 'user');
});

test('SUPER_ADMIN_EMAILS extends the allow list', () => {
  const original = process.env.SUPER_ADMIN_EMAILS;

  process.env.SUPER_ADMIN_EMAILS = 'extra-admin@example.com';

  try {
    assert.equal(access.isSuperAdminEmail('extra-admin@example.com'), true);
  } finally {
    if (original === undefined) {
      delete process.env.SUPER_ADMIN_EMAILS;
    } else {
      process.env.SUPER_ADMIN_EMAILS = original;
    }
  }
});
