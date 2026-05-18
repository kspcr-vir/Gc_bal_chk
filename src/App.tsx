import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CreditCard, Lock, Loader2, CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";

export default function App() {
  const [cardNumber, setCardNumber] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    balance?: string;
    status?: string;
    rawText?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // In development/Docker, this hits the Express backend directly on the same domain
      const response = await fetch("/api/balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardNumber, pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch balance");
      }

      if (data.extractedInfo?.alerts?.length > 0) {
        // usually alerts contain our errors like "Invalid card"
        setError(data.extractedInfo.alerts.join(", "));
      } else {
        // Attempt to parse out basic data
        const text = data.rawText || "";
        const match = text.match(/balance.*?([\d,]+)/i) || 
                      data.extractedInfo?.balances?.[0]?.match(/([\d,]+)/);
                      
        if (match) {
          setResult({
            balance: match[1],
            status: "Active",
            rawText: data.rawText,
          });
        } else if (text.trim()) {
           setResult({
            balance: "Unknown",
            status: "Needs review",
            rawText: text.substring(0, 500)
          });
        } else {
           setError("Unable to process the response. Please try again.");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setCardNumber("");
    setPin("");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4 selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0A0A0A] to-[#0A0A0A] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle gradient glow inside card */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold tracking-tight mb-2 text-white/90">
              Check Balance
            </h1>
            <p className="text-sm text-gray-400">
              Securely check your Woohoo McD India gift card balance.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!result ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                      placeholder="Card Number (14-19 digits)"
                      minLength={14}
                      maxLength={19}
                      pattern="\d*"
                      disabled={loading}
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                      type="password"
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono tracking-[0.2em]"
                      placeholder="PIN (4-6 digits)"
                      minLength={4}
                      maxLength={6}
                      pattern="\d*"
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 flex items-start gap-2"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading || !cardNumber || !pin}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3.5 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Checking securely...
                    </>
                  ) : (
                    "Check Balance"
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                  
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    <h2 className="text-sm font-medium text-gray-400 uppercase tracking-widest">Available Balance</h2>
                    <p className="text-5xl font-light text-white tracking-tight flex items-baseline gap-1">
                      <span className="text-2xl text-gray-500">₹</span>
                      {result.balance !== "Unknown" ? result.balance : "--"}
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
                      <p className="text-sm font-medium text-emerald-400">{result.status || "Active"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Card</p>
                      <p className="text-sm font-medium font-mono text-white/80">•••• {cardNumber.slice(-4)}</p>
                    </div>
                  </div>
                </div>

                {result.balance === "Unknown" && (
                   <p className="text-xs text-amber-500/80 bg-amber-500/10 p-2 rounded w-full line-clamp-3 text-left">
                     Raw Output: {result.rawText}
                   </p>
                )}

                <button
                  onClick={handleReset}
                  className="mx-auto flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/5"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Check Another Card
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <p className="text-center text-xs text-gray-500 mt-6 flex flex-col gap-1 items-center">
          <span>Uses secure browser automation.</span>
          <span>We do not store your card details.</span>
        </p>
      </motion.div>
    </div>
  );
}
