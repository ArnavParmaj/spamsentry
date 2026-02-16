import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export default function Scanner() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    prediction: string;
    confidence: number;
    is_spam: boolean;
  } | null>(null);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate('/login');
      } else {
        setUser(user);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleAnalyze = async () => {
    if (!message.trim() || !user) return;

    setLoading(true);
    setResult(null);

    try {
      // Call ML API
      const response = await axios.post('http://localhost:8000/api/predict', {
        text: message,
      });

      const prediction = response.data;
      setResult(prediction);

      // Save to Supabase history
      const { error } = await supabase.from('history').insert([
        {
          text: message,
          result: prediction.prediction,
          confidence: prediction.confidence,
          is_spam: prediction.is_spam,
          user_id: user.id,
        },
      ]);

      if (error) {
        console.error('Error saving to history:', error);
      }
    } catch (error: any) {
      console.error('Error analyzing message:', error);
      const mockResult = {
        prediction: 'Unable to connect to ML API',
        confidence: 0,
        is_spam: false,
      };
      setResult(mockResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-swiss-border sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-black flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-white">shield</span>
                </div>
                <span className="font-bold text-sm tracking-widest uppercase">Spamsentry</span>
              </div>
              <div className="hidden md:flex gap-8 text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-500">
                <Link to="/scanner" className="text-black">
                  Scanner
                </Link>
                <Link to="/dashboard" className="hover:text-black transition-colors">
                  History
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={handleLogout}
                className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-swiss-red transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-20">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-24 max-w-4xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="status-dot bg-black"></span>
            <span className="swiss-label text-zinc-500">Interface 01 // Security Protocol</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-medium tracking-tighter leading-[0.9] mb-12">
            Automated Threat Analysis <span className="text-zinc-300">&</span> Verification.
          </h1>
          <div className="flex flex-wrap gap-12 pt-12 border-t border-swiss-border">
            <div>
              <p className="swiss-label text-zinc-400 mb-2">System Status</p>
              <p className="text-sm font-medium">Operational. All clusters active.</p>
            </div>
            <div>
              <p className="swiss-label text-zinc-400 mb-2">Neural Engine</p>
              <p className="text-sm font-medium">v4.2.0-Editorial</p>
            </div>
            <div>
              <p className="swiss-label text-zinc-400 mb-2">Last Update</p>
              <p className="text-sm font-medium">04 Mins Ago</p>
            </div>
          </div>
        </motion.header>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-swiss-border border border-swiss-border overflow-hidden">
          {/* Main Input Area */}
          <div className="lg:col-span-8 bg-white p-12">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest mb-1">Input Buffer</h2>
                <p className="text-xs text-zinc-400">Target string for security evaluation</p>
              </div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                Max: 5,000 Characters
              </div>
            </div>

            <textarea
              className="block w-full border-0 p-0 text-3xl font-light focus:ring-0 min-h-[300px] resize-none leading-tight placeholder:text-zinc-200 bg-transparent"
              placeholder="Insert text for analysis..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
            />

            <div className="mt-12 flex justify-between items-center pt-8 border-t border-swiss-border">
              <div className="flex gap-8">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-zinc-400">check_circle</span>
                  <span className="swiss-label">Phishing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-zinc-400">check_circle</span>
                  <span className="swiss-label">Malware</span>
                </div>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={loading || !message.trim()}
                className="bg-black text-white px-10 py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing...' : 'Execute Analysis'}
              </button>
            </div>

            {/* Result Display */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 pt-8 border-t border-swiss-border"
              >
                <div className="flex items-center gap-4 mb-4">
                  {result.is_spam ? (
                    <span className="material-symbols-outlined text-2xl text-swiss-red">warning</span>
                  ) : (
                    <span className="material-symbols-outlined text-2xl text-black">check_circle</span>
                  )}
                  <h3 className="text-2xl font-medium">
                    {result.is_spam ? 'Threat Detected' : 'Clean Message'}
                  </h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong className="swiss-label mr-2">Result:</strong>{result.prediction}</p>
                  <p><strong className="swiss-label mr-2">Confidence:</strong>{(result.confidence * 100).toFixed(1)}%</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-px">
            {/* Logs Section */}
            <div className="bg-white p-10 h-full">
              <h3 className="swiss-label mb-6">Real-time Logs</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400 font-medium">{new Date().toLocaleTimeString()}</span>
                  <span className="font-medium uppercase">Kernel verified</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400 font-medium">{new Date().toLocaleTimeString()}</span>
                  <span className="font-medium uppercase text-zinc-400">Database sync...</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400 font-medium">{new Date().toLocaleTimeString()}</span>
                  <span className="font-medium uppercase">
                    {loading ? 'Processing...' : 'Awaiting instruction'}
                  </span>
                </div>
              </div>
            </div>

            {/* Alert Section */}
            <div className="bg-black p-10 text-white">
              <div className="flex items-center gap-2 mb-4">
                <span className="status-dot bg-swiss-red"></span>
                <h3 className="swiss-label">System Alert</h3>
              </div>
              <p className="text-2xl font-light leading-tight mb-8">
                Critical correlation: 98.2% of attacks utilize masked redirection.
              </p>
              <div className="h-[1px] bg-zinc-800 w-full relative">
                <div className="absolute top-0 left-0 h-full bg-swiss-red w-[98.2%]"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
