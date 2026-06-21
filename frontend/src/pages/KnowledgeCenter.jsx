import React, { useState, useEffect } from 'react';
import { 
  uploadFileDoc, 
  uploadFileImage, 
  uploadFileProject, 
  searchKnowledge, 
  getKnowledgeHistory,
  getHealth
} from '../services/api';
import { 
  BrainCircuit, 
  UploadCloud, 
  FileText, 
  Image, 
  FolderArchive, 
  Search, 
  ShieldAlert, 
  Cpu, 
  Layers, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Code2, 
  Activity,
  ChevronRight,
  BookOpen
} from 'lucide-react';

export default function KnowledgeCenter() {
  const [history, setHistory] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking');
  
  // Upload States
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState('document'); // document, image, project
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null); // { type: 'success'|'error', message: '' }
  
  // Selected analysis log for Detail View
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // summary, architecture, decisions, dependencies, security, memories

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setBackendStatus('checking');
      await getHealth();
      setBackendStatus('online');

      const data = await getKnowledgeHistory();
      setHistory(data || []);
      
      // Auto-select first item if exists and nothing is selected
      if (data && data.length > 0 && !selectedAnalysis) {
        setSelectedAnalysis(data[0]);
      }
    } catch (e) {
      console.error('Error fetching knowledge history:', e);
      setBackendStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setUploadStatus(null);
      
      // Auto-detect type by extension
      const ext = file.name.split('.').pop().toLowerCase();
      if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
        setUploadType('image');
      } else if (ext === 'zip') {
        setUploadType('project');
      } else {
        setUploadType('document');
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadStatus(null);
    setUploadProgress(20);

    try {
      let response;
      setUploadProgress(40);
      
      if (uploadType === 'image') {
        response = await uploadFileImage(uploadFile);
      } else if (uploadType === 'project') {
        response = await uploadFileProject(uploadFile);
      } else {
        response = await uploadFileDoc(uploadFile);
      }

      setUploadProgress(80);
      setUploadStatus({
        type: 'success',
        message: `Successfully processed "${uploadFile.name}" and extracted structured knowledge.`
      });
      setUploadFile(null);
      
      // Refresh history & highlight the new upload
      const freshHistory = await getKnowledgeHistory();
      setHistory(freshHistory || []);
      if (freshHistory && freshHistory.length > 0) {
        // Find the matching newly uploaded item by filename
        const matched = freshHistory.find(h => h.filename === response.filename);
        setSelectedAnalysis(matched || freshHistory[0]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.detail || 'Ingestion failed. Please check backend connection or file structure.'
      });
    } finally {
      setUploading(false);
      setUploadProgress(100);
      // reset progress bar after delay
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchKnowledge(query);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Search query failed:', error);
    }
  };

  const getFileIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
      case 'docx':
      case 'txt':
      case 'md':
        return <FileText size={18} className="text-blue-400" />;
      case 'image':
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <Image size={18} className="text-emerald-400" />;
      case 'project':
      case 'zip':
        return <FolderArchive size={18} className="text-violet-400" />;
      default:
        return <FileText size={18} className="text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 bg-slate-950 px-4 py-8 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="mx-auto max-w-7xl">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl flex items-center gap-2">
              <BrainCircuit className="text-violet-500 animate-pulse" />
              File Intelligence & Project Ingestion
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Extract context, compile dependencies, inspect security, and generate cognitive memory from codebase artifacts.
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Sync System</span>
            </button>
          </div>
        </div>

        {/* Backend Offline Warn */}
        {backendStatus === 'offline' && (
          <div className="mb-6 flex items-center justify-between rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-3 text-sm text-red-400">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0" />
              <span>Could not connect to backend server. File extraction and Groq models may be offline.</span>
            </div>
            <button
              onClick={fetchHistory}
              className="rounded-lg bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-red-300 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Hand Actions & Upload / History list */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Upload Area */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-5 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 via-indigo-500 to-emerald-500" />
              
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <UploadCloud size={16} className="text-violet-400" />
                Ingest Workspace Asset
              </h2>

              <form onSubmit={handleUpload} className="space-y-4">
                {/* Drag and Drop Container */}
                <div className="relative group cursor-pointer border border-dashed border-slate-800 hover:border-violet-500/40 rounded-xl bg-slate-900/10 p-6 text-center hover:bg-slate-900/25 transition-all">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept=".pdf,.docx,.txt,.md,.json,.zip,image/*,README"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-500 border border-slate-800 group-hover:text-violet-400 group-hover:border-violet-500/20 transition-all">
                      {uploadType === 'image' ? (
                        <Image size={18} />
                      ) : uploadType === 'project' ? (
                        <FolderArchive size={18} />
                      ) : (
                        <FileText size={18} />
                      )}
                    </div>
                    {uploadFile ? (
                      <div className="max-w-xs">
                        <p className="text-xs font-semibold text-slate-200 truncate">{uploadFile.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase">
                          Type Detected: {uploadType}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-300">
                          Drop code, ZIP, docs, or screenshots here
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          ZIP, PDF, DOCX, TXT, PNG, JPG up to 15MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {uploadProgress > 0 && (
                  <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                {/* Feedback */}
                {uploadStatus && (
                  <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    uploadStatus.type === 'success' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {uploadStatus.type === 'success' ? (
                      <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{uploadStatus.message}</span>
                  </div>
                )}

                {/* Action button */}
                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-violet-500/10 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Ingesting & Processing...</span>
                    </>
                  ) : (
                    <>
                      <BrainCircuit size={14} />
                      <span>Process & Memorize Asset</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Ingested History & Search */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-5 backdrop-blur-xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-400" />
                Ingestion Registry
              </h2>

              {/* Search Registry */}
              <div className="relative flex items-center w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 mb-4 focus-within:border-indigo-500/50 transition-all">
                <Search size={14} className="text-slate-500 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search matching content..."
                  className="flex-1 bg-transparent py-0.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Search result view fallback */}
              {isSearching ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-900">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Search Hits</span>
                    <button 
                      onClick={() => { setSearchQuery(''); setIsSearching(false); setSearchResults([]); }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300"
                    >
                      Clear
                    </button>
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      No matching records found.
                    </div>
                  ) : (
                    searchResults.map((res) => (
                      <div 
                        key={res.id} 
                        className="p-3 bg-slate-900/35 border border-slate-900 rounded-xl hover:border-slate-800 cursor-pointer"
                        onClick={() => {
                          const matched = history.find(h => h.file_id === res.id || h.filename?.includes(res.title?.replace('Document: ', '')));
                          if (matched) setSelectedAnalysis(matched);
                        }}
                      >
                        <h4 className="text-xs font-semibold text-white truncate">{res.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{res.content_preview}</p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Standard History List */
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-slate-900/20 border border-slate-900 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-slate-900" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2.5 bg-slate-900 rounded w-2/3" />
                          <div className="h-2 bg-slate-900 rounded w-1/2" />
                        </div>
                      </div>
                    ))
                  ) : history.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No files ingested yet. Upload an asset above to start.
                    </div>
                  ) : (
                    history.map((item) => {
                      const isSelected = selectedAnalysis?.file_id === item.file_id;
                      return (
                        <div
                          key={item.file_id}
                          onClick={() => setSelectedAnalysis(item)}
                          className={`group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-indigo-600/10 border-indigo-500/30 text-white' 
                              : 'bg-slate-900/20 border-slate-900/70 text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                          }`}
                        >
                          <div className="mt-0.5 p-1.5 rounded-lg bg-slate-950 border border-slate-900">
                            {getFileIcon(item.file_type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-350'}`}>
                                {item.filename}
                              </p>
                              <ChevronRight size={12} className={`shrink-0 opacity-0 group-hover:opacity-100 transition-all ${isSelected ? 'text-indigo-400' : 'text-slate-550'}`} />
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate-500 font-medium">
                              <Clock size={10} />
                              <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{(item.size / 1024).toFixed(1)} KB</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Right Hand: AI Analysis Dashboard Details */}
          <div className="lg:col-span-7">
            {selectedAnalysis ? (
              <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 backdrop-blur-xl flex flex-col h-full min-h-[500px]">
                
                {/* Panel Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-5 mb-5">
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
                      Asset Ingestion Analysis
                    </span>
                    <h2 className="text-lg font-bold text-white mt-2 truncate font-sans">
                      {selectedAnalysis.filename}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                    <Clock size={11} />
                    <span>Parsed: {new Date(selectedAnalysis.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                {/* Analysis Tab Switchers */}
                <div className="flex flex-wrap gap-1.5 border-b border-slate-900 pb-3 mb-6">
                  {[
                    { id: 'summary', label: 'Summary', icon: <FileText size={12} /> },
                    { id: 'architecture', label: 'Architecture', icon: <Cpu size={12} /> },
                    { id: 'decisions', label: 'Decisions', icon: <Code2 size={12} /> },
                    { id: 'dependencies', label: 'Dependencies', icon: <Layers size={12} /> },
                    { id: 'security', label: 'Security Alert', icon: <ShieldAlert size={12} /> },
                    { id: 'memories', label: 'Saved Memories', icon: <BrainCircuit size={12} /> }
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all border ${
                          isActive 
                            ? 'bg-slate-800 border-slate-700 text-white shadow-sm' 
                            : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab content screens */}
                <div className="flex-1 text-slate-300 overflow-y-auto max-h-[500px] pr-2">
                  
                  {activeTab === 'summary' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Executive Abstract</h3>
                      <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl leading-relaxed text-slate-300 text-xs font-sans whitespace-pre-line">
                        {selectedAnalysis.summary}
                      </div>
                      
                      {selectedAnalysis.analysis?.technologies?.length > 0 && (
                        <div className="space-y-2 mt-4">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Core Technologies Identified</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedAnalysis.analysis.technologies.map((tech, idx) => (
                              <span key={idx} className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'architecture' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Architectural Overview</h3>
                      <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl">
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">
                          {selectedAnalysis.analysis?.architecture || 'No explicit architecture structures cataloged.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'decisions' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Design Patterns & Technical Decisions</h3>
                      {selectedAnalysis.analysis?.decisions?.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No technical decisions cataloged in this asset.</p>
                      ) : (
                        <ul className="space-y-2.5">
                          {selectedAnalysis.analysis?.decisions?.map((dec, idx) => (
                            <li key={idx} className="flex gap-2.5 p-3 bg-slate-900/20 border border-slate-900/60 rounded-xl">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-950 border border-slate-900 text-[10px] font-bold text-slate-400">
                                {idx + 1}
                              </span>
                              <p className="text-xs text-slate-350 leading-relaxed font-sans">{dec}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {activeTab === 'dependencies' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Dependencies & Specs</h3>
                      {selectedAnalysis.analysis?.dependencies?.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No package configuration or dependencies parsed.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedAnalysis.analysis?.dependencies?.map((dep, idx) => (
                            <div key={idx} className="p-3 bg-slate-900/25 border border-slate-900/60 rounded-xl flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-200 truncate">{dep.name || dep}</span>
                              {dep.version && (
                                <span className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                                  {dep.version}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'security' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Security & Code Integrity Alerts</h3>
                      {selectedAnalysis.analysis?.security_findings?.length === 0 ? (
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-emerald-400 text-xs flex items-center gap-2.5">
                          <CheckCircle2 size={16} />
                          <span>No credentials leaks, configuration vulnerability, or package risk warnings detected.</span>
                        </div>
                      ) : (
                        <ul className="space-y-3">
                          {selectedAnalysis.analysis?.security_findings?.map((finding, idx) => (
                            <li key={idx} className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-xs flex items-start gap-3">
                              <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <span className="font-bold text-red-400 uppercase tracking-wider text-[9px]">Potential Risk Found</span>
                                <p className="text-slate-350 leading-relaxed font-sans">{finding}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {activeTab === 'memories' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Generated Semantic Memory Objects</h3>
                      <p className="text-[10px] text-indigo-400 uppercase tracking-wider">
                        These items have been compiled and registered into your Parcle memory workspace space.
                      </p>
                      
                      {selectedAnalysis.analysis?.memories?.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No memories generated from this file.</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedAnalysis.analysis?.memories?.map((mem, idx) => (
                            <div key={idx} className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl relative overflow-hidden">
                              <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500" />
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                  {mem.type || 'architecture'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-350 leading-relaxed font-sans">{mem.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>
            ) : (
              /* Idle Select Placeholder Dashboard Card */
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/10 h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-slate-600 border border-slate-800 mb-4 animate-bounce">
                  <Activity size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Select Ingestion Record</h3>
                <p className="mt-2 max-w-sm text-xs text-slate-500 leading-relaxed font-sans">
                  Select a document file, diagnostic image, or codebase package archive from the history registry on the left to load AI intelligence insights.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
