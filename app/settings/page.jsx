"use client";
import Link from "next/link";

export default function SettingsPage() {
  const handleLogout = () => {
    // Clears the neural link session and returns to gateway
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ebf3fa] via-[#e2edfa] to-[#d6e7f7] text-slate-800 p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-blue-700 tracking-tight">System Settings</h1>
          <Link href="/" className="px-5 py-2.5 bg-white/70 backdrop-blur-md border border-blue-200 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm">
            Back to Matrix
          </Link>
        </div>
        
        <div className="bg-white/60 backdrop-blur-xl border border-blue-100 rounded-3xl p-8 mb-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-slate-700">Account Preferences</h2>
          <p className="text-sm text-slate-500 mb-8">Manage your digital twin connection and subscription tier.</p>
          
          <div className="flex flex-col gap-4">
            <Link href="/pricing" className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl hover:border-blue-400 transition-colors group">
              <div className="text-left">
                <h3 className="font-bold text-blue-700 group-hover:text-blue-800">Subscription & Billing</h3>
                <p className="text-xs text-slate-500 mt-1">Upgrade your tier or view pre-orders.</p>
              </div>
              <span className="text-blue-600 font-bold text-xl">→</span>
            </Link>

            <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-2xl hover:bg-red-100 transition-colors group">
               <div className="text-left">
                <h3 className="font-bold text-red-600 group-hover:text-red-700">Log Out</h3>
                <p className="text-xs text-red-400 mt-1">Sever neural link and return to gateway.</p>
              </div>
              <span className="text-red-500 font-bold text-xl">↪</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}