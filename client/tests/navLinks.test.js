import test from 'node:test';
import assert from 'node:assert/strict';

import { ADMIN_ROLE, USER_ROLE } from '../src/auth/access.js';
import {
  buildMainNavLinks,
  buildPublicDiscoveryLinks,
  resolveAdminWebsiteRoute,
  resolveMainNavbarHomePath,
  resolvePublicWebsiteEntry,
} from '../src/navbar/navLinks.js';

test('buildMainNavLinks hides learner dashboard links for admin sessions', () => {
  const memberPaths = buildMainNavLinks({
    isPremium: true,
    isSuperAdmin: false,
    userRole: USER_ROLE,
  }).map((link) => link.path);

  const adminLinks = buildMainNavLinks({
    isPremium: false,
    isSuperAdmin: true,
    userRole: ADMIN_ROLE,
  });
  const adminPaths = adminLinks.map((link) => link.path);

  assert.ok(memberPaths.includes('/dashboard'));
  assert.ok(!adminPaths.includes('/dashboard'));
  assert.ok(!adminPaths.includes('/get-premium'));
  assert.equal(adminLinks[0].path, '/admin');
});

test('resolveMainNavbarHomePath sends each session type to the correct home surface', () => {
  assert.equal(resolveMainNavbarHomePath({ isGuest: true, userRole: USER_ROLE }), '/');
  assert.equal(resolveMainNavbarHomePath({ isGuest: false, userRole: USER_ROLE }), '/dashboard');
  assert.equal(resolveMainNavbarHomePath({ isGuest: false, userRole: ADMIN_ROLE }), '/admin');
});

test('resolveAdminWebsiteRoute always returns the public site', () => {
  assert.equal(resolveAdminWebsiteRoute({ isSuperAdmin: false }), '/');
  assert.equal(resolveAdminWebsiteRoute({ isSuperAdmin: true }), '/');
});

test('resolvePublicWebsiteEntry keeps learners on the dashboard path', () => {
  assert.deepEqual(
    resolvePublicWebsiteEntry({
      hasSession: true,
      userRole: USER_ROLE,
      isSuperAdmin: false,
    }),
    {
      path: '/dashboard',
      label: 'Open dashboard',
    }
  );
});

test('resolvePublicWebsiteEntry gives super admins a learner-safe website entry point', () => {
  assert.deepEqual(
    resolvePublicWebsiteEntry({
      hasSession: true,
      userRole: ADMIN_ROLE,
      isSuperAdmin: true,
    }),
    {
      path: '/browse-skills',
      label: 'Open learning site',
    }
  );
});

test('resolvePublicWebsiteEntry sends non-super admins back to admin console', () => {
  assert.deepEqual(
    resolvePublicWebsiteEntry({
      hasSession: true,
      userRole: ADMIN_ROLE,
      isSuperAdmin: false,
    }),
    {
      path: '/admin',
      label: 'Return to admin console',
    }
  );
});

test('buildPublicDiscoveryLinks exposes competitions and career discovery routes', () => {
  const links = buildPublicDiscoveryLinks();

  assert.deepEqual(
    links.map((link) => link.path),
    ['/competitions', '/career']
  );
  assert.equal(links[0].label, 'Competitions');
  assert.equal(links[1].label, 'Career');
});
