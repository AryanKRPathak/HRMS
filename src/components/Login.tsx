import React, { useState } from "react";
import { Mail, Lock, ShieldAlert, KeyRound, Loader2, Building2, Flame, Eye, EyeOff } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Ready-to-go quick-test accounts
  const quickAccounts = [
    {
      name: "Arjun Sharma",
      email: "arjun.sharma@enterprise.io",
      role: "Super Admin",
      avatar: "AS"
    },
    {
      name: "Aryan Pathak",
      email: "aryanpathak099@gmail.com",
      role: "Admin",
      avatar: "AP"
    },
    {
      name: "Diana Prince",
      email: "d.prince@enterprise.io",
      role: "HR Head",
      avatar: "DP"
    },
    {
      name: "Fiona Gallagher",
      email: "f.gallagher@enterprise.io",
      role: "HR Associate",
      avatar: "FG"
    },
    {
      name: "Alexander Mercer",
      email: "a.mercer@enterprise.io",
      role: "Employee",
      avatar: "AM"
    }
  ];

  const handleQuickSelect = (accEmail: string) => {
    setEmail(accEmail);
    setPassword("password");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill out all credentials.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to reach server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1C3F] to-[#070b1e] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans" id="jwt-login-viewport">
      <div className="w-full max-w-[450px] z-10 flex flex-col gap-6" id="jwt-login-card-wrapper">
        
        {/* Branding Logo Header matching image */}
        <div className="text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-3.5 transition-transform hover:scale-105 duration-300">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">NexaHR</h1>
          <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider mt-1.5 opacity-90">Enterprise HRMS Platform</p>
        </div>

        {/* Primary Login Card */}
        <div className="bg-[#f4f6f8] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] rounded-2xl p-6 md:p-8 border border-white/5" id="login-card">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Welcome back</h2>
          <p className="text-slate-500 text-[13px] mt-1 mb-6">
            Sign in to your account
          </p>

          {/* Form Error Feedback */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2.5" id="login-error-alert animate-shake">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Access Denied</p>
                <p className="opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 tracking-wide block mb-1.5">
                Email address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nexora.in"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-605 outline-none rounded-lg text-sm text-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 tracking-wide block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-605 outline-none rounded-lg text-sm text-slate-900 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-6 h-10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white/90" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>

          {/* Quick Sandbox Access section styled like details box */}
          <div className="mt-6 pt-5 border-t border-slate-200/80">
            <div className="bg-white/80 border border-slate-200/60 rounded-xl p-4" id="sandbox-credentials-box">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mb-2 px-1">
                Demo Quick-Selection Sandbox
              </span>
              
              <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {quickAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickSelect(acc.email)}
                    className="text-left w-full px-2.5 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg transition-all group flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex gap-2 items-center truncate">
                      <span className="w-5 h-5 shrink-0 rounded bg-blue-50 text-[9px] text-blue-600 flex items-center justify-center font-bold">
                        {acc.avatar}
                      </span>
                      <div className="truncate">
                        <span className="block text-[11px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors truncate">
                          {acc.name}
                        </span>
                        <span className="block text-[9px] text-slate-400 truncate mt-0.5 leading-none">
                          {acc.email}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9.5px] font-bold text-slate-400 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white px-1.5 py-0.5 rounded transition-all shrink-0">
                      {acc.role}
                    </span>
                  </button>
                ))}
              </div>
              
              <div className="mt-2 pl-1">
                <span className="text-[9px] text-slate-400">
                  Click any profile above to auto-fill. Password is <strong className="text-slate-600">password</strong>
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer info matching image layout */}
        <p className="text-center text-[#94a3b8] text-xs font-medium tracking-wide">
          © 2026 NexaHR · Enterprise Edition v2.1
        </p>

      </div>
    </div>
  );
}
