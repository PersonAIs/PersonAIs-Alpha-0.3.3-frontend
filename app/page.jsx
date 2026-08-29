"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function MainPage() {
  const [messages, setMessages] = useState([
    { role: "ai", content: "Neural link established. How can I assist you today?" },
  ]);
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: "Alpha 0.3.3 Core Setup" },
    { id: 2, title: "Database Architecture" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarImg, setAvatarImg] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("alpha_avatar_image");
    if (saved) setAvatarImg(saved);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (e) => {
  e.preventDefault();
  if (!inputText.trim() || isLoading) return;

  const userMsg = inputText.trim();
  setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
  setInputText("");
  setIsLoading(true);

  try {
    const res = await fetch("http://localhost:8000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Explicitly sending the user_id to match the Swagger payload
      body: JSON.stringify({ 
        user_id: "guest_tester", 
        message: userMsg 
      }),
    });
    
    const data = await res.json();

    if (!res.ok) {
      setMessages((prev) => [...prev, { role: "ai", content: `System Error: ${data.detail || "Connection dropped"}` }]);
    } else {
      setMessages((prev) => [...prev, { role: "ai", content: data.reply || data.response }]);
    }
  } catch (error) {
    setMessages((prev) => [...prev, { role: "ai", content: "Critical fault: Unable to reach the neural engine." }]);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="h-full flex gap-6 p-6">
      
      {/* Inner Sidebar: Avatar & History */}
      <div className="w-72 bg-white/60 backdrop-blur-xl border border-blue-100 rounded-3xl flex flex-col shadow-sm overflow-hidden">
        {/* Profile Slot */}
        <div className="p-6 border-b border-blue-100/60 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-blue-300 bg-blue-50/50 flex flex-col items-center justify-center overflow-hidden relative shadow-inner mb-3">
            {avatarImg ? (
              <img src={avatarImg} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl block">👤</span>
            )}
          </div>
          <h2 className="text-sm font-bold text-blue-700 tracking-tight">Active Identity</h2>
          <Link href="/setup" className="text-[10px] uppercase font-semibold text-blue-500 mt-1 hover:text-blue-600">
            Update Photo
          </Link>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Memory Logs</h3>
          <div className="space-y-1">
            {chatHistory.length > 0 ? chatHistory.map((chat) => (
              <button key={chat.id} className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-blue-50/60 hover:text-blue-700 transition-all truncate">
                💬 {chat.title}
              </button>
            )) : (
              <p className="text-xs text-slate-400 px-2">No chat history found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Chat Matrix Frame */}
      <div className="flex-1 bg-white/60 backdrop-blur-xl border border-blue-100 rounded-3xl flex flex-col overflow-hidden shadow-sm">
        <header className="px-6 py-4 border-b border-blue-100 bg-white/40 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-700">Neural Chat Matrix</h2>
          <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Online</span>
        </header>

        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed shadow-xs ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white border border-blue-100 text-slate-700 rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="p-4 bg-white border border-blue-100 rounded-2xl rounded-bl-sm text-slate-400 text-xs italic shadow-xs">
                Processing neural pathways...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-5 border-t border-blue-100 bg-white/40 flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message to your digital twin..."
            className="flex-1 bg-white border border-blue-200 rounded-xl px-5 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}