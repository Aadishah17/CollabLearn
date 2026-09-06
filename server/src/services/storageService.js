const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { avatarUploadsPath, sessionDocumentUploadsPath, uploadsPath } = require('../config/storage');

const getStorageProvider = () => {
  if (process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID) {
    return 's3';
  }
  if (
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)
  ) {
    return 'cloudinary';
  }
  return 'disk';
};

class StorageService {
  constructor() {
    this.provider = getStorageProvider();
  }

  getProviderName() {
    return getStorageProvider();
  }

  /**
   * Resolves appropriate local folder target based on category
   */
  resolveLocalTargetDirectory(folder = 'misc') {
    if (folder === 'avatars') return avatarUploadsPath;
    if (folder === 'session-documents') return sessionDocumentUploadsPath;
    const target = path.join(uploadsPath, folder);
    try {
      fs.mkdirSync(target, { recursive: true });
    } catch (_err) {
      // Ignored if directory already exists or filesystem is read-only
    }
    return target;
  }

  /**
   * Upload file to configured storage provider
   */
  async upload({ buffer, filename, mimetype, folder = 'misc' }) {
    const provider = this.getProviderName();
    const safeHash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(filename || '') || '.bin';
    const baseName = path.basename(filename || 'upload', ext);
    const key = `${folder}/${Date.now()}-${safeHash}-${baseName}${ext}`;

    if (provider === 's3') {
      const bucket = process.env.AWS_S3_BUCKET;
      const region = process.env.AWS_REGION || 'us-east-1';
      // S3 upload simulation / client hook
      console.log(`[Storage:S3] Uploading ${key} to bucket ${bucket} (${buffer.length} bytes)`);
      const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
      return {
        key,
        url,
        provider: 's3',
        size: buffer.length,
        mimetype,
      };
    }

    if (provider === 'cloudinary') {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'collablearn';
      console.log(
        `[Storage:Cloudinary] Uploading ${key} to cloud ${cloudName} (${buffer.length} bytes)`
      );
      const url = `https://res.cloudinary.com/${cloudName}/image/upload/v1/${key}`;
      return {
        key,
        url,
        provider: 'cloudinary',
        size: buffer.length,
        mimetype,
      };
    }

    // Default Local Disk Fallback
    const localDir = this.resolveLocalTargetDirectory(folder);
    const localFileName = `${Date.now()}-${safeHash}-${baseName}${ext}`;
    const localFilePath = path.join(localDir, localFileName);

    if (buffer) {
      await fs.promises.writeFile(localFilePath, buffer);
    }

    const publicUrl = `/uploads/${folder}/${localFileName}`;
    return {
      key: localFileName,
      url: publicUrl,
      localPath: localFilePath,
      provider: 'disk',
      size: buffer ? buffer.length : 0,
      mimetype,
    };
  }

  /**
   * Delete file from configured storage provider
   */
  async delete(fileKey, folder = 'misc', provider = this.getProviderName()) {
    if (!fileKey) return false;

    if (provider === 'disk') {
      try {
        const localDir = this.resolveLocalTargetDirectory(folder);
        const targetPath = path.join(localDir, path.basename(fileKey));
        if (fs.existsSync(targetPath)) {
          await fs.promises.unlink(targetPath);
          return true;
        }
      } catch (err) {
        console.warn(`[Storage:Disk] Failed to delete file ${fileKey}:`, err.message);
        return false;
      }
    }

    if (provider === 's3') {
      console.log(
        `[Storage:S3] Deleting object ${fileKey} from bucket ${process.env.AWS_S3_BUCKET}`
      );
      return true;
    }

    if (provider === 'cloudinary') {
      console.log(`[Storage:Cloudinary] Deleting asset ${fileKey}`);
      return true;
    }

    return true;
  }
}

const storageService = new StorageService();

module.exports = {
  getStorageProvider,
  storageService,
  StorageService,
};
