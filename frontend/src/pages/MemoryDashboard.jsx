import React, { useState, useEffect } from 'react';
import MemoryCard from '../components/MemoryCard';
import { SkeletonCard } from '../components/LoadingSpinner';
import { getMemories, getHealth } from '../services/api';
import { Database, LayoutGrid, Cpu, Terminal, ShieldAlert, Heart, MessageSquare, AlertCircle, RefreshCw, Search, Calendar } from 'lucide-react';

const MemoryDashboard = () => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking'); // checking, online, offline
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('group'); // group, timeline

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

  const validMemories = Array.isArray(memories) ? memories.filter(Boolean) : [];

  // Categorize helper totals
  const stats = {
    total: validMemories.length,
    architecture: validMemories.filter((m) => typeof m.type === 'string' && m.type.toLowerCase() === 'architecture').length,
    coding_standard: validMemories.filter((m) => typeof m.type === 'string' && m.type.toLowerCase() === 'coding_standard').length,
    bug_fix: validMemories.filter((m) => typeof m.type === 'string' && m.type.toLowerCase() === 'bug_fix').length,
    team_preference: validMemories.filter((m) => typeof m.type === 'string' && m.type.toLowerCase() === 'team_preference').length,
    conversation: validMemories.filter((m) => typeof m.type === 'string' && m.type.toLowerCase() === 'conversation').length,
  };

  // Filter memories list by search query and category
  const getFilteredMemories = (memsList) => {
    const validMems = Array.isArray(memsList) ? memsList.filter(Boolean) : [];
    return validMems.filter((memory) => {
      const typeStr = typeof memory.type === 'string' ? memory.type : '';
      const contentStr = typeof memory.content === 'string' ? memory.content : '';

      const matchesFilter = selectedFilter === 'all' || typeStr.toLowerCase() === selectedFilter;
      const matchesSearch = !searchQuery.trim() || 
        contentStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        typeStr.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  };

  const currentFiltered = getFilteredMemories(validMemories);

  const filterTabs = [
    { id: 'all', label: 'All Memory', count: stats.total, icon: <LayoutGrid size={14} /> },
    { id: 'architecture', label: 'Architecture', count: stats.architecture, icon: <Cpu size={14} /> },
    { id: 'coding_standard', label: 'Standards', count: stats.coding_standard, icon: <Terminal size={14} /> },
    { id: 'bug_fix', label: 'Bug Fixes', count: stats.bug_fix, icon: <ShieldAlert size={14} /> },
    { id: 'team_preference', label: 'Preferences', count: stats.team_preference, icon: <Heart size={14} /> },
    { id: 'conversation', label: 'Conversations', count: stats.conversation, icon: <MessageSquare size={14} /> },
  ];

  // Helper categories config for group headers
  const categoryHeaders = {
    architecture: { title: 'Architecture Decisions', color: 'text-blue-400 border-blue-900/50' },
    coding_standard: { title: 'Coding Standards & Guidelines', color: 'text-emerald-400 border-emerald-900/50' },
    bug_fix: { title: 'Bug Fix & Resolution Memory', color: 'text-red-400 border-red-900/50' },
    team_preference: { title: 'Team Preference Constraints', color: 'text-purple-400 border-purple-900/50' },
    conversation: { title: 'Interactive Conversation Logs', color: 'text-slate-400 border-slate-800' },
  };

  // Grouped memories view builder
  const renderGroupedMemories = () => {
    const categories = ['architecture', 'coding_standard', 'bug_fix', 'team_preference', 'conversation'];
    
    // If we have selected a specific category filter, only show that category
    const activeCategories = selectedFilter === 'all' ? categories : [selectedFilter];

    const sections = activeCategories.map((cat) => {
      const catMems = validMemories.filter((m) => typeof m?.type === 'string' && m.type.toLowerCase() === cat);
      const filteredCatMems = getFilteredMemories(catMems);

      if (filteredCatMems.length === 0) return null;

      const header = categoryHeaders[cat] || { title: cat, color: 'text-slate-300' };

      return (
        <div key={cat} className="space-y-4">
          <div className={`border-b pb-2 flex items-center justify-between ${header.color}`}>
            <h2 className="text-sm font-bold uppercase tracking-widest">{header.title}</h2>
            <span className="rounded-full bg-slate-900 border border-slate-800 px-2 py-0.5 text-3xs font-bold font-mono">
              {filteredCatMems.length} items
            </span>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCatMems.map((memory, index) => (
              <MemoryCard key={index} type={memory.type} content={memory.content} />
            ))}
          </div>
        </div>
      );
    });

    const hasContent = sections.some((s) => s !== null);

    if (!hasContent) {
      return renderEmptyState();
    }

    return <div className="space-y-10">{sections}</div>;
  };

  // Chronological timeline view builder
  const renderTimelineMemories = () => {
    if (currentFiltered.length === 0) {
      return renderEmptyState();
    }

    return (
      <div className="relative pl-6 md:pl-8 border-l-2 border-slate-800 space-y-8 ml-2 md:ml-4">
        {currentFiltered.map((memory, index) => (
          <div key={index} className="relative group">
            {/* Timeline node node indicator */}
            <div className="absolute -left-[31px] md:-left-[39px] top-1.5 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-slate-950 border-2 border-slate-700 group-hover:border-brand-500 group-hover:bg-brand-500/10 transition-all duration-300">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400 group-hover:bg-brand-400" />
            </div>
            
            {/* Timestamp / Order bubble */}
            <div className="flex items-center gap-2 mb-2 text-2xs font-semibold text-slate-500 uppercase tracking-widest">
              <Calendar size={12} className="text-slate-600" />
              <span>Memory Index #{currentFiltered.length - index} (Ingested Chronologically)</span>
            </div>

            <div className="max-w-3xl">
              <MemoryCard type={memory.type} content={memory.content} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-600 border border-slate-800 mb-4">
        <Database size={20} />
      </div>
      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">No memories match</h3>
      <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed font-sans">
        No cognitive records found matching categories or search keywords.
      </p>
    </div>
  );

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
          
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* View Mode Toggles */}
            <div className="flex rounded-lg border border-slate-800 bg-slate-900/40 p-1 mr-1">
              <button
                onClick={() => setViewMode('group')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  viewMode === 'group'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Category Group
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Memory Timeline
              </button>
            </div>

            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Reload</span>
            </button>
          </div>
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

        {/* Filters and Search Bar Container */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
          {/* Filters List */}
          <div className="flex flex-wrap gap-2">
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

          {/* Search Inputs */}
          <div className="relative flex items-center w-full md:max-w-xs rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-1.5 focus-within:border-brand-500/50 transition-all shrink-0">
            <Search size={14} className="text-slate-500 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search index memories..."
              className="flex-1 bg-transparent py-1 text-xs text-slate-250 placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Content Renderers */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : viewMode === 'timeline' ? (
          renderTimelineMemories()
        ) : (
          renderGroupedMemories()
        )}
      </div>
    </div>
  );
};

export default MemoryDashboard;
