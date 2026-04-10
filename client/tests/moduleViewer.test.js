import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildModuleViewTarget,
  getModuleEditPath,
  getModuleFixtureFromSearchParams,
  getModuleViewPath,
  isPretextModule,
  resolveModuleViewerState,
} from '../src/utils/moduleViewer.js';

test('resolveModuleViewerState renders pretext modules in iframe mode', () => {
  const state = resolveModuleViewerState({
    _id: 'module-1',
    title: 'PreTeXt module',
    contentType: 'pretext',
    contentUrl: '/pretext/collablearn-intro.html',
  });

  assert.equal(state.mode, 'iframe');
  assert.equal(state.src, '/pretext/collablearn-intro.html');
});

test('resolveModuleViewerState falls back to inline html for regular modules', () => {
  const state = resolveModuleViewerState({
    _id: 'module-2',
    title: 'Rich text module',
    content: '<h1>Hello</h1>',
  });

  assert.equal(state.mode, 'html');
  assert.equal(state.html, '<h1>Hello</h1>');
});

test('module viewer helpers return the expected module paths', () => {
  assert.equal(getModuleViewPath('abc123'), '/modules/abc123/view');
  assert.equal(getModuleEditPath('abc123'), '/modules/abc123');
  assert.equal(isPretextModule({ contentType: 'pretext' }), true);
  assert.equal(isPretextModule({ contentType: 'richtext' }), false);
});

test('fixture modules can round-trip through a reload-safe viewer target', () => {
  const target = buildModuleViewTarget({
    _id: 'demo-1',
    title: 'Fixture module',
    description: 'Available without API data',
    fixture: true,
    content: '<h1>Fixture lesson</h1>',
  });

  assert.equal(target.pathname, '/modules/demo-1/view');
  const moduleData = getModuleFixtureFromSearchParams(new URLSearchParams(target.search));

  assert.equal(moduleData?.fixture, true);
  assert.equal(moduleData?.title, 'Fixture module');
  assert.equal(moduleData?.contentType, 'richtext');
  assert.equal(moduleData?.content, '<h1>Fixture lesson</h1>');
});

test('fixture pretext modules preserve their exported lesson source url', () => {
  const target = buildModuleViewTarget({
    _id: 'demo-pretext',
    title: 'PreTeXt fixture',
    fixture: true,
    contentType: 'pretext',
    contentUrl: '/pretext/collablearn-intro.html',
  });

  const moduleData = getModuleFixtureFromSearchParams(new URLSearchParams(target.search));

  assert.equal(moduleData?.contentType, 'pretext');
  assert.equal(moduleData?.contentUrl, '/pretext/collablearn-intro.html');
});
