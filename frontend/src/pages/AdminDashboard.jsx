import React, { useState, useEffect } from 'react';
import { 
  getAnalyticsData, 
  createMemory, 
  createKnowledgeItem, 
  uploadDocumentFile, 
  getMemories, 
  getKnowledge,
  getAllUsers
} from '../services/api';
import { 
  BarChart3, 
  Database, 
  Users, 
  MessageSquare, 
  UploadCloud, 
  Plus, 
  Search, 
  BookOpen, 
  FileText, 
  BrainCircuit, 
  Activity,
  CheckCircle,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [memories, setMemories] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [memType, setMemType] = useState('architecture');
  const [memContent, setMemContent] = useState('');
  const [knowTitle, setKnowTitle] = useState('');
  const [knowContent, setKnowContent] = useState('');
  const [uploadFile, setUploadFile] = useState(null);

  // Search states
  const [memSearch, setMemSearch] = useState('');
  const [memFilter, setMemFilter] = useState('all');
  const [knowSearch, setKnowSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'analytics') {
        const stats = await getAnalyticsData();
        setAnalytics(stats);
        const usersList = await getAllUsers();
        setUsers(usersList);
      } else if (activeTab === 'memories') {
        const data = await getMemories();
        setMemories(data.memories || []);
      } else if (activeTab === 'knowledge') {
        const data = await getKnowledge();
        setKnowledge(data.knowledge || []);
      }
    } catch (err) {
      setError('Failed to fetch data. Verify admin role or backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!memContent.trim()) return;
    setError('');
    setSuccess('');
    try {
      await createMemory(memType, memContent);
      setSuccess('Memory successfully created in MongoDB and Parcle!');
      setMemContent('');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) {
      setError('Failed to save memory.');
    }
  };

  const handleAddKnowledge = async (e) => {
    e.preventDefault();
    if (!knowTitle.trim() || !knowContent.trim()) return;
    setError('');
    setSuccess('');
    try {
      await createKnowledgeItem(knowTitle, knowContent);
      setSuccess('Knowledge article stored and ingested successfully.');
      setKnowTitle('');
      setKnowContent('');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) {
      setError('Failed to store knowledge.');
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await uploadDocumentFile(uploadFile);
      setSuccess(`File "${uploadFile.name}" successfully indexed into Parcle client memory!`);
      setUploadFile(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Document upload failed. Make sure the file format is valid text, markdown, or PDF.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMemories = memories.filter(m => {
    const matchesSearch = m.content.toLowerCase().includes(memSearch.toLowerCase()) || 
                          m.type.toLowerCase().includes(memSearch.toLowerCase());
    const matchesFilter = memFilter === 'all' || m.type === memFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredKnowledge = knowledge.filter(k => 
    k.title.toLowerCase().includes(knowSearch.toLowerCase()) || 
    k.content.toLowerCase().includes(knowSearch.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 p-6 md:p-8 text-slate-100">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-5 border-b border-slate-900 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-200 to-slate-100 bg-clip-text text-transparent flex items-center gap-3">
            <Database className="h-8 w-8 text-indigo-400" /> Admin Control Room
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure system parameters, manage vector knowledge ingest, and monitor retrieval metrics.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'knowledge' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Knowledge Base
          </button>
          <button
            onClick={() => setActiveTab('memories')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'memories' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Memories
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div>{error}</div>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-sm flex items-start gap-3">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
          <div>{success}</div>
        </div>
      )}

      {/* Main Tab Content */}
      {loading && !analytics && memories.length === 0 && knowledge.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-4" />
          <p className="text-slate-400 text-sm">Querying database resources...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: ANALYTICS */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                
                {/* Card 1: Users */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 hover:border-slate-800/80 transition-all flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Total Users</span>
                    <span className="text-2xl md:text-3xl font-extrabold text-white mt-1 block">{analytics.total_users}</span>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    <Users className="h-5 w-5" />
                  </div>
                </div>

                {/* Card 2: Memories */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 hover:border-slate-800/80 transition-all flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Memories Stored</span>
                    <span className="text-2xl md:text-3xl font-extrabold text-white mt-1 block">{analytics.total_memories}</span>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                </div>

                {/* Card 3: Chats */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 hover:border-slate-800/80 transition-all flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Total chats</span>
                    <span className="text-2xl md:text-3xl font-extrabold text-white mt-1 block">{analytics.total_chats}</span>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                </div>

                {/* Card 4: Retrievals */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 hover:border-slate-800/80 transition-all flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Retrievals Count</span>
                    <span className="text-2xl md:text-3xl font-extrabold text-white mt-1 block">{analytics.memory_retrieval_count}</span>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>

              </div>

              {/* Advanced Graphs & User Roles List */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1: Most Queried Topics */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 lg:col-span-2">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-5">
                    <BarChart3 className="h-5 w-5 text-indigo-400" /> Hot Retrieval Topics
                  </h3>
                  
                  {analytics.most_queried_topics?.length === 0 ? (
                    <div className="h-48 flex items-center justify-center border border-dashed border-slate-800 rounded-xl">
                      <p className="text-slate-500 text-sm">No vector query events logged yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analytics.most_queried_topics?.map((topic, i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium text-slate-300">
                            <span className="font-mono">"{topic.topic}"</span>
                            <span>{topic.count} query hits</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-full rounded-full" 
                              style={{ width: `${Math.min(100, (topic.count / (analytics.memory_retrieval_count || 1)) * 100)}%` }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category counts */}
                  <h3 className="text-lg font-bold text-slate-100 mt-8 mb-5 flex items-center gap-2">
                    <Database className="h-5 w-5 text-violet-400" /> Memories by Category
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(analytics.memory_categories || {}).map(([cat, val]) => (
                      <div key={cat} className="bg-slate-950 border border-slate-800/60 rounded-xl p-4 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">{cat.replace('_', ' ')}</span>
                        <span className="text-xl font-extrabold text-white mt-1 block">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: System Users & Credentials */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-5">
                    <Users className="h-5 w-5 text-violet-400" /> Platform Registered Users
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto max-h-[350px] space-y-3 pr-1">
                    {users.map((user) => (
                      <div key={user.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 tracking-wider ${
                          user.role === 'ADMIN' 
                            ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20' 
                            : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 text-center text-xs">
                    <div>
                      <span className="text-slate-500 block">Admins</span>
                      <span className="text-base font-bold text-slate-300 mt-0.5 block">{analytics.roles?.ADMIN || 0}</span>
                    </div>
                    <div className="border-l border-slate-800/80">
                      <span className="text-slate-500 block">Users</span>
                      <span className="text-base font-bold text-slate-300 mt-0.5 block">{analytics.roles?.USER || 0}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: KNOWLEDGE BASE MANAGER */}
          {activeTab === 'knowledge' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
              
              {/* Form Input (Left Column) */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 lg:col-span-1 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-indigo-400" /> Create Knowledge Document
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Adds reference documentation to the system. The AI retrieves these contents during query evaluations.
                  </p>
                </div>

                <form onSubmit={handleAddKnowledge} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Database Authentication"
                      value={knowTitle}
                      onChange={(e) => setKnowTitle(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 px-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Article Content</label>
                    <textarea
                      rows={6}
                      placeholder="e.g., Always use JWT authentication for protected API endpoints..."
                      value={knowContent}
                      onChange={(e) => setKnowContent(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 px-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold py-2.5 px-4 rounded-xl shadow-md text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Save Article
                  </button>
                </form>

                {/* Form 2: Document File Upload */}
                <div className="border-t border-slate-800 pt-6">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
                    <UploadCloud className="h-4.5 w-4.5 text-violet-400" /> Upload Knowledge File
                  </h3>
                  <form onSubmit={handleFileUpload} className="space-y-4">
                    <div className="border-2 border-dashed border-slate-800 rounded-xl p-5 text-center bg-slate-950/30 hover:bg-slate-950/60 hover:border-slate-700 transition-all relative">
                      <input 
                        type="file" 
                        accept=".txt,.md,.pdf,README" 
                        onChange={(e) => setUploadFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <UploadCloud className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-xs text-slate-300 font-medium">
                        {uploadFile ? uploadFile.name : 'Choose a file or drag here'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">Accepts PDF, TXT, MD, README (Max 5MB)</p>
                    </div>
                    <button
                      type="submit"
                      disabled={!uploadFile}
                      className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600 text-sm font-semibold py-2.5 px-4 rounded-xl shadow-md text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UploadCloud className="h-4 w-4" /> Index File to Vector Store
                    </button>
                  </form>
                </div>

              </div>

              {/* Knowledge Base List (Right Column) */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 lg:col-span-2 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-violet-400" /> Reference Library
                  </h3>
                  
                  {/* Search bar */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search knowledge..."
                      value={knowSearch}
                      onChange={(e) => setKnowSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {filteredKnowledge.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl">
                    <FolderOpen className="h-10 w-10 text-slate-600 mb-2" />
                    <p className="text-slate-500 text-sm">No matching knowledge articles found.</p>
                  </div>
                ) : (
                  <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
                    {filteredKnowledge.map((item) => (
                      <div key={item.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition-all space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-white text-sm">{item.title}</h4>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">ID: {item.id?.substring(0, 8)}...</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">{item.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: MEMORIES MANAGEMENT */}
          {activeTab === 'memories' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
              
              {/* Form Input (Left Column) */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 lg:col-span-1 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-indigo-400" /> Add Workspace Memory
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Saves a context memory snippet into MongoDB Atlas metadata and the Parcle vector store.
                  </p>
                </div>

                <form onSubmit={handleAddMemory} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Memory Category</label>
                    <select
                      value={memType}
                      onChange={(e) => setMemType(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 px-3.5 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                    >
                      <option value="architecture">Architecture</option>
                      <option value="coding_standard">Coding Standard</option>
                      <option value="bug_fix">Bug Fix</option>
                      <option value="team_preference">Team Preference</option>
                      <option value="conversation">Conversation Log</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Memory Content</label>
                    <textarea
                      rows={5}
                      placeholder="e.g., Deploy all microservices using Docker on AWS ECS."
                      value={memContent}
                      onChange={(e) => setMemContent(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 px-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold py-2.5 px-4 rounded-xl shadow-md text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Save Memory
                  </button>
                </form>
              </div>

              {/* Memories List (Right Column) */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 lg:col-span-2 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-indigo-400" /> Active Vector Memories
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Category Filter */}
                    <select
                      value={memFilter}
                      onChange={(e) => setMemFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="architecture">Architecture</option>
                      <option value="coding_standard">Coding Standard</option>
                      <option value="bug_fix">Bug Fix</option>
                      <option value="team_preference">Team Preference</option>
                      <option value="conversation">Conversation Log</option>
                    </select>

                    {/* Search bar */}
                    <div className="relative w-full sm:w-48">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search memories..."
                        value={memSearch}
                        onChange={(e) => setMemSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {filteredMemories.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl">
                    <FolderOpen className="h-10 w-10 text-slate-600 mb-2" />
                    <p className="text-slate-500 text-sm">No matching workspace memories recorded.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[500px] pr-1">
                    {filteredMemories.map((m, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4.5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
                        <p className="text-xs text-slate-300 leading-relaxed font-mono">"{m.content}"</p>
                        <div className="flex items-center justify-between border-t border-slate-900 pt-3">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 font-mono">Memory {idx+1}</span>
                          <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full border tracking-wide ${
                            m.type === 'architecture' ? 'bg-violet-500/10 text-violet-300 border-violet-500/20' :
                            m.type === 'coding_standard' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' :
                            m.type === 'bug_fix' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' :
                            m.type === 'team_preference' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                            'bg-blue-500/10 text-blue-300 border-blue-500/20'
                          }`}>
                            {m.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </>
      )}

    </div>
  );
}
