"use client";

import { useEffect, useState } from "react";
import { fetchHealth, type Health } from "@/lib/api";

type Status =
  | { state: "loading" }
  | { state: "connected"; health: Health }
  | { state: "error"; message: string };

export default function Home() {
  const [status, setStatus] = useState<Status>({ state: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetchHealth(controller.signal)
      .then((health) => setStatus({ state: "connected", health }))
      .catch((err: unknown) =>
        setStatus({
          state: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        }),
      );
    return () => controller.abort();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">🪔 Sahayata AI</h1>
        <p className="mt-3 max-w-xl text-slate-400">
          Multilingual voice copilot for bank branch officers.
        </p>
      </div>

      <ConnectivityCard status={status} />
    </main>
  );
}

function ConnectivityCard({ status }: { status: Status }) {
  const base =
    "rounded-xl border px-6 py-4 text-sm font-medium shadow-lg w-full max-w-md text-center";

  if (status.state === "loading") {
    return (
      <div className={`${base} border-slate-700 bg-slate-800/50 text-slate-300`}>
        Checking backend connection…
      </div>
    );
  }

  if (status.state === "error") {
    return (
      <div className={`${base} border-red-800 bg-red-950/40 text-red-300`}>
        <p className="font-semibold">⚠️ Backend not reachable</p>
        <p className="mt-1 text-xs text-red-400/80">{status.message}</p>
      </div>
    );
  }

  const { health } = status;
  return (
    <div className={`${base} border-emerald-800 bg-emerald-950/40 text-emerald-300`}>
      <p className="font-semibold">✅ Connected to backend</p>
      <p className="mt-1 text-xs text-emerald-400/80">
        {health.service} v{health.version} · {health.environment}
      </p>
    </div>
  );
}
