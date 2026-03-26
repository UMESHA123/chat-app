---
name: cloudinary-upload
description: Cloudinary v2 file upload patterns for this chat application — multer memory storage, stream upload, resource types, and file validation
---

# Cloudinary Upload Standards

## Architecture

- **Multer**: `memoryStorage()` — files NEVER touch disk, stored in `req.file.buffer`
- **Cloudinary**: `upload_stream()` — pipe buffer directly to Cloudinary
- **streamifier**: converts Buffer to readable stream for `upload_stream`

## Setup

```javascript
// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
module.exports = cloudinary;
```

## Upload Middleware

```javascript
// middleware/upload.js
const multer = require('multer');

const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/quicktime',
  'application/pdf', 'application/msword',
];

exports.upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error(`File type not allowed: ${file.mimetype}`), false);
    }
    cb(null, true);
  },
});
```

## Upload to Cloudinary (Stream)

```javascript
// utils/cloudinaryUpload.js
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

exports.uploadBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};
```

## Resource Type by MIME

```javascript
const getResourceType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return 'raw'; // PDFs, documents, etc.
};
```

## Upload Controller

```javascript
// controllers/uploadController.js
const { uploadBuffer } = require('../utils/cloudinaryUpload');

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file provided' });

    const resourceType = getResourceType(req.file.mimetype);
    const result = await uploadBuffer(req.file.buffer, {
      folder: 'chatapp',
      resource_type: resourceType,
      // Images: auto-format and quality optimization
      ...(resourceType === 'image' ? { quality: 'auto', fetch_format: 'auto' } : {}),
    });

    res.json({
      success: true,
      data: {
        url:          result.secure_url,
        publicId:     result.public_id,
        resourceType: result.resource_type,
        format:       result.format,
        bytes:        result.bytes,
        originalName: req.file.originalname,
      },
    });
  } catch (err) {
    next(err);
  }
};
```

## Delete from Cloudinary

```javascript
// When deleting a message with attachments
const deleteCloudinaryFiles = async (attachments) => {
  if (!attachments?.length) return;
  await Promise.all(
    attachments.map(att =>
      cloudinary.uploader.destroy(att.publicId, { resource_type: att.resourceType })
    )
  );
};
```

## Route

```javascript
// routes/uploadRoutes.js
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { uploadFile } = require('../controllers/uploadController');

router.post('/', protect, upload.single('file'), uploadFile);
module.exports = router;
```

## Anti-Patterns

- ❌ Using `cloudinary.uploader.upload(filePath)` — files are in memory, not on disk
- ❌ Forgetting `resource_type` — defaults to 'image', fails for videos/PDFs
- ❌ No file type validation — multer fileFilter is required
- ❌ Trusting file extension — validate MIME type (`file.mimetype`)
- ❌ Not storing `publicId` — needed for future deletion from Cloudinary
