const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const args = new Set(process.argv.slice(2));
const shouldCleanDependencies = args.has('--deps');

const removed = [];
const failures = [];

function toRelative(targetPath) {
  return path.relative(projectRoot, targetPath) || '.';
}

function removePath(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
    removed.push(toRelative(targetPath));
  } catch (error) {
    failures.push({ path: toRelative(targetPath), message: error.message });
  }
}

function removeRootGeneratedLogs() {
  for (const entry of fs.readdirSync(projectRoot, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue;
    }

    if (entry.name.endsWith('.log')) {
      removePath(path.join(projectRoot, entry.name));
    }
  }
}

function removeDirectoryLogs(relativeDir) {
  const targetDir = path.join(projectRoot, relativeDir);
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    return;
  }

  for (const entry of fs.readdirSync(targetDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.log')) {
      removePath(path.join(targetDir, entry.name));
    }
  }
}

removeRootGeneratedLogs();
removeDirectoryLogs('output');
removePath(path.join(projectRoot, 'tmp'));
removePath(path.join(projectRoot, 'temp'));

if (shouldCleanDependencies) {
  removePath(path.join(projectRoot, 'node_modules'));
  removePath(path.join(projectRoot, 'client', 'node_modules'));
  removePath(path.join(projectRoot, 'server', 'node_modules'));
}

if (removed.length === 0) {
  console.log('No generated artifacts were removed.');
} else {
  console.log('Removed generated artifacts:');
  for (const target of removed) {
    console.log(`- ${target}`);
  }
}

if (shouldCleanDependencies) {
  console.log('Dependency cleanup enabled (--deps).');
}

if (failures.length > 0) {
  console.error('Failed to remove some paths:');
  for (const failure of failures) {
    console.error(`- ${failure.path}: ${failure.message}`);
  }
  process.exitCode = 1;
}
