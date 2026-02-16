import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabaseClient";

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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/login");
      } else {
        fetchHistory(user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchHistory = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("history").delete().eq("id", id);
      if (error) throw error;
      setHistory(history.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
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
                  <span className="material-symbols-outlined text-[16px] text-white">
                    shield
                  </span>
                </div>
                <span className="font-bold text-sm tracking-widest uppercase">
                  Spamsentry
                </span>
              </div>
              <div className="hidden md:flex gap-8 text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-500">
                <Link
                  to="/scanner"
                  className="hover:text-black transition-colors"
                >
                  Scanner
                </Link>
                <Link to="/dashboard" className="text-black">
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
          className="mb-24"
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="status-dot bg-black"></span>
            <span className="swiss-label text-zinc-500">Archive Interface</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-medium tracking-tighter leading-[0.9] mb-12">
            Scan History
          </h1>
          <div className="flex items-center gap-12 pt-12 border-t border-swiss-border">
            <div>
              <p className="swiss-label text-zinc-400 mb-2">Total Scans</p>
              <p className="text-2xl font-medium">{history.length}</p>
            </div>
            <div>
              <p className="swiss-label text-zinc-400 mb-2">Threats Detected</p>
              <p className="text-2xl font-medium text-swiss-red">
                {history.filter((item) => item.is_spam).length}
              </p>
            </div>
          </div>
        </motion.header>

        {/* Content */}
        {loading ? (
          <div className="text-center p-12">
            <p className="text-xl font-medium">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center p-16 border border-swiss-border bg-white">
            <p className="text-2xl font-medium mb-4">No scans found</p>
            <p className="text-zinc-500 mb-8">
              Start analyzing messages to build your history.
            </p>
            <Link
              to="/scanner"
              className="inline-block px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-swiss-red transition-colors"
            >
              Go to Scanner
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`group border-l-2 pl-8 pb-12 ${
                  item.is_spam ? "border-swiss-red" : "border-zinc-200"
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <span
                      className={`swiss-label px-2 py-1 ${
                        item.is_spam
                          ? "bg-swiss-red text-white"
                          : "border border-zinc-200"
                      }`}
                    >
                      {item.is_spam ? "High Threat" : "Verified"}
                    </span>
                    <span className="text-xs font-medium text-zinc-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span
                    className={`text-2xl font-light ${item.is_spam ? "text-swiss-red" : ""}`}
                  >
                    {item.is_spam
                      ? "Critical"
                      : `${(item.confidence * 100).toFixed(0)}%`}
                  </span>
                </div>

                <p
                  className={`text-lg mb-8 ${
                    item.is_spam
                      ? "font-medium text-black"
                      : "font-light text-zinc-500 italic"
                  }`}
                >
                  &quot;{item.text.substring(0, 120)}
                  {item.text.length > 120 ? "..." : ""}&quot;
                </p>

                <div className="flex items-center justify-between">
                  <div
                    className={`flex items-center gap-2 swiss-label ${
                      item.is_spam ? "text-swiss-red" : "text-black"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {item.is_spam ? "warning" : "check"}
                    </span>
                    {item.is_spam
                      ? "Malicious content identified"
                      : "Zero threat signatures detected"}
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 hover:text-swiss-red transition-colors"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-base">
                      delete
                    </span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
