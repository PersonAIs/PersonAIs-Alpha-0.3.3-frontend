"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Dynamic Backend URL
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://personais-api.net";

export default function ChatPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([
    { role: "ai", content: "Neural link established. How can I assist you today?" },
  ]);
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: "Alpha 0.3.3 Core Setup" },
    { id: 2, title: "Database Architecture" },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarImg, setAvatarImg] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const chatEndRef = useRef(null);

  // 1. Load Local Avatar
  useEffect(() => {
    const saved = localStorage.getItem("alpha_avatar_image");
    if (saved) setAvatarImg(saved);
  }, []);

  // 2. Auth Session Gatekeeper
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push("/auth");
        } else {
          setUserId(session.user.id);
          setIsAuthenticating(false);
        }
      } catch (err) {
        console.error("Auth verification failed:", err);
        router.push("/auth");
      }
    };

    checkSession();

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push("/auth");
      } else {
        setUserId(session.user.id);
        setIsAuthenticating(false);
      }
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, [router]);

  // 3. Auto-scroll Message Feed
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // 4. Message Dispatch to Python Core Brain
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg = inputText.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId || "guest_tester",
          message: userMsg,
        }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Raw non-JSON response:", text);
        throw new Error(
          "Backend returned HTML instead of JSON. Verify Render URL and DNS settings."
        );
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || `Server returned ${res.status}`);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: data.reply || data.response || "Neural signal confirmed.",
        },
      ]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `Critical Error: ${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ebf3fa] via-[#e2edfa] to-[#d6e7f7] flex items-center justify-center font-sans">
        <div className="text-slate-600 font-semibold text-sm animate-pulse">
          Synchronizing neural session...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-6 p-6 font-sans">
      {/* Left Sidebar: Avatar & History */}
      <div className="w-72 bg-white/60 backdrop-blur-xl border border-blue-100 rounded-3xl flex flex-col shadow-sm overflow-hidden">
        {/* Profile Slot */}
        <div className="p-6 border-b border-blue-100/60 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-blue-300 bg-blue-50/50 flex flex-col items-center justify-center overflow-hidden relative shadow-inner mb-3">
            {avatarImg ? (
              <img
                src={avatarImg}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl block">👤</span>
            )}
          </div>
          <h2 className="text-sm font-bold text-blue-700 tracking-tight">
            Active Identity
          </h2>
          <Link
            href="/setup"
            className="text-[10px] uppercase font-semibold text-blue-500 mt-1 hover:text-blue-600 transition"
          >
            Update Photo
          </Link>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
            Memory Logs
          </h3>
          <div className="space-y-1">
            {chatHistory.length > 0 ? (
              chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-blue-50/60 hover:text-blue-700 transition-all truncate"
                >
                  💬 {chat.title}
                </button>
              ))
            ) : (
              <p className="text-xs text-slate-400 px-2">No chat history found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Matrix */}
      <div className="flex-1 bg-white/60 backdrop-blur-xl border border-blue-100 rounded-3xl flex flex-col overflow-hidden shadow-sm">
        <header className="px-6 py-4 border-b border-blue-100/60 bg-white/40 flex justify-between items-center">
          <div>
            <h1 className="text-sm font-bold text-slate-700">Neural Chat Matrix</h1>
            <p className="text-xs text-slate-500">Alpha 0.3.3 Live Instance</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Online
            </span>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/auth");
              }}
              className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Messages Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3 text-sm shadow-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white/80 text-slate-800 border border-blue-100 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/80 border border-blue-100 text-slate-500 rounded-2xl px-5 py-3 text-xs animate-pulse shadow-sm">
                Accessing neural matrix...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-white/40 border-t border-blue-100/60 flex gap-3"
        >
          <input
            type="text"
            placeholder="Type a message to your digital twin..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-white/70 border border-blue-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition shadow-md"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}