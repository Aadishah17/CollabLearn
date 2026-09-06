const { execSync } = require('child_process');

delete process.env.npm_config_allow_scripts;

try {
  execSync('npm audit --omit=dev', { stdio: 'inherit' });
} catch (err) {
  process.exit(err.status || 1);
}
