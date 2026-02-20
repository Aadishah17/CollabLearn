import { createServer } from 'vite';
import fs from 'fs';

async function start() {
  try {
    const server = await createServer({
      configFile: './vite.config.js',
      root: process.cwd(),
      server: {
        port: 5173,
      }
    });
    
    await server.listen();
    server.printUrls();
    fs.writeFileSync('./dev_log.txt', 'Server started successfully on port 5173');
  } catch (e) {
    fs.writeFileSync('./dev_log.txt', 'Error starting server: ' + (e.stack || e));
    process.exit(1);
  }
}

start();
