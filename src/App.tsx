import React, { useState } from "react";
import { Loader2, AlertCircle, CreditCard, Lock, CheckCircle2, RefreshCcw } from "lucide-react";

export default function App() {
  const [cardNumber, setCardNumber] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Construct exact GET URL
      const url = new URL(window.location.origin + "/api/check-balance");
      url.searchParams.append("card", cardNumber);
      url.searchParams.append("pin", pin);

      const response = await fetch(url.toString(), {
        method: "GET",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch balance");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
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
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl relative">
        <h1 className="text-3xl font-semibold mb-2">Check Balance</h1>
        <p className="text-sm text-gray-400 mb-8">Secure Wrapper API via Playwright</p>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <CreditCard className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                placeholder="Card Number"
                disabled={loading}
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                placeholder="PIN"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !cardNumber || !pin}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl py-3.5 font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Checking...</> : "Check Balance"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h2 className="text-sm font-medium text-gray-400 uppercase">Available Balance</h2>
            <p className="text-5xl font-light text-white flex items-baseline justify-center gap-1">
              <span className="text-2xl text-gray-500">₹</span>{result.balance}
            </p>
            <p className="text-sm font-medium text-emerald-400">{result.status}</p>
            
            <button 
              onClick={handleReset} 
              className="mx-auto flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors py-2"
            >
              <RefreshCcw className="w-4 h-4" /> Check Another Card
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
