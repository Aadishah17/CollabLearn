const test = require('node:test');
const assert = require('node:assert/strict');

const app = require('../src/index');

const requestJson = async (server, path) => {
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}${path}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });
  const body = await response.json();

  return { response, body };
};

test('GET /api/public/competitions returns fixture-backed public listings', async () => {
  const server = app.listen(0);

  try {
    const { response, body } = await requestJson(server, '/api/public/competitions');

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.competitions));
    assert.ok(body.competitions.length > 0);
    assert.equal(body.competitions[0].slug, 'frontend-founders-cup');
    assert.equal(body.competitions[0].status, 'live');
    assert.ok(body.competitions[0].sourceUrl);
    assert.ok(body.competitions[0].timing);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /api/public/competitions/:slug returns a public competition detail payload', async () => {
  const server = app.listen(0);

  try {
    const { response, body } = await requestJson(
      server,
      '/api/public/competitions/frontend-founders-cup'
    );

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.competition.slug, 'frontend-founders-cup');
    assert.equal(body.competition.status, 'live');
    assert.ok(body.competition.summary);
    assert.ok(body.competition.prize);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /api/public/career/tracks/:slug returns a public track detail payload', async () => {
  const server = app.listen(0);

  try {
    const { response, body } = await requestJson(
      server,
      '/api/public/career/tracks/full-stack-react'
    );

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.track.slug, 'full-stack-react');
    assert.ok(Array.isArray(body.track.linkedSkills));
    assert.ok(Array.isArray(body.track.linkedCourses));
    assert.ok(Array.isArray(body.track.linkedModules));
    assert.ok(body.track.roleSummary);
    assert.ok(body.track.hiringAdvice);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /api/public/career/tracks returns fixture-backed public track listings', async () => {
  const server = app.listen(0);

  try {
    const { response, body } = await requestJson(server, '/api/public/career/tracks');

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.tracks));
    assert.ok(body.tracks.length > 0);
    assert.equal(body.tracks[0].slug, 'full-stack-react');
    assert.ok(body.tracks[0].roleSummary);
    assert.ok(Array.isArray(body.tracks[0].linkedSkills));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /api/public/counsellors returns booking-oriented public profiles', async () => {
  const server = app.listen(0);

  try {
    const { response, body } = await requestJson(server, '/api/public/counsellors');

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.counsellors));
    assert.ok(body.counsellors.length > 0);
    assert.ok(body.counsellors[0].bio);
    assert.ok(Array.isArray(body.counsellors[0].specialties));
    assert.ok(body.counsellors[0].cta);
    assert.ok(body.counsellors[0].cta.label);
    assert.ok(body.counsellors[0].cta.target);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
