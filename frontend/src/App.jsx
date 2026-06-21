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

function App() {
  return (
    <Router>
      <div className="flex h-screen w-screen bg-slate-950 text-slate-100 antialiased overflow-hidden selection:bg-indigo-500/20">
        {/* Modern Sidebar Navigation */}
        <Sidebar />

        {/* Page Render Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/chat" element={<Navigate to="/" replace />} />
            <Route path="/memories" element={<MemoryDashboard />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/agent" element={<AutonomousWorkspace />} />
            
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
    </Router>
  );
}

export default App;

