const { asyncHandler } = require('./_helpers');
const { processAIChat, isEmergency, getEmergencyResponse } = require('../services/intelligentAIEngine');
const AIChatSession = require('../models/AIChatSession');
const { analyzeReportText, formatReportMarkdown } = require('../services/clinicalReportAnalyzer');
const pdfParse = require('pdf-parse');

/**
 * 1. Primary AI Chat Endpoint (Supports both legacy question format and rich message format)
 */
exports.chat = asyncHandler(async (req, res) => {
  const message = req.body?.message || req.body?.question;
  const sessionId = req.body?.sessionId;
  const attachments = req.body?.attachments || [];
  const currentPage = req.body?.currentPage || '';

  if ((typeof message !== 'string' || message.trim().length < 1) && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ success: false, message: 'A question, message, or document is required.' });
  }

  const result = await processAIChat({
    message: message || 'Please analyze this uploaded medical report.',
    sessionId,
    user: req.user,
    attachments,
    currentPage,
  });

  res.json({
    success: true,
    message: result.content, // Backward-compatibility
    ...result,
  });
});

/**
 * 2. Get All User Chat Sessions (Conversational Memory)
 */
exports.getSessions = asyncHandler(async (req, res) => {
  const sessions = await AIChatSession.find({ userId: req.user._id, isActive: true })
    .select('title isPinned lastMessageAt messages createdAt')
    .sort({ isPinned: -1, lastMessageAt: -1 })
    .limit(30)
    .lean();

  const formatted = sessions.map((s) => ({
    id: s._id,
    title: s.title || 'Consultation Session',
    isPinned: s.isPinned,
    lastMessageAt: s.lastMessageAt || s.createdAt,
    messageCount: (s.messages || []).length,
    preview: s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1].content.slice(0, 60) : '',
  }));

  res.json({ success: true, count: formatted.length, data: formatted });
});

/**
 * 3. Create a New Chat Session
 */
exports.createSession = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const session = await AIChatSession.create({
    userId: req.user._id,
    title: title || 'New Consultation',
    messages: [
      {
        role: 'assistant',
        content: `Hello ${req.user.name || req.user.firstName || ''}! I am your **Kushal Hospitals AI Assistant**.\n\nI can assist you with your appointments, medical records, doctors, prescriptions, laboratory reports, and clinical guidance. How can I assist you today?`,
        agent: 'kushal-clinical-agent',
        createdAt: new Date(),
      },
    ],
  });

  res.status(201).json({
    success: true,
    data: {
      id: session._id,
      title: session.title,
      messages: session.messages,
      lastMessageAt: session.lastMessageAt,
    },
  });
});

/**
 * 4. Get Single Session Message History
 */
exports.getSessionById = asyncHandler(async (req, res) => {
  const session = await AIChatSession.findOne({ _id: req.params.id, userId: req.user._id });
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }

  res.json({
    success: true,
    data: {
      id: session._id,
      title: session.title,
      isPinned: session.isPinned,
      messages: session.messages,
      createdAt: session.createdAt,
    },
  });
});

/**
 * 5. Delete a Single Session
 */
exports.deleteSession = asyncHandler(async (req, res) => {
  const result = await AIChatSession.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!result) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }

  res.json({ success: true, message: 'Chat session deleted successfully' });
});

/**
 * 6. Clear All User Chat Sessions
 */
exports.clearAllSessions = asyncHandler(async (req, res) => {
  await AIChatSession.deleteMany({ userId: req.user._id });
  res.json({ success: true, message: 'All chat history cleared successfully' });
});

/**
 * 7. Upload & Extract Medical Document / Lab Report (PDF / Image)
 */
exports.uploadReport = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const { originalname, mimetype, buffer } = req.file;
  let extractedText = '';

  if (mimetype === 'application/pdf') {
    try {
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text || '';
    } catch (err) {
      console.warn('PDF text extraction notice:', err.message);
      extractedText = `Medical Laboratory PDF: ${originalname}`;
    }
  } else {
    // For images, store description or image token
    extractedText = `Medical image document: ${originalname} (${mimetype})`;
  }

  // Analyze parameters if present
  const reportAnalysis = analyzeReportText(extractedText);
  const formattedMarkdown = formatReportMarkdown(reportAnalysis);

  res.json({
    success: true,
    data: {
      fileName: originalname,
      fileType: mimetype,
      fileSize: req.file.size,
      extractedText,
      analysisSummary: reportAnalysis.summary,
      parametersDetected: reportAnalysis.totalTestsDetected,
      formattedAnalysis: formattedMarkdown,
    },
  });
});

/**
 * 8. Real-time Streaming Response (Server-Sent Events)
 */
exports.streamChat = asyncHandler(async (req, res) => {
  const message = req.body?.message || req.body?.question;
  const sessionId = req.body?.sessionId;
  const attachments = req.body?.attachments || [];
  const currentPage = req.body?.currentPage || '';

  if (!message || message.trim().length < 1) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const result = await processAIChat({
      message,
      sessionId,
      user: req.user,
      attachments,
      currentPage,
    });

    const fullText = result.content || '';
    const words = fullText.split(' ');

    // Stream words progressively
    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + (i === words.length - 1 ? '' : ' ');
      res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
      // Small natural typing delay for streaming feel
      await new Promise((r) => setTimeout(r, 20));
    }

    res.write(`data: ${JSON.stringify({ done: true, ...result })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message, done: true })}\n\n`);
    res.end();
  }
});
