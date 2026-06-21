import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Cpu, Database, Zap, Sparkles, Brain, Magnet } from 'lucide-react';
import heroImage from '../assets/hero.png';

const ChatWindow = ({ messages = [], loading = false }) => {
  const bottomRef = useRef(null);

  // Automatically scroll to the bottom of the conversation when new items arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center select-none overflow-y-auto">
        {/* Floating 3D Cube Graphic */}
        <div className="relative w-72 h-72 flex items-center justify-center shrink-0">
          <img 
            src={heroImage} 
            alt="MemoryForge Illustration" 
            className="w-full h-full object-contain animate-float"
          />
        </div>
        
        {/* Glowing Headings */}
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">
          Build AI Systems
        </h1>
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4 font-sans filter drop-shadow-[0_0_12px_rgba(99,102,241,0.25)]">
          With Persistent Memory
        </h2>
        
        {/* Description Subtitle */}
        <p className="max-w-lg text-xs text-slate-400 leading-relaxed font-sans mb-6">
          MemoryForge empowers AI engineers with long-term memory, architecture retention,
          contextual reasoning, and intelligent retrieval across projects and conversations.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <div className="flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
            <span>Persistent Memory</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
            <Zap size={11} className="text-amber-400 shrink-0" />
            <span>Context Retrieval</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-pink-500/20 bg-pink-500/5 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-pink-300">
            <Sparkles size={11} className="text-pink-400 shrink-0" />
            <span>Agent Engineering</span>
          </div>
        </div>

        {/* Action / Explanation Cards */}
        <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 text-left">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 hover:border-slate-700/60 transition-all flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400">
              <Brain size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300">Seed Preferences</span>
              </div>
              <p className="text-2xs text-slate-400 leading-normal font-sans">
                Store architecture decisions and coding standards so assistant can remember and apply later.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 hover:border-slate-700/60 transition-all flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400">
              <Magnet size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300">Persistent Retrieval</span>
              </div>
              <p className="text-2xs text-slate-400 leading-normal font-sans">
                Retrieve prior project knowledge, architecture decisions, and technical context instantly.
              </p>
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
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white animate-pulse">
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
