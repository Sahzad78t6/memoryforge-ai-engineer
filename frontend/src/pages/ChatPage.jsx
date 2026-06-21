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
  ArrowUp
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

  const handleFileUploadChange = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    // Add user placeholder message
    setMessages((prev) => [...prev, { role: 'user', content: `📁 Uploaded file: **${file.name}**` }]);
    setLoading(true);

    // Add assistant processing placeholder message
    setMessages((prev) => [...prev, { role: 'assistant', content: `⏳ Ingesting and analyzing "${file.name}"...` }]);

    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let response;
      if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
        response = await uploadFileImage(file);
      } else if (ext === 'zip') {
        response = await uploadFileProject(file);
      } else {
        response = await uploadFileDoc(file);
      }

      // Format the AI's analysis response
      const analysis = response.analysis || {};
      const summary = analysis.summary || "No summary provided.";
      const technologies = analysis.technologies?.length > 0 ? analysis.technologies.join(', ') : "None identified";
      const dependencies = analysis.dependencies?.length > 0 
        ? analysis.dependencies.map(d => typeof d === 'object' ? `${d.name} (${d.version || 'any'})` : d).join(', ')
        : "None identified";
      const architecture = analysis.architecture || "Standard";
      const decisions = analysis.decisions?.length > 0 
        ? analysis.decisions.map((d, i) => `\n${i+1}. ${d}`).join('') 
        : "None cataloged";
      const security = analysis.security_findings?.length > 0 
        ? analysis.security_findings.map(s => `\n⚠️ ${s}`).join('')
        : "✅ No threats detected";
      const memories = analysis.memories?.length > 0
        ? analysis.memories.map(m => `\n🧠 *[${m.type}]* ${m.content}`).join('')
        : "None generated";

      const formattedReply = 
`📄 **File Ingested: ${file.name}**

**AI Summary:**
${summary}

🛠️ **Technologies:** ${technologies}
📦 **Dependencies:** ${dependencies}
🏗️ **Architecture:** ${architecture}

📐 **Technical Decisions:**
${decisions}

🔒 **Security Findings:**
${security}

🧠 **Memories Generated:**
${memories}`;

      // Update the assistant message with the formatted reply
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === 'assistant' && next[i].content.includes('Ingesting and analyzing')) {
            next[i] = { role: 'assistant', content: formattedReply };
            break;
          }
        }
        return next;
      });

      // Refresh memory list count and layout
      const mems = await getMemories();
      setStoredCount(mems.count || 0);

      // Trigger chat history load or update memory panels
      if (response.memories_created_count > 0) {
        const latest = await getMemories();
        setLatestMemories(latest.memories?.slice(-5) || []);
      }
    } catch (error) {
      console.error('File upload error in chat page:', error);
      const errMsg = error.response?.data?.detail || 'Unexpected error occurred during file ingestion.';
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === 'assistant' && next[i].content.includes('Ingesting and analyzing')) {
            next[i] = { role: 'assistant', content: `❌ **Failed to ingest "${file.name}":** ${errMsg}` };
            break;
          }
        }
        return next;
      });
    } finally {
      setLoading(false);
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


  const handleSend = async (messageText) => {
    if (!messageText.trim() || loading) return;

    // Stage user message
    setMessages((prev) => [...prev, { role: 'user', content: messageText }]);
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
    if (!input.trim()) return;
    const query = input;
    setInput('');
    handleSend(query);
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
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-950">
      {/* Offline Status Warning */}
      {backendStatus === 'offline' && (
        <div className="flex items-center justify-between bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs font-medium text-red-400">
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
      <div className="flex flex-1 flex-col lg:grid lg:grid-cols-4 overflow-hidden">
        {/* Chat Area (3 columns on desktop) */}
        <div className="flex flex-col lg:col-span-3 h-full border-r border-slate-900 overflow-hidden">
          {/* Chat Header */}
          <div className="flex h-14 items-center justify-between border-b border-slate-900 bg-slate-950/40 px-6 shrink-0">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-brand-400" />
              <span className="text-sm font-bold uppercase tracking-wider text-slate-300">
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
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-brand-600/10 border-brand-500/20 text-brand-400 hover:bg-brand-600/20 hover:border-brand-500/30'
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
                <span className={`inline-block h-2 w-2 rounded-full ${
                  backendStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`} />
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
          <div className="border-t border-slate-900 bg-slate-950/40 p-4 shrink-0">
            <form onSubmit={handleFormSubmit} className="mx-auto max-w-4xl">
              <div className="relative flex items-center rounded-full bg-[#212121] border border-transparent focus-within:border-slate-800/80 px-4 py-2 transition-all">
                {/* File Upload Trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || backendStatus === 'offline'}
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
                  accept=".pdf,.docx,.txt,.md,.json,.zip,image/*,README"
                />

                {/* Main Prompt Input */}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading || backendStatus === 'offline'}
                  placeholder={
                    backendStatus === 'offline'
                      ? 'Reconnect to backend to send prompts...'
                      : 'Ask anything'
                  }
                  className="flex-1 bg-transparent px-2 text-sm text-slate-200 placeholder-[#8e8e8e] focus:outline-none disabled:opacity-50"
                />
                
                {/* Voice & Submit Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => alert("Voice transcription feature is coming soon!")}
                    disabled={loading || backendStatus === 'offline'}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all cursor-pointer"
                  >
                    <Mic size={18} />
                  </button>

                  {input.trim() ? (
                    <button
                      type="submit"
                      disabled={loading || backendStatus === 'offline'}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black hover:bg-slate-200 transition-all cursor-pointer shrink-0 shadow-md active:scale-95"
                    >
                      <ArrowUp size={18} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => alert("Voice mode features are coming soon!")}
                      disabled={loading || backendStatus === 'offline'}
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
              <div className="text-center text-[10px] text-slate-500 mt-2 font-sans selection:bg-transparent">
                MemoryForge can make mistakes. Verify critical logic and code structures.
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Controls & Memory Panel (1 column on desktop) */}
        <div className="lg:col-span-1 h-full bg-slate-950 p-4 overflow-y-auto border-t lg:border-t-0 border-slate-900 space-y-5 flex flex-col">
          
          {/* 1. Live Memory Influence Panel */}
          <div className="flex-1 min-h-0 flex flex-col">
            <MemoryPanel memories={latestMemories} />
          </div>

          {/* 2. Success Metrics Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800/60 mb-3">
              <Database size={14} className="text-brand-400" />
              <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                Demo Success Metrics
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-900">
                <div className="text-3xs font-semibold text-slate-500 uppercase tracking-wide">Stored</div>
                <div className="text-base font-bold text-white mt-0.5 font-mono">{storedCount}</div>
              </div>
              <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-900">
                <div className="text-3xs font-semibold text-slate-500 uppercase tracking-wide">Recalls</div>
                <div className="text-base font-bold text-brand-400 mt-0.5 font-mono">{retrievedCount}</div>
              </div>
              <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-900">
                <div className="text-3xs font-semibold text-slate-500 uppercase tracking-wide">Success</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5 font-mono">
                  {retrievedCount > 0 ? '100%' : '0%'}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Demo Scenario Pills */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
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
                  className="w-full flex items-center justify-between gap-1 text-left rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50"
                >
                  <span className="truncate">{scenario}</span>
                  <ChevronRightIcon className="text-slate-600 group-hover:text-slate-400 shrink-0" />
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
