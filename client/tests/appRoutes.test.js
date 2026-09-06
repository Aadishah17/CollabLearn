import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

test('dashboard route is restricted to user accounts', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'src/App.jsx'), 'utf8');

  assert.match(
    appSource,
    /<Route\s+path="\/dashboard"\s+element={\s*<ProtectedRoute requiredRole="user">\s*<Dashboard \/>\s*<\/ProtectedRoute>\s*}\s*\/>/
  );
});

test('guest-facing competition and career routes are registered in the public router', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'src/App.jsx'), 'utf8');

  assert.match(appSource, /<Route path="\/competitions" element={<CompetitionsPage \/>} \/>/);
  assert.match(
    appSource,
    /<Route path="\/competitions\/:slug" element={<CompetitionDetailPage \/>} \/>/
  );
  assert.match(appSource, /<Route path="\/career" element={<CareerPage \/>} \/>/);
  assert.match(appSource, /<Route path="\/career\/:trackSlug" element={<CareerTrackPage \/>} \/>/);
});
