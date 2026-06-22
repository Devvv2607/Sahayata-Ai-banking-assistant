"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type ConversationListItem, listConversations } from "@/lib/api";

export default function Dashboard() {
  const [items, setItems] = useState<ConversationListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    listConversations(undefined, controller.signal)
      .then(setItems)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"));
    return () => controller.abort();
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🪔 Conversations</h1>
          <p className="text-xs text-slate-400">Branch dashboard</p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
        >
          ← Copilot
        </Link>
      </header>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {items === null && !error && <p className="text-sm text-slate-500">Loading…</p>}

      {items?.length === 0 && (
        <p className="text-sm text-slate-500">
          No conversations yet. Start one in the copilot.
        </p>
      )}

      {items && items.length > 0 && (
        <ul className="divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/${c.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/50"
              >
                <div>
                  <p className="text-sm font-medium">
                    {c.primary_intent ?? "—"}{" "}
                    {c.escalated && (
                      <span className="ml-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold">
                        ESCALATED
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(c.started_at).toLocaleString()} · {c.utterance_count} turns
                  </p>
                </div>
                <span className="font-mono text-[10px] text-slate-600">
                  {c.id.slice(0, 8)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
