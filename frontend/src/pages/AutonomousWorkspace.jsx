import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  File, 
  FileCode, 
  Terminal, 
  Save, 
  Play, 
  Sparkles, 
  Cpu, 
  Database, 
  Plus, 
  X, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  Code,
  Activity,
  Trash2,
  Lock,
  Compass,
  Upload
} from 'lucide-react';
import { 
  getWorkspaceFiles, 
  getWorkspaceFile, 
  saveWorkspaceFile, 
  runWorkspaceCommand,
  uploadFileProject,
  uploadGithubProject
} from '../services/api';

const AutonomousWorkspace = () => {
  // Navigation & Directory State
  const [folderContents, setFolderContents] = useState({ '.': [] });
  const [expandedFolders, setExpandedFolders] = useState({ '.': true });
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [explorerError, setExplorerError] = useState(null);

  // Active Editor State
  const [currentFilePath, setCurrentFilePath] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editorError, setEditorError] = useState(null);

  // Terminal Console State
  const [commandInput, setCommandInput] = useState('');
  const [runningCommand, setRunningCommand] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([
    { type: 'system', text: 'MemoryForge Workspace OS v2.0.0 (agent-sandbox)' },
    { type: 'system', text: 'Type a command and press Enter to execute (e.g. dir, git status)' }
  ]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Agent Simulation State
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentStatus, setAgentStatus] = useState('IDLE'); // IDLE, RUNNING, COMPLETED, FAILED
  const [agentSteps, setAgentSteps] = useState([]);
  const [agentStepIndex, setAgentStepIndex] = useState(0);
  const [agentLogs, setAgentLogs] = useState([]);
  
  // Refs
  const lineRef = useRef(null);
  const textareaRef = useRef(null);
  const terminalEndRef = useRef(null);
  const agentLogEndRef = useRef(null);
  const uploadInputRef = useRef(null);

  // Upload state
  const [uploadingProject, setUploadingProject] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [draggingUpload, setDraggingUpload] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [importingGithub, setImportingGithub] = useState(false);

  // Fetch Root Files initially
  const loadRootFiles = async () => {
    setLoadingFiles(true);
    setExplorerError(null);
    try {
      const res = await getWorkspaceFiles('.');
      setFolderContents({ '.': res });
      setUploadMessage('');
    } catch (err) {
      console.error('Failed to load workspace files:', err);
      setExplorerError('Failed to fetch workspace structure. Verify backend server status.');
    } finally {
      setLoadingFiles(false);
    }
  };
  const processProjectFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const selectedFiles = Array.from(fileList);
    setUploadingProject(true);
    setUploadMessage('Uploading project files...');

    try {
      const response = await uploadFileProject(selectedFiles) || {};
      setUploadMessage(
        `Uploaded ${response.files_in_workspace || selectedFiles.length} file(s) into the workspace.`
      );
      await loadRootFiles();
    } catch (err) {
      console.error('Project upload failed:', err);
      setUploadMessage(err.response?.data?.message || err.response?.data?.detail || err.message || 'Upload failed. Please try again.');
    } finally {
      setUploadingProject(false);
    }
  };

  const importGithubRepo = async () => {
    if (!githubUrl.trim()) return;
    setImportingGithub(true);
    setUploadMessage('Importing project from GitHub...');
    try {
      const response = await uploadGithubProject(githubUrl);
      setUploadMessage(
        `Imported ${response.files_in_workspace || 0} file(s) from GitHub into the workspace.`
      );
      setGithubUrl('');
      await loadRootFiles();
    } catch (err) {
      console.error('GitHub import failed:', err);
      setUploadMessage(
        err.response?.data?.message || err.response?.data?.detail || err.message || 'GitHub import failed. Please try again.'
      );
    } finally {
      setImportingGithub(false);
    }
  };
  const handleProjectUpload = async (e) => {
    await processProjectFiles(e.target.files);
    e.target.value = null;
  };

  const handleDropUpload = async (e) => {
    e.preventDefault();
    setDraggingUpload(false);
    await processProjectFiles(e.dataTransfer.files);
  };

  useEffect(() => {
    loadRootFiles();
  }, []);

  // Sync scroll for editor lines and textarea
  const handleEditorScroll = () => {
    if (lineRef.current && textareaRef.current) {
      lineRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Auto-scroll terminal to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs, runningCommand]);

  // Auto-scroll agent console logs
  useEffect(() => {
    agentLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentLogs]);

  // File Explorer Folder Clicks
  const handleFolderClick = async (dirPath) => {
    const isExpanded = expandedFolders[dirPath];
    
    if (!isExpanded) {
      // Fetch contents if not loaded yet
      if (!folderContents[dirPath] || folderContents[dirPath].length === 0) {
        try {
          const res = await getWorkspaceFiles(dirPath);
          setFolderContents(prev => ({ ...prev, [dirPath]: res }));
        } catch (err) {
          console.error(`Failed to load directory: ${dirPath}`, err);
          alert(`Error reading directory '${dirPath}'`);
          return;
        }
      }
    }
    
    setExpandedFolders(prev => ({
      ...prev,
      [dirPath]: !prev[dirPath]
    }));
  };

  // Open file in Editor
  const handleFileClick = async (filePath) => {
    if (isDirty) {
      const confirmDiscard = window.confirm("You have unsaved changes. Discard changes?");
      if (!confirmDiscard) return;
    }

    setEditorError(null);
    setSaveSuccess(false);
    try {
      const res = await getWorkspaceFile(filePath);
      setCurrentFilePath(filePath);
      setFileContent(res.content || '');
      setIsDirty(false);
    } catch (err) {
      console.error(`Failed to load file: ${filePath}`, err);
      setEditorError(`Error loading file: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Save active file changes
  const handleSaveFile = async () => {
    if (!currentFilePath || saving) return;
    setSaving(true);
    setEditorError(null);
    setSaveSuccess(false);
    try {
      await saveWorkspaceFile(currentFilePath, fileContent);
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Add terminal log for write activity
      setTerminalLogs(prev => [
        ...prev,
        { type: 'system', text: `[SYSTEM] Saved modifications to ${currentFilePath}` }
      ]);
    } catch (err) {
      console.error('Failed to save file:', err);
      setEditorError(`Failed to save changes: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Terminal command execution
  const handleRunCommand = async (e) => {
    e.preventDefault();
    if (!commandInput.trim() || runningCommand) return;

    const cmd = commandInput;
    setCommandInput('');
    setRunningCommand(true);
    setCommandHistory(prev => [cmd, ...prev]);
    setHistoryIndex(-1);

    // Add command to log
    setTerminalLogs(prev => [...prev, { type: 'command', text: `memoryforge-agent:~/workspace$ ${cmd}` }]);

    try {
      const res = await runWorkspaceCommand(cmd);
      
      if (res.stdout && res.stdout.trim()) {
        setTerminalLogs(prev => [...prev, { type: 'stdout', text: res.stdout }]);
      }
      if (res.stderr && res.stderr.trim()) {
        setTerminalLogs(prev => [...prev, { type: 'stderr', text: res.stderr }]);
      }
      
      setTerminalLogs(prev => [
        ...prev, 
        { type: 'system', text: `Process exited with code ${res.exit_code}` }
      ]);
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message;
      setTerminalLogs(prev => [...prev, { type: 'stderr', text: `Error running command: ${errMsg}` }]);
    } finally {
      setRunningCommand(false);
    }
  };

  // Clear console log
  const handleClearLogs = () => {
    setTerminalLogs([
      { type: 'system', text: 'Console cleared.' }
    ]);
  };

  // Command History Navigation (Arrow Up / Down)
  const handleTerminalKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex < commandHistory.length) {
        setHistoryIndex(nextIndex);
        setCommandInput(commandHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setCommandInput(commandHistory[nextIndex]);
      } else {
        setHistoryIndex(-1);
        setCommandInput('');
      }
    }
  };

  // Build simulated reasoning chain based on prompt
  const generateSimulatedSteps = (prompt) => {
    const isAuth = /auth|login|register|user|jwt/i.test(prompt);
    const isDb = /db|mongo|atlas|save|query|collection/i.test(prompt);
    const isTest = /test|pytest|vitest|unit/i.test(prompt);
    const isFrontend = /frontend|ui|page|dashboard|css|react/i.test(prompt);

    const steps = [];
    
    // Step 1: Ingestion
    steps.push({
      title: "Analyzing workspace code structures",
      desc: "Scanning configuration schemas and active components.",
      logs: [
        "[INFO] Workspace parser initialized...",
        "[INFO] Listing workspace contents relative to '.'",
        "[INFO] Discovered active files in backend/ and frontend/src/",
        "[SUCCESS] Directory hierarchy parsed successfully."
      ]
    });

    // Step 2: Inspection
    if (isAuth) {
      steps.push({
        title: "Scanning authentication modules",
        desc: "Checking backend/auth.py and database models.",
        logs: [
          "[AGENT] Reading c:\\workspace\\backend\\auth.py...",
          "[AGENT] Loaded JWT encryption configuration keys.",
          "[AGENT] Checking password hashing algorithms: bcrypt detected.",
          "[INFO] Discovered dependency chain: app.py -> auth.py -> models.py"
        ]
      });
    } else if (isDb) {
      steps.push({
        title: "Validating MongoDB configuration",
        desc: "Inspecting backend/mongodb.py connection status.",
        logs: [
          "[AGENT] Examining backend/mongodb.py config details.",
          "[AGENT] Discovered active database collections: 'users', 'memories', 'knowledge_base'.",
          "[INFO] Connection URI fallback: Mock local memory storage active.",
          "[SUCCESS] Mongo DB Schema constraints validated."
        ]
      });
    } else if (isFrontend) {
      steps.push({
        title: "Inspecting frontend components",
        desc: "Scanning files in frontend/src/pages/ and components/.",
        logs: [
          "[AGENT] Locating App.jsx routing pathways.",
          "[AGENT] Inspecting Sidebar.jsx navigation links.",
          "[INFO] Discovered css configuration modules: Tailwind v4.",
          "[SUCCESS] Workspace views cataloged."
        ]
      });
    } else {
      steps.push({
        title: "Searching code modules for target symbols",
        desc: "Scanning all Python and Javascript sources for reference matches.",
        logs: [
          "[AGENT] Running code search for relevant patterns.",
          "[AGENT] Found matches in backend/app.py and frontend/src/services/api.js",
          "[SUCCESS] Code target areas mapped successfully."
        ]
      });
    }

    // Step 3: Action & Code Patching
    steps.push({
      title: "Generating implementation changes",
      desc: "Executing agent code optimization pipeline.",
      logs: [
        "[AGENT] Drafting drop-in replacement chunks...",
        `[AGENT] Writing patch to temporary buffer for validation.`,
        "[AGENT] Merging new code branches..."
      ]
    });

    // Step 4: Verification
    steps.push({
      title: "Validating build integrity",
      desc: "Running syntax check and automated regression suite.",
      logs: [
        "[INFO] Initiating verification checks...",
        "[AGENT] Executing command: python -m py_compile backend/app.py",
        "[SUCCESS] Backend compiled with exit code 0",
        "[AGENT] Checking frontend compilation status: vite build --dry-run",
        "[SUCCESS] Frontend code builds successfully."
      ]
    });

    // Step 5: Test Execution
    if (isTest || isAuth || isDb) {
      steps.push({
        title: "Executing automated test suite",
        desc: "Running active verification script commands.",
        logs: [
          "[AGENT] Running command: pytest backend/auth.py",
          "[INFO] Running 3 active test instances...",
          "test_register_user_success: PASSED",
          "test_login_verification: PASSED",
          "test_token_expiry_validation: PASSED",
          "[SUCCESS] Automated testing completed. 3/3 passed."
        ]
      });
    } else {
      steps.push({
        title: "Verifying runtime health checks",
        desc: "Querying development server status checks.",
        logs: [
          "[AGENT] Running command: curl http://localhost:8000/health",
          "[INFO] Status response: 200 OK (MongoDB Atlas Live)",
          "[SUCCESS] Dev sandbox health check verified."
        ]
      });
    }

    // Step 6: Completion
    steps.push({
      title: "Workspace updates complete",
      desc: "Changes applied to codebase and verified.",
      logs: [
        "[SUCCESS] Task completed successfully.",
        "[AGENT] Workspace remains in clean compiled state.",
        "[AGENT] Workspace agent returning idle status."
      ]
    });

    return steps;
  };

  // Launch Simulated Agent Process
  const handleLaunchAgent = (e) => {
    e.preventDefault();
    if (!agentPrompt.trim() || agentStatus === 'RUNNING') return;

    const steps = generateSimulatedSteps(agentPrompt);
    setAgentSteps(steps);
    setAgentStatus('RUNNING');
    setAgentStepIndex(0);
    setAgentLogs(["[START] Workspace agent process launched.", `[PROMPT] "${agentPrompt}"`]);

    let stepIdx = 0;
    
    const runNextStep = () => {
      if (stepIdx >= steps.length) {
        setAgentStatus('COMPLETED');
        return;
      }
      
      const currentStep = steps[stepIdx];
      
      // Update step index
      setAgentStepIndex(stepIdx);
      
      // Append step start log
      setAgentLogs(prev => [
        ...prev, 
        `\n[PHASE] ${stepIdx + 1}/${steps.length}: ${currentStep.title.toUpperCase()}`,
        `[STATUS] ${currentStep.desc}`
      ]);

      // Print step detailed logs line by line
      let logLineIdx = 0;
      const logInterval = setInterval(() => {
        if (logLineIdx < currentStep.logs.length) {
          setAgentLogs(prev => [...prev, currentStep.logs[logLineIdx]]);
          logLineIdx++;
        } else {
          clearInterval(logInterval);
          stepIdx++;
          // Wait briefly before launching the next phase
          setTimeout(runNextStep, 1500);
        }
      }, 300);
    };

    // Begin sequence
    setTimeout(runNextStep, 500);
  };

  // Reset agent status
  const handleResetAgent = () => {
    setAgentStatus('IDLE');
    setAgentSteps([]);
    setAgentStepIndex(0);
    setAgentLogs([]);
  };

  // File explorer recursive tree renderer
  const renderTree = (dirPath, depth = 0) => {
    try {
      const rawContents = folderContents[dirPath];
      const contents = Array.isArray(rawContents) ? rawContents : [];
      
      // Sort directories first, then files
      const sortedContents = [...contents].sort((a, b) => {
        if (!a || !b) return 0;
        if (a.is_dir && !b.is_dir) return -1;
        if (!a.is_dir && b.is_dir) return 1;
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
      });

      return sortedContents.map(item => {
        if (!item || !item.name) return null;
        const itemPath = dirPath === '.' ? item.name : `${dirPath}/${item.name}`;
        
        if (item.is_dir) {
          const isExpanded = expandedFolders[itemPath];
          return (
            <div key={itemPath} className="select-none">
              <button 
                onClick={() => handleFolderClick(itemPath)}
                className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-slate-900/60 text-slate-300 hover:text-white w-full text-left font-medium text-xs rounded transition-colors cursor-pointer"
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
              >
                <span className="shrink-0 text-slate-500">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
                <Folder size={14} className="text-indigo-400 shrink-0 fill-indigo-400/20" />
                <span className="truncate">{item.name}</span>
              </button>
              {isExpanded && renderTree(itemPath, depth + 1)}
            </div>
          );
        } else {
          const isSelected = currentFilePath === itemPath;
          return (
            <div key={itemPath}>
              <button 
                onClick={() => handleFileClick(itemPath)}
                className={`flex items-center gap-2 py-1.5 px-2 w-full text-left text-xs transition-colors rounded cursor-pointer ${
                  isSelected 
                    ? 'bg-indigo-600/10 text-indigo-400 font-semibold border border-indigo-500/20' 
                    : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200 border border-transparent'
                }`}
                style={{ paddingLeft: `${depth * 12 + 24}px` }}
              >
                <FileCode size={14} className={isSelected ? "text-indigo-400" : "text-slate-500"} />
                <span className="truncate">{item.name}</span>
              </button>
            </div>
          );
        }
      });
    } catch (renderErr) {
      console.error("Error rendering directory tree:", renderErr);
      return <div className="text-rose-450 p-2 text-2xs font-mono">Render Error</div>;
    }
  };

  // Editor line numbers list
  const getLineNumbers = () => {
    const lineCount = fileContent.split('\n').length;
    return Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-950">
      
      {/* Workspace Sub Header / Agent HUD */}
      <div className="flex h-14 items-center justify-between border-b border-slate-900 bg-slate-950/40 px-6 shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <Activity size={16} className="text-indigo-400 animate-pulse" />
          <span className="text-sm font-bold uppercase tracking-wider text-slate-350 font-mono">
            Autonomous Coding Space
          </span>
          <span className="text-[10px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
            sandbox active
          </span>
        </div>

        {/* Global actions/connection indicators */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">
              Subprocess Channel Connected
            </span>
          </div>
          {/* GitHub Import Link */}
          <div className="flex items-center gap-1 border border-slate-700/50 bg-slate-900/60 rounded-lg px-2 py-1 text-xs">
            <input
              type="text"
              placeholder="GitHub Link (owner/repo)"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              disabled={importingGithub || uploadingProject}
              className="bg-transparent border-none text-[11px] text-slate-300 placeholder-slate-500 focus:outline-none w-44 font-mono"
            />
            <button
              onClick={importGithubRepo}
              disabled={importingGithub || uploadingProject || !githubUrl.trim()}
              className="text-indigo-400 hover:text-white transition-colors cursor-pointer text-[10px] font-bold uppercase disabled:opacity-30 disabled:pointer-events-none"
            >
              {importingGithub ? 'Importing...' : 'Import'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            disabled={uploadingProject || importingGithub}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300 hover:bg-indigo-500/20 transition-colors cursor-pointer disabled:opacity-50"
            title="Upload a project folder or files"
          >
            {uploadingProject ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
            <span>{uploadingProject ? 'Uploading...' : 'Upload Project'}</span>
          </button>
          <button 
            onClick={loadRootFiles}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
            title="Refresh workspace directories"
          >
            <RefreshCw size={12} className={loadingFiles ? "animate-spin text-indigo-400" : ""} />
            <span className="hidden sm:inline font-mono">Sync</span>
          </button>
          <input
            ref={uploadInputRef}
            type="file"
            multiple
            directory=""
            webkitdirectory=""
            onChange={handleProjectUpload}
            className="hidden"
            accept=".pdf,.docx,.txt,.md,.json,.zip,image/*,README,.html,.css,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.sh,.yml,.yaml"
          />
        </div>
      </div>

      {uploadMessage && (
        <div className="border-b border-slate-900 bg-slate-950/60 px-6 py-2 text-[11px] text-slate-300">
          {uploadMessage}
        </div>
      )}

      {/* Main Grid: File Tree, Code Editor / Console, Agent HUD */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* PANEL 1: File Explorer (Left sidebar) */}
        <div className="w-64 border-r border-slate-900 bg-slate-950 flex flex-col shrink-0 overflow-hidden h-full">
          <div className="p-4 border-b border-slate-900 bg-slate-950/60 shrink-0 flex items-center justify-between">
            <span className="text-2xs font-extrabold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
              <Compass size={12} className="text-indigo-400" />
              File Explorer
            </span>
            <span className="text-[9px] text-slate-500 font-mono bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded select-none">
              WORKSPACE
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-900">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDraggingUpload(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDraggingUpload(false);
              }}
              onDrop={handleDropUpload}
              className={`mx-1 mb-2 rounded-xl border p-3 text-center transition-colors ${
                draggingUpload
                  ? 'border-indigo-500/60 bg-indigo-500/10'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-300">
                <Upload size={14} className="text-indigo-400" />
                <span>Drop project folder/files here</span>
              </div>
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="mt-2 text-[10px] uppercase tracking-wider text-indigo-300 hover:text-indigo-200"
              >
                Or choose files manually
              </button>
            </div>

            {loadingFiles && (
              <div className="flex flex-col items-center justify-center p-8 gap-2 text-slate-500 text-xs">
                <RefreshCw size={16} className="animate-spin text-indigo-400" />
                <span>Scanning directories...</span>
              </div>
            )}
            
            {explorerError && (
              <div className="p-3 text-2xs text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded-lg flex flex-col gap-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle size={14} />
                  <span>Sync Failed</span>
                </div>
                <span>{explorerError}</span>
              </div>
            )}

            {!loadingFiles && !explorerError && (
              <div className="space-y-1">
                {renderTree('.')}
              </div>
            )}
          </div>
        </div>

        {/* PANEL 2 & 3: Editor (Top Center) & Terminal (Bottom Center) */}
        <div className="flex-1 flex flex-col border-r border-slate-900 overflow-hidden bg-slate-950 h-full">
          
          {/* Top segment: Editor */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            <div className="h-10 border-b border-slate-900 bg-slate-950/60 px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 truncate">
                <File className="text-indigo-400 shrink-0" size={14} />
                <span className="text-xs font-semibold text-slate-300 font-mono truncate">
                  {currentFilePath ? currentFilePath : 'No active file selected'}
                </span>
                {isDirty && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Unsaved changes" />
                )}
              </div>

              {currentFilePath && (
                <div className="flex items-center gap-2">
                  {editorError && (
                    <span className="text-[10px] text-rose-400 font-semibold max-w-xs truncate flex items-center gap-1">
                      <AlertCircle size={12} />
                      {editorError}
                    </span>
                  )}
                  {saveSuccess && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check size={12} />
                      Changes Saved
                    </span>
                  )}
                  <button
                    onClick={handleSaveFile}
                    disabled={!isDirty || saving}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-all duration-200 border cursor-pointer ${
                      isDirty 
                        ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/20' 
                        : 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                    <span>Save</span>
                  </button>
                </div>
              )}
            </div>

            {/* Code editor container */}
            <div className="flex-1 overflow-hidden relative">
              {currentFilePath ? (
                <div className="flex font-mono h-full overflow-hidden text-xs bg-slate-950">
                  {/* Scrolling line numbers */}
                  <pre 
                    ref={lineRef}
                    className="p-4 text-slate-700 bg-slate-950/60 text-right select-none border-r border-slate-900/60 pr-3.5 min-w-[3.2rem] overflow-hidden leading-relaxed font-mono"
                  >
                    {getLineNumbers()}
                  </pre>
                  {/* Textarea code writer */}
                  <textarea
                    ref={textareaRef}
                    value={fileContent}
                    onScroll={handleEditorScroll}
                    onChange={(e) => {
                      setFileContent(e.target.value);
                      setIsDirty(true);
                    }}
                    spellCheck="false"
                    className="flex-1 p-4 bg-transparent text-slate-300 focus:outline-none resize-none overflow-auto font-mono leading-relaxed whitespace-pre"
                    style={{ tabSize: 4 }}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3 select-none">
                  <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-500 shadow-lg shadow-black/40">
                    <Code size={22} className="text-indigo-400" />
                  </div>
                  <div className="max-w-xs space-y-1">
                    <p className="text-sm font-bold text-slate-300">No File Loaded</p>
                    <p className="text-xs text-slate-500 leading-normal">
                      Select a file from the explorer directory to read or edit its contents.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom segment: Terminal Emulator */}
          <div className="h-64 border-t border-slate-900 bg-slate-950 flex flex-col shrink-0 overflow-hidden">
            <div className="h-9 border-b border-slate-900 bg-slate-950/60 px-4 flex items-center justify-between shrink-0 select-none">
              <span className="text-2xs font-extrabold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
                <Terminal size={12} className="text-indigo-400" />
                Terminal Console
              </span>
              <button 
                onClick={handleClearLogs}
                className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 text-[10px] font-mono cursor-pointer"
                title="Wipe terminal buffer logs"
              >
                <Trash2 size={10} />
                Clear
              </button>
            </div>

            {/* Terminal logs list */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-2xs space-y-1.5 scrollbar-thin scrollbar-thumb-slate-900 bg-slate-950/80">
              {terminalLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`whitespace-pre-wrap leading-normal font-mono ${
                    log.type === 'command' 
                      ? 'text-indigo-400 font-semibold' 
                      : log.type === 'stderr' 
                      ? 'text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded' 
                      : log.type === 'stdout'
                      ? 'text-slate-300'
                      : 'text-slate-500 italic'
                  }`}
                >
                  {log.text}
                </div>
              ))}
              
              {runningCommand && (
                <div className="flex items-center gap-2 text-indigo-400 font-semibold animate-pulse">
                  <span>Executing command...</span>
                  <div className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                </div>
              )}
              
              <div ref={terminalEndRef} />
            </div>

            {/* Terminal input form */}
            <form onSubmit={handleRunCommand} className="h-9 border-t border-slate-900 bg-slate-950/60 px-3 flex items-center gap-2 shrink-0">
              <span className="text-2xs text-indigo-400 font-bold font-mono select-none">
                memoryforge-agent:~/workspace$
              </span>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={handleTerminalKeyDown}
                disabled={runningCommand}
                placeholder="git status, npm test, etc."
                className="flex-1 bg-transparent border-none text-2xs font-mono text-slate-350 placeholder-slate-600 focus:outline-none disabled:opacity-50"
              />
            </form>
          </div>
        </div>

        {/* PANEL 4: Right Agent Console */}
        <div className="w-80 border-l border-slate-900 bg-slate-950 flex flex-col shrink-0 overflow-hidden h-full">
          <div className="p-4 border-b border-slate-900 bg-slate-950/60 shrink-0 flex items-center justify-between">
            <span className="text-2xs font-extrabold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
              <Cpu size={12} className="text-indigo-400 animate-spin-slow" />
              Agent Console
            </span>
            <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded select-none uppercase tracking-wider ${
              agentStatus === 'RUNNING' 
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse'
                : agentStatus === 'COMPLETED'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900 border border-slate-800 text-slate-500'
            }`}>
              {agentStatus}
            </span>
          </div>

          {/* Prompt field */}
          <div className="p-4 border-b border-slate-900 bg-slate-950/30 shrink-0">
            <form onSubmit={handleLaunchAgent} className="space-y-3">
              <div className="relative">
                <textarea
                  value={agentPrompt}
                  onChange={(e) => setAgentPrompt(e.target.value)}
                  disabled={agentStatus === 'RUNNING'}
                  placeholder="Tell the agent what to do with your uploaded project folder, like debug, refactor, or add features"
                  className="w-full h-20 rounded-xl bg-slate-900/60 border border-slate-800 p-3 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/30 resize-none disabled:opacity-50 font-sans"
                />
              </div>

              <div className="flex gap-2">
                {agentStatus !== 'IDLE' && (
                  <button
                    type="button"
                    onClick={handleResetAgent}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!agentPrompt.trim() || agentStatus === 'RUNNING'}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 border cursor-pointer ${
                    agentPrompt.trim() && agentStatus !== 'RUNNING'
                      ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/10'
                      : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Play size={12} className={agentStatus === 'RUNNING' ? 'animate-pulse' : ''} />
                  <span>Launch Agent</span>
                </button>
              </div>
            </form>
          </div>

          {/* Agent Simulation Checklist & Console log */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950/20">
            
            {/* Checklist */}
            {agentSteps.length > 0 && (
              <div className="p-4 border-b border-slate-900/60 max-h-48 overflow-y-auto space-y-2.5 shrink-0 bg-slate-950/40">
                {agentSteps.map((step, idx) => {
                  const isCurrent = idx === agentStepIndex && agentStatus === 'RUNNING';
                  const isDone = idx < agentStepIndex || agentStatus === 'COMPLETED';
                  
                  return (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {isDone ? (
                          <div className="h-4 w-4 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                            <Check size={10} />
                          </div>
                        ) : isCurrent ? (
                          <div className="h-4 w-4 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
                            <RefreshCw size={10} className="animate-spin" />
                          </div>
                        ) : (
                          <div className="h-4 w-4 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 text-[8px] font-bold font-mono">
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <p className={`text-2xs font-bold leading-normal truncate ${
                          isDone ? 'text-slate-400' : isCurrent ? 'text-indigo-400' : 'text-slate-600'
                        }`}>
                          {step.title}
                        </p>
                        <p className={`text-[9px] leading-relaxed truncate ${
                          isDone ? 'text-slate-500' : isCurrent ? 'text-slate-350' : 'text-slate-700'
                        }`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Simulator detailed logs view */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-950/80 font-mono text-[10px]">
              <div className="p-3 border-b border-slate-900 bg-slate-950/40 flex items-center justify-between shrink-0 text-slate-500 text-3xs uppercase font-mono tracking-widest select-none">
                <span>SIMULATION OUTPUT LOG</span>
                {agentStatus === 'RUNNING' && <span className="text-amber-500 animate-pulse font-bold">STREAMING</span>}
              </div>

              <div className="flex-1 p-4 overflow-y-auto font-mono space-y-1.5 scrollbar-thin scrollbar-thumb-slate-900 bg-slate-950/85">
                {agentLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 gap-2 text-slate-600 select-none">
                    <Database size={16} />
                    <span className="font-mono text-3xs tracking-wider">LOG STREAM EMPTY</span>
                  </div>
                ) : (
                  agentLogs.map((log, idx) => {
                    const isSystem = log.startsWith('[START]') || log.startsWith('[PHASE]') || log.startsWith('[STATUS]');
                    const isSuccess = log.includes('[SUCCESS]');
                    const isPrompt = log.startsWith('[PROMPT]');
                    const isPhase = log.startsWith('[PHASE]');

                    let logClass = "text-slate-400 font-mono";
                    if (isPhase) logClass = "text-indigo-400 font-bold pt-1.5 border-t border-slate-900/50";
                    else if (isSuccess) logClass = "text-emerald-400 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded";
                    else if (isPrompt) logClass = "text-slate-500 italic";
                    else if (isSystem) logClass = "text-indigo-300 font-semibold";

                    return (
                      <div key={idx} className={`whitespace-pre-wrap leading-normal ${logClass}`}>
                        {log}
                      </div>
                    );
                  })
                )}
                <div ref={agentLogEndRef} />
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AutonomousWorkspace;
