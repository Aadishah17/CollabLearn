import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

test('dashboard route is restricted to user accounts', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'src/App.jsx'), 'utf8');

  assert.match(
    appSource,
    /<Route path="\/dashboard" element={<ProtectedRoute requiredRole="user"><Dashboard \/><\/ProtectedRoute>} \/>/,
  );
});
