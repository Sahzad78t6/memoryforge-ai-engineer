import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Upload, 
  Sparkles, 
  Cpu, 
  Layers, 
  ShieldAlert, 
  CheckCircle, 
  BrainCircuit, 
  Clock, 
  FileText, 
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Search,
  Eye
} from 'lucide-react';
import { uploadFileImage, getKnowledgeImages, getKnowledgeImage } from '../services/api';

export default function KnowledgeCenter() {
  const [history, setHistory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local session image preview URL
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch ingestion history list on mount
  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await getKnowledgeImages();
      setHistory(data || []);
      if (data && data.length > 0 && !selectedItem) {
        // Automatically select the first item as initial view
        setSelectedItem(data[0]);
      }
    } catch (e) {
      console.error('Failed to load image analysis history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Handle uploading files
  const handleFileUpload = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    // Check type is image
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files (PNG, JPG, WEBP, GIF) are supported.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    
    // Set preview URL for the local session
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl(URL.createObjectURL(file));

    try {
      const response = await uploadFileImage(file);
      if (response.status === 'success' || response.status === 'partial_success') {
        const newItem = {
          id: response.file_id,
          filename: response.filename,
          size: response.size,
          upload_date: new Date().toISOString(),
          summary: response.summary,
          technologies_detected: response.technologies_detected || [],
          architecture_patterns: response.architecture_patterns || [],
          components_detected: response.components_detected || [],
          security_findings: response.security_findings || [],
          recommendations: response.recommendations || [],
          memories_created: response.memories_created || [],
          vision_provider: response.vision_provider || 'gemini',
          isLocalSession: true // Tag to render localPreviewUrl
        };
        
        setSelectedItem(newItem);
        setHistory(prev => [newItem, ...prev]);
      } else {
        setUploadError(response.analysis || 'Vision AI analysis failed to process.');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      const msg = error.response?.data?.detail || 'Failed to analyze image using Vision AI.';
      setUploadError(msg);
    } finally {
      setUploading(false);
      e.target.value = null; // Reset input trigger
    }
  };

  const handleSelectItem = async (item) => {
    setLocalPreviewUrl(null); // Clear local preview for history objects
    try {
      const fullDetail = await getKnowledgeImage(item.id);
      setSelectedItem(fullDetail);
    } catch (e) {
      console.error('Failed to load item detail:', e);
      // Fallback to list state if get detail fails
      setSelectedItem(item);
    }
  };

  // Filter history based on search bar
  const filteredHistory = history.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.filename.toLowerCase().includes(q) ||
      (item.summary && item.summary.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex h-full bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* 1. Left Sidebar: Ingestion List */}
      <aside className="w-80 border-r border-slate-900 bg-slate-950/40 p-5 flex flex-col justify-between shrink-0 h-full">
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          
          {/* Header */}
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-violet-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-3.50">
              Image Ingestion Registry
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141414] border border-slate-900 focus:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none transition-colors"
            />
          </div>

          {/* List items scrollable area */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loadingHistory && history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-2">
                <RefreshCw size={18} className="animate-spin text-indigo-400" />
                <span className="text-3xs font-semibold uppercase tracking-wider">Loading history...</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-10 text-slate-600 text-xs italic">
                No analyses cataloged.
              </div>
            ) : (
              filteredHistory.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`w-full text-left p-3.5 rounded-xl border flex flex-col gap-1.5 transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-600/10 border-indigo-500/20 shadow-md shadow-indigo-500/5' 
                        : 'bg-slate-900/10 border-slate-900/60 hover:bg-slate-900/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="text-xs font-semibold text-slate-200 truncate flex-1">
                        {item.filename}
                      </span>
                      <span className="text-[8px] font-bold text-slate-500 font-mono shrink-0">
                        {new Date(item.upload_date).toLocaleDateString()}
                      </span>
                    </div>
                    {item.summary && (
                      <p className="text-[10px] text-slate-500 leading-normal line-clamp-2 font-sans">
                        {item.summary}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Sync trigger */}
        <button
          onClick={fetchHistory}
          className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-900 hover:border-slate-800 bg-[#121212]/40 py-2.5 text-3xs font-extrabold uppercase tracking-wider text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          <RefreshCw size={10} />
          <span>Refresh Database</span>
        </button>
      </aside>

      {/* 2. Main Content Board */}
      <main className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
        
        {/* Title Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <BrainCircuit size={18} className="text-indigo-400" />
            <span className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Vision AI Image Intelligence Ingestion
            </span>
          </div>
          
          {selectedItem && (
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Eye size={10} />
              Provider: {selectedItem.vision_provider}
            </span>
          )}
        </div>

        {/* Upload Trigger Dropzone */}
        <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 relative group overflow-hidden">
          {/* Glowing glow effect on hover */}
          <div className="absolute inset-0 bg-indigo-500/2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-850 text-indigo-400 shadow-md">
            {uploading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Upload size={18} />
            )}
          </div>
          
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {uploading ? 'Analyzing Image contents using Gemini Vision...' : 'Ingest Architecture Diagram, UI Screenshot or Code'}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 max-w-sm font-sans mx-auto leading-relaxed">
              {uploading 
                ? 'Extracting technologies, software components, architecture patterns and generating persistent memories...'
                : 'Drag and drop image files here, or click to upload. Vision AI parses structured knowledge schemas.'}
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-3xs font-extrabold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-md shadow-indigo-600/15 disabled:opacity-50 transition-colors"
          >
            <span>{uploading ? 'Processing...' : 'Select Image File'}</span>
          </button>
          
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept="image/*"
          />

          {uploadError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 rounded-full mt-2">
              <AlertCircle size={14} />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* 3. Image Intelligence Panel */}
        {selectedItem ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left Col: Image Preview + Summary (1 Col) */}
            <div className="space-y-6">
              
              {/* Image Preview Container */}
              <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-4 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Source Image Ingested</span>
                
                <div className="relative aspect-video w-full rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-center overflow-hidden">
                  {selectedItem.isLocalSession && localPreviewUrl ? (
                    <img 
                      src={localPreviewUrl} 
                      alt={selectedItem.filename} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    // Aesthetic placeholder for archived/history elements
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-500 mb-2">
                        <ImageIcon size={20} />
                      </div>
                      <span className="text-2xs font-semibold text-slate-400">{selectedItem.filename}</span>
                      <span className="text-[9px] text-slate-500 font-mono mt-1">
                        Archived File Size: {Math.round(selectedItem.size / 1024)} KB
                      </span>
                      <span className="text-[8px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-indigo-400 mt-3 tracking-wider font-semibold uppercase">
                        Secure Storage Active
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block border-b border-slate-900 pb-2">
                  Vision Summary
                </span>
                <p className="text-xs text-slate-350 leading-relaxed font-sans font-medium">
                  {selectedItem.summary || 'No summary available.'}
                </p>
              </div>

            </div>

            {/* Right Col: Extracted Structured metadata grids (2 Cols) */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Technologies & Architecture Pattern Badges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Tech card */}
                <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5 space-y-3.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                    <Cpu size={14} className="text-emerald-400" />
                    Technologies Detected
                  </span>
                  
                  {selectedItem.technologies_detected?.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No technologies parsed.</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedItem.technologies_detected?.map((tech, idx) => (
                        <span 
                          key={idx} 
                          className="bg-slate-950 border border-slate-900 text-emerald-400 font-semibold px-2.5 py-1 rounded-lg text-2xs tracking-wide"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Architecture card */}
                <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5 space-y-3.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                    <Layers size={14} className="text-violet-400" />
                    Architecture Patterns
                  </span>
                  
                  {selectedItem.architecture_patterns?.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No patterns detected.</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedItem.architecture_patterns?.map((pattern, idx) => (
                        <span 
                          key={idx} 
                          className="bg-slate-950 border border-slate-900 text-violet-400 font-semibold px-2.5 py-1 rounded-lg text-2xs tracking-wide"
                        >
                          {pattern}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Components Detected list */}
              <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5 space-y-3.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                  <FileText size={14} className="text-indigo-400" />
                  Identified Systems & Components
                </span>
                
                {selectedItem.components_detected?.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No explicit components identified.</span>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedItem.components_detected?.map((comp, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl text-xs text-slate-350 leading-relaxed font-sans">
                        • {comp}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Security Findings & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Security findings */}
                <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5 space-y-3.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                    <ShieldAlert size={14} className="text-rose-400" />
                    Security Audit Findings
                  </span>
                  
                  {selectedItem.security_findings?.length === 0 ? (
                    <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 rounded-xl text-2xs flex items-center gap-2">
                      <CheckCircle size={14} />
                      <span>No potential security vulnerabilities or hardcoded credentials visible.</span>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {selectedItem.security_findings?.map((f, idx) => (
                        <li key={idx} className="p-3 bg-rose-500/5 border border-rose-500/10 text-rose-450 rounded-xl text-2xs flex items-start gap-2 leading-relaxed">
                          <ShieldAlert size={12} className="shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Recommendations */}
                <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5 space-y-3.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                    <CheckCircle size={14} className="text-brand-400" />
                    Architecture Recommendations
                  </span>
                  
                  {selectedItem.recommendations?.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No recommendations produced.</span>
                  ) : (
                    <ul className="space-y-2">
                      {selectedItem.recommendations?.map((r, idx) => (
                        <li key={idx} className="p-3 bg-[#121212]/40 border border-slate-900 text-slate-350 rounded-xl text-2xs flex items-start gap-2 leading-relaxed font-sans">
                          <span className="text-brand-400 shrink-0 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>

              {/* Generated Brain memories list */}
              <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5 space-y-3.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                  <BrainCircuit size={14} className="text-indigo-400" />
                  Persisted Cognitive memories Ingested
                </span>
                <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">
                  These items have been structured and indexed under your authenticated Parcle vector space:
                </p>
                
                {selectedItem.memories_created?.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No persistent memories generated.</span>
                ) : (
                  <div className="space-y-2">
                    {selectedItem.memories_created?.map((mem, idx) => (
                      <div key={idx} className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl relative overflow-hidden flex items-center justify-between gap-3">
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500" />
                        
                        <p className="text-xs text-slate-300 font-medium pl-1.5 leading-relaxed font-sans">
                          {mem.content}
                        </p>
                        
                        <span className="text-[8px] font-bold text-indigo-300 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 shrink-0">
                          {mem.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-850 bg-slate-900/10 h-64 flex flex-col items-center justify-center text-center p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-600 border border-slate-850 mb-3">
              <Database size={20} />
            </div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">No Image Selected</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed font-sans">
              Select a previous Vision AI analysis from the registry on the left, or upload a new architecture diagram to view analysis results.
            </p>
          </div>
        )}

      </main>

    </div>
  );
}
