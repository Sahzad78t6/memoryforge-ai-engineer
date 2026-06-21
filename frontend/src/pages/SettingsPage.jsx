import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  Key, 
  Globe, 
  RefreshCw, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState([
    { id: 'mongodb', name: 'MongoDB Atlas', category: 'Database', status: 'Connected', desc: 'Stores persistent file summaries, metadata schemas, and user records.', active: true },
    { id: 'parcle', name: 'Parcle Memory Platform', category: 'Vector Memory', status: 'Connected', desc: 'Orchestrates search context vector matching and dialog memory.', active: true },
    { id: 'groq', name: 'Groq Llama-3.3 Cloud', category: 'AI Inference', status: 'Connected', desc: 'Powers structured software architecture and engineering metadata extraction.', active: true },
    { id: 'tesseract', name: 'Tesseract OCR parser', category: 'OCR Engine', status: 'Disconnected', desc: 'Performs local image text extraction. Fallback classification logic handles errors when missing.', active: false },
    { id: 'nodejs', name: 'Node.js Runtime', category: 'Compiler', status: 'Connected', desc: 'Processes zip archives, directory trees, and setup configurations in backend parsers.', active: true }
  ]);

  const [apiKeys, setApiKeys] = useState([
    { id: 'k1', name: 'Default Read/Write Key', value: 'mf_live_8fe532b48536417ab3fc47aa65425ccd', created: '2026-06-20', show: false },
    { id: 'k2', name: 'Analytics Exporter Token', value: 'mf_read_254139d0cc7ffa969b0e4dd46a37bfee', created: '2026-06-21', show: false }
  ]);

  const [copiedKeyId, setCopiedKeyId] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState('https://api.memoryforge.io/webhooks/ingest');
  const [webhookSaved, setWebhookSaved] = useState(false);

  const toggleIntegration = (id) => {
    setIntegrations(prev => prev.map(item => {
      if (item.id === id) {
        const nextActive = !item.active;
        return {
          ...item,
          active: nextActive,
          status: nextActive ? 'Connected' : 'Disconnected'
        };
      }
      return item;
    }));
  };

  const copyToClipboard = (text, keyId) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const toggleShowKey = (id) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, show: !k.show } : k));
  };

  const generateApiKey = () => {
    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newKey = {
      id: `k_${Date.now()}`,
      name: `Generated Key ${apiKeys.length + 1}`,
      value: `mf_live_${randomHex}`,
      created: new Date().toISOString().split('T')[0],
      show: true
    };
    setApiKeys(prev => [...prev, newKey]);
  };

  const saveWebhook = (e) => {
    e.preventDefault();
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-900 shrink-0">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-violet-400" />
          <span className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Workspace Integrations & Settings
          </span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Integrations Cards Grid (2 cols wide) */}
        <div className="xl:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Connected Integrations
            </h2>
            <span className="text-[10px] text-slate-500 font-medium">
              Toggle connections to enable/disable specific modules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((item) => {
              const Icon = item.id === 'mongodb' || item.id === 'parcle' ? Database : Settings;
              return (
                <div 
                  key={item.id} 
                  className={`bg-slate-900/30 border rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all hover:border-slate-800 ${
                    item.active ? 'border-slate-850 shadow-[0_4px_15px_rgba(99,102,241,0.02)]' : 'border-slate-950 opacity-60'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header: Title and Type indicator */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-lg bg-slate-950 border flex items-center justify-center ${
                          item.active ? 'text-indigo-400 border-slate-800' : 'text-slate-650 border-slate-900'
                        }`}>
                          <Icon size={15} />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-200">{item.name}</h3>
                          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">{item.category}</span>
                        </div>
                      </div>

                      {/* Status indicator pill */}
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        item.active 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {item.active ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                        {item.status}
                      </span>
                    </div>

                    {/* Description text */}
                    <p className="text-[11px] text-slate-450 leading-relaxed font-sans">
                      {item.desc}
                    </p>
                  </div>

                  {/* Toggle switch controls */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-900/50">
                    <span className="text-[10px] text-slate-500 font-semibold">Active State</span>
                    <button 
                      onClick={() => toggleIntegration(item.id)}
                      className="text-slate-400 hover:text-white cursor-pointer transition-colors focus:outline-none"
                    >
                      {item.active ? (
                        <ToggleRight size={24} className="text-indigo-400 fill-indigo-500/10" />
                      ) : (
                        <ToggleLeft size={24} className="text-slate-600" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: API Keys & Webhooks panels */}
        <div className="space-y-6">
          
          {/* API Keys Configuration Panel */}
          <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-350 flex items-center gap-1.5">
                <Key size={14} className="text-violet-400" />
                Workspace API Keys
              </span>
              <button 
                onClick={generateApiKey}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider cursor-pointer"
              >
                + Generate
              </button>
            </div>

            <div className="space-y-3">
              {apiKeys.map((k) => (
                <div key={k.id} className="bg-slate-950/60 border border-slate-900 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-300">{k.name}</span>
                    <span className="text-[8px] text-slate-550 font-mono">Created: {k.created}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 rounded-lg p-1.5 px-2.5">
                    <div className="flex-1 min-w-0 font-mono text-2xs text-slate-400 truncate">
                      {k.show ? k.value : '••••••••••••••••••••••••••••••••••••'}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => toggleShowKey(k.id)}
                        className="text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {k.show ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button 
                        onClick={() => copyToClipboard(k.value, k.id)}
                        className="text-slate-500 hover:text-slate-300 cursor-pointer transition-all active:scale-95"
                      >
                        {copiedKeyId === k.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Webhook Configuration Panel */}
          <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-350 flex items-center gap-1.5">
                <Globe size={14} className="text-emerald-400" />
                Ingestion Webhooks
              </span>
            </div>

            <form onSubmit={saveWebhook} className="space-y-3.5">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Webhook URL</label>
                <input 
                  type="text" 
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2.5 text-2xs text-slate-300 font-mono focus:outline-none focus:border-slate-750"
                />
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button 
                  type="button" 
                  onClick={() => alert("Testing webhook endpoint: Event dispatched successfully!")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#212121] text-3xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                >
                  <RefreshCw size={10} />
                  <span>Test Connection</span>
                </button>
                <button 
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-3xs font-bold uppercase tracking-wider cursor-pointer shadow-md transition-colors"
                >
                  {webhookSaved ? <Check size={10} /> : null}
                  <span>{webhookSaved ? 'Saved!' : 'Save URL'}</span>
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
