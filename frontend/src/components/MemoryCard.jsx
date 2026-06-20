import React, { useState } from 'react';
import { Copy, Check, Terminal, ShieldAlert, Cpu, Heart, MessageSquare } from 'lucide-react';

const MemoryCard = ({ type, content }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Set up categories mapping with styling
  const categoryConfig = {
    architecture: {
      label: 'Architecture Decision',
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      icon: <Cpu size={14} />,
    },
    bug_fix: {
      label: 'Bug Fix',
      bg: 'bg-red-500/10 text-red-400 border-red-500/20',
      icon: <ShieldAlert size={14} />,
    },
    coding_standard: {
      label: 'Coding Standard',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: <Terminal size={14} />,
    },
    team_preference: {
      label: 'Team Preference',
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      icon: <Heart size={14} />,
    },
    conversation: {
      label: 'Conversation Log',
      bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      icon: <MessageSquare size={14} />,
    },
  };

  const defaultCategory = {
    label: type || 'Memory Item',
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    icon: <Cpu size={14} />,
  };

  const currentCategory = categoryConfig[type?.toLowerCase()] || defaultCategory;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/60 hover:shadow-md hover:shadow-slate-950/20">
      {/* Background radial shine */}
      <div className="absolute -inset-px bg-gradient-to-r from-transparent via-slate-800/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Header info */}
      <div className="flex items-start justify-between gap-4">
        <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${currentCategory.bg}`}>
          {currentCategory.icon}
          <span>{currentCategory.label}</span>
        </div>

        <button
          onClick={handleCopy}
          className="rounded-lg border border-slate-800 bg-slate-950/50 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          title="Copy Memory"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>

      {/* Content */}
      <div className="mt-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300 font-sans break-words selection:bg-brand-500/20">
          {content}
        </p>
      </div>
    </div>
  );
};

export default MemoryCard;
