import React from 'react';
import { NavLink } from 'react-router-dom';
import { BrainCircuit, MessageSquare, Database } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 text-white shadow-md shadow-brand-500/20">
              <BrainCircuit size={22} className="animate-pulse" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-lg font-bold tracking-wider text-transparent uppercase">
                MemoryForge
              </span>
              <span className="ml-1.5 rounded-full bg-brand-500/10 px-2 py-0.5 text-2xs font-medium uppercase tracking-widest text-brand-400 border border-brand-500/20">
                AI Engineer
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <MessageSquare size={16} />
              <span>Chat Workspace</span>
            </NavLink>

            <NavLink
              to="/memories"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <Database size={16} />
              <span>Memory Dashboard</span>
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
