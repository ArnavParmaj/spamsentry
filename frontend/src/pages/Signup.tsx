import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
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
        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          setError('This email is already registered. Please login instead.');
        } else {
          navigate('/login');
          // In production, you might want to show a message about email confirmation
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-0 md:p-12"
      style={{
        backgroundColor: '#FDFF00',
        backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      <main className="w-full max-w-6xl flex flex-col md:flex-row border-4 border-black bg-white shadow-neo overflow-hidden">
        {/* Left Section - Branding */}
        <section className="md:w-1/3 border-b-4 md:border-b-0 md:border-r-4 border-black flex flex-col justify-between bg-[#0051FF] text-white">
          <div className="p-8 border-b-4 border-black bg-white text-black">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2 border-black bg-[#FDFF00] flex items-center justify-center text-black shadow-neo-sm">
                <Shield size={24} />
              </div>
              <span className="font-display text-xl font-extrabold tracking-tighter">
                SPAMSENTRY
              </span>
            </div>
          </div>

          <div className="p-8 flex-grow flex items-end">
            <h1 className="font-display text-5xl md:text-6xl font-black leading-none uppercase tracking-tighter">
              DEFEAT
              <br />
              THE
              <br />
              NOISE.
            </h1>
          </div>

          <div className="p-8 bg-[#FF00F5] text-black border-t-4 border-black">
            <p className="font-bold text-lg leading-tight uppercase">
              AI-Powered Threat Neutralization
            </p>
            <p className="text-sm mt-2 opacity-90">SECURED_VERSION_2.04</p>
          </div>
        </section>

        {/* Right Section - Signup Form */}
        <section className="md:w-2/3 flex flex-col bg-white">
          <div className="flex-grow p-0">
            <div className="grid grid-cols-1">
              <div className="border-b-4 border-black p-8 bg-[#FDFF00]">
                <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight">
                  Access Control: Sign Up
                </h2>
              </div>

              {error && (
                <div className="border-b-4 border-black p-4 bg-red-100 text-red-800 font-bold">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSignup}
                className="grid grid-cols-1 md:grid-cols-2"
              >
                <div className="border-b-4 md:border-r-4 border-black">
                  <label
                    htmlFor="fullname"
                    className="block p-4 border-b-4 border-black font-display text-xs font-bold uppercase tracking-widest bg-white"
                  >
                    01. Full Name
                  </label>
                  <input
                    type="text"
                    id="fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-6 text-xl font-bold border-none focus:ring-0 placeholder:text-slate-300 bg-white outline-none"
                    placeholder="FULL NAME"
                    required
                  />
                </div>

                <div className="border-b-4 border-black">
                  <label
                    htmlFor="email"
                    className="block p-4 border-b-4 border-black font-display text-xs font-bold uppercase tracking-widest bg-white"
                  >
                    02. Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-6 text-xl font-bold border-none focus:ring-0 placeholder:text-slate-300 bg-white outline-none"
                    placeholder="EMAIL@DOMAIN.COM"
                    required
                  />
                </div>

                <div className="border-b-4 md:border-r-4 border-black">
                  <label
                    htmlFor="password"
                    className="block p-4 border-b-4 border-black font-display text-xs font-bold uppercase tracking-widest bg-white"
                  >
                    03. Security Key
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-6 text-xl font-bold border-none focus:ring-0 placeholder:text-slate-300 bg-white outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="border-b-4 border-black">
                  <label
                    htmlFor="confirm-password"
                    className="block p-4 border-b-4 border-black font-display text-xs font-bold uppercase tracking-widest bg-white"
                  >
                    04. Re-Verify
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-6 text-xl font-bold border-none focus:ring-0 placeholder:text-slate-300 bg-white outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="md:col-span-2 p-8 bg-black flex items-center justify-between">
                  <div className="hidden md:block">
                    <p className="text-white text-xs font-bold uppercase tracking-widest opacity-60">
                      Ready for deployment?
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto px-12 py-6 bg-[#FDFF00] border-4 border-black text-black font-display text-2xl font-black uppercase shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-active transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border-t-4 border-black">
            <div className="p-8 border-b-4 md:border-b-0 md:border-r-4 border-black bg-white">
              <p className="text-sm font-bold uppercase">
                Already have an account?
              </p>
              <Link
                to="/login"
                className="font-display text-xl font-black text-[#0051FF] underline decoration-4 underline-offset-4 hover:text-[#FF00F5] transition-colors"
              >
                LOG IN NOW
              </Link>
            </div>
            <div className="p-8 bg-slate-50 flex items-center">
              <p className="text-[10px] font-bold uppercase leading-tight tracking-wider text-slate-500">
                By signing up, you agree to our{' '}
                <a href="#" className="underline">
                  Terms of Service
                </a>{' '}
                &{' '}
                <a href="#" className="underline">
                  Privacy Policy
                </a>
                . Data protection is guaranteed by SpamSentry protocol.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Decorative Elements */}
      <div className="fixed top-8 right-8 hidden xl:block w-32 h-32 border-4 border-black bg-[#FF00F5] -z-10 rotate-12" />
      <div className="fixed bottom-12 left-12 hidden xl:block w-48 h-12 border-4 border-black bg-[#0051FF] -z-10 -rotate-3" />
    </div>
  );
}
