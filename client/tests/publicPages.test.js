import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findPublicItemBySlug,
  normalizePublicCollection,
  resolvePublicPageCta,
} from '../src/components/public/publicContent.js';

test('normalizePublicCollection prefers explicit collection keys', () => {
  const payload = {
    competitions: [{ slug: 'frontend-founders-cup' }],
    items: [{ slug: 'ignored' }],
  };

  assert.deepEqual(
    normalizePublicCollection(payload, ['competitions', 'items']),
    payload.competitions
  );
});

test('findPublicItemBySlug matches slug aliases and identifiers', () => {
  const items = [
    { slug: 'career-launch', id: 'not-this-one' },
    { trackSlug: 'product-design', _id: 'track-2' },
    { id: 'fallback-id', name: 'Fallback' },
  ];

  assert.equal(findPublicItemBySlug(items, 'product-design'), items[1]);
  assert.equal(findPublicItemBySlug(items, 'fallback-id'), items[2]);
});

test('resolvePublicPageCta sends guests to signup and sessions to the workspace entry', () => {
  assert.deepEqual(
    resolvePublicPageCta({ hasSession: false, userRole: null, isSuperAdmin: false }),
    { path: '/signup', label: 'Get started' }
  );

  assert.deepEqual(
    resolvePublicPageCta({ hasSession: true, userRole: 'admin', isSuperAdmin: true }),
    { path: '/browse-skills', label: 'Open learning site' }
  );
});
