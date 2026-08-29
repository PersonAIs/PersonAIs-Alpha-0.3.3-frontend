"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// Initialize your real Supabase client here
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // Safely capture the origin only on the client side to avoid hydration mismatches
    setOrigin(window.location.origin);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isLogin && !termsAccepted) {
      setErrorMsg("You must agree to the Alpha Terms of Service to proceed.");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/setup";
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${origin}/setup`
          }
        });
        if (error) throw error;
        setVerificationSent(true);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ebf3fa] via-[#e2edfa] to-[#d6e7f7] text-slate-800 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white/70 backdrop-blur-xl border border-blue-100 rounded-3xl p-10 shadow-lg relative overflow-hidden">
        
        {errorMsg && (
          <div className="absolute top-0 left-0 w-full bg-red-500 text-white text-xs font-bold text-center py-2 shadow-md">
            {errorMsg}
          </div>
        )}

        {verificationSent ? (
          <div className="text-center py-8">
            <span className="text-5xl block mb-4">✉️</span>
            <h2 className="text-2xl font-bold text-blue-700 mb-2">Verify Your Identity</h2>
            <p className="text-sm text-slate-500">
              A secure verification link has been sent to <strong>{email}</strong>. Please click the link to activate your digital twin.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8 mt-4">
              <h1 className="text-3xl font-bold text-blue-700 tracking-tight">
                {isLogin ? "Neural Gateway" : "Initialize Account"}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {isLogin ? "Authenticate your session." : "Register for Alpha 0.3.3 access."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/50 border border-blue-200 rounded-xl px-5 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/50 border border-blue-200 rounded-xl px-5 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
              />

              {!isLogin && (
                <div className="flex items-start gap-3 mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-600 cursor-pointer">
                    I agree to the <span className="font-bold text-blue-600 underline">Alpha Terms of Service</span>, including temporary usage caps and database reset acknowledgments.
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-3.5 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:scale-[1.02] rounded-xl font-bold text-white transition-transform shadow-md disabled:opacity-50"
              >
                {isLoading ? "Processing..." : isLogin ? "Access Matrix" : "Create Identity"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrorMsg("");
                }}
                className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors"
              >
                {isLogin ? "No account? Apply for Alpha Access." : "Already registered? Login here."}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}