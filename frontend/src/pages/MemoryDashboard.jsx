import React, { useState, useEffect } from 'react';
import MemoryCard from '../components/MemoryCard';
import { SkeletonCard } from '../components/LoadingSpinner';
import { getMemories, getHealth } from '../services/api';
import { Database, LayoutGrid, Cpu, Terminal, ShieldAlert, Heart, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';

const MemoryDashboard = () => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking'); // checking, online, offline
  const [selectedFilter, setSelectedFilter] = useState('all');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setBackendStatus('checking');
      await getHealth();
      setBackendStatus('online');

      const data = await getMemories();
      setMemories(data.memories || []);
    } catch (e) {
      console.error('Error fetching dashboard memories:', e);
      setBackendStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Categorize helper totals
  const stats = {
    total: memories.length,
    architecture: memories.filter((m) => m.type?.toLowerCase() === 'architecture').length,
    coding_standard: memories.filter((m) => m.type?.toLowerCase() === 'coding_standard').length,
    bug_fix: memories.filter((m) => m.type?.toLowerCase() === 'bug_fix').length,
    team_preference: memories.filter((m) => m.type?.toLowerCase() === 'team_preference').length,
    conversation: memories.filter((m) => m.type?.toLowerCase() === 'conversation').length,
  };

  // Filter memories list
  const filteredMemories = memories.filter((memory) => {
    if (selectedFilter === 'all') return true;
    return memory.type?.toLowerCase() === selectedFilter;
  });

  const filterTabs = [
    { id: 'all', label: 'All Memory', count: stats.total, icon: <LayoutGrid size={14} /> },
    { id: 'architecture', label: 'Architecture', count: stats.architecture, icon: <Cpu size={14} /> },
    { id: 'coding_standard', label: 'Standards', count: stats.coding_standard, icon: <Terminal size={14} /> },
    { id: 'bug_fix', label: 'Bug Fixes', count: stats.bug_fix, icon: <ShieldAlert size={14} /> },
    { id: 'team_preference', label: 'Preferences', count: stats.team_preference, icon: <Heart size={14} /> },
    { id: 'conversation', label: 'Conversations', count: stats.conversation, icon: <MessageSquare size={14} /> },
  ];

  return (
    <div className="flex-1 bg-slate-950 px-4 py-8 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="mx-auto max-w-7xl">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl font-sans">
              Persistent Memory Dashboard
            </h1>
            <p className="mt-1.5 text-sm text-slate-400 font-sans">
              Real-time exploration of AI cognitive state and Parcle API records.
            </p>
          </div>
          
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Reload Dashboard</span>
          </button>
        </div>

        {/* Backend offline warning banner */}
        {backendStatus === 'offline' && (
          <div className="mb-6 flex items-center justify-between rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-3 text-sm text-red-400">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0" />
              <span>Failed to establish API handshake with MemoryForge backend on port 8000.</span>
            </div>
            <button
              onClick={fetchDashboardData}
              className="rounded-lg bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-red-300 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Grid Dashboard Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 transition-all hover:bg-slate-900/30">
            <div className="text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Memories</div>
            <div className="text-2xl font-extrabold text-white font-mono">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 transition-all hover:bg-slate-900/30">
            <div className="text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Architecture</div>
            <div className="text-2xl font-extrabold text-blue-400 font-mono">{stats.architecture}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 transition-all hover:bg-slate-900/30">
            <div className="text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Coding Standards</div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">{stats.coding_standard}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 transition-all hover:bg-slate-900/30">
            <div className="text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Bug Fixes</div>
            <div className="text-2xl font-extrabold text-red-400 font-mono">{stats.bug_fix}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 transition-all hover:bg-slate-900/30">
            <div className="text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Team Preferences</div>
            <div className="text-2xl font-extrabold text-purple-400 font-mono">{stats.team_preference}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 transition-all hover:bg-slate-900/30">
            <div className="text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Conversations</div>
            <div className="text-2xl font-extrabold text-slate-400 font-mono">{stats.conversation}</div>
          </div>
        </div>

        {/* Filters and Views tabs */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-900 pb-4">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider border transition-all ${
                selectedFilter === tab.id
                  ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`ml-1 rounded px-1.5 py-0.2 text-3xs font-bold font-mono ${
                selectedFilter === tab.id
                  ? 'bg-slate-700 text-slate-200'
                  : 'bg-slate-900 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-600 border border-slate-800 mb-4">
              <Database size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">No memories found</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed font-sans">
              No cognitive records are currently indexable for category "{selectedFilter}". Talk to MemoryForge to seed preferences.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMemories.map((memory, index) => (
              <MemoryCard key={index} type={memory.type} content={memory.content} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryDashboard;
