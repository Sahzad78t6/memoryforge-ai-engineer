import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ChatPage from './pages/ChatPage';
import MemoryDashboard from './pages/MemoryDashboard';

function App() {
  return (
    <Router>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100 antialiased selection:bg-brand-500/20">
        {/* Top Navbar */}
        <Navbar />

        {/* Dynamic Route Pages */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/memories" element={<MemoryDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
