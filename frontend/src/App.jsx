import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import MemoryDashboard from './pages/MemoryDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import AutonomousWorkspace from './pages/AutonomousWorkspace';

// Protected Route wrapper to secure Admin control panels
function ProtectedAdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/auth" replace />;
  }
  
  try {
    const user = JSON.parse(userStr);
    if (user.role !== 'ADMIN') {
      return <Navigate to="/chat" replace />;
    }
  } catch (err) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
}

// Protected Route wrapper for general authenticated users
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

function App() {
  const [backendStatus, setBackendStatus] = React.useState('online'); // Default to online to avoid screen flash

  const checkHealth = async () => {
    try {
      const res = await fetch('http://localhost:8000/health');
      if (res.ok) {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    } catch (e) {
      setBackendStatus('offline');
    }
  };

  React.useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 antialiased overflow-hidden selection:bg-indigo-500/20">
        
        {/* Global Offline Status Warning Banner */}
        {backendStatus === 'offline' && (
          <div className="flex items-center justify-between bg-red-500/10 border-b border-red-500/10 px-6 py-2 text-xs font-semibold text-red-400 w-full z-50 shrink-0 select-none">
            <div className="flex items-center gap-2">
              <span className="tracking-wider uppercase flex items-center gap-1">
                SYSTEM STATUS: Unable to connect to MemoryForge backend on http://localhost:8000. 
                <span className="cursor-pointer hover:text-red-300 ml-0.5 inline-block text-[10px]" onClick={checkHealth}>↻</span>
              </span>
            </div>
            <button
              onClick={checkHealth}
              className="flex items-center gap-1.5 hover:text-red-300 transition-colors uppercase font-bold text-[10px] tracking-widest cursor-pointer text-red-400"
            >
              <span className="text-[11px]">↻</span>
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Modern Sidebar Navigation */}
          <Sidebar />

          {/* Page Render Workspace */}
          <main className="flex-1 flex flex-col overflow-hidden relative">
            <Routes>
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/chat" element={<Navigate to="/" replace />} />
              <Route 
                path="/memories" 
                element={
                  <ProtectedRoute>
                    <MemoryDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/auth" element={<AuthPage />} />
              <Route 
                path="/agent" 
                element={
                  <ProtectedRoute>
                    <AutonomousWorkspace />
                  </ProtectedRoute>
                } 
              />
              
              {/* Secured Admin Room */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                } 
              />
              
              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;

