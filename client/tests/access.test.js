import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ADMIN_ROLE,
  USER_ROLE,
  canAccessRole,
  formatAccessLabel,
  normalizeStoredRole,
  resolveNextRoute,
} from '../src/auth/access.js';

test('normalizeStoredRole falls back to user for unknown roles', () => {
  assert.equal(normalizeStoredRole('something-else'), USER_ROLE);
});

test('resolveNextRoute keeps admin destinations for admins', () => {
  assert.equal(resolveNextRoute('/admin/settings', ADMIN_ROLE), '/admin/settings');
});

test('resolveNextRoute redirects non-admin users away from admin routes', () => {
  assert.equal(resolveNextRoute('/admin/settings', USER_ROLE), '/dashboard');
});

test('canAccessRole enforces admin routes correctly', () => {
  assert.equal(canAccessRole(ADMIN_ROLE, ADMIN_ROLE), true);
  assert.equal(canAccessRole(ADMIN_ROLE, USER_ROLE), false);
});

test('formatAccessLabel highlights super-admin sessions', () => {
  assert.equal(formatAccessLabel(USER_ROLE, true), 'Super Access');
  assert.equal(formatAccessLabel(ADMIN_ROLE, false), 'Admin Access');
});
