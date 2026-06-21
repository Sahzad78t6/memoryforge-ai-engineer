import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Info, 
  BrainCircuit, 
  Database, 
  Cpu, 
  Settings, 
  FileCode, 
  Zap, 
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';

export default function WorkflowPage() {
  const [nodes, setNodes] = useState([
    { id: 'n1', type: 'input', label: 'File Upload (Ingest)', x: 80, y: 180, config: { filename: 'architecture_guideline.txt' } },
    { id: 'n2', type: 'llm', label: 'Groq Llama-3.3-70b', x: 380, y: 100, config: { temperature: 0.1, maxTokens: 2048 } },
    { id: 'n3', type: 'database', label: 'Parcle Memory Index', x: 680, y: 220, config: { user_id: 'auth_user_mongodb' } }
  ]);

  const [connections, setConnections] = useState([
    { id: 'c1', fromId: 'n1', toId: 'n2' },
    { id: 'c2', fromId: 'n2', toId: 'n3' }
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [connectingFromId, setConnectingFromId] = useState(null);
  const canvasRef = useRef(null);

  // Manage node drag positioning
  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);
    
    // Calculate drag click offsets inside node boundary
    const clientX = e.clientX;
    const clientY = e.clientY;
    setDragOffset({
      x: (clientX / zoom) - node.x,
      y: (clientY / zoom) - node.y
    });
  };

  const handleMouseMove = (e) => {
    if (draggingNodeId) {
      const clientX = e.clientX;
      const clientY = e.clientY;
      setNodes(prev => prev.map(n => {
        if (n.id === draggingNodeId) {
          return {
            ...n,
            x: Math.max(10, Math.min(1200, (clientX / zoom) - dragOffset.x)),
            y: Math.max(10, Math.min(800, (clientY / zoom) - dragOffset.y))
          };
        }
        return n;
      }));
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  // Node Port connection logic
  const startConnection = (e, nodeId) => {
    e.stopPropagation();
    setConnectingFromId(nodeId);
  };

  const endConnection = (nodeId) => {
    if (connectingFromId && connectingFromId !== nodeId) {
      // Check if duplicate connection exists
      const exists = connections.some(c => c.fromId === connectingFromId && c.toId === nodeId);
      if (!exists) {
        setConnections(prev => [...prev, {
          id: `c_${Date.now()}`,
          fromId: connectingFromId,
          toId: nodeId
        }]);
      }
    }
    setConnectingFromId(null);
  };

  const addNode = (type) => {
    let label = 'New Node';
    let config = {};
    if (type === 'input') {
      label = 'File Upload (Ingest)';
      config = { filename: 'unnamed_asset.zip' };
    } else if (type === 'llm') {
      label = 'Groq LLM Model';
      config = { temperature: 0.2, maxTokens: 4096 };
    } else if (type === 'database') {
      label = 'Parcle Memory Index';
      config = { user_id: 'auth_user_mongodb' };
    }

    const newNode = {
      id: `n_${Date.now()}`,
      type,
      label,
      x: 150 + Math.random() * 80,
      y: 150 + Math.random() * 80,
      config
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const deleteNode = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.fromId !== nodeId && c.toId !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const deleteConnection = (connId) => {
    setConnections(prev => prev.filter(c => c.id !== connId));
  };

  // Calculate midpoints of nodes to draw connection Bezier lines
  const getNodePorts = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { outX: 0, outY: 0, inX: 0, inY: 0 };
    
    // Assume node width is 200px and height is 80px (approximated)
    const width = 220;
    const height = 82;
    return {
      outX: node.x + width,
      outY: node.y + height / 2,
      inX: node.x,
      inY: node.y + height / 2
    };
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Page Header */}
      <div className="flex h-14 items-center justify-between border-b border-slate-900 bg-slate-950/40 px-6 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <BrainCircuit size={16} className="text-violet-400" />
          <span className="text-sm font-bold uppercase tracking-wider text-slate-350">
            Node-Based Workflow Canvas
          </span>
        </div>
        
        {/* Toolbar controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => addNode('input')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#212121] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer transition-all"
          >
            <Plus size={14} className="text-emerald-400" />
            <span>Add Input</span>
          </button>
          <button 
            onClick={() => addNode('llm')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#212121] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer transition-all"
          >
            <Plus size={14} className="text-indigo-400" />
            <span>Add LLM</span>
          </button>
          <button 
            onClick={() => addNode('database')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#212121] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer transition-all"
          >
            <Plus size={14} className="text-violet-400" />
            <span>Add Memory DB</span>
          </button>

          <div className="flex items-center gap-1 border-l border-slate-850 pl-3">
            <button 
              onClick={() => setZoom(prev => Math.max(0.6, prev - 0.1))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer hover:bg-slate-900"
              title="Zoom Out"
            >
              <Minimize2 size={14} />
            </button>
            <span className="text-[10px] text-slate-500 font-mono w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={() => setZoom(prev => Math.min(1.4, prev + 0.1))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer hover:bg-slate-900"
              title="Zoom In"
            >
              <Maximize2 size={14} />
            </button>
            <button 
              onClick={() => {
                setZoom(1);
                setNodes([
                  { id: 'n1', type: 'input', label: 'File Upload (Ingest)', x: 80, y: 180, config: { filename: 'architecture_guideline.txt' } },
                  { id: 'n2', type: 'llm', label: 'Groq Llama-3.3-70b', x: 380, y: 100, config: { temperature: 0.1, maxTokens: 2048 } },
                  { id: 'n3', type: 'database', label: 'Parcle Memory Index', x: 680, y: 220, config: { user_id: 'auth_user_mongodb' } }
                ]);
                setConnections([
                  { id: 'c1', fromId: 'n1', toId: 'n2' },
                  { id: 'c2', fromId: 'n2', toId: 'n3' }
                ]);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer hover:bg-slate-900 ml-1"
              title="Reset Layout"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div 
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
        onClick={() => setSelectedNodeId(null)}
      >
        {/* Dot grid background */}
        <div 
          className="absolute inset-0 z-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-80"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        />

        {/* SVG connection lines Overlay */}
        <svg 
          className="absolute inset-0 pointer-events-none z-10 w-[2000px] h-[2000px]"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          <defs>
            <linearGradient id="connGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Active SVG Connections */}
          {connections.map((c) => {
            const { outX, outY } = getNodePorts(c.fromId);
            const { inX, inY } = getNodePorts(c.toId);
            
            // Cubic bezier control point offsets
            const dx = Math.abs(inX - outX) * 0.4;
            const pathData = `M ${outX} ${outY} C ${outX + dx} ${outY}, ${inX - dx} ${inY}, ${inX} ${inY}`;

            return (
              <g key={c.id} className="pointer-events-auto group/line cursor-pointer">
                {/* Fat transparent hitbox line */}
                <path 
                  d={pathData} 
                  fill="none" 
                  stroke="transparent" 
                  strokeWidth="10" 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConnection(c.id);
                  }}
                />
                {/* Glowing neon background connection line */}
                <path 
                  d={pathData} 
                  fill="none" 
                  stroke="url(#connGlow)" 
                  strokeWidth="2.5" 
                  className="transition-all duration-300 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] group-hover/line:stroke-rose-500"
                />
              </g>
            );
          })}
        </svg>

        {/* Dynamic Nodes Container */}
        <div 
          className="absolute inset-0 z-20 w-[2000px] h-[2000px] pointer-events-none"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          {nodes.map((n) => {
            const isSelected = selectedNodeId === n.id;
            const Icon = n.type === 'input' ? FileCode : n.type === 'llm' ? Cpu : Database;
            const typeColor = n.type === 'input' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : n.type === 'llm' ? 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5' : 'text-violet-400 border-violet-500/20 bg-violet-500/5';

            return (
              <div
                key={n.id}
                onMouseDown={(e) => handleNodeMouseDown(e, n.id)}
                onClick={(e) => e.stopPropagation()}
                className={`absolute w-56 bg-[#1a1a1a]/95 border border-slate-800/80 rounded-xl p-3 flex flex-col pointer-events-auto cursor-grab active:cursor-grabbing hover:border-slate-700/80 transition-all shadow-[0_10px_25px_rgba(0,0,0,0.5)] ${
                  isSelected ? 'ring-2 ring-indigo-500/80 border-indigo-500/80 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : ''
                }`}
                style={{ left: n.x, top: n.y }}
              >
                {/* Left Connector (Input Port) */}
                {n.type !== 'input' && (
                  <div 
                    onMouseUp={(e) => {
                      e.stopPropagation();
                      endConnection(n.id);
                    }}
                    className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-900 border-2 border-indigo-500 rounded-full cursor-crosshair z-30 flex items-center justify-center hover:scale-125 transition-transform"
                    title="Connect input port"
                  >
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                  </div>
                )}

                {/* Node Title Header */}
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-850">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${typeColor}`}>
                    <Icon size={14} />
                  </div>
                  <span className="text-[11px] font-bold tracking-wide truncate max-w-[140px] text-slate-200">
                    {n.label}
                  </span>
                </div>

                {/* Node details */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9px] text-slate-500">
                    <span>Node Type</span>
                    <span className="uppercase font-semibold text-slate-400 font-mono">{n.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500">
                    <span>Status</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  </div>
                </div>

                {/* Right Connector (Output Port) */}
                {n.type !== 'database' && (
                  <div 
                    onMouseDown={(e) => startConnection(e, n.id)}
                    className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-900 border-2 border-indigo-500 rounded-full cursor-crosshair z-30 flex items-center justify-center hover:scale-125 transition-transform"
                    title="Drag to connect output port"
                  >
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
                    <div className="absolute w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Canvas Controls Info */}
      <div className="absolute bottom-6 left-6 z-30 bg-[#121212]/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-1 text-[10px] text-slate-400 font-medium shadow-lg max-w-sm pointer-events-none">
        <span className="font-bold text-white flex items-center gap-1.5 text-xs pb-1 mb-1.5 border-b border-slate-850">
          <Info size={12} className="text-indigo-400" />
          Interactive Canvas Shortcuts
        </span>
        <div className="flex items-center justify-between gap-4">
          <span>Move Node</span>
          <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono">Drag Header</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Connect Node</span>
          <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono">Drag Output → Input</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Remove Link</span>
          <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono">Click Line</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Configure Parameter</span>
          <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono">Click Node Card</span>
        </div>
      </div>

      {/* Glassmorphism Configuration Side Panel Drawer */}
      {selectedNode && (
        <div className="absolute right-6 top-20 bottom-6 w-80 bg-[#121212]/95 border border-slate-800 backdrop-blur-md rounded-2xl p-5 z-30 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <div className="space-y-5">
            {/* Drawer Title Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-850">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Settings size={14} className="text-indigo-400" />
                Configure Node
              </span>
              <button 
                onClick={() => setSelectedNodeId(null)}
                className="text-slate-500 hover:text-slate-350 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Custom parameters based on Node Type */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Node Label</label>
                <input 
                  type="text" 
                  value={selectedNode.label}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, label: val } : n));
                  }}
                  className="w-full bg-[#1c1c1c] border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-750"
                />
              </div>

              {selectedNode.type === 'input' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Ingested Filename</label>
                  <input 
                    type="text" 
                    value={selectedNode.config.filename || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, filename: val } } : n));
                    }}
                    className="w-full bg-[#1c1c1c] border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-slate-750"
                  />
                </div>
              )}

              {selectedNode.type === 'llm' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Temperature</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1"
                        value={selectedNode.config.temperature ?? 0.5}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, temperature: val } } : n));
                        }}
                        className="flex-1 accent-indigo-500 bg-slate-800"
                      />
                      <span className="text-xs text-slate-300 font-mono w-6 text-right">
                        {selectedNode.config.temperature ?? 0.5}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Max Tokens</label>
                    <select 
                      value={selectedNode.config.maxTokens ?? 2048}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, maxTokens: val } } : n));
                      }}
                      className="w-full bg-[#1c1c1c] border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-750"
                    >
                      <option value="1024">1024 tokens</option>
                      <option value="2048">2048 tokens</option>
                      <option value="4096">4096 tokens</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedNode.type === 'database' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">User Workspace ID</label>
                  <input 
                    type="text" 
                    value={selectedNode.config.user_id || ''}
                    disabled
                    className="w-full bg-[#1c1c1c]/50 border border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-500 font-mono select-none"
                  />
                  <span className="text-[9px] text-slate-650 mt-1 block">
                    Automatically isolated based on logged in user space.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Delete Action button */}
          <button 
            onClick={() => deleteNode(selectedNode.id)}
            className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/40 text-rose-400 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all"
          >
            <Trash2 size={14} />
            <span>Remove Node Module</span>
          </button>
        </div>
      )}
    </div>
  );
}
