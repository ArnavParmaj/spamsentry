import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        navigate('/scanner');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 md:p-24 bg-white selection:bg-black selection:text-white">
      {/* Header */}
      <header className="fixed top-12 left-0 right-0 px-8 md:px-24 flex justify-between items-baseline z-50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-swiss-red"></div>
          <span className="font-bold text-lg tracking-tighter">SPAMSENTRY AI</span>
        </div>
        <nav className="hidden md:block">
          <span className="nav-link">System Status: 01</span>
        </nav>
      </header>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] py-24"
      >
        {/* Section Title */}
        <section className="space-y-4 mb-12">
          <span className="swiss-label text-gray-400">Identity Layer</span>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-[0.9]">
            Access the
            <br />
            Secure Portal.
          </h1>
        </section>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 p-4 border border-swiss-red bg-swiss-red/5 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Login Form */}
        <section>
          <form onSubmit={handleLogin} className="space-y-12">
            <div className="space-y-8">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="swiss-label">
                  User Identification
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="swiss-input"
                  placeholder="email@domain.com"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="swiss-label">
                  Security Key
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="swiss-input"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col gap-6">
              <button
                type="submit"
                disabled={loading}
                className="swiss-btn flex items-center justify-between group"
              >
                <span>{loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>

              {/* Links */}
              <div className="flex justify-between items-center">
                <Link to="/forgot-password" className="swiss-label hover:text-swiss-red transition-colors">
                  Forgot Credentials
                </Link>
                <span className="h-px w-8 bg-gray-200"></span>
                <Link to="/signup" className="swiss-label hover:text-swiss-red transition-colors">
                  Register Account
                </Link>
              </div>
            </div>

            {/* Google SSO */}
            <div className="pt-8 border-t border-gray-100">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 border border-black text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
              >
                <span className="material-symbols-outlined text-base">passkey</span>
                Single Sign-On
              </button>
            </div>
          </form>
        </section>
      </motion.main>

      {/* Footer */}
      <footer className="fixed bottom-12 left-0 right-0 px-8 md:px-24 flex justify-between items-end pointer-events-none">
        <div className="text-[10px] font-medium leading-relaxed max-w-[200px] text-gray-400">
          STRATEGIC INTELLIGENCE
          <br />
          REF: SS-2024-AI-V1
          <br />
          ENCRYPTED: YES
        </div>
        <div className="flex items-center gap-4 pointer-events-auto">
          <span className="text-[10px] font-bold uppercase tracking-widest text-swiss-red">© 2024</span>
        </div>
      </footer>

      {/* Decorative Line */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 h-48 w-px bg-gray-100 hidden lg:block">
        <div className="absolute top-0 left-0 w-1 h-4 bg-swiss-red -translate-x-1/2"></div>
      </div>
    </div>
  );
}
