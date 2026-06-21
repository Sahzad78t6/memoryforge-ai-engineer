import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  BrainCircuit, 
  MessageSquare, 
  Database, 
  Shield, 
  LogOut, 
  LogIn, 
  User, 
  Settings,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false); // Mobile toggle state
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsOpen(false);
    navigate('/auth');
    window.location.reload();
  };

  const navItems = [
    { to: '/', label: 'Chat Workspace', icon: MessageSquare },
    { to: '/agent', label: 'Agent Workspace', icon: Sparkles },
    { to: '/memories', label: 'Memory Dashboard', icon: Database },
  ];


  // If user is ADMIN, append the Admin Portal option
  if (user?.role === 'ADMIN') {
    navItems.push({ to: '/admin', label: 'Admin Portal', icon: Shield });
  }

  // Hide sidebar on Auth screen to give clean space
  if (location.pathname === '/auth') {
    return null;
  }

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex h-14 items-center justify-between border-b border-slate-900 bg-slate-950 px-4 shrink-0 w-full z-40 relative">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-400 text-white">
            <BrainCircuit size={18} className="animate-pulse" />
          </div>
          <span className="text-sm font-extrabold tracking-wider uppercase text-white">
            MemoryForge
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-400 hover:text-white focus:outline-none"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 md:relative flex w-64 flex-col border-r border-slate-900 bg-slate-950 p-5 transform transition-transform duration-300 ease-in-out shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-400 text-white shadow-md shadow-violet-500/20">
            <BrainCircuit size={20} className="animate-pulse" />
          </div>
          <div>
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-sm font-bold tracking-wider text-transparent uppercase">
              MemoryForge
            </span>
            <span className="block text-[9px] font-semibold uppercase tracking-widest text-slate-500 mt-0.5">
              AI PLATFORM
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer
                  ${isActive 
                    ? 'bg-gradient-to-r from-violet-600/25 to-indigo-600/20 text-indigo-200 border border-indigo-500/35 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-semibold' 
                    : 'text-slate-450 hover:bg-slate-900/40 hover:text-slate-200 border border-transparent'}
                `}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Panel */}
        <div className="border-t border-slate-900 pt-5 mt-5 space-y-4">
          {user ? (
            <div className="space-y-3">
              {/* Profile card */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</p>
                </div>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full shrink-0 tracking-wider ${
                  user.role === 'ADMIN' ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20' : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                }`}>
                  {user.role}
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // placeholder settings
                  }}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-500 hover:bg-slate-900/60 hover:text-slate-300 cursor-pointer"
                >
                  <Settings size={16} />
                  <span>Workspace Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4 px-2 border border-slate-800 bg-slate-900/10 rounded-2xl relative overflow-hidden backdrop-blur-md">
              {/* Wireframe head SVG */}
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full border border-slate-800/80 bg-slate-950/80 shadow-[0_0_15px_rgba(99,102,241,0.15)] shrink-0">
                <svg className="w-14 h-14 text-indigo-400/70 animate-pulse" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="45" r="28" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.2" />
                  <path d="M 50 15 L 50 75 M 22 45 L 78 45 M 30 25 L 70 65 M 30 65 L 70 25" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
                  <path d="M 30 35 Q 50 20 70 35 Q 75 60 50 80 Q 25 60 30 35 Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 38 48 Q 50 51 62 48" stroke="currentColor" strokeWidth="1" />
                  <path d="M 42 38 A 2 2 0 1 1 42 37.9 Z M 58 38 A 2 2 0 1 1 58 37.9 Z" fill="currentColor" />
                  <path d="M 50 48 L 50 58 L 46 58" stroke="currentColor" strokeWidth="1" />
                  <circle cx="50" cy="45" r="35" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
                  <circle cx="50" cy="15" r="2.5" fill="currentColor" />
                  <circle cx="50" cy="75" r="2.5" fill="currentColor" />
                  <circle cx="22" cy="45" r="2.5" fill="currentColor" />
                  <circle cx="78" cy="45" r="2.5" fill="currentColor" />
                </svg>
              </div>

              {/* Status Indicator */}
              <div className="bg-slate-950/40 border border-slate-900 rounded-xl px-3 py-1.5 w-full text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block select-none">
                  Account Security Status: <span className="text-amber-500 font-extrabold animate-pulse">Locked</span>
                </span>
              </div>

              {/* Sign In Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/auth');
                }}
                className="w-full flex flex-col items-center justify-center gap-0.5 bg-gradient-to-r from-indigo-950/80 to-purple-950/80 hover:from-indigo-900/90 hover:to-purple-900/90 border border-indigo-500/20 text-white py-2 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-indigo-300">
                  🔑 Sign In
                </span>
                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-semibold">
                  Secure your memory forge
                </span>
              </button>
            </div>
          )}
        </div>

      </aside>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
        />
      )}
    </>
  );
}
