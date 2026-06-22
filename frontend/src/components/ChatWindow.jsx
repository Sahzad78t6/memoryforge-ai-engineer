import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { BrainCircuit, Cpu, Database, Flower2, Magnet, Rocket, Zap } from 'lucide-react';
import heroImage from '../assets/hero.png';

const featurePills = [
  { label: 'Persistent Memory', icon: Flower2, tone: 'text-pink-300' },
  { label: 'Context Retrieval', icon: Zap, tone: 'text-cyan-300' },
  { label: 'Agent Engineering', icon: Rocket, tone: 'text-teal-200' },
];

const ChatWindow = ({ messages = [], loading = false }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (messages.length === 0) {
    return (
      <div className="mf-hero-stage h-full min-h-0 flex-1 overflow-y-auto px-8 pb-36 pt-5 text-center select-none">
        <div className="mx-auto flex max-w-6xl flex-col items-center">
          <div className="mf-hero-visual relative flex w-full items-center justify-center overflow-visible">
            <div className="mf-network-field" />
            <div className="mf-orbit mf-orbit-a" />
            <div className="mf-orbit mf-orbit-b" />
            <img src={heroImage} alt="MemoryForge system cube" className="relative z-10 h-[180px] w-[230px] object-contain drop-shadow-[0_0_42px_rgba(116,153,255,0.55)]" />
          </div>

          <h1 className="mt-0 text-[56px] font-black leading-[1.02] tracking-normal text-white drop-shadow-[0_6px_22px_rgba(0,0,0,0.65)] max-[1400px]:text-5xl max-md:text-4xl">
            Build AI Systems
            <span className="mt-3 block bg-gradient-to-r from-[#a4adff] via-[#c7b3ff] to-[#80edf0] bg-clip-text text-transparent">
              With Persistent Memory
            </span>
          </h1>

          <p className="mt-6 max-w-[860px] text-[19px] font-medium leading-[1.5] text-slate-400 max-md:text-base">
            MemoryForge empowers AI engineers with long-term memory, architecture retention,
            contextual reasoning, and intelligent retrieval across projects and conversations.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {featurePills.map((pill) => {
              const Icon = pill.icon;
              return (
                <span key={pill.label} className="mf-pill">
                  <Icon size={17} className={pill.tone} />
                  {pill.label}
                </span>
              );
            })}
          </div>

          <div className="mt-8 grid w-full grid-cols-2 gap-5 text-left max-lg:grid-cols-1">
            <div className="mf-feature-card">
              <div className="relative z-10 max-w-[70%]">
                <div className="mb-3 flex items-center gap-3 text-[16px] font-black uppercase tracking-wide text-white">
                  <BrainCircuit size={23} className="text-violet-300" />
                  Seed Preferences
                </div>
                <p className="text-[15px] leading-relaxed text-slate-400">
                  Store architecture decisions and coding standards that your AI assistant can remember and apply later.
                </p>
              </div>
              <BrainCircuit className="absolute bottom-5 right-9 text-violet-300/35" size={95} strokeWidth={1.1} />
            </div>

            <div className="mf-feature-card">
              <div className="relative z-10 max-w-[72%]">
                <div className="mb-3 flex items-center gap-3 text-[16px] font-black uppercase tracking-wide text-white">
                  <Database size={23} className="text-teal-300" />
                  Persistent Retrieval
                </div>
                <p className="text-[15px] leading-relaxed text-slate-400">
                  Retrieve prior project knowledge, architecture decisions, and technical context instantly.
                </p>
              </div>
              <Magnet className="absolute bottom-4 right-10 rotate-[-14deg] text-cyan-200/45" size={100} strokeWidth={1.2} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto px-8 py-6 space-y-4">
      {messages.map((msg, index) => (
        <MessageBubble key={index} role={msg.role} content={msg.content} />
      ))}

      {loading && (
        <div className="flex w-full gap-3 py-4 justify-start border-b border-white/5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200 ring-1 ring-violet-300/25 animate-pulse">
            <Cpu size={17} />
          </div>
          <div className="max-w-[85%] rounded-2xl rounded-bl-none border border-white/10 bg-white/[0.05] p-4 text-slate-300 shadow-[0_0_30px_rgba(111,93,255,0.14)]">
            <div className="mb-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">MemoryForge AI</div>
            <div className="flex items-center gap-2 text-sm italic text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-300 animate-ping" />
              <span>Thinking... retrieving memory context...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default ChatWindow;
