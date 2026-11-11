import { useState } from 'react';
import { Activity, Bot, Database, FileCheck2, Loader2, Send, ShieldCheck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiChatAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  agent?: string;
}

const suggestions = ['Show my appointments', 'What doctors are available?', 'What do my records show?', 'I have fever and cough'];
const agents = ['Patient', 'Doctor', 'Appointment', 'Medical RAG'];

export default function AIChatbotWidget() {
  const token = useAuthStore((state) => state.token);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Hello. I can help with your hospital appointments, doctors, records, profile, and symptom-safety guidance.', agent: 'orchestrator-agent' },
  ]);

  if (!token) return null;

  const ask = async (value = question) => {
    const text = value.trim();
    if (!text || sending) return;
    setQuestion('');
    setMessages((current) => [...current, { role: 'user', text }]);
    setSending(true);
    try {
      const response = await aiChatAPI.ask(text, { currentPage: globalThis.location.pathname });
      setMessages((current) => [...current, {
        role: 'assistant',
        text: response.data.message,
        agent: response.data.agent,
      }]);
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Chat service unavailable');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-24 z-[70] flex items-center gap-2.5 rounded-full border border-teal-200/90 bg-white/95 pl-2.5 pr-4 py-2 text-left shadow-xl shadow-teal-950/10 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-teal-400 group ring-2 ring-teal-500/10"
        aria-label="Open hospital AI assistant"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-md group-hover:scale-105 transition-transform">
          <Bot size={19} />
        </span>
        <span className="leading-tight">
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-teal-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            AI Clinical Guide
          </span>
          <span className="block text-xs font-extrabold text-slate-800">
            Ask Kushal AI
          </span>
        </span>
      </button>

      {open ? (
        <div className="fixed inset-y-0 right-0 z-[80] flex w-[min(94vw,430px)] flex-col border-l border-slate-200 bg-white shadow-2xl">
          <header className="relative overflow-hidden bg-gradient-to-br from-[#092f49] via-[#075b73] to-[#0f8c83] px-5 pb-5 pt-6 text-white">
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full border-[18px] border-white/10" />
            <div className="relative flex items-start justify-between"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Bot size={24} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100">HMS intelligence layer</p><h2 className="text-lg font-extrabold">Hospital AI Assistant</h2></div></div><button type="button" onClick={() => setOpen(false)} aria-label="Close AI assistant" className="rounded-full p-1.5 hover:bg-white/15"><X size={19} /></button></div>
            <p className="relative mt-4 text-sm font-medium text-cyan-50">I can assist you with your care journey. May I help you?</p>
          </header>
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700"><Activity size={14} className="text-teal-700" /> Supervisor agent</span><span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ready</span></div>
            <div className="grid grid-cols-4 gap-1.5">{agents.map((agent) => <div key={agent} className="rounded-lg border border-slate-200 bg-white px-1 py-2 text-center text-[9px] font-semibold text-slate-600"><Database size={12} className="mx-auto mb-1 text-cyan-700" />{agent}</div>)}</div>
          </div>
          <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-xs leading-5 text-amber-900">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" /> Verified hospital data only. Symptom replies are safety guidance, not a diagnosis.
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'ml-8 rounded-xl bg-cyan-700 p-3 text-sm text-white' : 'mr-5 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700'}>
                <p>{message.text}</p>
                {message.agent ? <p className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-wide opacity-60"><FileCheck2 size={11} />{message.agent} · grounded response</p> : null}
              </div>
            ))}
            {sending ? <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 size={14} className="animate-spin" /> Consulting hospital data agents...</div> : null}
          </div>
          <div className="flex flex-wrap gap-1.5 border-t border-slate-200 bg-white p-3">
            {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => ask(suggestion)} className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs text-cyan-800 hover:bg-cyan-100">{suggestion}</button>)}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); ask(); }} className="flex gap-2 border-t border-slate-200 bg-white p-3">
            <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a hospital question..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" />
            <button type="submit" disabled={sending || !question.trim()} aria-label="Send question" className="rounded-xl bg-cyan-700 px-3 text-white disabled:bg-slate-300"><Send size={16} /></button>
          </form>
        </div>
      ) : null}
    </>
  );
}