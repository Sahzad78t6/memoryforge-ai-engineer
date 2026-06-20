import React, { useState, useEffect } from 'react';
import ChatWindow from '../components/ChatWindow';
import MemoryPanel from '../components/MemoryPanel';
import { sendChatMessage, getHealth } from '../services/api';
import { Send, AlertCircle, RefreshCw, Cpu } from 'lucide-react';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [latestMemories, setLatestMemories] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // checking, online, offline

  // Check health on load
  const checkStatus = async () => {
    try {
      setBackendStatus('checking');
      await getHealth();
      setBackendStatus('online');
    } catch (e) {
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Stage user message
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const data = await sendChatMessage(userMessage);
      
      // Stage AI reply and memories utilized
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      setLatestMemories(data.memory_context || []);
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

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-950">
      {/* Offline Status Warning */}
      {backendStatus === 'offline' && (
        <div className="flex items-center justify-between bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs font-medium text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} />
            <span>Unable to connect to MemoryForge backend on http://localhost:8000.</span>
          </div>
          <button
            onClick={checkStatus}
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
                Agent Engineering Session
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${
                backendStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className="text-2xs font-semibold text-slate-500 uppercase tracking-widest">
                {backendStatus === 'online' ? 'Backend Live' : 'Backend Offline'}
              </span>
            </div>
          </div>

          {/* Messages view */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <ChatWindow messages={messages} loading={loading} />
          </div>

          {/* Form Input Footer */}
          <div className="border-t border-slate-900 bg-slate-950/40 p-4 shrink-0">
            <form onSubmit={handleSend} className="mx-auto max-w-4xl">
              <div className="relative flex items-center rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-1.5 focus-within:border-brand-500/50 focus-within:ring-1 focus-within:ring-brand-500/20 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading || backendStatus === 'offline'}
                  placeholder={
                    backendStatus === 'offline'
                      ? 'Reconnect to backend to send prompts...'
                      : 'Ask the Sentient Engineer (e.g. "Use JWT with MongoDB Atlas", "Create a signup api")...'
                  }
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none disabled:opacity-50"
                />
                
                <button
                  type="submit"
                  disabled={!input.trim() || loading || backendStatus === 'offline'}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white shadow-md shadow-brand-600/10 hover:bg-brand-500 hover:shadow-brand-500/20 disabled:bg-slate-800 disabled:text-slate-550 disabled:shadow-none transition-all duration-200 shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Memory Panel (1 column on desktop) */}
        <div className="lg:col-span-1 h-full bg-slate-950 p-4 overflow-y-auto border-t lg:border-t-0 border-slate-900">
          <div className="h-full">
            <MemoryPanel memories={latestMemories} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
