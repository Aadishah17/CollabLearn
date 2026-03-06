import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const src = path.join(__dirname, 'src/assets/Collablearn Logo.png');
const dest = path.join(__dirname, 'src/assets/collablearn_logo.png');
try {
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('Copied successfully');
    } else {
        console.log('Source file not found:', src);
    }
} catch (error) {
    console.error('Error:', error);
}
