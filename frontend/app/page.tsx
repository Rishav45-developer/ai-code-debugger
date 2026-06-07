"use client";
import { useState, useRef, useEffect } from "react";

const LANGUAGES = ["python", "javascript", "java", "c++", "c#", "go", "rust", "typescript"];

interface DebugResult {
  explanation: string;
  bugs: string;
  fixed_code: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [code, setCode] = useState<string>("");
  const [language, setLanguage] = useState<string>("python");
  const [result, setResult] = useState<DebugResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"explanation" | "bugs" | "fixed">("explanation");
  const [hasResult, setHasResult] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleDebug() {
    if (!code.trim()) { setError("Please paste some code first."); return; }
    setError("");
    setResult(null);
    setMessages([]);
    setLoading(true);
    try {
      const res = await fetch("https://rishavdev-code-debugger-api.hf.space/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      if (!res.ok) throw new Error("Server error: " + res.status);
      const data: DebugResult = await res.json();
      setResult(data);
      setHasResult(true);
      setActiveTab("explanation");
      setMessages([{
        role: "assistant",
        content: "I have analyzed your code. Ask me anything about it — I can explain specific lines, suggest optimizations, or help you understand the fixes."
      }]);
    } catch (e: unknown) {
      setError("Error: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!input.trim() || chatLoading || !code.trim()) return;
    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setChatLoading(true);
    try {
      const res = await fetch("https://rishavdev-code-debugger-api.hf.space/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, messages: updatedMessages }),
      });
      if (!res.ok) throw new Error("Server error: " + res.status);
      const data = await res.json();
      setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...updatedMessages, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && e.currentTarget.tagName === "INPUT") {
      e.preventDefault();
      handleSendMessage();
    }
  }

  function copyFixed() {
    if (result?.fixed_code) {
      navigator.clipboard.writeText(result.fixed_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClear() {
    setCode("");
    setResult(null);
    setError("");
    setMessages([]);
    setHasResult(false);
  }

  const tabs = [
    { key: "explanation", label: "Explanation" },
    { key: "bugs", label: "Bugs Found" },
    { key: "fixed", label: "Fixed Code" },
  ] as const;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@300;400;500;600&family=Google+Sans+Mono&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0d0d0f;
          --glow-color: #1a3a6b;
          --surface: rgba(255,255,255,0.05);
          --surface2: rgba(255,255,255,0.08);
          --border: rgba(255,255,255,0.1);
          --border-focus: rgba(138,180,248,0.5);
          --text: #e8eaed;
          --text-secondary: #9aa0a6;
          --text-tertiary: #5f6368;
          --blue: #8ab4f8;
          --blue-btn: #1a73e8;
          --blue-btn-hover: #1557b0;
          --green: #81c995;
          --red: #f28b82;
          --radius: 16px;
          --radius-sm: 10px;
          --radius-pill: 28px;
        }

        html, body {
          height: 100%;
          background: var(--bg);
          color: var(--text);
          font-family: 'Google Sans', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
        }

        /* Gemini background glow */
        .bg-glow {
          position: fixed;
          inset: 0;
          z-index: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 60%, #0d2a5e 0%, #091428 35%, #0d0d0f 70%);
          pointer-events: none;
        }

        /* Extra subtle noise texture */
        .bg-glow::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.4;
          pointer-events: none;
        }

        .app {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        /* Header */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 32px;
          flex-shrink: 0;
        }
        .header-left { display: flex; align-items: center; gap: 10px; }
        .logo-mark {
          width: 26px; height: 26px; border-radius: 50%;
          background: linear-gradient(135deg, #8ab4f8 0%, #c58af9 50%, #f28b82 100%);
          flex-shrink: 0;
        }
        .logo-text { font-size: 17px; font-weight: 400; color: var(--text); letter-spacing: -0.01em; }
        .header-right {
          background: var(--blue-btn);
          color: #fff;
          font-family: 'Google Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          border: none;
          border-radius: var(--radius-pill);
          padding: 8px 18px;
          cursor: default;
          display: flex;
          align-items: center;
          gap: 6px;
          opacity: 0.85;
        }

        /* Landing / input centered */
        .landing {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px 24px 60px;
          gap: 32px;
          overflow: hidden;
        }

        .greeting {
          font-size: clamp(26px, 4vw, 38px);
          font-weight: 400;
          color: var(--text);
          text-align: center;
          letter-spacing: -0.02em;
        }

        /* Input card — Gemini style pill */
        .input-card {
          width: 100%;
          max-width: 720px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: var(--radius-pill);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          overflow: hidden;
          transition: border-color .2s, box-shadow .2s;
        }
        .input-card:focus-within {
          border-color: rgba(138,180,248,0.35);
          box-shadow: 0 0 0 1px rgba(138,180,248,0.15), 0 8px 40px rgba(13,42,94,0.5);
        }

        .input-top {
          display: flex;
          align-items: flex-start;
          padding: 18px 24px 12px;
          gap: 14px;
        }
        .code-textarea {
          flex: 1;
          background: transparent;
          border: none;
          color: #a8d5a2;
          font-family: 'Google Sans Mono', monospace;
          font-size: 13px;
          line-height: 1.7;
          resize: none;
          outline: none;
          min-height: 100px;
          max-height: 240px;
          overflow-y: auto;
        }
        .code-textarea::placeholder { color: var(--text-tertiary); font-family: 'Google Sans', sans-serif; font-size: 14px; }
        .code-textarea::-webkit-scrollbar { width: 4px; }
        .code-textarea::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        .input-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px 14px 24px;
          gap: 12px;
        }
        .input-bottom-left { display: flex; align-items: center; gap: 10px; }

        .lang-select {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius-pill);
          color: var(--text-secondary);
          font-family: 'Google Sans', sans-serif;
          font-size: 12px;
          padding: 5px 28px 5px 12px;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239aa0a6' stroke-width='2'%3E%3Cpolyline points='6,9 12,15 18,9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          transition: border-color .15s;
        }
        .lang-select:focus { border-color: var(--border-focus); }
        .lang-select option { background: #1e1e2e; }

        .btn-clear {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius-pill);
          color: var(--text-secondary);
          font-family: 'Google Sans', sans-serif;
          font-size: 12px;
          padding: 5px 14px;
          cursor: pointer;
          transition: background .15s;
        }
        .btn-clear:hover { background: rgba(255,255,255,0.06); }

        .btn-analyze {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: var(--blue-btn);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background .15s, transform .1s;
        }
        .btn-analyze:hover { background: var(--blue-btn-hover); }
        .btn-analyze:active { transform: scale(.94); }
        .btn-analyze:disabled { background: rgba(255,255,255,0.08); cursor: not-allowed; }
        .btn-analyze svg { width: 16px; height: 16px; fill: #fff; }
        .btn-analyze:disabled svg { fill: var(--text-tertiary); }

        .loading-dots { display: flex; gap: 5px; align-items: center; }
        .loading-dots span { width: 6px; height: 6px; border-radius: 50%; background: var(--blue); animation: ldot 1.2s infinite; }
        .loading-dots span:nth-child(2) { animation-delay: .15s; }
        .loading-dots span:nth-child(3) { animation-delay: .3s; }
        @keyframes ldot { 0%,80%,100%{transform:scale(.5);opacity:.3} 40%{transform:scale(1);opacity:1} }

        .error-msg { font-size: 13px; color: var(--red); text-align: center; }

        /* Result layout — two column */
        .result-layout {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          overflow: hidden;
          padding: 0 24px 24px;
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
        }

        /* Left result column */
        .result-left {
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--border);
          padding-right: 24px;
          overflow: hidden;
          gap: 12px;
        }

        /* Code input (compact) in result view */
        .code-compact {
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 14px 16px;
          flex-shrink: 0;
        }
        .code-compact-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .compact-label { font-size: 11px; font-weight: 500; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: .06em; }
        .code-compact textarea {
          width: 100%;
          background: transparent;
          border: none;
          color: #a8d5a2;
          font-family: 'Google Sans Mono', monospace;
          font-size: 12px;
          line-height: 1.7;
          resize: none;
          outline: none;
          height: 140px;
          overflow-y: auto;
        }
        .code-compact textarea::-webkit-scrollbar { width: 3px; }
        .code-compact textarea::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .compact-actions { display: flex; gap: 8px; margin-top: 10px; }
        .btn-reanalyze {
          flex: 1;
          background: var(--blue-btn);
          color: #fff;
          font-family: 'Google Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          border: none;
          border-radius: var(--radius-pill);
          padding: 8px;
          cursor: pointer;
          transition: background .15s;
        }
        .btn-reanalyze:hover { background: var(--blue-btn-hover); }
        .btn-reanalyze:disabled { background: rgba(255,255,255,0.08); color: var(--text-tertiary); cursor: not-allowed; }
        .btn-new {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-family: 'Google Sans', sans-serif;
          font-size: 12px;
          border-radius: var(--radius-pill);
          padding: 8px 14px;
          cursor: pointer;
          transition: background .15s;
        }
        .btn-new:hover { background: rgba(255,255,255,0.05); }

        /* Chat in left col */
        .chat-box {
          flex: 1;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .chat-head { padding: 10px 14px; border-bottom: 1px solid var(--border); }
        .chat-head-label { font-size: 11px; font-weight: 500; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: .06em; }
        .chat-msgs { flex: 1; overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
        .chat-msgs::-webkit-scrollbar { width: 4px; }
        .chat-msgs::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        .msg { display: flex; gap: 8px; align-items: flex-start; }
        .msg.user { flex-direction: row-reverse; }
        .msg-av { width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; }
        .msg-av.ai { background: linear-gradient(135deg, #8ab4f8, #c58af9); color: #0d1117; }
        .msg-av.usr { background: rgba(255,255,255,0.08); border: 1px solid var(--border); color: var(--text-secondary); }
        .msg-bubble { max-width: 85%; padding: 8px 12px; font-size: 12.5px; line-height: 1.6; white-space: pre-wrap; }
        .msg-bubble.ai { background: rgba(255,255,255,0.05); color: var(--text-secondary); border-radius: 4px 12px 12px 12px; }
        .msg-bubble.usr { background: rgba(26,115,232,0.2); color: var(--blue); border: 1px solid rgba(138,180,248,0.2); border-radius: 12px 4px 12px 12px; }

        .typing-dots span { display: inline-block; width: 4px; height: 4px; background: var(--text-tertiary); border-radius: 50%; margin: 0 1px; animation: dot 1.2s infinite; }
        .typing-dots span:nth-child(2){animation-delay:.2s} .typing-dots span:nth-child(3){animation-delay:.4s}
        @keyframes dot{0%,80%,100%{transform:scale(.6);opacity:.3}40%{transform:scale(1);opacity:1}}

        .chat-input-row { padding: 10px 12px; border-top: 1px solid var(--border); display: flex; gap: 8px; }
        .chat-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          border-radius: var(--radius-pill);
          color: var(--text);
          font-family: 'Google Sans', sans-serif;
          font-size: 12.5px;
          padding: 7px 14px;
          outline: none;
          transition: border-color .15s;
        }
        .chat-input:focus { border-color: var(--border-focus); }
        .chat-input::placeholder { color: var(--text-tertiary); }
        .btn-send { width: 32px; height: 32px; border-radius: 50%; background: var(--blue-btn); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background .15s; }
        .btn-send:hover { background: var(--blue-btn-hover); }
        .btn-send:disabled { background: rgba(255,255,255,0.06); cursor: not-allowed; }
        .btn-send svg { width: 13px; height: 13px; fill: #fff; }
        .btn-send:disabled svg { fill: var(--text-tertiary); }

        /* Right result column */
        .result-right {
          padding-left: 24px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin-bottom: 16px; flex-shrink: 0; }
        .tab { padding: 10px 18px; font-size: 13px; font-weight: 400; color: var(--text-secondary); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color .15s; white-space: nowrap; }
        .tab:hover { color: var(--text); }
        .tab.active { color: var(--blue); border-bottom-color: var(--blue); font-weight: 500; }

        .tab-body { flex: 1; overflow-y: auto; }
        .tab-body::-webkit-scrollbar { width: 5px; }
        .tab-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        .result-text { font-size: 13px; color: var(--text-secondary); line-height: 1.85; white-space: pre-wrap; }
        .result-text.is-bugs { color: #f28b82cc; }

        .code-block { background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        .code-block-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid var(--border); }
        .code-lang { font-size: 11px; color: var(--text-tertiary); font-family: 'Google Sans Mono', monospace; text-transform: uppercase; letter-spacing: .05em; }
        .btn-copy { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); font-family: 'Google Sans', sans-serif; font-size: 11px; border-radius: var(--radius-pill); padding: 4px 12px; cursor: pointer; transition: background .15s, color .15s, border-color .15s; }
        .btn-copy:hover { background: rgba(255,255,255,0.06); }
        .btn-copy.copied { color: var(--green); border-color: var(--green); }
        .code-block pre { padding: 16px; font-family: 'Google Sans Mono', monospace; font-size: 12.5px; color: #a8d5a2; line-height: 1.75; overflow-x: auto; white-space: pre; }
        .code-block pre::-webkit-scrollbar { height: 4px; } 
        .code-block pre::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        @media (max-width: 900px) {
          html, body { overflow: auto; }
          .app { height: auto; overflow: auto; }
          .result-layout { grid-template-columns: 1fr; padding: 0 16px 24px; gap: 16px; }
          .result-left { border-right: none; padding-right: 0; border-bottom: 1px solid var(--border); padding-bottom: 16px; }
          .result-right { padding-left: 0; }
        }
      `}</style>

      <div className="bg-glow" />

      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="logo-mark" />
            <span className="logo-text">Code Debugger</span>
          </div>
          <div className="header-right">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.19 9.19 2 12l7.19 2.81L12 22l2.81-7.19L22 12l-7.19-2.81z"/></svg>
            AI Powered
          </div>
        </header>

        {/* Landing — before any result */}
        {!hasResult && (
          <div className="landing">
            <div className="greeting">Debug your code with AI</div>

            <div className="input-card">
              <div className="input-top">
                <textarea
                  className="code-textarea"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your code here..."
                  spellCheck={false}
                  rows={5}
                />
              </div>
              <div className="input-bottom">
                <div className="input-bottom-left">
                  <select
                    className="lang-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    {LANGUAGES.map(l => (
                      <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                    ))}
                  </select>
                  <button className="btn-clear" onClick={handleClear}>Clear</button>
                </div>
                <button className="btn-analyze" onClick={handleDebug} disabled={loading}>
                  {loading ? (
                    <div className="loading-dots"><span/><span/><span/></div>
                  ) : (
                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  )}
                </button>
              </div>
              {error && <div style={{padding:"0 24px 14px"}}><div className="error-msg">{error}</div></div>}
            </div>
          </div>
        )}

        {/* Result layout — after analysis */}
        {hasResult && result && (
          <div className="result-layout">

            {/* Left — code + chat */}
            <div className="result-left">
              <div className="code-compact">
                <div className="code-compact-header">
                  <span className="compact-label">Your Code</span>
                  <select
                    className="lang-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{fontSize:"11px"}}
                  >
                    {LANGUAGES.map(l => (
                      <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                />
                {error && <div className="error-msg" style={{marginTop:6}}>{error}</div>}
                <div className="compact-actions">
                  <button className="btn-reanalyze" onClick={handleDebug} disabled={loading}>
                    {loading ? "Analyzing..." : "Re-analyze"}
                  </button>
                  <button className="btn-new" onClick={handleClear}>New</button>
                </div>
              </div>

              <div className="chat-box">
                <div className="chat-head">
                  <div className="chat-head-label">Follow-up</div>
                </div>
                <div className="chat-msgs">
                  {messages.map((msg, i) => (
                    <div key={i} className={`msg${msg.role === "user" ? " user" : ""}`}>
                      <div className={`msg-av${msg.role === "assistant" ? " ai" : " usr"}`}>
                        {msg.role === "assistant" ? "AI" : "U"}
                      </div>
                      <div className={`msg-bubble${msg.role === "assistant" ? " ai" : " usr"}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="msg">
                      <div className="msg-av ai">AI</div>
                      <div className="msg-bubble ai">
                        <div className="typing-dots"><span/><span/><span/></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="chat-input-row">
                  <input
                    className="chat-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a follow-up question..."
                  />
                  <button className="btn-send" onClick={handleSendMessage} disabled={chatLoading || !input.trim()}>
                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Right — results tabs */}
            <div className="result-right">
              <div className="tabs">
                {tabs.map(t => (
                  <div key={t.key} className={`tab${activeTab === t.key ? " active" : ""}`} onClick={() => setActiveTab(t.key)}>
                    {t.label}
                  </div>
                ))}
              </div>
              <div className="tab-body">
                {activeTab === "explanation" && (
                  <p className="result-text">{result.explanation}</p>
                )}
                {activeTab === "bugs" && (
                  <p className={`result-text is-bugs`}>{result.bugs}</p>
                )}
                {activeTab === "fixed" && (
                  <div className="code-block">
                    <div className="code-block-header">
                      <span className="code-lang">{language}</span>
                      <button className={`btn-copy${copied ? " copied" : ""}`} onClick={copyFixed}>
                        {copied ? "Copied" : "Copy code"}
                      </button>
                    </div>
                    <pre>{result.fixed_code}</pre>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}