import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Database, Terminal, Cpu, Settings } from 'lucide-react';

const ChatWindow = ({ messages = [], loading = false }) => {
  const bottomRef = useRef(null);

  // Automatically scroll to the bottom of the conversation when new items arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-12 text-center select-none">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-lg shadow-brand-500/5 mb-6">
          <Terminal size={32} />
        </div>
        
        <h2 className="text-xl font-bold tracking-tight text-white mb-2 font-sans">
          Welcome to MemoryForge AI Engineer Workspace
        </h2>
        <p className="max-w-md text-sm text-slate-400 mb-8 leading-relaxed font-sans">
          An AI software engineer equipped with persistent long-term memory powered by Parcle API. Ask coding questions or seed architecture preferences to see memories persisted across sessions.
        </p>

        {/* Hackathon Demo Cards */}
        <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 text-left">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings size={16} className="text-brand-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">1. Seed Preferences</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Send a preference command, e.g.:<br />
              <code className="text-brand-300 font-mono text-2xs block bg-slate-950 p-1.5 rounded mt-1.5">
                "Use MongoDB Atlas for all database operations"
              </code>
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database size={16} className="text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">2. Persistent Retrieval</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Ask a related prompt later, e.g.:<br />
              <code className="text-emerald-300 font-mono text-2xs block bg-slate-950 p-1.5 rounded mt-1.5">
                "Create an authentication system"
              </code>
            </p>
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
