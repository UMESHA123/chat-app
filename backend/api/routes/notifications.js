const express = require('express');
const { getNotifications, markAllRead, markRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);                  // GET  /api/notifications
router.patch('/read-all', markAllRead);             // PATCH /api/notifications/read-all
router.patch('/:id/read', markRead);                // PATCH /api/notifications/:id/read

module.exports = router;
