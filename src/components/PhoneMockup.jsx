export function PhoneMockup() {
  return (
    <div className="relative mx-auto flex w-full max-w-[340px] justify-center">
      <div className="absolute inset-x-8 top-5 h-40 rounded-full bg-bank-blue/10 blur-3xl" />
      <div className="relative w-[285px] rounded-[36px] border-[10px] border-slate-900 bg-slate-900 p-2 shadow-[0_30px_60px_rgba(0,87,156,0.18)]">
        <div className="mb-2 flex justify-center">
          <div className="h-1.5 w-20 rounded-full bg-slate-700" />
        </div>
        <div className="overflow-hidden rounded-[28px] bg-white">
          <div className="bg-bank-blue px-5 py-4 text-white">
            <div className="text-xs font-medium uppercase tracking-[0.24em] text-white/75">
              Smart Banking
            </div>
            <div className="mt-2 text-lg font-semibold">Banking that feels guided</div>
          </div>
          <div className="space-y-4 p-4">
            <div className="rounded-2xl bg-highlight p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-bank-blue">
                Branch Assist
              </div>
              <div className="mt-2 text-sm font-semibold text-ink">
                Multilingual voice support at your nearest branch.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-stroke p-3">
                <div className="text-[11px] font-medium text-muted">Accounts</div>
                <div className="mt-1 text-sm font-semibold text-ink">Open in branch</div>
              </div>
              <div className="rounded-2xl border border-stroke p-3">
                <div className="text-[11px] font-medium text-muted">Loans</div>
                <div className="mt-1 text-sm font-semibold text-ink">Check offers</div>
              </div>
            </div>
            <div className="rounded-2xl border border-stroke px-4 py-3">
              <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                <span>Live Help</span>
                <span className="rounded-full bg-bank-red/10 px-2 py-1 text-bank-red">Active</span>
              </div>
              <div className="mt-3 flex items-end gap-1">
                {[16, 28, 18, 34, 22, 30, 12].map((height) => (
                  <span
                    key={height}
                    className="w-2 rounded-full bg-bank-blue/75"
                    style={{ height }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
