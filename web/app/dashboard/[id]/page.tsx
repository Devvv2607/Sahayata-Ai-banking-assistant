"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { type ConversationDetail, getConversation } from "@/lib/api";

export default function ConversationView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getConversation(id, controller.signal)
      .then(setDetail)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"));
    return () => controller.abort();
  }, [id]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-5 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Transcript</h1>
          {detail && (
            <p className="text-xs text-slate-400">
              {detail.primary_intent ?? "—"} · {new Date(detail.started_at).toLocaleString()}
              {detail.escalated && (
                <span className="ml-2 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold">
                  ESCALATED
                </span>
              )}
            </p>
          )}
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
        >
          ← All conversations
        </Link>
      </header>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {detail && (
        <ol className="space-y-3">
          {detail.utterances.map((u, i) => (
            <li
              key={i}
              className={`rounded-lg border p-3 ${
                u.speaker === "customer"
                  ? "border-slate-800 bg-slate-900/50"
                  : "border-emerald-900 bg-emerald-950/30"
              }`}
            >
              <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">
                {u.speaker} · {u.original_lang}
                {u.sentiment ? ` · ${u.sentiment}` : ""}
              </p>
              <p className="text-sm text-slate-100">{u.original_text}</p>
              {u.translated_text && (
                <p className="mt-1 text-sm text-slate-400">
                  → {u.translated_text}{" "}
                  <span className="text-[10px] text-slate-600">({u.translated_lang})</span>
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
