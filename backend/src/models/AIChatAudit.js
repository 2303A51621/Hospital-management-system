const mongoose = require('mongoose');

const aiChatAuditSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userRole: String,
    currentPage: String,
    intent: String,
    agentsUsed: [String],
    toolsUsed: [String],
    dataSources: [String],
    retrievedRecordIds: [String],
    ragDocumentIds: [String],
    authorizationResult: String,
    finalResponse: String,
    dataAvailable: Boolean,
    responseStatus: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIChatAudit', aiChatAuditSchema);
