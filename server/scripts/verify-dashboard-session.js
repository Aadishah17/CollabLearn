const { spawn } = require('child_process');
const path = require('path');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const serverRoot = path.join(__dirname, '..');
const healthUrl = 'http://127.0.0.1:5001/api/health';
const dashboardUrl = 'http://127.0.0.1:5001/api/dashboard/stats';
const loginUrl = 'http://127.0.0.1:5001/api/auth/login';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForHealth(maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        return response.json();
      }
    } catch (_error) {
      // Keep waiting for the child process to bind the port.
    }

    await wait(500);
  }

  throw new Error('Server failed to start in time.');
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  return {
    status: response.status,
    ok: response.ok,
    payload
  };
}

async function main() {
  const child = spawn(process.execPath, ['src/index.js'], {
    cwd: serverRoot,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (chunk) => {
    stdout += String(chunk);
  });

  child.stderr.on('data', (chunk) => {
    stderr += String(chunk);
  });

  try {
    const health = await waitForHealth();
    const staleToken = jwt.sign(
      {
        userId: '000000000000000000000000',
        email: 'ghost@example.com',
        role: 'user'
      },
      String(process.env.JWT_SECRET || ''),
      { expiresIn: '1h' }
    );

    const staleSessionResult = await requestJson(dashboardUrl, {
      headers: {
        Authorization: `Bearer ${staleToken}`
      }
    });

    const loginResult = await requestJson(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'noah.learner@example.com',
        password: 'DemoPass123!',
        role: 'user'
      })
    });

    if (!loginResult.ok || !loginResult.payload?.token) {
      throw new Error(`Login verification failed with status ${loginResult.status}`);
    }

    const dashboardResult = await requestJson(dashboardUrl, {
      headers: {
        Authorization: `Bearer ${loginResult.payload.token}`
      }
    });

    console.log(
      JSON.stringify({
        healthStatus: health.status,
        staleStatus: staleSessionResult.status,
        staleMessage: staleSessionResult.payload?.message || null,
        loginSuccess: Boolean(loginResult.payload?.success),
        dashboardStatus: dashboardResult.status,
        dashboardSuccess: Boolean(dashboardResult.payload?.success),
        dashboardUser: dashboardResult.payload?.data?.user?.name || null,
        learningCount: Array.isArray(dashboardResult.payload?.data?.skills?.learning)
          ? dashboardResult.payload.data.skills.learning.length
          : 0
      })
    );
  } finally {
    child.kill('SIGTERM');
    await wait(500);

    if (!child.killed) {
      child.kill('SIGKILL');
    }

    if (stderr.trim()) {
      console.error(stderr.trim());
    }

    if (!stdout.includes('Server running on port')) {
      console.error(stdout.trim());
    }
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
