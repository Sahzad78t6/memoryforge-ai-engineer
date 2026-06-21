import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, ArrowRight, Play, Terminal, Database, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [typedText, setTypedText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const placeholders = [
    "Ingest project codebase and parse schemas...",
    "Query long-term vector memory regarding database configs...",
    "Analyze architecture_diagram.png and index memories...",
    "Build a custom workflow node layout..."
  ];

  // Typing effect for search bar
  useEffect(() => {
    let currentText = placeholders[placeholderIndex];
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 70;

    const type = () => {
      if (!isDeleting) {
        setTypedText(currentText.substring(0, charIndex + 1));
        charIndex++;

        if (charIndex === currentText.length) {
          isDeleting = true;
          typingSpeed = 3000; // Hold full text
        } else {
          typingSpeed = 70;
        }
      } else {
        setTypedText(currentText.substring(0, charIndex - 1));
        charIndex--;

        if (charIndex === 0) {
          isDeleting = false;
          setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
          typingSpeed = 500;
        } else {
          typingSpeed = 30;
        }
      }
      timer = setTimeout(type, typingSpeed);
    };

    let timer = setTimeout(type, 1000);
    return () => clearTimeout(timer);
  }, [placeholderIndex]);

  const handleLaunch = () => {
    setSubmitting(true);
    setTimeout(() => {
      navigate('/chat');
    }, 800);
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-indigo-500/30">
      {/* Background Neon Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-violet-600/10 rounded-full blur-[160px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />

      {/* SVG Neural Connections Background */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Mock neural connecting lines */}
          <line x1="15%" y1="20%" x2="40%" y2="35%" stroke="#312e81" strokeWidth="1" strokeDasharray="5,5" />
          <line x1="40%" y1="35%" x2="60%" y2="15%" stroke="#312e81" strokeWidth="1" />
          <line x1="60%" y1="15%" x2="85%" y2="30%" stroke="#4338ca" strokeWidth="1.5" />
          <line x1="40%" y1="35%" x2="50%" y2="70%" stroke="#4338ca" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="50%" y1="70%" x2="80%" y2="60%" stroke="#312e81" strokeWidth="1.5" />
          <line x1="85%" y1="30%" x2="80%" y2="60%" stroke="#312e81" strokeWidth="1" />

          {/* Glowing node points */}
          <circle cx="15%" cy="20%" r="20" fill="url(#nodeGlow)" />
          <circle cx="15%" cy="20%" r="4" fill="#818cf8" />
          
          <circle cx="40%" cy="35%" r="25" fill="url(#nodeGlow)" />
          <circle cx="40%" cy="35%" r="5" fill="#a78bfa" className="animate-ping" style={{ animationDuration: '3s' }} />
          <circle cx="40%" cy="35%" r="5" fill="#a78bfa" />

          <circle cx="60%" cy="15%" r="20" fill="url(#nodeGlow)" />
          <circle cx="60%" cy="15%" r="4" fill="#818cf8" />

          <circle cx="85%" cy="30%" r="30" fill="url(#nodeGlow)" />
          <circle cx="85%" cy="30%" r="6" fill="#a78bfa" />

          <circle cx="50%" cy="70%" r="28" fill="url(#nodeGlow)" />
          <circle cx="50%" cy="70%" r="5" fill="#818cf8" />

          <circle cx="80%" cy="60%" r="24" fill="url(#nodeGlow)" />
          <circle cx="80%" cy="60%" r="4" fill="#a78bfa" />
        </svg>
      </div>

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-400 text-white shadow-md shadow-violet-500/20">
            <BrainCircuit size={20} className="animate-pulse" />
          </div>
          <div>
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-sm font-extrabold tracking-wider text-transparent uppercase">
              MemoryForge
            </span>
            <span className="block text-[8px] font-semibold uppercase tracking-widest text-slate-500 mt-0.5">
              AI Engineering Platform
            </span>
          </div>
        </div>

        <button 
          onClick={handleLaunch}
          disabled={submitting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-slate-200 cursor-pointer shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50"
        >
          <span>Launch Workspace</span>
          <ArrowRight size={14} />
        </button>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">
        {/* Glow Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-[10px] font-semibold tracking-wider uppercase mb-6 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
          <Zap size={10} className="fill-indigo-400" />
          <span>Next-Generation Context Orchestrator</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent max-w-3xl leading-tight">
          Drill Deep Context Into Your Engineering Agent
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
          MemoryForge structures ingested files, codebases, and custom node workflows into persistent, isolated vector memories that supercharge agent intelligence.
        </p>

        {/* Typing Glassmorphism Query Panel */}
        <div className="mt-10 w-full max-w-2xl bg-[#121212]/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          {/* Subtle light leak */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/15 transition-colors duration-500" />
          
          <div className="flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Terminal size={14} className="text-slate-500 shrink-0" />
              <div className="text-xs font-mono text-slate-350 truncate select-none flex items-center">
                <span>{typedText}</span>
                <span className="w-1.5 h-3.5 bg-indigo-400 ml-0.5 animate-pulse shrink-0" />
              </div>
            </div>
            <button 
              onClick={handleLaunch}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-3xs font-bold uppercase tracking-wider cursor-pointer shadow-md shrink-0 transition-colors"
            >
              Analyze
            </button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center">
          <button
            onClick={handleLaunch}
            disabled={submitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 px-8 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-98 transition-all cursor-pointer text-sm disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-5 h-5 rounded-full border-2 border-slate-600 border-t-white animate-spin" />
            ) : (
              <>
                <Play size={16} className="fill-white" />
                <span>Launch Interactive Console</span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Feature Grids Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 backdrop-blur-md py-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Multi-User Memory Isolation</h3>
              <p className="text-2xs text-slate-500 mt-1.5 leading-relaxed">
                Persistent storage partitions securely isolate agent memory spaces using authenticated workspace user IDs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-violet-400 shrink-0">
              <BrainCircuit size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Knowledge Ingestion Pipeline</h3>
              <p className="text-2xs text-slate-500 mt-1.5 leading-relaxed">
                Ingest PDF files, code snippet packages, and full project archives with advanced summaries and technology tracking.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Robust OCR Fallback System</h3>
              <p className="text-2xs text-slate-500 mt-1.5 leading-relaxed">
                Intelligent categorizer maps screenshots, diagram workflows, and code structures cleanly when OCR binaries are missing.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
