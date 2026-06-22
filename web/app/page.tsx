"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type CustomerTurn,
  type TurnAnalysis,
  sendCustomerTurn,
  sendStaffTurn,
  startConversation,
} from "@/lib/api";
import { useRecorder } from "@/lib/useRecorder";

type Turn = {
  speaker: "customer" | "staff";
  original: string;
  originalLang: string;
  translated: string;
  translatedLang: string;
};

export default function OfficerCopilot() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [analysis, setAnalysis] = useState<TurnAnalysis | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state: recState, start, stop } = useRecorder();

  const newSession = useCallback(async () => {
    setError(null);
    try {
      const { conversation_id } = await startConversation();
      setConversationId(conversation_id);
      setTurns([]);
      setAnalysis(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start session");
    }
  }, []);

  useEffect(() => {
    void newSession();
  }, [newSession]);

  const handleStop = useCallback(async () => {
    const blob = await stop();
    if (!blob || !conversationId) return;
    setBusy(true);
    setError(null);
    try {
      const result: CustomerTurn = await sendCustomerTurn(conversationId, blob);
      setTurns((t) => [
        ...t,
        {
          speaker: "customer",
          original: result.original_text,
          originalLang: result.original_lang,
          translated: result.translated_text,
          translatedLang: result.translated_lang,
        },
      ]);
      setAnalysis(result.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Turn failed");
    } finally {
      setBusy(false);
    }
  }, [stop, conversationId]);

  const sendReply = useCallback(async () => {
    if (!conversationId || !reply.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await sendStaffTurn(conversationId, reply.trim(), "en");
      setTurns((t) => [
        ...t,
        {
          speaker: "staff",
          original: reply.trim(),
          originalLang: "en",
          translated: result.translated_text,
          translatedLang: result.translated_lang,
        },
      ]);
      setReply("");
      if (result.audio_base64) {
        void new Audio(`data:audio/wav;base64,${result.audio_base64}`).play().catch(() => {});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reply failed");
    } finally {
      setBusy(false);
    }
  }, [conversationId, reply]);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 p-4 md:p-6">
      <Header recState={recState} onNew={() => void newSession()} />

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid flex-1 gap-4 md:grid-cols-3">
        <Panel title="🎙️ Customer Speech" subtitle="Original language">
          <TranscriptColumn turns={turns} field="original" langField="originalLang" />
          <PushToTalk
            recState={recState}
            busy={busy}
            onStart={() => void start()}
            onStop={() => void handleStop()}
          />
        </Panel>

        <Panel title="🌐 Live Translation" subtitle="Bilingual transcript">
          <TranscriptColumn turns={turns} field="translated" langField="translatedLang" />
        </Panel>

        <Panel title="🤖 AI Copilot" subtitle="Intent · guidance · documents">
          <CopilotContext analysis={analysis} />
        </Panel>
      </div>

      <ReplyBar value={reply} onChange={setReply} onSend={() => void sendReply()} busy={busy} />
    </main>
  );
}

function Header({ recState, onNew }: { recState: string; onNew: () => void }) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">🪔 Sahayata AI</h1>
        <p className="text-xs text-slate-400">Branch officer copilot</p>
      </div>
      <div className="flex items-center gap-3">
        {recState === "recording" && (
          <span className="flex items-center gap-1 text-xs text-red-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> recording
          </span>
        )}
        <button
          onClick={onNew}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
        >
          New session
        </button>
      </div>
    </header>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mb-3 text-xs text-slate-500">{subtitle}</p>
      <div className="flex flex-1 flex-col gap-3">{children}</div>
    </section>
  );
}

function TranscriptColumn({
  turns,
  field,
  langField,
}: {
  turns: Turn[];
  field: "original" | "translated";
  langField: "originalLang" | "translatedLang";
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [turns]);
  return (
    <div className="flex-1 space-y-2 overflow-y-auto">
      {turns.length === 0 && <p className="text-xs text-slate-600">No turns yet.</p>}
      {turns.map((t, i) => (
        <div
          key={i}
          className={`rounded-lg px-3 py-2 text-sm ${
            t.speaker === "customer"
              ? "bg-slate-800/70 text-slate-100"
              : "bg-emerald-950/40 text-emerald-100"
          }`}
        >
          <span className="mr-2 text-[10px] uppercase tracking-wide text-slate-500">
            {t.speaker} · {t[langField]}
          </span>
          <span>{t[field]}</span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

function PushToTalk({
  recState,
  busy,
  onStart,
  onStop,
}: {
  recState: string;
  busy: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  if (recState === "unsupported" || recState === "denied") {
    return (
      <p className="rounded-lg bg-amber-950/40 px-3 py-2 text-xs text-amber-300">
        Microphone {recState === "denied" ? "permission denied" : "not supported"}.
      </p>
    );
  }
  const recording = recState === "recording";
  return (
    <button
      onMouseDown={onStart}
      onMouseUp={onStop}
      onTouchStart={onStart}
      onTouchEnd={onStop}
      disabled={busy}
      aria-pressed={recording}
      className={`rounded-lg px-4 py-3 text-sm font-semibold transition disabled:opacity-50 ${
        recording
          ? "bg-red-600 text-white"
          : "bg-indigo-600 text-white hover:bg-indigo-500"
      }`}
    >
      {recording ? "Release to send" : busy ? "Processing…" : "Hold to speak"}
    </button>
  );
}

function CopilotContext({ analysis }: { analysis: TurnAnalysis | null }) {
  if (!analysis) {
    return <p className="text-xs text-slate-600">Awaiting the first customer turn…</p>;
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-indigo-600/80 px-3 py-1 text-xs font-semibold">
          {analysis.intent}
        </span>
        <span className="text-xs text-slate-400">{Math.round(analysis.confidence * 100)}%</span>
        {analysis.escalate && (
          <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold">
            ⚠ Escalate
          </span>
        )}
        <span className="text-xs text-slate-500">sentiment: {analysis.sentiment}</span>
      </div>

      {analysis.suggested_guidance.length > 0 && (
        <div>
          <h3 className="mb-1 text-xs font-semibold text-slate-300">Guidance</h3>
          <ol className="list-decimal space-y-1 pl-4 text-sm text-slate-300">
            {analysis.suggested_guidance.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      {analysis.required_documents.length > 0 && (
        <div>
          <h3 className="mb-1 text-xs font-semibold text-slate-300">Required documents</h3>
          <ul className="space-y-1 text-sm text-slate-300">
            {analysis.required_documents.map((d, i) => (
              <li key={i}>☐ {d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ReplyBar({
  value,
  onChange,
  onSend,
  busy,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend()}
        placeholder="Type your reply in English — it will be translated and spoken to the customer"
        className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
      />
      <button
        onClick={onSend}
        disabled={busy || !value.trim()}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}
