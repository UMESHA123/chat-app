const express = require('express');
const { upload, uploadToCloudinary } = require('../middleware/upload');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/upload
 * Accepts up to 10 files in a multipart/form-data field named "files".
 * Returns an array of uploaded file metadata.
 */
router.post('/', protect, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files provided' });
    }

    const uploads = await Promise.all(
      req.files.map((file) => {
        // Pick resource_type based on MIME
        const resourceType = file.mimetype.startsWith('video') ? 'video' : 'auto';
        return uploadToCloudinary(file.buffer, {
          resource_type: resourceType,
          public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
        }).then((result) => ({
          url: result.secure_url,
          publicId: result.public_id,
          type: file.mimetype.startsWith('image')
            ? 'image'
            : file.mimetype.startsWith('video')
            ? 'video'
            : 'file',
          filename: file.originalname,
          size: file.size,
          width: result.width,
          height: result.height,
          format: result.format,
        }));
      })
    );

    res.status(201).json({ files: uploads });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
});

/**
 * DELETE /api/upload/:publicId
 * Remove a previously uploaded asset from Cloudinary.
 */
router.delete('/:publicId(*)', protect, async (req, res) => {
  try {
    const { cloudinary } = require('../middleware/upload');
    await cloudinary.uploader.destroy(req.params.publicId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
