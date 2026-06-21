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
  X
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
    { to: '/knowledge', label: 'Knowledge Center', icon: BrainCircuit },
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
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border border-transparent'}
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
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 text-center">
                Authenticate to manage workspace memory
              </p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/auth');
                }}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <LogIn size={14} />
                <span>Sign In</span>
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
