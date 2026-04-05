import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Pill, User, Lock, ArrowRight, Activity, ShieldCheck, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.login(formData);
      const { token, role } = response.data;
      login({ token, role, username: formData.username });
      
      if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/biller/dashboard');
      }
    } catch (err) {
      setError('Incorrect Password or User');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/20 blur-[130px] rounded-full -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200/20 blur-[130px] rounded-full -ml-48 -mb-48" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-3xl p-10 relative z-10 overflow-hidden">
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200 mb-8 group transition-all transform hover:scale-110 p-2 overflow-hidden">
              <img src={logo} className="w-full h-full object-contain" alt="PharmTech Logo" />
            </div>
            <h1 className="font-sans text-4xl font-black text-slate-800 tracking-tighter">Pharm<span className="text-green-600">Tech</span></h1>
            <p className="text-slate-500 mt-2 font-medium text-sm">Pharmacy Management & Billing</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.4 }}
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-red-600 text-xs font-bold uppercase tracking-wider">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter your username"
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all text-sm font-medium"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all text-sm font-medium"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
              <div className="relative w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-green-100 hover:shadow-green-200 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-tight">Secured Access</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 justify-end">
              <Activity className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-tight">System v1.0</span>
            </div>
          </div>
        </div>

        {/* Demo Credentials Hint */}
        <p className="text-center text-slate-400 text-sm font-medium mt-10 max-w-xs mx-auto">
          Authorized personnel only. Access strictly monitored and audited.
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
