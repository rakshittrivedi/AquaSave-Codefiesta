import React, { useState } from 'react';
import { setToken } from '../lib/api';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('aquasave2026!');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid operator credentials');
      }

      const data = await res.json();
      setToken(data.token, data.user);
      onLoginSuccess();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F6FC] flex flex-col justify-center items-center px-4 py-12 selection:bg-sky-900 selection:text-white">
      <div className="w-full max-w-md space-y-8 bg-[#161B22] p-8 rounded-2xl border border-[#30363D] shadow-2xl">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-xl bg-sky-950 border border-sky-500/50 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-950/40">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              AquaSave
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60">
                SCADA
              </span>
            </h1>
            <p className="text-xs text-[#8B949E] mt-1 font-mono">
              Authorized Telemetry & Facility Control Access
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2.5 animate-in fade-in"
          >
            <svg
              className="w-4 h-4 text-rose-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-mono font-medium text-[#8B949E] uppercase tracking-wider mb-1.5"
            >
              Operator Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0D1117] border border-[#30363D] text-white text-sm font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              placeholder="e.g. admin"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-mono font-medium text-[#8B949E] uppercase tracking-wider mb-1.5"
            >
              Security Passcode
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0D1117] border border-[#30363D] text-white text-sm font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono font-semibold text-xs uppercase tracking-wider transition-all duration-150 shadow-md shadow-sky-950/50 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating…</span>
              </>
            ) : (
              <span>Sign In to SCADA Console</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="p-3 rounded-lg bg-[#0D1117] border border-[#21262D] text-[11px] font-mono text-[#8B949E] text-center">
          <span className="text-slate-300 font-semibold block mb-0.5">
            Default System Credentials
          </span>
          <span>
            User: <code className="text-sky-400">admin</code> &bull; Password:{' '}
            <code className="text-sky-400">aquasave2026!</code>
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
