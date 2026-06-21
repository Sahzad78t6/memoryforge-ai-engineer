import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import MemoryOrb3D from './MemoryOrb3D';
import { Database, Cpu, Settings } from 'lucide-react';

const ChatWindow = ({ messages = [], loading = false }) => {
  const bottomRef = useRef(null);

  // Automatically scroll to the bottom of the conversation when new items arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

 if (messages.length === 0) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center px-6 py-12 text-center overflow-hidden">

      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-brand-500/10 blur-[120px]" />
        <div className="absolute bottom-10 left-1/3 h-48 w-48 rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      {/* Orb */}
      <div
        className="relative mb-8 flex items-center justify-center"
        style={{ width: 180, height: 180 }}
      >
        <MemoryOrb3D size={180} />
      </div>

      {/* Hero Title */}
      <h1 className="max-w-4xl text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
        Build AI Systems
        <span className="block bg-gradient-to-r from-brand-300 via-white to-cyan-300 bg-clip-text text-transparent">
          With Persistent Memory
        </span>
      </h1>

      {/* Subtitle */}
      <p className="mt-5 max-w-2xl text-base text-slate-400 leading-relaxed">
        MemoryForge empowers AI engineers with long-term memory,
        architecture retention, contextual reasoning, and intelligent
        retrieval across projects and conversations.
      </p>

      {/* Feature Pills */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <div className="rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-2 text-xs font-medium text-brand-300">
          🧠 Persistent Memory
        </div>

        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300">
          ⚡ Context Retrieval
        </div>

        <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-medium text-cyan-300">
          🚀 Agent Engineering
        </div>
      </div>

      {/* Existing Cards */}
      <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 text-left">

        <div className="group rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-5 transition-all duration-300 hover:border-brand-500/40 hover:shadow-[0_0_40px_-12px_rgba(92,120,255,0.4)]">
          <div className="flex items-center gap-2 mb-3">
            <Settings size={16} className="text-brand-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Seed Preferences
            </span>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed">
            Store architecture decisions and coding standards that your
            AI assistant can remember and apply later.
          </p>

          <code className="mt-3 block rounded-lg bg-slate-950/70 border border-slate-800 p-3 text-brand-300 font-mono text-xs">
            "Use MongoDB Atlas for all database operations"
          </code>
        </div>

        <div className="group rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-5 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_0_40px_-12px_rgba(16,185,129,0.35)]">
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} className="text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Persistent Retrieval
            </span>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed">
            Retrieve prior project knowledge, architecture decisions,
            and technical context instantly.
          </p>

          <code className="mt-3 block rounded-lg bg-slate-950/70 border border-slate-800 p-3 text-emerald-300 font-mono text-xs">
            "Create an authentication system"
          </code>
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
