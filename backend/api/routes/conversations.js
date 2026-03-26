const express = require('express');
const {
  getConversations,
  createDirect,
  createGroup,
  getConversation,
  addParticipants,
  removeParticipant,
  deleteConversation,
} = require('../controllers/conversationController');
const { getMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getConversations);                                         // GET  /api/conversations
router.post('/direct', createDirect);                                      // POST /api/conversations/direct
router.post('/group', createGroup);                                        // POST /api/conversations/group
router.get('/:id', getConversation);                                       // GET  /api/conversations/:id
router.patch('/:id/participants', addParticipants);                        // PATCH /api/conversations/:id/participants
router.delete('/:id/participants/:userId', removeParticipant);             // DELETE /api/conversations/:id/participants/:userId
router.delete('/:id', deleteConversation);                                 // DELETE /api/conversations/:id

// Message sub-routes
router.get('/:id/messages', getMessages);                                  // GET  /api/conversations/:id/messages
router.post('/:id/messages', sendMessage);                                 // POST /api/conversations/:id/messages

module.exports = router;
