"use client";
import { useState, useRef } from "react";

export default function SetupPage() {
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!avatarPreview) return;
    setIsScanning(true);
    
    // Save image to browser storage to pass to the Main Chat page
    localStorage.setItem("alpha_avatar_image", avatarPreview);

    // Simulated scanning delay before routing
    setTimeout(() => {
      window.location.href = "/";
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ebf3fa] via-[#e2edfa] to-[#d6e7f7] text-slate-800 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-xl w-full bg-white/70 backdrop-blur-xl border border-blue-100 rounded-3xl p-10 shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-2 text-blue-700 tracking-tight">
          Initialize Digital Twin
        </h1>
        <p className="text-slate-500 mb-8 text-sm">
          Upload a reference photo. Our biometric AI will generate your identical digital avatar.
        </p>

        <form onSubmit={handleGenerate} className="space-y-6">
          {/* File Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative border-2 border-dashed border-blue-300 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-blue-50/50 overflow-hidden flex flex-col items-center justify-center min-h-[220px]"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            
            {avatarPreview ? (
              <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-md">
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                {isScanning && (
                  <div className="absolute inset-0 bg-blue-500/20 animate-pulse border-t-4 border-blue-400 scanning-laser"></div>
                )}
              </div>
            ) : (
              <>
                <span className="text-5xl mb-4 block text-blue-400 drop-shadow-sm">📷</span>
                <p className="text-sm text-slate-600 font-semibold">Click to select or drag photo here</p>
                <p className="text-xs text-slate-400 mt-2">Biometric reference required</p>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={isScanning || !avatarPreview}
            className="w-full py-4 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:scale-[1.02] rounded-xl font-bold text-white transition-transform shadow-md disabled:opacity-50 disabled:hover:scale-100"
          >
            {isScanning ? "Scanning Biometrics..." : "Generate Digital Twin"}
          </button>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scanning-laser {
          animation: scan 2s linear infinite;
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}} />
    </div>
  );
}