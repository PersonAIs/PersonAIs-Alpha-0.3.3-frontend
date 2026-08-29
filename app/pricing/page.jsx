"use client";
import Link from "next/link";
import { useState } from "react";

export default function PricingPage() {
  const [checkoutMessage, setCheckoutMessage] = useState("");

  const handlePreOrder = (e) => {
    e.preventDefault();
    setCheckoutMessage("System Alert: Preorders coming soon! Commercial transactions open after Alpha Week (Sept 4th).");
    setTimeout(() => setCheckoutMessage(""), 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ebf3fa] via-[#e2edfa] to-[#d6e7f7] text-slate-800 font-sans p-6 md:p-12 relative flex flex-col items-center">
        <div className="w-full max-w-5xl flex justify-start mb-4">
          <Link href="/" className="px-5 py-2.5 bg-white/70 backdrop-blur-md border border-blue-200 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm">
            ← Return to Matrix
          </Link>
        </div>

        <div className="relative z-10 max-w-5xl w-full text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-blue-700 tracking-tight">
                Upgrade Your Digital Twin
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                PersonAIs Alpha 0.3.3 is live. Test the matrix for free this week, or prepare for our exclusive Founder Pre-Order.
            </p>
        </div>

        {/* Custom UI Message Box */}
        {checkoutMessage && (
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-xl border-2 border-blue-300 shadow-xl text-blue-800 px-6 py-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                <span className="text-xl">⚠️</span>
                <p className="text-sm font-bold">{checkoutMessage}</p>
            </div>
        )}

        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Free Alpha Week Card */}
            <div className="bg-white/60 backdrop-blur-xl border border-blue-100 rounded-3xl p-8 shadow-sm flex flex-col">
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-700">Alpha Week Access</h2>
                        <p className="text-slate-500 text-sm mt-1">7-Day Free Trial</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider">
                        Active
                    </span>
                </div>
                
                <div className="text-4xl font-bold text-slate-800 mb-8">
                    $0 <span className="text-xl text-slate-400 font-normal">/ week</span>
                </div>

                <ul className="space-y-4 mb-8 flex-1 text-slate-600 text-sm font-medium">
                    <li className="flex items-center gap-3"><span className="text-emerald-500 font-bold text-lg">✓</span> Create 1 Digital Twin Avatar</li>
                    <li className="flex items-center gap-3"><span className="text-emerald-500 font-bold text-lg">✓</span> Access to Claude 3 Haiku Model</li>
                    <li className="flex items-center gap-3"><span className="text-emerald-500 font-bold text-lg">✓</span> 20 Messages Per 24-Hour Cycle</li>
                    <li className="flex items-center gap-3 opacity-50"><span className="text-slate-400 font-bold text-lg">✕</span> 8K Cinematic Generation (Locked)</li>
                </ul>

                <button disabled className="w-full py-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold cursor-not-allowed">
                    Current Plan
                </button>
            </div>

            {/* 2-Year Founder Pre-Order Card */}
            <div className="bg-white/80 backdrop-blur-xl border-2 border-blue-400 rounded-3xl p-8 shadow-lg flex flex-col relative overflow-hidden group hover:border-blue-500 transition-colors">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-8 rotate-45 translate-x-8 translate-y-4 shadow-md">
                    Sept 4th
                </div>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-blue-700">2-Year Founder Pass</h2>
                    <p className="text-blue-500 font-semibold text-sm mt-1">Preorders coming soon!</p>
                </div>
                
                <div className="text-4xl font-bold text-slate-800 mb-8">
                    $150 <span className="text-xl text-slate-400 font-normal">one-time</span>
                </div>

                <ul className="space-y-4 mb-8 flex-1 text-slate-600 text-sm font-medium">
                    <li className="flex items-center gap-3"><span className="text-blue-500 font-bold text-lg">✓</span> 2 Years of Ultra Access (Starts at Beta)</li>
                    <li className="flex items-center gap-3"><span className="text-blue-500 font-bold text-lg">✓</span> Uncapped Chat Limits</li>
                    <li className="flex items-center gap-3"><span className="text-blue-500 font-bold text-lg">✓</span> Priority GPU Queue</li>
                    <li className="flex items-center gap-3"><span className="text-blue-500 font-bold text-lg">✓</span> Exclusive "Founder" UI Badge</li>
                </ul>

                <button onClick={handlePreOrder} className="w-full py-4 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:scale-[1.02] text-white font-bold text-lg shadow-md transition-transform">
                    Pre-Order (Unlocks Sept 4)
                </button>
            </div>
        </div>
    </div>
  );
}