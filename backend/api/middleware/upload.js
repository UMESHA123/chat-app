const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary from env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Store files in memory so we can stream them to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = /image\/(jpeg|png|gif|webp)|video\/(mp4|webm)|application\/pdf/;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported. Allowed: images, videos, PDF.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

/**
 * Upload a buffer to Cloudinary and return the result.
 * @param {Buffer} buffer
 * @param {object} options  - Cloudinary upload options (folder, resource_type, …)
 * @returns {Promise<object>}
 */
const uploadToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'chat-app', ...options },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });

module.exports = { upload, uploadToCloudinary, cloudinary };
