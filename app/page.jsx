"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// 1. Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// 2. Dynamic Backend URL Fallback
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://personais-api.net";

export default function ChatPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([
    { role: "ai", content: "Neural link established. How can I assist you today?" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const chatEndRef = useRef(null);

  // 3. Auth Gatekeeper: Redirect unauthenticated visitors to /auth
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
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

    // Properly destructured Supabase v2 listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push("/auth");
      } else {
        setUserId(session.user.id);
        setIsAuthenticating(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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
        console.error("Raw Server Response:", text);
        throw new Error(`Matrix Offline: Backend returned HTML. Verify NEXT_PUBLIC_BACKEND_URL.`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || `Server returned ${res.status}`);
      }

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: data.reply || data.response || "Neural signal confirmed." }
      ]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `Critical Error: ${error.message}`
        }
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
    <div className="min-h-screen bg-gradient-to-br from-[#ebf3fa] via-[#e2edfa] to-[#d6e7f7] text-slate-800 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-3xl w-full h-[80vh] bg-white/70 backdrop-blur-xl border border-blue-100 rounded-3xl shadow-xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-blue-100/60 bg-white/40 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-blue-700 text-lg">PersonAIs Matrix</h1>
            <p className="text-xs text-slate-500">Alpha 0.3.3 Live Instance</p>
          </div>
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

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3 text-sm shadow-sm ${
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
              <div className="bg-white/80 border border-blue-100 text-slate-500 rounded-2xl px-5 py-3 text-xs animate-pulse">
                Accessing neural matrix...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white/40 border-t border-blue-100/60 flex gap-3">
          <input
            type="text"
            placeholder="Send a transmission..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-white/70 border border-blue-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
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