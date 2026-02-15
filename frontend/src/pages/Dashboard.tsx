import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Bell, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface HistoryItem {
  id: string;
  text: string;
  result: string;
  confidence: number;
  is_spam: boolean;
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate('/login');
      } else {
        setUser(user);
        fetchHistory(user.id);
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

  const fetchHistory = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('history').delete().eq('id', id);
      if (error) throw error;
      setHistory(history.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
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
                className="flex items-center px-8 border-l-[6px] border-black hover:bg-black hover:text-white transition-all font-display uppercase"
              >
                SCANNER
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center px-8 border-l-[6px] border-black bg-[#FCFF00] font-bold hover:invert transition-all font-display uppercase"
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
            SCAN HISTORY:
            <br />
            ARCHIVED ANALYSES.
          </h1>
          <p className="text-xl max-w-2xl font-bold uppercase bg-black text-white p-2 inline-block font-display">
            TOTAL SCANS: {history.length}
          </p>
        </div>

        {loading ? (
          <div className="text-center p-12">
            <p className="text-2xl font-bold font-display uppercase">LOADING...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center p-12 border-[6px] border-black bg-white shadow-brutal">
            <p className="text-2xl font-bold font-display uppercase mb-4">
              NO SCANS FOUND
            </p>
            <p className="font-mono">Start analyzing messages to build your history.</p>
            <Link
              to="/scanner"
              className="inline-block mt-6 px-8 py-4 bg-[#FCFF00] border-3 border-black font-bold uppercase shadow-brutal-sm hover:shadow-brutal transition-all"
            >
              GO TO SCANNER
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {history.map((item) => (
              <div
                key={item.id}
                className="border-[6px] border-black bg-white shadow-brutal-sm overflow-hidden"
              >
                <div
                  className={`p-4 border-b-[6px] border-black flex justify-between items-center ${
                    item.is_spam
                      ? 'bg-[#FF0000] text-white'
                      : 'bg-[#00FF41] text-black'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.is_spam ? (
                      <AlertTriangle size={24} />
                    ) : (
                      <CheckCircle size={24} />
                    )}
                    <h3 className="font-bold text-xl font-display uppercase">
                      {item.is_spam ? 'THREAT_DETECTED' : 'CLEAN'}
                    </h3>
                  </div>
                  <span
                    className={`font-bold border-2 px-2 ${
                      item.is_spam
                        ? 'border-white bg-black text-white'
                        : 'border-black bg-white text-black'
                    }`}
                  >
                    {item.is_spam ? 'HIGH_RISK' : `TRUST: ${(item.confidence * 100).toFixed(0)}%`}
                  </span>
                </div>

                <div className="p-6">
                  <div
                    className={`p-4 border-2 mb-4 font-mono ${
                      item.is_spam
                        ? 'bg-[#FF0000]/10 border-[#FF0000]'
                        : 'bg-zinc-100 border-black'
                    }`}
                  >
                    &quot;{item.text.substring(0, 150)}
                    {item.text.length > 150 ? '...' : ''}&quot;
                  </div>

                  <div className="flex items-center justify-between">
                    <div
                      className={`flex items-center gap-2 font-bold text-sm uppercase ${
                        item.is_spam ? 'text-[#FF0000]' : 'text-black'
                      }`}
                    >
                      {item.is_spam ? (
                        <span className="material-symbols-outlined text-sm">dangerous</span>
                      ) : (
                        <span className="material-symbols-outlined text-sm">verified</span>
                      )}
                      {item.result}
                    </div>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 border-2 border-black hover:bg-[#FF0000] hover:text-white transition-all"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p className="text-xs text-zinc-500 mt-4 font-mono">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
