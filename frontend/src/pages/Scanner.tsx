import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Bell, Radar, AlertTriangle, CheckCircle } from 'lucide-react';
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
      // For demo purposes, show a mock result if API is not available
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

  const handleClear = () => {
    setMessage('');
    setResult(null);
  };

  return (
    <div className="antialiased min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b-[6px] border-black">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4 border-r-[6px] border-black h-20 pr-8">
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
                <Shield size={32} />
              </div>
              <span className="font-bold text-2xl font-display uppercase tracking-tighter">
                SPAMSENTRY
              </span>
            </div>

            <div className="hidden md:flex h-20">
              <Link
                to="/scanner"
                className="flex items-center px-8 border-l-[6px] border-black bg-[#FCFF00] font-bold hover:invert transition-all font-display uppercase"
              >
                SCANNER
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center px-8 border-l-[6px] border-black hover:bg-black hover:text-white transition-all font-display uppercase"
              >
                HISTORY
              </Link>
            </div>

            <div className="flex items-center gap-0 h-20">
              <button className="h-20 w-20 border-l-[6px] border-black flex items-center justify-center hover:bg-[#FCFF00] transition-colors">
                <Bell size={24} />
              </button>
              <button
                onClick={handleLogout}
                className="h-20 px-6 border-l-[6px] border-black flex items-center justify-center hover:bg-[#FF0000] hover:text-white transition-colors font-display uppercase font-bold text-sm"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative pt-32 pb-24 px-6 max-w-screen-2xl mx-auto">
        <div className="mb-16 border-l-[6px] border-black pl-8">
          <h1 className="text-6xl md:text-8xl font-bold leading-none mb-6 font-display uppercase tracking-tighter">
            MESSAGE SCANNER:
            <br />
            IMMEDIATE THREAT DETECTION.
          </h1>
          <p className="text-xl max-w-2xl font-bold uppercase bg-black text-white p-2 inline-block font-display">
            SYSTEM STATUS: OPERATIONAL // AI-LAYER: ACTIVE
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Scanner Input */}
          <div className="lg:col-span-8">
            <div className="bg-white border-[6px] border-black shadow-brutal">
              <div className="bg-black text-white p-4 font-display font-bold flex justify-between items-center uppercase">
                <span>INPUT_BUFFER_01</span>
                <span className="text-[#FCFF00]">
                  {result ? 'ANALYSIS_COMPLETE' : 'READY_FOR_ANALYSIS'}
                </span>
              </div>

              <div className="relative">
                <textarea
                  className="block w-full border-0 p-8 text-black placeholder:text-zinc-400 focus:ring-0 text-xl font-mono min-h-[400px] resize-none uppercase outline-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="PASTE SUSPICIOUS TEXT HERE..."
                  maxLength={5000}
                />
                <div className="absolute bottom-6 right-6 flex items-center gap-4">
                  <span className="font-bold bg-black text-white px-3 py-1 text-sm font-mono">
                    CHAR_COUNT: {message.length} / 5000
                  </span>
                  <button
                    onClick={handleClear}
                    className="bg-[#FF0000] text-white p-2 border-2 border-black shadow-brutal-sm active:translate-y-1 transition-all"
                    title="WIPE BUFFER"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row border-t-[6px] border-black">
                <div className="flex-1 p-6 flex items-center gap-4 border-b-[6px] md:border-b-0 md:border-r-[6px] border-black bg-zinc-100">
                  <Radar size={36} />
                  <span className="font-bold uppercase leading-tight font-display">
                    SCANNER PARAMETERS:
                    <br />
                    PHISHING / MALWARE / SOCIAL_ENG
                  </span>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !message.trim()}
                  className="bg-[#FCFF00] p-8 text-2xl font-bold shadow-brutal-active hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-display uppercase tracking-tighter"
                >
                  {loading ? 'ANALYZING...' : 'EXECUTE ANALYSIS_'}
                </button>
              </div>

              {/* Result Display */}
              {result && (
                <div
                  className={`border-t-[6px] border-black p-6 ${
                    result.is_spam
                      ? 'bg-[#FF0000]/10'
                      : 'bg-[#00FF41]/10'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {result.is_spam ? (
                      <AlertTriangle size={32} className="text-[#FF0000]" />
                    ) : (
                      <CheckCircle size={32} className="text-[#00FF41]" />
                    )}
                    <h3 className="text-2xl font-bold font-display uppercase">
                      {result.is_spam ? 'THREAT DETECTED' : 'CLEAN'}
                    </h3>
                  </div>
                  <p className="font-mono text-lg mb-2">
                    <strong>Result:</strong> {result.prediction}
                  </p>
                  <p className="font-mono text-lg">
                    <strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="border-[6px] border-black p-6 bg-white shadow-brutal">
              <h2 className="text-2xl font-bold mb-4 border-b-[6px] border-black pb-2 font-display uppercase">
                SYSTEM_LOGS
              </h2>
              <div className="space-y-4 font-mono text-sm">
                <div className="flex gap-2">
                  <span className="text-zinc-400">[{new Date().toLocaleTimeString()}]</span>
                  <span>KERNEL_LOADED_OK</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-zinc-400">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-[#00FF41]">SECURITY_DB_UPDATED</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-zinc-400">[{new Date().toLocaleTimeString()}]</span>
                  <span>{loading ? 'ANALYZING_INPUT...' : 'WAITING_FOR_USER_INPUT...'}</span>
                </div>
              </div>
            </div>

            <div className="border-[6px] border-black p-6 bg-black text-white shadow-brutal">
              <h2 className="text-2xl font-bold mb-4 text-[#FCFF00] font-display uppercase">
                SECURITY_ALERT
              </h2>
              <p className="mb-4 font-mono">
                98.2% OF PHISHING ATTEMPTS USE DECEPTIVE LINKS.
              </p>
              <div className="h-2 bg-zinc-800 w-full">
                <div className="h-full bg-[#FCFF00] w-[98.2%]" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
