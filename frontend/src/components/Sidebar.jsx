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
  Sparkles,
  Lock
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
        fixed inset-y-0 left-0 z-50 md:relative flex w-72 flex-col border-r border-white/5 bg-[#0d0d16] p-5 transform transition-transform duration-300 ease-in-out shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <BrainCircuit size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wider text-white">MEMORYFORGE</h1>
            <p className="text-[10px] text-gray-400 tracking-widest uppercase">AI Platform</p>
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
                    ? 'bg-gradient-to-r from-purple-600/20 to-transparent border border-purple-500/30 rounded-xl text-purple-300 transition-all hover:bg-purple-600/30 font-semibold shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                    : 'text-gray-400 hover:text-gray-200 transition-all border border-transparent'}
                `}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Panel */}
        <div className="relative mt-10">
          {user ? (
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col items-center shadow-lg">
              {/* Avatar Placeholder / Authenticated Profile Card */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-indigo-600 to-purple-600 border-2 border-purple-500/50 -mt-12 mb-4 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                 <span className="text-xl font-extrabold text-white">{user.name ? user.name[0].toUpperCase() : 'U'}</span>
              </div>
              
              <div className="w-full text-center mb-3">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{user.email}</p>
              </div>
              
              <p className="text-[10px] text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider font-semibold">
                Role: <span className="text-indigo-400">{user.role}</span>
              </p>

              <div className="w-full space-y-1.5">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // placeholder settings
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-medium text-slate-400 bg-white/[0.02] border border-white/5 hover:bg-white/5 cursor-pointer transition-all"
                >
                  <Settings size={14} />
                  <span>Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-rose-500 bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col items-center shadow-lg">
              {/* Avatar Placeholder */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-gray-700 to-gray-900 border-2 border-purple-500/50 -mt-12 mb-4 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                 <div className="w-full h-full bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 bg-cover opacity-60"></div>
              </div>
              
              <div className="w-full h-8 bg-black/40 rounded-lg mb-4 border border-white/5 flex items-center justify-center">
                 <span className="text-[10px] text-gray-500 font-mono tracking-widest">UNAUTHENTICATED</span>
              </div>
              
              <p className="text-xs text-gray-400 mb-4 flex items-center gap-2">
                Account Security Status: <span className="text-gray-200">Locked</span>
              </p>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/auth');
                }}
                className="w-full py-2 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-purple-500/40 hover:bg-purple-600/40 rounded-lg flex items-center justify-center gap-2 text-sm transition-all shadow-[0_0_10px_rgba(168,85,247,0.2)] cursor-pointer"
              >
                <Lock size={14} className="text-indigo-400" />
                <span className="text-indigo-200 font-medium">Sign In</span>
              </button>
              <p className="text-[10px] text-gray-500 mt-3">Secure your memory forge</p>
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
