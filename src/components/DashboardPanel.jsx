export function DashboardPanel({ title, subtitle, children }) {
  return (
    <section className="surface-card flex h-full min-h-[380px] flex-col overflow-hidden">
      <div className="border-b border-stroke px-5 py-4">
        <h2 className="text-[18px] font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </section>
  );
}
