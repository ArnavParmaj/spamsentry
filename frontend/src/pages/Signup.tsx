import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

export default function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="asymmetric-grid min-h-screen">
        {/* Left Sidebar - Black Background */}
        <motion.header
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-black text-white p-8 md:p-16 flex flex-col justify-between h-screen sticky top-0"
        >
          <div>
            <div className="flex items-center gap-2 mb-24">
              <span className="material-symbols-outlined text-4xl">shield</span>
              <span className="text-xs font-bold tracking-[0.2em] uppercase">SpamSentry</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[0.9] tracking-tighter uppercase mb-12">
              System
              <br />
              Access
              <br />
              Protocol
            </h1>
          </div>
          <div className="space-y-4">
            <div className="h-px bg-white/20 w-full"></div>
            <div className="flex justify-between items-end">
              <p className="text-[10px] tracking-widest uppercase opacity-60">Version 2.0.4.81</p>
              <p className="text-[10px] tracking-widest uppercase opacity-60">©2024</p>
            </div>
          </div>
        </motion.header>

        {/* Right Form Section */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="p-8 md:p-24 lg:p-32 flex flex-col justify-center"
        >
          <div className="max-w-xl">
            {/* Section Title */}
            <div className="mb-16">
              <h2 className="text-xs font-bold tracking-[0.3em] uppercase mb-4 text-swiss-red">
                01. Identification
              </h2>
              <p className="text-3xl md:text-4xl font-light leading-snug">
                Create your defensive perimeter within the global network.
              </p>
            </div>

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

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                {/* Full Name */}
                <div className="flex flex-col">
                  <label htmlFor="fullname" className="swiss-label mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="border-0 border-b border-black px-0 py-4 focus:ring-0 focus:border-swiss-red transition-colors text-lg bg-transparent"
                    placeholder="E. HAUSER"
                    required
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col">
                  <label htmlFor="email" className="swiss-label mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-0 border-b border-black px-0 py-4 focus:ring-0 focus:border-swiss-red transition-colors text-lg bg-transparent"
                    placeholder="ACCESS@DOMAIN.NET"
                    required
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col">
                  <label htmlFor="password" className="swiss-label mb-1">
                    Security Key
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-0 border-b border-black px-0 py-4 focus:ring-0 focus:border-swiss-red transition-colors text-lg bg-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col">
                  <label htmlFor="confirm-password" className="swiss-label mb-1">
                    Verification
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-0 border-b border-black px-0 py-4 focus:ring-0 focus:border-swiss-red transition-colors text-lg bg-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Submit Button & Status */}
              <div className="pt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-swiss-red text-white px-12 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-black transition-colors"
                >
                  {loading ? 'CREATING ACCOUNT...' : 'INITIALIZE ACCOUNT'}
                </button>
                <div className="flex flex-col items-start">
                  <span className="swiss-label opacity-40 mb-1">Status</span>
                  <Link
                    to="/login"
                    className="text-xs font-medium border-b border-black pb-1 hover:text-swiss-red hover:border-swiss-red transition-all"
                  >
                    Existing member? Sign In
                  </Link>
                </div>
              </div>
            </form>

            {/* Footer */}
            <footer className="mt-32 border-t border-swiss-gray pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <p className="text-[10px] leading-relaxed text-gray-400 uppercase tracking-wider">
                  By proceeding, you authorize the encryption protocol and accept the regulatory terms
                  governing automated defense systems.
                </p>
                <div className="flex gap-4 md:justify-end text-[10px] font-bold uppercase tracking-widest">
                  <a href="#" className="hover:text-swiss-red transition-colors">
                    Legal
                  </a>
                  <a href="#" className="hover:text-swiss-red transition-colors">
                    Privacy
                  </a>
                  <a href="#" className="hover:text-swiss-red transition-colors">
                    Nodes
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
