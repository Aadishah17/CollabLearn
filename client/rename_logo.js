const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'src/assets/Collablearn Logo.png');
const dest = path.join(__dirname, 'src/assets/collablearn_logo.png');
try {
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('Copied successfully');
    } else {
        console.log('Source file not found:', src);
    }
} catch (e) {
    console.error('Error:', e);
}
