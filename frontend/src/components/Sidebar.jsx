import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  Database,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  Shield,
  User,
  X,
} from 'lucide-react';

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setUser(null);
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (e) {
      localStorage.removeItem('user');
      setUser(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsOpen(false);
    navigate('/');
  };

  const navItems = [
    { to: '/', label: 'Chat Workspace', icon: MessageSquare },
    { to: '/memories', label: 'Memory Dashboard', icon: Database },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ to: '/admin', label: 'Admin Portal', icon: Shield });
  }

  if (location.pathname === '/auth') {
    return null;
  }

  return (
    <>
      <div className="md:hidden flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#111529] px-4 w-full z-40">
        <div className="flex items-center gap-3">
          <div className="mf-logo-mark h-9 w-9">
            <BrainCircuit size={19} />
          </div>
          <span className="text-sm font-black tracking-wide text-white">MEMORYFORGE</span>
        </div>
        <button onClick={() => setIsOpen((value) => !value)} className="text-slate-300 hover:text-white">
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <aside
        className={`mf-sidebar fixed inset-y-0 left-0 z-50 flex h-full w-[340px] shrink-0 flex-col p-6 transition-transform duration-300 md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-10 flex items-center gap-4">
          <div className="mf-logo-mark h-[62px] w-[62px]">
            <BrainCircuit size={30} />
          </div>
          <div>
            <h1 className="text-[22px] font-black leading-none tracking-wide text-white">MEMORYFORGE</h1>
            <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-400">AI Platform</p>
          </div>
        </div>

        <nav className="space-y-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `mf-nav-item ${isActive ? 'mf-nav-item-active' : 'text-slate-400 hover:text-white'}`
                }
              >
                <Icon size={25} strokeWidth={1.65} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto pt-10">
          <div className="mf-security-card">
            <div className="mf-profile-orb">
              {user ? <User size={36} /> : <BrainCircuit size={44} />}
            </div>

            <div className="mt-20 flex h-10 w-[78%] items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-[11px] uppercase tracking-[0.22em] text-slate-500">
              {user ? user.role : ''}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-base text-slate-300">
              {user ? user.email : 'Account Security Status: Locked'}
            </div>

            {user ? (
              <button onClick={handleLogout} className="mf-signin-button mt-8">
                <LogOut size={19} />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/auth');
                }}
                className="mf-signin-button mt-8"
              >
                <Lock size={21} />
                <span>Sign In</span>
              </button>
            )}

            <p className="mt-4 text-center text-sm text-slate-400">Secure your memory forge</p>
          </div>
        </div>
      </aside>

      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden" />}
    </>
  );
}
