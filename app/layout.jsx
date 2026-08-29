"use client";

import "./globals.css";
import Link from "next/link";
import { useState } from "react";

export default function RootLayout({ children }) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(0);

  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-[#ebf3fa] via-[#e2edfa] to-[#d6e7f7] min-h-screen text-slate-800 flex font-sans overflow-hidden">
        
        {/* Minimalist Left Sidebar */}
        <aside className="w-24 bg-white/70 backdrop-blur-xl border-r border-blue-100 flex flex-col justify-between items-center py-6 shadow-sm z-30">
          
          {/* Brand */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-extrabold text-blue-600 tracking-tight">P</span>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">PersonAIs</span>
          </div>

          {/* Circular Utility Buttons */}
          <div className="flex flex-col gap-4">
            <Link
              href="/settings"
              className="w-12 h-12 rounded-full bg-white/90 border border-blue-200 flex items-center justify-center text-xl hover:bg-blue-50 transition-all shadow-sm"
              title="Settings"
            >
              ⚙️
            </Link>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl hover:scale-105 transition-transform shadow-md"
              title="Feedback"
            >
              💬
            </button>
          </div>
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 h-screen overflow-hidden relative">
          {children}
        </main>

        {/* Feedback Modal */}
        {isFeedbackOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/90 backdrop-blur-2xl border border-blue-200 rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900 mb-1 text-center">Alpha Experience</h3>
              <p className="text-slate-500 text-xs text-center mb-6">Rate your digital twin connection</p>

              <div className="flex justify-center gap-2 mb-6 text-2xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setRating(star)}
                    className={`cursor-pointer transition-transform hover:scale-110 ${
                      star <= rating ? "opacity-100" : "opacity-30 grayscale"
                    }`}
                  >
                    ⭐
                  </span>
                ))}
              </div>

              <textarea
                placeholder="Describe any bugs, latency, or suggestions..."
                className="w-full bg-white/80 border border-blue-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 mb-6 h-28 resize-none"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setIsFeedbackOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsFeedbackOpen(false)}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                >
                  Submit Log
                </button>
              </div>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}