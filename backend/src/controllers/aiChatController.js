const { asyncHandler } = require('./_helpers');
const { answerQuestion } = require('../services/aiChatService');

exports.chat = asyncHandler(async (req, res) => {
  const question = req.body?.question;
  if (typeof question !== 'string' || question.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'A question is required.' });
  }

  const result = await answerQuestion({ question, context: req.body, user: req.user });
  res.json({ success: true, ...result });
});