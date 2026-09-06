const test = require('node:test');
const assert = require('node:assert/strict');

const { MODULE_CONTENT_TYPES, normalizeModuleInput } = require('../src/utils/moduleContent');

test('normalizeModuleInput defaults to richtext content and trims common fields', () => {
  const normalized = normalizeModuleInput({
    title: '  Sprint Notes  ',
    description: '  Weekly review  ',
    content: '  <h1>Hello</h1>  ',
    tags: [' react ', ' notes ', 'react'],
    visibility: 'public',
  });

  assert.equal(normalized.title, 'Sprint Notes');
  assert.equal(normalized.description, 'Weekly review');
  assert.equal(normalized.contentType, 'richtext');
  assert.equal(normalized.contentUrl, '');
  assert.equal(normalized.content, '<h1>Hello</h1>');
  assert.deepEqual(normalized.tags, ['react', 'notes']);
});

test('normalizeModuleInput keeps a pretext content url and strips editor html payload', () => {
  const normalized = normalizeModuleInput({
    title: 'PreTeXt lesson',
    description: 'Structured lesson',
    contentType: 'pretext',
    contentUrl: '  /pretext/collablearn-intro.html  ',
    content: '<p>should not be stored as main body</p>',
    tags: ['pretext', 'lesson'],
  });

  assert.equal(normalized.contentType, 'pretext');
  assert.equal(normalized.contentUrl, '/pretext/collablearn-intro.html');
  assert.equal(normalized.content, '');
});

test('module content types exposes the supported values', () => {
  assert.deepEqual(MODULE_CONTENT_TYPES, ['richtext', 'pretext']);
});
