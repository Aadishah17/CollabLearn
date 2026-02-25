const fs = require('fs');

try {
  fs.rmSync('c:/Users/sseja/OneDrive/Desktop/CollabLearn/client/node_modules', { recursive: true, force: true });
  console.log('Client node_modules deleted.');
} catch (e) {
  console.error('Error deleting client node_modules:', e.message);
}

try {
  fs.rmSync('c:/Users/sseja/OneDrive/Desktop/CollabLearn/server/node_modules', { recursive: true, force: true });
  console.log('Server node_modules deleted.');
} catch (e) {
  console.error('Error deleting server node_modules:', e.message);
}

// Also recreate separate directories in D drive
try {
  fs.mkdirSync('D:/CollabLearn_Deps_Client', { recursive: true });
  fs.mkdirSync('D:/CollabLearn_Deps_Server', { recursive: true });
  console.log('D drive directories created.');
} catch (e) {
  console.error(e.message);
}

fs.writeFileSync('c:/Users/sseja/OneDrive/Desktop/CollabLearn/client/install.bat', `@echo off\nSET "NODE_PATH=C:\\Program Files\\nodejs"\nSET "PATH=%NODE_PATH%;%PATH%"\ncall npm install --legacy-peer-deps\n`);
fs.writeFileSync('c:/Users/sseja/OneDrive/Desktop/CollabLearn/server/install.bat', `@echo off\nSET "NODE_PATH=C:\\Program Files\\nodejs"\nSET "PATH=%NODE_PATH%;%PATH%"\ncall npm install\n`);
