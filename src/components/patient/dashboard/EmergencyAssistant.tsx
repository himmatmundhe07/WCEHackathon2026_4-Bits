import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, HeartPulse, Activity } from 'lucide-react';
import { getMedicalAdviceStream } from '@/services/geminiService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export default function EmergencyAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'I am the Sanjeevani AI First-Aid Assistant. I provide instant medical advice for stabilization. If this is a life-threatening crisis, press the giant red SOS button above immediately.',
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', timestamp: new Date() }]);

    let fullText = '';
    await getMedicalAdviceStream(userMsg.text, (chunk) => {
      fullText += chunk;
      setMessages(prev => prev.map(msg => msg.id === modelMsgId ? { ...msg, text: fullText } : msg));
    });
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-[#E2EEF1] shadow-sm flex flex-col h-[500px]">
      <div className="bg-[#F7FBFC] p-4 border-b border-[#E2EEF1] flex items-center justify-between z-10">
        <h2 className="text-base font-bold flex items-center gap-2" style={{ color: '#0891B2' }}>
          <div className="bg-[#EBF7FA] p-2 rounded-full border border-[#BAE6FD]">
            <Bot size={20} />
          </div>
          AI Emergency Triage
        </h2>
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#10B981] bg-[#ECFDF5] px-2.5 py-1 rounded-full border border-[#D1FAE5]">
          <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse"></span>
          Online
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#F8FAFC]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             {msg.role === 'model' && (
               <div className="shrink-0 mr-3 w-8 h-8 rounded-full bg-[#0891B2] text-white flex items-center justify-center">
                 <Bot size={16} />
               </div>
             )}
            <div className={`
              max-w-[75%] rounded-2xl p-4 shadow-sm text-[14px] leading-relaxed
              ${msg.role === 'user' ? 'bg-[#0891B2] text-white rounded-tr-none' : 'bg-white text-[#1E293B] border border-[#E2EEF1] rounded-tl-none'}
            `}>
              {msg.text ? (
                <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
              ) : (
                <div className="flex items-center gap-2 text-[#64748B]">
                  <Loader2 className="animate-spin" size={16} /> Analyzing symptoms...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-[#E2EEF1]">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type symptoms (e.g., 'Heavy bleeding from arm')..."
            className="flex-1 bg-[#F8FAFC] border border-[#E2EEF1] rounded-full px-5 py-3.5 text-[#1E293B] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#0891B2] focus:border-transparent transition-all placeholder:text-[#94A3B8]"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-[#0891B2] shrink-0 text-white w-12 h-12 flex items-center justify-center rounded-full hover:bg-[#0E7490] disabled:opacity-50 transition-colors shadow-md active:scale-95"
          >
            <Send size={18} className="translate-x-[1px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
