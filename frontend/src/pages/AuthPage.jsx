import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/api';
import { Shield, Sparkles, Key, Mail, User, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import NetworkAnimation from '../components/NetworkAnimation'; // ← ADD THIS

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        if (!email || !password) {
          setError('Please fill in all credentials.');
          setLoading(false);
          return;
        }
        const data = await loginUser(email, password);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setSuccess('Authentication successful! Loading workspace...');
        setTimeout(() => {
          navigate(data.user.role === 'ADMIN' ? '/admin' : '/');
          window.location.reload();
        }, 1200);
      } else {
        if (!name || !email || !password) {
          setError('Please complete all form fields.');
          setLoading(false);
          return;
        }
        await registerUser(name, email, password, role);
        setSuccess('Registration successful! You can now log in.');
        setTimeout(() => {
          setIsLogin(true);
          setPassword('');
          setError('');
          setSuccess('');
        }, 1500);
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Authentication failed. Please verify credentials.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Network animation background */}
      <NetworkAnimation height="100vh" nodeCount={50} speed={1.5} distance={120} glow={1} />

      {/* Soft vignette so the login card stays legible over the animation */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/70 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_15%,rgba(11,15,25,0.75)_75%)] pointer-events-none" />

      {/* Card container */}
      <div className="w-full max-w-md border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 p-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4 flex h-14 w-14 items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-brand-500/15 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <div className="relative z-10 h-12 w-12 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-[0_0_30px_-4px_rgba(92,120,255,0.7)]">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            MemoryForge AI Platform
          </h2>
          <p className="text-slate-400 text-sm mt-1 text-center">
            {isLogin ? 'Sign in to access your memory-aware agent workspace' : 'Register a new engineering account'}
          </p>
        </div>

        {/* Form Notifications */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm flex items-start gap-3">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="email"
                placeholder="developer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-10 pr-12 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-600 to-brand-400 hover:from-brand-500 hover:to-brand-300 active:scale-[0.98] py-3.5 px-4 rounded-xl text-sm font-semibold text-white shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-70"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {isLogin ? 'Sign In to Platform' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-sm text-slate-400">
          {isLogin ? (
            <p>
              New here?{' '}
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                  setSuccess('');
                }}
                className="text-brand-400 font-semibold hover:text-brand-300 hover:underline transition-colors"
              >
                Create a developer account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                  setSuccess('');
                }}
                className="text-brand-400 font-semibold hover:text-brand-300 hover:underline transition-colors"
              >
                Sign in to workspace
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}