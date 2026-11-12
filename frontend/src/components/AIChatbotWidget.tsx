import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Database,
  FileCheck2,
  FileText,
  Maximize2,
  Minimize2,
  Paperclip,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Loader2,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { aiChatAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatAttachment {
  fileName: string;
  fileType: string;
  fileSize?: number;
  extractedText?: string;
  fileUrl?: string;
}

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: string;
  sources?: string[];
  isEmergency?: boolean;
  attachments?: ChatAttachment[];
  createdAt?: string;
}

interface ChatSession {
  id: string;
  title: string;
  isPinned?: boolean;
  lastMessageAt?: string;
  messageCount?: number;
}

const DEFAULT_SUGGESTIONS = [
  'What are the symptoms and causes of Diabetes?',
  'Find an available Cardiologist',
  'Explain high blood pressure stages',
  'Check hospital bed availability',
  'Analyze my CBC blood test report',
  'Show my upcoming appointments',
];

export default function AIChatbotWidget() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  // Widget visibility & display modes
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Sessions & Conversational Memory
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionSearch, setSessionSearch] = useState('');

  // Messages & Stream State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<ChatAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Utilities
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isGenerating]);

  // Load Sessions on mount / open
  const loadSessions = async () => {
    try {
      const res = await aiChatAPI.getSessions();
      if (res.data?.data) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load past chat sessions:', err);
    }
  };

  useEffect(() => {
    if (token && isOpen) {
      loadSessions();
      if (!currentSessionId && messages.length === 0) {
        // Initialize welcome message
        setMessages([
          {
            role: 'assistant',
            content: `👋 Hello **${user?.name || user?.firstName || 'there'}**! I am your **Kushal Hospitals AI Assistant**.\n\nI combine clinical reasoning, multimodal report analysis, and direct hospital database integration to assist you.\n\n### How I Can Help You Today:\n* 🩺 **Medical Guidance:** Comprehensive explanations of conditions (Diabetes, Hypertension, Heart Diseases, Asthma, CKD), diagnostics, and health precautions.\n* 📋 **Lab Report Analyzer:** Upload your blood test or PDF reports for automated parameter extraction and reference interval checks.\n* 👨‍⚕️ **Doctor Search & Appointments:** Find specialists, verify live consultation slots, and review your upcoming visits.\n* 💳 **Billing & Hospital Services:** Check balances, receipts, and real-time hospital bed availability.\n\nFeel free to ask any question or choose a suggested topic below!`,
            agent: 'kushal-clinical-agent',
            sources: ['Kushal Hospitals Clinical AI Intelligence Layer'],
          },
        ]);
      }
    }
  }, [token, isOpen]);

  if (!token) return null;

  // Start a new chat session
  const handleNewChat = async () => {
    try {
      const res = await aiChatAPI.createSession('New Consultation');
      if (res.data?.data) {
        const newSession = res.data.data;
        setCurrentSessionId(newSession.id);
        setMessages(
          newSession.messages?.map((m: any) => ({
            role: m.role,
            content: m.content,
            agent: m.agent,
            sources: m.sources,
          })) || []
        );
        loadSessions();
        if (window.innerWidth < 768) setShowSidebar(false);
      }
    } catch {
      setCurrentSessionId(null);
      setMessages([
        {
          role: 'assistant',
          content: 'Started a fresh consultation session. How may I assist you?',
          agent: 'kushal-clinical-agent',
        },
      ]);
    }
  };

  // Select an existing chat session
  const handleSelectSession = async (sessionId: string) => {
    try {
      const res = await aiChatAPI.getSession(sessionId);
      if (res.data?.data) {
        setCurrentSessionId(sessionId);
        setMessages(
          res.data.data.messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            agent: m.agent,
            sources: m.sources,
            attachments: m.attachments,
            createdAt: m.createdAt,
          }))
        );
        if (window.innerWidth < 768) setShowSidebar(false);
      }
    } catch {
      toast.error('Failed to load consultation session');
    }
  };

  // Delete a session
  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await aiChatAPI.deleteSession(sessionId);
      toast.success('Session deleted');
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
      loadSessions();
    } catch {
      toast.error('Failed to delete session');
    }
  };

  // Clear all sessions
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear your entire consultation history?')) return;
    try {
      await aiChatAPI.clearAllSessions();
      toast.success('All history cleared');
      setSessions([]);
      handleNewChat();
    } catch {
      toast.error('Failed to clear history');
    }
  };

  // File Upload (PDF / Image Report)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }

    try {
      setUploadingFile(true);
      const res = await aiChatAPI.uploadReport(file);
      const data = res.data?.data;

      const attachment: ChatAttachment = {
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        extractedText: data.extractedText,
      };

      setAttachedFiles((prev) => [...prev, attachment]);
      toast.success(`Attached ${file.name}`);

      // If document contains detected parameters, append helpful prompt
      if (data.parametersDetected > 0) {
        setInputMessage((prev) => prev || `Please analyze this uploaded laboratory report (${file.name}).`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process document');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove attached file
  const handleRemoveAttachment = (idx: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if ((!text && attachedFiles.length === 0) || isGenerating) return;

    const userAttachments = [...attachedFiles];
    setInputMessage('');
    setAttachedFiles([]);

    const newUserMsg: ChatMessage = {
      role: 'user',
      content: text || 'Please review and analyze the attached document.',
      attachments: userAttachments,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsGenerating(true);

    try {
      const response = await aiChatAPI.sendMessage({
        message: text,
        sessionId: currentSessionId || undefined,
        attachments: userAttachments,
        currentPage: window.location.pathname,
      });

      const data = response.data;
      if (data.sessionId && !currentSessionId) {
        setCurrentSessionId(data.sessionId);
        loadSessions();
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.content || data.message || 'Information received.',
          agent: data.agent,
          sources: data.sources,
          isEmergency: data.isEmergency,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'AI Assistant is currently busy. Please try again.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ I encountered an unexpected error processing your request. Please ask your question again or verify your connection.',
          agent: 'error-recovery-agent',
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard
  const handleCopy = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(idx);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Text to speech
  const handleSpeak = (text: string, idx: number) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-speech not supported on this browser');
      return;
    }

    if (speakingIndex === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner speech
    const cleanSpeech = text.replace(/[*#`_>|\[\]\(\)]/g, ' ').replace(/\s+/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(idx);
    window.speechSynthesis.speak(utterance);
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) =>
    (s.title || '').toLowerCase().includes(sessionSearch.toLowerCase())
  );

  return (
    <>
      {/* Floating Launcher Pill */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed right-6 bottom-24 z-[70] flex items-center gap-2.5 rounded-full border border-teal-200/90 bg-white/95 pl-2.5 pr-4 py-2 text-left shadow-xl shadow-teal-950/10 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-teal-400 group ring-2 ring-teal-500/10"
          aria-label="Open Hospital AI Assistant"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 via-teal-700 to-[#0b3d4f] text-white shadow-md group-hover:scale-105 transition-transform">
            <Bot size={20} />
          </span>
          <span className="leading-tight">
            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-teal-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Clinical Intelligence
            </span>
            <span className="block text-xs font-extrabold text-slate-800">
              Ask Kushal AI
            </span>
          </span>
        </button>
      )}

      {/* Main Chatbot Interface */}
      {isOpen && (
        <div
          className={`fixed z-[80] flex overflow-hidden bg-white shadow-2xl transition-all duration-300 ${
            isFullscreen
              ? 'inset-0 w-full h-full'
              : 'inset-y-0 right-0 w-[min(96vw,520px)] border-l border-slate-200'
          }`}
        >
          {/* Conversational Memory Sidebar */}
          {showSidebar && (
            <aside className="w-64 sm:w-72 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 animate-in slide-in-from-left duration-200">
              <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Database size={14} className="text-teal-700" /> Chat History
                </span>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
                  title="Close History"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>

              {/* New Consultation Button */}
              <div className="p-3">
                <button
                  onClick={handleNewChat}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Plus size={14} /> New Consultation
                </button>
              </div>

              {/* Search Past Chats */}
              <div className="px-3 pb-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    placeholder="Search consultations..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto px-2 space-y-1">
                {filteredSessions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No consultation sessions found.
                  </div>
                ) : (
                  filteredSessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSession(s.id)}
                      className={`group relative flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                        currentSessionId === s.id
                          ? 'bg-teal-100/70 text-teal-900 font-bold border border-teal-200'
                          : 'hover:bg-slate-200/60 text-slate-700'
                      }`}
                    >
                      <div className="truncate pr-5">
                        <span className="truncate block">{s.title || 'Consultation'}</span>
                        {s.lastMessageAt && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {new Date(s.lastMessageAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(e, s.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 transition-opacity"
                        title="Delete chat"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Clear All Footer */}
              {sessions.length > 0 && (
                <div className="p-3 border-t border-slate-200 bg-slate-50">
                  <button
                    onClick={handleClearAll}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                  >
                    <Trash2 size={12} /> Clear Consultation History
                  </button>
                </div>
              )}
            </aside>
          )}

          {/* Main Chat Section */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
            {/* Header */}
            <header className="relative bg-gradient-to-r from-[#092f49] via-[#075b73] to-[#0f8c83] px-4 sm:px-6 py-4 text-white shadow-md shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/15"
                    title={showSidebar ? 'Hide History' : 'Show Chat History'}
                  >
                    {showSidebar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 shadow-inner">
                      <Bot size={20} />
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-sm sm:text-base font-extrabold tracking-tight">Kushal Hospitals AI</h2>
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold uppercase tracking-wider border border-emerald-400/30">
                          Live Sentinel
                        </span>
                      </div>
                      <p className="text-[11px] text-cyan-100 font-medium">
                        Multimodal Medical Intelligence & RAG
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleNewChat}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all text-xs flex items-center gap-1 border border-white/15"
                    title="New Consultation"
                  >
                    <Plus size={15} /> <span className="hidden sm:inline text-xs font-semibold">New</span>
                  </button>
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all border border-white/15"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-all"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </header>

            {/* Clinical Safety Sub-banner */}
            <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/80 px-4 py-2 text-[11px] text-amber-900 shrink-0">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-amber-700 shrink-0" />
                <span>Verified clinical database & approved medical knowledge. For emergencies, dial <strong>112</strong> immediately.</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider hidden sm:inline">
                Role: {user?.role || 'Patient'}
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#f8fafc]">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
                  >
                    <div
                      className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 shadow-xs text-xs sm:text-sm ${
                        isUser
                          ? 'bg-gradient-to-r from-teal-700 to-cyan-800 text-white rounded-tr-none'
                          : msg.isEmergency
                          ? 'bg-rose-50 border-2 border-rose-300 text-slate-800 rounded-tl-none shadow-md'
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      {/* Attachments if any */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-2.5 pb-2 border-b border-white/20 space-y-1">
                          {msg.attachments.map((att, aIdx) => (
                            <div
                              key={aIdx}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono ${
                                isUser ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              <FileText size={14} />
                              <span className="truncate">{att.fileName}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Content (Render Markdown for Assistant, plaintext for user) */}
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}

                      {/* Assistant Grounding & Source Citations */}
                      {!isUser && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                          <span className="font-semibold uppercase tracking-wider text-slate-400">Sources:</span>
                          {msg.sources.map((src, sIdx) => (
                            <span
                              key={sIdx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-medium"
                            >
                              <FileCheck2 size={10} /> {src}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Bar on Assistant Messages */}
                    {!isUser && (
                      <div className="flex items-center gap-2 mt-1 ml-1 text-slate-400 text-xs">
                        <button
                          onClick={() => handleCopy(msg.content, index)}
                          className="hover:text-teal-700 transition-colors p-1"
                          title="Copy response"
                        >
                          {copiedId === index ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                        <button
                          onClick={() => handleSpeak(msg.content, index)}
                          className="hover:text-teal-700 transition-colors p-1"
                          title={speakingIndex === index ? 'Stop audio' : 'Read aloud'}
                        >
                          {speakingIndex === index ? <VolumeX size={13} className="text-teal-700 animate-pulse" /> : <Volume2 size={13} />}
                        </button>
                        <button
                          onClick={() => toast.success('Thank you for your feedback!')}
                          className="hover:text-emerald-600 transition-colors p-1"
                          title="Helpful"
                        >
                          <ThumbsUp size={12} />
                        </button>
                        <button
                          onClick={() => toast('Feedback noted for continuous refinement')}
                          className="hover:text-rose-600 transition-colors p-1"
                          title="Not helpful"
                        >
                          <ThumbsDown size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Generating loading indicator */}
              {isGenerating && (
                <div className="flex items-center gap-2.5 text-xs text-slate-500 p-3 rounded-2xl bg-white border border-slate-200 max-w-xs shadow-xs">
                  <Loader2 size={16} className="animate-spin text-teal-700" />
                  <span>Consulting medical knowledge base & reasoning...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Pills */}
            <div className="px-4 py-2 border-t border-slate-100 bg-white overflow-x-auto flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Suggested:</span>
              {DEFAULT_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(suggestion)}
                  disabled={isGenerating}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 transition-all text-slate-700 shrink-0 disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Attached Files Preview Bar */}
            {attachedFiles.length > 0 && (
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2 shrink-0">
                {attachedFiles.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1 bg-white border border-teal-200 rounded-xl text-xs shadow-xs text-teal-900"
                  >
                    <FileText size={14} className="text-teal-700" />
                    <span className="truncate max-w-[200px] font-medium">{att.fileName}</span>
                    <button
                      onClick={() => handleRemoveAttachment(idx)}
                      className="p-0.5 text-slate-400 hover:text-rose-600 rounded-full"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <footer className="p-3 sm:p-4 border-t border-slate-200 bg-white shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-end gap-2"
              >
                {/* File Attachment Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="application/pdf,image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile || isGenerating}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all disabled:opacity-50"
                  title="Upload PDF Lab Report or Medical Image"
                >
                  {uploadingFile ? <Loader2 size={18} className="animate-spin text-teal-700" /> : <Paperclip size={18} />}
                </button>

                {/* Textarea */}
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={1}
                  placeholder="Ask a medical question, search doctors, analyze lab report..."
                  className="flex-1 max-h-32 min-h-[42px] px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all text-slate-800"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isGenerating || (!inputMessage.trim() && attachedFiles.length === 0)}
                  className="p-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold transition-all shadow-md shadow-teal-700/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                  title="Send Message"
                >
                  {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
