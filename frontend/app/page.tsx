"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import ChatInput from "./components/ChatInput";
import DisclaimerBanner from "./components/DisclaimerBanner";
import MessageBubble, { MessageType } from "./components/MessageBubble";
import ScholarCharacter from "./components/ScholarCharacter";
import WelcomeCard from "./components/WelcomeCard";

const StarField = dynamic(() => import("./components/StarField"), { ssr: false });

interface Message {
  role: "user" | "bot";
  text: string;
  type?: MessageType;
  sourceUrl?: string | null;
  sourceDate?: string | null;
}

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (query: string) => {
    if (!query.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (res.status === 429) {
        setMessages((prev) => [...prev, {
          role: "bot",
          text: "Too many requests. Please wait a moment before asking another question.",
          type: "rate_limit",
        }]);
        return;
      }

      const data = await res.json();
      setMessages((prev) => [...prev, {
        role: "bot",
        text: data.answer,
        type: data.type,
        sourceUrl: data.source_url,
        sourceDate: data.source_date,
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "bot",
        text: "Something went wrong. Please try again.",
        type: "not_found",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden relative">

      {/* Subtle floating dots */}
      <StarField />

      {/* ── HEADER ── */}
      <header className="relative z-10 bg-white/85 backdrop-blur-sm border-b-2 border-orange-200 px-6 py-4 flex flex-col items-center gap-1 shrink-0">
        <h1 className="font-display text-2xl font-bold text-coral-dark tracking-tight">
          💰 Mutual Fund FAQ Assistant
        </h1>
        <p className="text-xs text-orange-500 font-semibold tracking-wider">
          Powered by official Mirae Asset · AMFI · SEBI data
        </p>
        <DisclaimerBanner />
      </header>

      {/* ── MAIN: 3-panel ── */}
      <main className="relative z-10 flex flex-1 overflow-hidden">

        {/* Left analyst */}
        <aside className="hidden lg:flex w-44 xl:w-52 shrink-0 flex-col items-center justify-center px-2">
          <ScholarCharacter side="left" loading={loading} />
        </aside>

        {/* Middle — chat area. No scroll on welcome screen; scrollable once messages arrive */}
        <section className={`flex-1 px-4 flex flex-col min-w-0 ${
          messages.length === 0 && !loading
            ? "overflow-hidden"
            : "overflow-y-auto pt-4 pb-4 gap-4"
        }`}>
          {messages.length === 0 && !loading && (
            <WelcomeCard onQuestionClick={(q) => sendMessage(q)} />
          )}

          {messages.map((msg, i) => (
            <div key={i} className="animate-fadeinup">
              <MessageBubble message={msg} />
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fadeinup">
              <div className="sunny-card px-5 py-3 text-sm text-coral font-semibold flex items-center gap-2">
                <span className="inline-flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="w-2 h-2 rounded-full bg-coral animate-bounce"
                      style={{ animationDelay: `${d * 0.15}s` }}
                    />
                  ))}
                </span>
                Checking official sources…
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </section>

        {/* Right analyst */}
        <aside className="hidden lg:flex w-44 xl:w-52 shrink-0 flex-col items-center justify-center px-2">
          <ScholarCharacter side="right" loading={loading} />
        </aside>
      </main>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 bg-white/85 backdrop-blur-sm border-t-2 border-orange-200 shrink-0">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={() => sendMessage(input)}
          disabled={loading}
        />
      </footer>
    </div>
  );
}
