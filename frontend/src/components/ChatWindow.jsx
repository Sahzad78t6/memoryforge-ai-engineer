import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Cpu, Database, Zap, Sparkles, Brain, Magnet, BrainCircuit, RefreshCcw } from 'lucide-react';
import heroImage from '../assets/hero.png';

const ChatWindow = ({ messages = [], loading = false }) => {
  const bottomRef = useRef(null);

  // Automatically scroll to the bottom of the conversation when new items arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center pt-10 px-8 pb-32 text-center select-none overflow-y-auto w-full">
        {/* Central 3D Graphic Placeholder */}
        <div className="w-full max-w-2xl h-64 mb-6 relative flex items-center justify-center shrink-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#09090e] to-[#09090e] z-0"></div>
          <img 
            src={heroImage} 
            alt="MemoryForge Illustration" 
            className="w-48 h-48 object-contain animate-float z-10"
          />
        </div>
        
        {/* Glowing Headings */}
        <h1 className="text-5xl font-extrabold text-center mb-4 leading-tight text-white tracking-tight">
          Build AI Systems <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-cyan-300 to-teal-200 filter drop-shadow-[0_0_15px_rgba(99,102,241,0.25)]">
            With Persistent Memory
          </span>
        </h1>
        
        {/* Description Subtitle */}
        <p className="text-center text-gray-400 max-w-2xl mb-8 text-sm leading-relaxed">
          MemoryForge empowers AI engineers with long-term memory, architecture retention,
          contextual reasoning, and intelligent retrieval across projects and conversations.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          {['Persistent Memory', 'Context Retrieval', 'Agent Engineering'].map((tag, i) => (
            <span key={i} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center gap-2">
              {i === 0 && <span className="w-2 h-2 rounded-full bg-pink-500"></span>}
              {i === 1 && <Zap size={12} className="text-orange-400"/>}
              {i === 2 && <RefreshCcw size={12} className="text-purple-400"/>}
              {tag}
            </span>
          ))}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl text-left">
          {/* Card 1 */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-white/20 transition-all flex flex-col justify-between min-h-[140px]">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold mb-3 text-white">
                <BrainCircuit size={16} className="text-purple-400" />
                SEED PREFERENCES
              </div>
              <p className="text-xs text-gray-400 leading-relaxed pr-16">
                Store architecture decisions and coding standards that your AI assistant can remember and apply later.
              </p>
            </div>
            {/* Decorative graphic placeholder */}
            <div className="absolute right-[-20px] bottom-[-20px] opacity-50 group-hover:opacity-80 transition-all">
               <BrainCircuit size={80} className="text-purple-900/30" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-white/20 transition-all flex flex-col justify-between min-h-[140px]">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold mb-3 text-white">
                <Database size={16} className="text-teal-400" />
                PERSISTENT RETRIEVAL
              </div>
              <p className="text-xs text-gray-400 leading-relaxed pr-16">
                Retrieve prior project knowledge, architecture decisions, and technical context instantly.
              </p>
            </div>
             {/* Decorative graphic placeholder */}
             <div className="absolute right-[-10px] bottom-[-10px] opacity-50 group-hover:opacity-80 transition-all">
               <Magnet size={80} className="text-indigo-900/30" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
      {messages.map((msg, index) => (
        <MessageBubble key={index} role={msg.role} content={msg.content} />
      ))}

      {loading && (
        <div className="flex w-full gap-3 py-4 justify-start border-b border-slate-900/30">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white animate-pulse">
            <Cpu size={16} />
          </div>
          <div className="max-w-[85%] rounded-2xl p-4 bg-slate-900/50 text-slate-400 border border-slate-800/60 rounded-bl-none">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-2xs font-bold tracking-wider uppercase opacity-60">MemoryForge AI</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-sans italic text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-500 animate-ping" />
              <span>Thinking... retrieving memory context...</span>
            </div>
          </div>
        </div>
      )}

      {/* Anchor for Auto Scroll */}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatWindow;
