import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import MemoryDashboard from './pages/MemoryDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import AutonomousWorkspace from './pages/AutonomousWorkspace';

function ProtectedAdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/auth" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (user.role !== 'ADMIN') {
      return <Navigate to="/" replace />;
    }
  } catch (err) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <div className="h-dvh w-full overflow-hidden bg-[#030611] text-slate-100 antialiased selection:bg-violet-500/25">
        <div className="flex h-full w-full flex-col overflow-hidden md:flex-row">
          <Sidebar />
          <main className="min-w-0 flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<ChatPage />} />
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
              <Route
                path="/admin"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
