import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center p-6 md:p-12 overflow-x-hidden bg-white">
      <div
        className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <main className="w-full max-w-6xl z-10 grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 items-start">
        {/* Left Section - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="neo-block p-10 md:p-16 space-y-8 md:mt-12"
          style={{ transform: 'rotate(-1deg)' }}
        >
          <div className="inline-block border-4 border-black p-4 bg-[#F0FF00]">
            <Shield className="text-6xl font-black block" size={64} />
          </div>

          <div>
            <h1 className="text-6xl md:text-8xl font-black uppercase leading-none tracking-tighter">
              Spam
              <br />
              Sentry
              <br />
              AI
            </h1>
            <p className="mt-6 text-xl font-bold uppercase border-l-8 border-black pl-4">
              Eliminate Noise.
              <br />
              Secure Everything.
            </p>
          </div>

          <div className="pt-8">
            <a
              href="#"
              className="inline-block font-black text-sm uppercase tracking-[0.2em] underline decoration-4 underline-offset-8 hover:bg-[#F0FF00] transition-colors"
            >
              System Status: Operational
            </a>
          </div>
        </motion.div>

        {/* Right Section - Login Form */}
        <div className="space-y-8 md:mt-24">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="neo-block p-8 md:p-12 bg-white"
            style={{ transform: 'rotate(1deg)' }}
          >
            <h2 className="text-3xl font-black uppercase mb-10 tracking-tighter italic">
              Access Portal
            </h2>

            {error && (
              <div className="mb-6 p-4 border-3 border-black bg-red-100 text-red-800 font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-black uppercase tracking-widest"
                >
                  Identifier / Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="neo-input"
                  placeholder="USER@ORG.COM"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-black uppercase tracking-widest"
                  >
                    Security Code
                  </label>
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neo-input"
                  placeholder="********"
                  required
                />
                <div className="text-right">
                  <a
                    href="#"
                    className="text-xs font-bold uppercase underline decoration-2 underline-offset-4 hover:bg-[#F0FF00]"
                  >
                    Lost Code?
                  </a>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="neo-btn w-full"
                  disabled={loading}
                >
                  {loading ? 'Authorizing...' : 'Authorize Access'}
                </button>
              </div>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t-4 border-black" />
                <span className="flex-shrink mx-4 font-black uppercase text-xs">
                  Auth Layer 2
                </span>
                <div className="flex-grow border-t-4 border-black" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-4 p-4 border-3 border-black font-bold uppercase text-sm hover:bg-black hover:text-white transition-all shadow-brutal-sm active:shadow-none translate-y-0 active:translate-y-1 bg-white"
              >
                <span className="material-symbols-outlined">key</span>
                <span>Google Identity</span>
              </button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="neo-block bg-black text-white p-6"
            style={{ transform: 'rotate(-0.5deg)' }}
          >
            <p className="text-center font-bold uppercase tracking-widest text-sm">
              New Recruit?{' '}
              <Link
                to="/signup"
                className="text-[#F0FF00] hover:underline decoration-[#F0FF00] underline-offset-4"
              >
                Enlist Now
              </Link>
            </p>
          </motion.div>
        </div>
      </main>

      <div className="fixed bottom-8 left-8 z-20 hidden md:block">
        <div className="border-3 border-black bg-white px-4 py-2 font-black uppercase text-[10px] tracking-[0.3em] flex items-center gap-2 shadow-brutal-sm">
          <Lock size={12} />
          Encrypted End-To-End
        </div>
      </div>
    </div>
  );
}
