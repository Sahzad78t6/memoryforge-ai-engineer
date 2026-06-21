import React, { useState, useEffect, useRef } from 'react';
import ChatWindow from '../components/ChatWindow';
import MemoryPanel from '../components/MemoryPanel';
import { 
  sendChatMessage, 
  getHealth, 
  createMemory, 
  getMemories, 
  getChatHistory, 
  API_BASE_URL,
  uploadFileDoc,
  uploadFileImage,
  uploadFileProject
} from '../services/api';
import { 
  Send, 
  AlertCircle, 
  RefreshCw, 
  Cpu, 
  Database, 
  Play, 
  Sparkles, 
  Check, 
  Info,
  Plus,
  Mic,
  ArrowUp,
  X,
  Image,
  FolderArchive,
  FileText
} from 'lucide-react';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [latestMemories, setLatestMemories] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // checking, online, offline
  
  // Success Metrics State
  const [storedCount, setStoredCount] = useState(0);
  const [retrievedCount, setRetrievedCount] = useState(0);

  // File Upload Reference & Handler
  const fileInputRef = useRef(null);
  const [stagedFile, setStagedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileUploadChange = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;

    const selectedFiles = Array.from(e.target.files);
    const isDirectoryUpload = e.target.webkitdirectory || selectedFiles.length > 1;
    const primaryFile = selectedFiles[0];
    const stagedName = isDirectoryUpload
      ? `${selectedFiles.length} selected files`
      : primaryFile.name;

    // Stage file in state as uploading
    setStagedFile({
      name: stagedName,
      size: selectedFiles.reduce((total, file) => total + file.size, 0),
      type: isDirectoryUpload ? 'application/x-directory' : primaryFile.type,
      status: 'uploading'
    });
    setUploadingFile(true);

    try {
      let response;
      if (isDirectoryUpload) {
        response = await uploadFileProject(selectedFiles);
      } else {
        const ext = primaryFile.name.split('.').pop().toLowerCase();
        if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
          response = await uploadFileImage(primaryFile);
        } else if (ext === 'zip') {
          response = await uploadFileProject(primaryFile);
        } else {
          response = await uploadFileDoc(primaryFile);
        }
      }

      // Staged successfully
      const responseData = response || {};
      const analysisObj = responseData.analysis || responseData || {};
      setStagedFile({
        name: stagedName,
        size: responseData.size || selectedFiles.reduce((total, file) => total + file.size, 0),
        type: isDirectoryUpload ? 'application/x-directory' : primaryFile.type,
        status: 'ready',
        fileId: responseData.file_id,
        analysis: analysisObj,
        summary: responseData.summary || analysisObj.summary || 'No summary available.',
        ocrStatus: responseData.status || 'success',
        extractedText: responseData.extracted_text || '',
        technologies: responseData.technologies_detected || analysisObj.technologies || [],
        memories: responseData.memories_created || analysisObj.memories || []
      });

      // Refresh total count metrics
      const mems = await getMemories();
      setStoredCount(mems.count || 0);
    } catch (error) {
      console.error('Staging file upload failed:', error);
      const errMsg = error.response?.data?.detail || 'Ingestion failed.';
      setStagedFile({
        name: stagedName,
        size: selectedFiles.reduce((total, file) => total + file.size, 0),
        type: isDirectoryUpload ? 'application/x-directory' : primaryFile.type,
        status: 'error',
        error: errMsg
      });
    } finally {
      setUploadingFile(false);
      e.target.value = null;
    }
  };

  // Check health, count stored memories, and fetch chat history from DB
  const loadInitialData = async () => {
    try {
      setBackendStatus('checking');
      await getHealth();
      setBackendStatus('online');
      
      const mems = await getMemories();
      setStoredCount(mems.count || 0);

      // Load chat logs from MongoDB Atlas
      try {
        const history = await getChatHistory();
        if (history && history.length > 0) {
          const formattedHistory = [];
          history.forEach(h => {
            formattedHistory.push({ role: 'user', content: h.message });
            formattedHistory.push({ role: 'assistant', content: h.reply });
          });
          setMessages(formattedHistory);
        }
      } catch (historyErr) {
        console.error('Failed to load chat history:', historyErr);
      }
    } catch (e) {
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);


  const handleSend = async (messageText, displayText) => {
    if (!messageText.trim() || loading) return;

    const displayMsg = displayText || messageText;

    // Stage user message
    setMessages((prev) => [...prev, { role: 'user', content: displayMsg }]);
    setLoading(true);

    try {
      const data = await sendChatMessage(messageText);
      
      // Stage AI reply and memories utilized
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      
      const context = data.memory_context || [];
      setLatestMemories(context);
      
      // Update retrieval metrics
      if (context.length > 0) {
        setRetrievedCount((prev) => prev + context.length);
      }
      
      // Refresh total stored count (in case new interaction memory was saved)
      const mems = await getMemories();
      setStoredCount(mems.count || 0);
      setBackendStatus('online');
    } catch (error) {
      console.error('Chat error:', error);
      setBackendStatus('offline');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Failed to connect to the backend server. Please check that uvicorn is running on port 8000 and try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() && !stagedFile) return;

    let queryToSend = input;
    let displayMessageText = input;

    if (stagedFile) {
      if (stagedFile.status !== 'ready') {
        alert("Please wait for the file to finish uploading before sending.");
        return;
      }
      
      const analysis = stagedFile.analysis || {};
      const summary = stagedFile.summary || "No summary provided.";
      
      const technologies = Array.isArray(analysis.technologies) 
        ? analysis.technologies.filter(Boolean).join(', ') 
        : "None identified";
        
      const dependencies = Array.isArray(analysis.dependencies)
        ? analysis.dependencies
            .filter(Boolean)
            .map(d => (d && typeof d === 'object') ? `${d.name || 'unknown'} (${d.version || 'any'})` : String(d))
            .join(', ')
        : "None identified";
        
      const architecture = analysis.architecture || "Standard";
      
      const decisions = Array.isArray(analysis.decisions)
        ? analysis.decisions
            .filter(Boolean)
            .map((d, i) => `\n${i+1}. ${d}`)
            .join('')
        : "None cataloged";
        
      const security = Array.isArray(analysis.security_findings)
        ? analysis.security_findings
            .filter(Boolean)
            .map(s => `\n⚠️ ${s}`)
            .join('')
        : "✅ No threats detected";
        
      const memories = Array.isArray(analysis.memories)
        ? analysis.memories
            .filter(m => m && m.content)
            .map(m => `\n🧠 *[${m.type || 'architecture'}]* ${m.content}`)
            .join('')
        : "None generated";

      queryToSend = `[Context from file: ${stagedFile.name}
Summary: ${summary}
Technologies: ${technologies}
Dependencies: ${dependencies}
Architecture: ${architecture}
Decisions: ${decisions}
Security findings: ${security}
Memories generated: ${memories}]

User Prompt: ${input.trim() || 'Please analyze this ingested asset.'}`;

      displayMessageText = `📁 Attached: **${stagedFile.name}**\n\n${input.trim() || 'Please analyze this ingested asset.'}`;
    }

    setInput('');
    setStagedFile(null); // Clear staged thumbnail
    handleSend(queryToSend, displayMessageText);
  };

  // Demo Seeder
  const seedDemoWorkspace = async () => {
    if (seeding) return;
    setSeeding(true);
    setSeedSuccess(false);
    
    const demoMemories = [
      { type: 'architecture', content: 'Use MongoDB Atlas' },
      { type: 'coding_standard', content: 'Use JWT Authentication' },
      { type: 'team_preference', content: 'Use Tailwind CSS' },
      { type: 'architecture', content: 'Use Express.js' },
    ];

    try {
      // Create all demo memories in parallel
      await Promise.all(
        demoMemories.map((m) => createMemory(m.type, m.content))
      );
      
      setSeedSuccess(true);
      // Refresh count
      const mems = await getMemories();
      setStoredCount(mems.count || 0);
      
      // Clear success indicator after 3 seconds
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (e) {
      console.error('Seeding error:', e);
      alert('Failed to seed demo workspace. Is the backend running?');
    } finally {
      setSeeding(false);
    }
  };

  // Interactive Demo Scenario Prompts
  const demoScenarios = [
    'What database are we using?',
    'Create signup API',
    'Create login API',
    'What authentication method are we using?',
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-950 relative">
      {/* Ambient background glow — matches AuthPage / AdminDashboard / MemoryDashboard */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-60">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-brand-700/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-brand-600/10 blur-[100px]" />
      </div>

      {/* Offline Status Warning */}
      {backendStatus === 'offline' && (
        <div className="relative z-10 flex items-center justify-between bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs font-medium text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} />
            <span>Unable to connect to MemoryForge backend on {API_BASE_URL}.</span>
          </div>
          <button
            onClick={loadInitialData}
            className="flex items-center gap-1 hover:text-red-300 transition-colors uppercase font-bold text-2xs tracking-wider"
          >
            <RefreshCw size={10} className="animate-spin" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Main Grid Workspace */}
      <div className="relative z-10 flex flex-1 flex-col lg:grid lg:grid-cols-4 overflow-hidden">
        {/* Chat Area (3 columns on desktop) */}
        <div className="flex flex-col lg:col-span-3 h-full border-r border-slate-900/80 overflow-hidden">
          {/* Chat Header */}
          <div className="flex h-14 items-center justify-between border-b border-slate-900/80 bg-slate-950/60 backdrop-blur-sm px-6 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10 ring-1 ring-brand-500/30">
                <Cpu size={14} className="text-brand-400" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Agent Engineering Workspace
              </span>
            </div>
            
            {/* Action Bar */}
            <div className="flex items-center gap-3">
              <button
                onClick={seedDemoWorkspace}
                disabled={seeding || backendStatus === 'offline'}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
                  seedSuccess
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_16px_-4px_rgba(16,185,129,0.5)]'
                    : 'bg-brand-600/10 border-brand-500/30 text-brand-300 hover:bg-brand-600/20 hover:border-brand-500/50 hover:shadow-[0_0_16px_-4px_rgba(92,120,255,0.6)]'
                } disabled:opacity-50`}
              >
                {seeding ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : seedSuccess ? (
                  <Check size={12} />
                ) : (
                  <Sparkles size={12} />
                )}
                <span>{seedSuccess ? 'Workspace Loaded!' : 'Load Demo Workspace'}</span>
              </button>

              <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
                <span className={`relative inline-flex h-2 w-2 rounded-full ${
                  backendStatus === 'online' ? 'bg-emerald-500' : 'bg-red-500'
                }`}>
                  {backendStatus === 'online' && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-75" />
                  )}
                </span>
                <span className="text-2xs font-semibold text-slate-500 uppercase tracking-widest hidden sm:inline">
                  {backendStatus === 'online' ? 'Backend Live' : 'Backend Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Messages view */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <ChatWindow messages={messages} loading={loading} />
          </div>

          {/* Form Input Footer */}
          <div className="border-t border-slate-900/80 bg-slate-950/60 backdrop-blur-sm p-4 shrink-0">
            <form onSubmit={handleFormSubmit} className="mx-auto max-w-4xl">
              <div className="relative flex flex-col rounded-3xl bg-[#1a1a1f] border border-slate-800/60 focus-within:border-brand-500/50 focus-within:shadow-[0_0_0_3px_rgba(92,120,255,0.08)] p-3 transition-all duration-200">
                
                 {/* Staged File Thumbnail Row (visible if a file is staged) */}
                 {stagedFile && (
                   <div className="flex flex-col gap-2 px-2 mb-3">
                     <div className="flex items-center gap-3">
                       {/* Thumbnail/Icon */}
                       <div className="relative w-12 h-12 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center overflow-hidden shrink-0">
                         {stagedFile.status === 'uploading' ? (
                           <div className="w-5 h-5 rounded-full border-2 border-slate-600 border-t-white animate-spin" />
                         ) : stagedFile.status === 'error' ? (
                           <div className="text-rose-500">
                             <AlertCircle size={20} />
                           </div>
                         ) : (
                           <div className="flex flex-col items-center justify-center">
                             {stagedFile.type?.startsWith('image/') ? (
                               <Image size={18} className="text-emerald-400" />
                             ) : stagedFile.name?.endsWith('.zip') ? (
                               <FolderArchive size={18} className="text-brand-300" />
                             ) : (
                               <FileText size={18} className="text-blue-400" />
                             )}
                             <span className="text-[8px] text-slate-400 font-medium truncate max-w-[40px] mt-1 px-1">
                               {stagedFile.name}
                             </span>
                           </div>
                         )}
                         
                         {/* Close button */}
                         <button
                           type="button"
                           onClick={() => {
                             setStagedFile(null);
                             setUploadingFile(false);
                           }}
                           className="absolute -top-0.5 -right-0.5 h-[18px] w-[18px] bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white cursor-pointer z-20 transition-all shadow-md"
                         >
                           <X size={10} />
                         </button>
                       </div>
 
                       {/* Status / Tag Info */}
                       {stagedFile.status === 'ready' && (
                         <div className="flex flex-col justify-center">
                           <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full w-fit">
                             <Check size={12} />
                             <span>Upload Successful</span>
                           </div>
                           {stagedFile.ocrStatus === 'partial_success' && (
                             <span className="text-2xs text-amber-400 mt-1 font-medium">
                               Image processed with limited analysis available.
                             </span>
                           )}
                         </div>
                       )}
 
                       {stagedFile.status === 'error' && (
                         <div className="flex flex-col justify-center">
                           <span className="text-xs text-rose-400 font-semibold">
                             Upload Failed
                           </span>
                           <span className="text-2xs text-rose-500 mt-0.5 max-w-md truncate">
                             {stagedFile.error}
                           </span>
                         </div>
                       )}
 
                       {stagedFile.status === 'uploading' && (
                         <div className="flex items-center text-xs text-slate-400 font-medium">
                           Processing and ingesting asset...
                         </div>
                       )}
                     </div>

                     {/* Collapsible Image Analysis Panel */}
                     {stagedFile.status === 'ready' && stagedFile.type?.startsWith('image/') && (
                       <div className="mt-2 border-t border-slate-800/60 pt-2 w-full text-left">
                         <details className="group bg-slate-900/30 border border-slate-900 rounded-xl p-3" open>
                           <summary className="flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white cursor-pointer select-none">
                             <span className="flex items-center gap-1.5 uppercase tracking-wider text-2xs">
                               <Sparkles size={12} className="text-emerald-400" />
                               Image Analysis Details
                             </span>
                             <span className="text-slate-500 group-open:rotate-180 transition-transform duration-200 text-3xs">
                               ▼
                             </span>
                           </summary>
                           <div className="mt-3 space-y-4 pl-1 pr-1 max-h-60 overflow-y-auto">
                             {/* Extracted Text */}
                             {stagedFile.extractedText ? (
                               <div className="space-y-1">
                                 <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Extracted Text</span>
                                 <div className="bg-slate-950/80 border border-slate-900/80 rounded-lg p-2.5 text-2xs text-slate-300 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto select-text">
                                   {stagedFile.extractedText}
                                 </div>
                               </div>
                             ) : null}

                             {/* Summary */}
                             <div className="space-y-1">
                               <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Summary</span>
                               <p className="text-2xs text-slate-300 leading-relaxed font-sans">
                                 {stagedFile.summary}
                               </p>
                             </div>

                             {/* Detected Technologies */}
                             {stagedFile.technologies && stagedFile.technologies.length > 0 ? (
                               <div className="space-y-1.5">
                                 <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Detected Technologies</span>
                                 <div className="flex flex-wrap gap-1">
                                   {stagedFile.technologies.map((t, idx) => (
                                     <span key={idx} className="bg-slate-950 border border-slate-900 text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-md">
                                       {t}
                                     </span>
                                   ))}
                                 </div>
                               </div>
                             ) : null}

                             {/* Generated Memories */}
                             {stagedFile.memories && stagedFile.memories.length > 0 ? (
                               <div className="space-y-1.5">
                                 <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Generated Memories</span>
                                 <ul className="list-none space-y-1">
                                   {stagedFile.memories.map((m, idx) => (
                                     <li key={idx} className="flex items-start gap-1.5 text-2xs text-slate-300">
                                       <span className="text-emerald-500 font-bold shrink-0">🧠</span>
                                       <span>
                                         <strong className="text-slate-400 font-semibold">[{m.type}]</strong> {m.content}
                                       </span>
                                     </li>
                                   ))}
                                 </ul>
                               </div>
                             ) : null}
                           </div>
                         </details>
                       </div>
                     )}
                   </div>
                 )}

                {/* Input Controls Row */}
                <div className="flex items-center">
                  {/* File Upload Trigger */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || uploadingFile || backendStatus === 'offline'}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all cursor-pointer shrink-0 mr-1"
                    title="Upload and ingest files/code/projects"
                  >
                    <Plus size={18} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUploadChange}
                    style={{ display: 'none' }}
                    multiple
                    webkitdirectory=""
                    accept=".pdf,.docx,.txt,.md,.json,.zip,image/*,README,.html,.css,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.sh,.yml,.yaml"
                  />


                  {/* Main Prompt Input */}
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading || uploadingFile || backendStatus === 'offline'}
                    placeholder={
                      backendStatus === 'offline'
                        ? 'Reconnect to backend to send prompts...'
                        : 'Ask the agent to inspect, edit, debug, or improve your project'
                    }
                    className="flex-1 bg-transparent px-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none disabled:opacity-50"
                  />
                  
                  {/* Voice & Submit Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => alert("Voice transcription feature is coming soon!")}
                      disabled={loading || uploadingFile || backendStatus === 'offline'}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all cursor-pointer"
                    >
                      <Mic size={18} />
                    </button>

                    {(input.trim() || stagedFile) ? (
                      <button
                        type="submit"
                        disabled={loading || uploadingFile || backendStatus === 'offline'}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-400 transition-all cursor-pointer shrink-0 shadow-[0_0_16px_-2px_rgba(92,120,255,0.7)] active:scale-95 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
                      >
                        <ArrowUp size={18} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => alert("Voice mode features are coming soon!")}
                        disabled={loading || uploadingFile || backendStatus === 'offline'}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black hover:bg-slate-200 transition-all cursor-pointer shrink-0 active:scale-95"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="8" y1="5" x2="8" y2="19"></line>
                          <line x1="12" y1="9" x2="12" y2="15"></line>
                          <line x1="16" y1="7" x2="16" y2="17"></line>
                          <line x1="20" y1="10" x2="20" y2="14"></line>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

              </div>
              <div className="text-center text-[10px] text-slate-500 mt-2 font-sans selection:bg-transparent">
                MemoryForge can make mistakes. Verify critical logic and code structures.
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Controls & Memory Panel (1 column on desktop) */}
        <div className="lg:col-span-1 h-full bg-slate-950/60 p-4 overflow-y-auto border-t lg:border-t-0 border-slate-900/80 space-y-5 flex flex-col">
          
          {/* 1. Live Memory Influence Panel */}
          <div className="flex-1 min-h-0 flex flex-col">
            <MemoryPanel memories={latestMemories} />
          </div>

          {/* 2. Success Metrics Box — the proof point, made to pop */}
          <div className="rounded-2xl border border-brand-500/20 bg-gradient-to-b from-brand-500/[0.07] to-slate-900/40 p-4 shadow-[0_0_24px_-8px_rgba(92,120,255,0.35)]">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800/60 mb-3">
              <Database size={14} className="text-brand-400" />
              <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                Demo Success Metrics
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                <div className="text-3xs font-semibold text-slate-500 uppercase tracking-wide">Stored</div>
                <div className="text-xl font-bold text-white mt-1 font-mono tabular-nums">{storedCount}</div>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-brand-500/20">
                <div className="text-3xs font-semibold text-slate-500 uppercase tracking-wide">Recalls</div>
                <div className="text-xl font-bold text-brand-300 mt-1 font-mono tabular-nums">{retrievedCount}</div>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-emerald-500/20">
                <div className="text-3xs font-semibold text-slate-500 uppercase tracking-wide">Success</div>
                <div className="text-xl font-bold text-emerald-400 mt-1 font-mono tabular-nums">
                  {retrievedCount > 0 ? '100%' : '0%'}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Demo Scenario Pills */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800/60 mb-3">
              <Play size={14} className="text-emerald-400" />
              <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                Demo Scenario Prompts
              </span>
            </div>
            
            <div className="space-y-2">
              {demoScenarios.map((scenario, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(scenario)}
                  disabled={loading || backendStatus === 'offline'}
                  className="group w-full flex items-center justify-between gap-1 text-left rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-brand-500/30 px-3 py-2.5 text-xs font-medium text-slate-300 hover:text-white transition-all duration-150 disabled:opacity-50"
                >
                  <span className="truncate font-mono">{scenario}</span>
                  <ChevronRightIcon className="text-slate-600 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper chevron icon
const ChevronRightIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export default ChatPage;
