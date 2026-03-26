const express = require('express');
const { markRead, deleteMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.patch('/:id/read', markRead);    // PATCH /api/messages/:id/read
router.delete('/:id', deleteMessage);  // DELETE /api/messages/:id

module.exports = router;
