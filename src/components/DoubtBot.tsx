import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Upgraded to framer-motion for standard Vite compat
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { solveDoubt } from '../services/geminiService';
import ReactMarkdown from 'react-markdown'; // Run: npm install react-markdown
import remarkMath from 'remark-math';       // Run: npm install remark-math
import rehypeKatex from 'rehype-katex';     // Run: npm install rehype-katex
import 'katex/dist/katex.min.css';          // Required for math CSS

interface Message {
  role: 'user' | 'bot';
  text: string;
}

export const DoubtBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Hello! I am **AdiJEE AI**. Paste your Physics, Chemistry, or Maths doubt here and I will solve it step-by-step.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await solveDoubt(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "⚠️ Technical glitch in the matrix. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-[#0A0E1A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Bot className="text-emerald-400" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Zenith Assistant</h3>
            <p className="text-[10px] text-emerald-500 flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Online | Powered by Gemini
            </p>
          </div>
        </div>
        <Sparkles className="text-white/20" size={18} />
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`p-2 rounded-lg self-start ${msg.role === 'user' ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
                  {msg.role === 'user' ? <User size={16} className="text-emerald-400" /> : <Bot size={16} className="text-slate-400" />}
                </div>
                
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                    : 'bg-[#161B22] text-slate-200 border border-white/5 rounded-tl-none'
                }`}>
                  {/* Markdown + Math support */}
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                    className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50"
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start pl-11">
            <div className="bg-white/5 px-4 py-2 rounded-full border border-white/5 flex items-center gap-3">
              <Loader2 className="animate-spin text-emerald-400" size={14} />
              <span className="text-[11px] text-slate-400 font-medium tracking-wide">ANALYZING CONCEPT...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Field */}
      <div className="p-4 bg-white/5 border-t border-white/10">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything (e.g. Find limit of x/sin x as x -> 0)"
            className="w-full bg-[#0D1117] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="absolute right-2 p-2 text-emerald-500 hover:text-emerald-400 disabled:text-slate-600 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-500 mt-3">
          AI can make mistakes. Verify important formulas with Adi Sir.
        </p>
      </div>
    </div>
  );
};
