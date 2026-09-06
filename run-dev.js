const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'run-dev.log');
const logStream = fs.createWriteStream(logPath);

console.log('Starting servers...');
logStream.write(`--- Starting Servers at ${new Date().toISOString()} ---\n`);

// Use the explicit node and npm paths identified earlier
const nodePath = 'C:\\Program Files\\nodejs\\node.exe';
const npmPath = 'C:\\Program Files\\nodejs\\npm.cmd';

function run(name, cmd, args, cwd) {
  const proc = spawn(cmd, args, { cwd, shell: true });
  proc.stdout.on('data', (data) => {
    logStream.write(`[${name}] ${data}`);
  });
  proc.stderr.on('data', (data) => {
    logStream.write(`[${name}] ERROR: ${data}`);
  });
  proc.on('close', (code) => {
    logStream.write(`[${name}] Exited with code ${code}\n`);
  });
  return proc;
}

const serverProc = run('SERVER', npmPath, ['run', 'dev'], path.join(__dirname, 'server'));
const clientProc = run('CLIENT', npmPath, ['run', 'dev'], path.join(__dirname, 'client'));

process.on('SIGINT', () => {
  serverProc.kill();
  clientProc.kill();
  process.exit();
});

console.log(`Processes started. Logging to ${logPath}`);
setTimeout(() => {
  console.log('Stopping runner (processes will continue in background if shell allows)...');
  process.exit(0);
}, 10000);
