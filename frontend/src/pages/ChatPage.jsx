import React, { useEffect, useRef, useState } from 'react';
import ChatWindow from '../components/ChatWindow';
import MemoryPanel from '../components/MemoryPanel';
import { useBackendStatus } from '../hooks/useBackendStatus';
import {
  createMemory,
  getChatHistory,
  getMemories,
  sendChatMessage,
  uploadFileDoc,
  uploadFileImage,
  uploadFileProject,
} from '../services/api';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleGauge,
  Cuboid,
  Database,
  FileText,
  FolderArchive,
  Image,
  Mic,
  Package,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings,
  X,
} from 'lucide-react';

const demoScenarios = [
  'What database are we using?',
  'Create signup API',
  'Create login API',
  'What authentication method are we using?',
];

const demoMemories = [
  { type: 'architecture', content: 'Use MongoDB Atlas' },
  { type: 'coding_standard', content: 'Use JWT Authentication' },
  { type: 'team_preference', content: 'Use Tailwind CSS' },
  { type: 'architecture', content: 'Use Express.js' },
];

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [latestMemories, setLatestMemories] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const {
    status: backendStatus,
    isOffline,
    isChecking,
    isOnline,
    apiBaseUrl,
    checkBackend,
    markOffline,
    markOnline,
  } = useBackendStatus();
  const [storedCount, setStoredCount] = useState(0);
  const [retrievedCount, setRetrievedCount] = useState(0);
  const [stagedFile, setStagedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  const loadWorkspaceData = async () => {
    try {
      const mems = await getMemories();
      setStoredCount(mems.count || 0);

      try {
        const history = await getChatHistory();
        if (history?.length) {
          const formattedHistory = [];
          history.forEach((item) => {
            formattedHistory.push({ role: 'user', content: item.message });
            formattedHistory.push({ role: 'assistant', content: item.reply });
          });
          setMessages(formattedHistory);
        }
      } catch (historyErr) {
        console.error('Failed to load chat history:', historyErr);
      }
    } catch (e) {
      markOffline();
    }
  };

  const loadInitialData = async () => {
    const connectionStatus = await checkBackend();
    if (connectionStatus === 'online') {
      await loadWorkspaceData();
    }
  };

  useEffect(() => {
    if (isOnline) {
      loadWorkspaceData();
    }
  }, [isOnline]);

  const handleFileUploadChange = async (e) => {
    if (!e.target.files?.[0]) return;

    const selectedFiles = Array.from(e.target.files);
    const primaryFile = selectedFiles[0];
    const isDirectoryUpload = e.target.webkitdirectory || selectedFiles.length > 1;
    const stagedName = isDirectoryUpload ? `${selectedFiles.length} selected files` : primaryFile.name;
    const totalSize = selectedFiles.reduce((total, file) => total + file.size, 0);

    setStagedFile({ name: stagedName, size: totalSize, type: isDirectoryUpload ? 'application/x-directory' : primaryFile.type, status: 'uploading' });
    setUploadingFile(true);

    try {
      const ext = primaryFile.name.split('.').pop().toLowerCase();
      let response;

      if (isDirectoryUpload) {
        response = await uploadFileProject(selectedFiles);
        console.debug('uploadFileProject response:', response);
      } else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
        response = await uploadFileImage(primaryFile);
        console.debug('uploadFileImage response:', response);
      } else if (ext === 'zip') {
        response = await uploadFileProject(primaryFile);
        console.debug('uploadFileProject (zip) response:', response);
      } else {
        response = await uploadFileDoc(primaryFile);
        console.debug('uploadFileDoc response:', response);
      }

      const analysis = response?.analysis || response || {};
      setStagedFile({
        name: stagedName,
        size: response?.size || totalSize,
        type: isDirectoryUpload ? 'application/x-directory' : primaryFile.type,
        status: 'ready',
        fileId: response?.file_id,
        analysis,
        summary: response?.summary || analysis.summary || 'No summary available.',
        technologies: response?.technologies || response?.technologies_detected || analysis.technologies || [],
        memories: response?.memories || response?.memories_created || analysis.memories || [],
      });

      const mems = await getMemories();
      setStoredCount(mems.count || 0);
    } catch (error) {
      console.error('Staging file upload failed:', error);
      setStagedFile({
        name: stagedName,
        size: totalSize,
        type: primaryFile.type,
        status: 'error',
        error: error.response?.data?.message || error.response?.data?.detail || error.message || 'Ingestion failed.',
      });
    } finally {
      setUploadingFile(false);
      e.target.value = null;
    }
  };

  const handleSend = async (messageText, displayText) => {
    if (!messageText.trim() || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: displayText || messageText }]);
    setLoading(true);

    try {
      const data = await sendChatMessage(messageText);
      const context = data.memory_context || [];

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      setLatestMemories(context);
      if (context.length > 0) setRetrievedCount((prev) => prev + context.length);

      const mems = await getMemories();
      setStoredCount(mems.count || 0);
      markOnline();
    } catch (error) {
      console.error('Chat error:', error);
      markOffline();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Failed to connect to the backend server. Please check that the API is running on ${apiBaseUrl} and try again.` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() && !stagedFile) return;
    if (stagedFile && stagedFile.status !== 'ready') return;

    let queryToSend = input;
    let displayMessageText = input;

    if (stagedFile) {
      const analysis = stagedFile.analysis || {};
      const technologies = Array.isArray(stagedFile.technologies) ? stagedFile.technologies.filter(Boolean).join(', ') : 'None identified';
      const memories = Array.isArray(stagedFile.memories)
        ? stagedFile.memories.filter((memory) => memory?.content).map((memory) => `[${memory.type || 'memory'}] ${memory.content}`).join('\n')
        : 'None generated';

      queryToSend = `[Context from file: ${stagedFile.name}\nSummary: ${stagedFile.summary}\nTechnologies: ${technologies}\nArchitecture: ${analysis.architecture || 'Standard'}\nMemories generated: ${memories}]\n\nUser Prompt: ${input.trim() || 'Please analyze this ingested asset.'}`;
      displayMessageText = `Attached: ${stagedFile.name}\n\n${input.trim() || 'Please analyze this ingested asset.'}`;
    }

    setInput('');
    setStagedFile(null);
    handleSend(queryToSend, displayMessageText);
  };

  const seedDemoWorkspace = async () => {
    if (seeding) return;
    setSeeding(true);
    setSeedSuccess(false);

    try {
      await Promise.all(demoMemories.map((memory) => createMemory(memory.type, memory.content)));
      setSeedSuccess(true);
      const mems = await getMemories();
      setStoredCount(mems.count || 0);
      window.setTimeout(() => setSeedSuccess(false), 3000);
    } catch (e) {
      console.error('Seeding error:', e);
      markOffline();
    } finally {
      setSeeding(false);
    }
  };

  const backendLabel = isOffline ? 'Backend Offline' : isChecking ? 'Checking Backend' : 'Backend Live';
  const successPercent = retrievedCount > 0 ? 100 : 0;

  return (
    <div className="mf-app-surface flex h-full min-h-0 flex-col overflow-hidden text-white">
      {isOffline && (
        <div className="mf-system-status mf-system-status-offline h-[38px] shrink-0">
          <span className={`mf-status-spark ${backendStatus}`} aria-hidden="true" />
          <span className="font-black text-slate-200">SYSTEM STATUS:</span>
          <span className="min-w-0 flex-1 truncate text-slate-300">
            Unable to connect to MemoryForge backend on {apiBaseUrl}.
          </span>
          <button
            type="button"
            onClick={loadInitialData}
            disabled={isChecking}
            className="ml-auto flex items-center gap-2 text-[14px] font-black uppercase tracking-wide text-indigo-200 hover:text-white disabled:opacity-50"
          >
            <RotateCcw size={18} className={isChecking ? 'animate-spin' : ''} />
            Retry Connection
          </button>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_390px] max-[1024px]:grid-cols-1">
        <section className="flex min-h-0 min-w-0 flex-col border-r border-white/10">
          <header className="mf-workspace-header h-[74px] shrink-0 px-7">
            <div className="flex items-center gap-4">
              <div className="mf-small-icon"><Settings size={20} /></div>
              <span className="text-[21px] font-black uppercase tracking-wide text-slate-300 max-[1350px]:text-[18px]">Agent Engineering Workspace</span>
            </div>

            <div className="flex items-center gap-5">
              <button
                onClick={seedDemoWorkspace}
                disabled={seeding || isOffline}
                className={`mf-load-button ${seedSuccess ? 'border-emerald-300/45 text-emerald-200' : ''}`}
              >
                {seeding ? <RefreshCw size={22} className="animate-spin" /> : seedSuccess ? <Check size={22} /> : <Cuboid size={22} />}
                <span>{seedSuccess ? 'Workspace Loaded' : 'Load Demo Workspace'}</span>
              </button>

              <div className="flex items-center gap-3">
                <span className={`mf-backend-light ${backendStatus}`} title={backendLabel} />
                <span className={`text-[15px] font-black uppercase tracking-[0.08em] ${isOffline ? 'text-rose-300' : isChecking ? 'text-slate-400' : 'text-emerald-300'}`}>
                  {backendLabel}
                </span>
              </div>
            </div>
          </header>

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <ChatWindow messages={messages} loading={loading} />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#030611] via-[#030611]/96 to-transparent" />
            <form onSubmit={handleFormSubmit} className="absolute inset-x-0 bottom-0 z-20 px-8 pb-4">
              <div className="mx-auto max-w-[1220px]">
                {stagedFile && <StagedFile stagedFile={stagedFile} onClear={() => setStagedFile(null)} />}

                <div className="mf-prompt-bar">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || uploadingFile || isOffline}
                    className="mf-round-action"
                    title="Upload files"
                  >
                    <Plus size={27} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUploadChange}
                    className="hidden"
                    multiple
                    webkitdirectory=""
                    accept=".pdf,.docx,.txt,.md,.json,.zip,image/*,README,.html,.css,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.sh,.yml,.yaml"
                  />

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading || uploadingFile || isOffline}
                    placeholder={isOffline ? 'Reconnect to backend to send prompts...' : 'Ask MemoryForge to inspect, edit, debug, or improve your project'}
                    className="min-w-0 flex-1 bg-transparent text-[20px] font-medium text-slate-200 outline-none placeholder:text-slate-500 disabled:opacity-65"
                  />

                  <div className="mf-input-actions">
                    <button type="button" disabled={loading || uploadingFile || isOffline} className="mf-action-icon" title="Voice input">
                      <Mic size={25} />
                    </button>
                    <button
                      type="submit"
                      disabled={loading || uploadingFile || isOffline || (!input.trim() && !stagedFile)}
                      className="mf-action-icon text-fuchsia-300 disabled:opacity-35"
                      title="Send prompt"
                    >
                      <ArrowRight size={25} />
                    </button>
                  </div>
                </div>

                <p className="mt-4 text-center text-[13px] font-medium text-slate-500">
                  MemoryForge can make mistakes. Verify critical logic and code structures.
                </p>
              </div>
            </form>
          </div>
        </section>

        <aside className="mf-right-rail flex min-h-0 flex-col gap-5 overflow-y-auto p-5 max-[1024px]:hidden">
          <div className="mf-memory-empty min-h-[142px]">
            {latestMemories.length === 0 ? (
              <>
                <Database size={34} className="text-slate-500" />
                <p>No memory context retrieved for this prompt.</p>
              </>
            ) : (
              <MemoryPanel memories={latestMemories} />
            )}
          </div>

          <Panel title="Demo Success Metrics" icon={Package} className="mt-auto">
            <div className="grid grid-cols-3 gap-3">
              <MetricBox label="Stored" value={storedCount} />
              <MetricBox label="Recalls" value={retrievedCount} accent />
              <div className="mf-metric-box">
                <span>Success %</span>
                <div className="relative mt-2 h-12 w-20">
                  <CircleGauge className="absolute inset-0 h-full w-full text-slate-600" strokeWidth={1.8} />
                  <div className="absolute bottom-1 left-1/2 h-9 w-1 origin-bottom -translate-x-1/2 rounded-full bg-slate-300" style={{ transform: `translateX(-50%) rotate(${successPercent ? 24 : -55}deg)` }} />
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Demo Scenario Prompts" icon={Play}>
            <div className="space-y-3 font-mono">
              {demoScenarios.map((scenario) => (
                <button
                  key={scenario}
                  onClick={() => handleSend(scenario)}
                  disabled={loading || isOffline}
                  className="mf-scenario-row"
                >
                  <span className="truncate">{scenario}</span>
                  <ChevronRight size={20} />
                </button>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
};

function StagedFile({ stagedFile, onClear }) {
  const Icon = stagedFile.type?.startsWith('image/') ? Image : stagedFile.name?.endsWith('.zip') ? FolderArchive : FileText;

  return (
    <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#11172a]/90 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.32)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/25 text-cyan-200">
        {stagedFile.status === 'uploading' ? <RefreshCw size={19} className="animate-spin" /> : <Icon size={20} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{stagedFile.name}</p>
        <p className={`text-xs ${stagedFile.status === 'error' ? 'text-rose-300' : 'text-slate-400'}`}>
          {stagedFile.status === 'ready' ? 'Ready to send' : stagedFile.status === 'uploading' ? 'Processing asset...' : stagedFile.error}
        </p>
      </div>
      <button type="button" onClick={onClear} className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
}

function Panel({ title, icon: Icon, className = '', children }) {
  return (
    <section className={`mf-panel ${className}`}>
      <h2 className="mf-panel-title">
        <Icon size={20} />
        {title}
      </h2>
      {children}
    </section>
  );
}

function MetricBox({ label, value, accent = false }) {
  return (
    <div className="mf-metric-box">
      <span>{label}</span>
      <strong className={accent ? 'text-[#8d89ff]' : ''}>{value}</strong>
    </div>
  );
}

export default ChatPage;


