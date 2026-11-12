const express = require('express');
const multer = require('multer');
const {
  chat,
  getSessions,
  createSession,
  getSessionById,
  deleteSession,
  clearAllSessions,
  uploadReport,
  streamChat,
} = require('../controllers/aiChatController');
const { protect } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB maximum
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents and medical images (PNG, JPEG, WEBP) are supported.'));
    }
  },
});

const router = express.Router();

router.use(protect);

router.post('/', chat);
router.post('/message', chat);
router.post('/stream', streamChat);

router.get('/sessions', getSessions);
router.post('/sessions', createSession);
router.get('/sessions/:id', getSessionById);
router.delete('/sessions/:id', deleteSession);
router.delete('/sessions', clearAllSessions);

router.post('/upload-report', upload.single('file'), uploadReport);

module.exports = router;
