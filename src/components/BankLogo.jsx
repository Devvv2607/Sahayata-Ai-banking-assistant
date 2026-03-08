export function BankLogo({ compact = false, className = "" }) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <div className="grid h-11 w-11 place-items-center rounded-xl border border-stroke bg-white shadow-sm">
        <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-bank-blue">
          <div className="absolute inset-y-0 right-0 w-[42%] bg-bank-red" />
          <div className="absolute left-[7px] top-[7px] h-4 w-4 rounded-sm border-[3px] border-r-0 border-white" />
        </div>
      </div>

      {!compact ? (
        <div className="leading-tight">
          <div className="text-[0.72rem] font-semibold uppercase tracking-[0.35em] text-bank-red">
            Union Bank
          </div>
          <div className="text-sm font-semibold text-ink">of India</div>
        </div>
      ) : null}
    </div>
  );
}
