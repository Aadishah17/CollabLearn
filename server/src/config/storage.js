const fs = require('fs');
const path = require('path');

const isServerlessRuntime = () => Boolean(process.env.VERCEL || process.env.NETLIFY);

const uploadsPath = isServerlessRuntime()
  ? path.join('/tmp', 'collablearn-uploads')
  : path.join(__dirname, '..', '..', 'uploads');

const avatarUploadsPath = path.join(uploadsPath, 'avatars');
const sessionDocumentUploadsPath = path.join(uploadsPath, 'session-documents');

const ensureDirectory = (targetPath) => {
  try {
    fs.mkdirSync(targetPath, { recursive: true });
    return true;
  } catch (error) {
    if (['EACCES', 'ENOENT', 'EPERM', 'EROFS'].includes(error?.code)) {
      return false;
    }

    throw error;
  }
};

const ensureUploadDirectories = () => {
  ensureDirectory(uploadsPath);
  ensureDirectory(avatarUploadsPath);
  ensureDirectory(sessionDocumentUploadsPath);
};

module.exports = {
  avatarUploadsPath,
  ensureUploadDirectories,
  sessionDocumentUploadsPath,
  uploadsPath
};
