import React from 'react';
import { Database, CheckCircle2, ChevronRight } from 'lucide-react';

const MemoryPanel = ({ memories = [] }) => {
  if (!memories || memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/10 p-5 text-center">
        <Database size={24} className="text-slate-600 mb-2" />
        <span className="text-xs font-medium text-slate-500">No memory context retrieved for this prompt.</span>
      </div>
    );
  }

  // Categories helper mapping for short tags
  const tagLabels = {
    architecture: 'Architecture',
    bug_fix: 'Bug Fix',
    coding_standard: 'Coding Standard',
    team_preference: 'Preference',
    conversation: 'Conversation',
  };

  const tagColors = {
    architecture: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    bug_fix: 'bg-red-500/10 text-red-400 border-red-500/20',
    coding_standard: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    team_preference: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    conversation: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
      {/* Panel Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800/60">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-500/20 text-brand-400">
          <Database size={12} />
        </div>
        <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
          Retrieved Memory Context
        </span>
        <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-2xs font-semibold text-emerald-400 border border-emerald-500/20">
          Active ({memories.length})
        </span>
      </div>

      {/* Memory items list */}
      <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {memories.map((memory, index) => {
          const mType = memory.type?.toLowerCase() || 'unknown';
          const badgeClass = tagColors[mType] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
          const label = tagLabels[mType] || memory.type || 'Memory';

          return (
            <div
              key={index}
              className="flex items-start gap-2.5 rounded-lg border border-slate-800/40 bg-slate-900/50 p-2.5 hover:border-slate-800 transition-colors"
            >
              <CheckCircle2 size={14} className="text-emerald-400 mt-1 shrink-0" />
              
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`rounded px-1.5 py-0.2 text-3xs font-bold uppercase tracking-widest border shrink-0 ${badgeClass}`}>
                    {label}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono truncate hover:whitespace-normal hover:break-all transition-all duration-300">
                  {memory.content}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MemoryPanel;
