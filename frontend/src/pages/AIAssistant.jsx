import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import api, { API } from "../lib/api";
import { PageHeader, Card, Disclaimer } from "../components/common/UI";

const SUGGESTIONS = [
  "How much should I invest every month for my retirement goal?",
  "Why did you recommend bonds for me?",
  "Is my emergency fund adequate?",
  "How can I improve my financial health score?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    api.get("/assistant/history?session_id=default").then((r) => setMessages(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }, { role: "assistant", content: "" }]);
    setStreaming(true);
    try {
      const token = localStorage.getItem("si_token");
      const res = await fetch(`${API}/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: msg, session_id: "default" }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.replace(/^data: /, "").trim();
          if (!line) continue;
          try {
            const obj = JSON.parse(line);
            if (obj.delta) {
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + obj.delta };
                return copy;
              });
            }
            if (obj.error) {
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: "Sorry, I ran into an error. Please try again." };
                return copy;
              });
            }
          } catch { /* ignore partial */ }
        }
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "Connection error. Please try again." };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div>
      <PageHeader title="AI Financial Assistant" subtitle="Ask questions about your profile, goals and recommendations. Powered by Claude Sonnet 4.6." />

      <Card className="flex h-[calc(100vh-260px)] min-h-[440px] flex-col p-0">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6" data-testid="chat-messages">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/12"><Sparkles className="h-6 w-6 text-blue-400" /></div>
              <h3 className="font-manrope text-lg font-semibold text-slate-200">How can I help with your finances?</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">I use your stored profile to give personalized, educational answers.</p>
              <div className="mt-6 grid max-w-lg gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} data-testid="suggestion-chip" className="rounded-lg border border-white/10 px-3 py-2.5 text-left text-xs text-slate-300 transition-colors hover:border-blue-500/30 hover:bg-white/[0.03]">{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-blue-500 text-white" : "border border-white/[0.08] bg-[#0E1117] text-slate-200"}`}>
                {m.content || (streaming && i === messages.length - 1 ? <Loader2 className="h-4 w-4 animate-spin" /> : "")}
                <span className="whitespace-pre-wrap">{m.content}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about your goals, risk or recommendations..."
              data-testid="chat-input"
              className="flex-1 rounded-full border border-white/10 bg-[#0E1117] px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500/60"
            />
            <button onClick={() => send()} disabled={streaming} data-testid="chat-send-button" className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60">
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </Card>
      <Disclaimer text="This AI assistant provides educational and analytical information based on your profile. It is not a licensed financial advisor and does not guarantee investment returns or constitute personalized regulated financial advice." />
    </div>
  );
}
