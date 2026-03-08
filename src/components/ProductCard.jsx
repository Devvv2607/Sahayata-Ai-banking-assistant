function ProductIcon({ icon }) {
  if (icon === "loan") {
    return (
      <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none">
        <rect x="7" y="10" width="34" height="28" rx="8" stroke="currentColor" strokeWidth="2.4" />
        <path d="M16 24h16M24 16v16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "msme") {
    return (
      <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none">
        <path d="M10 36V18l14-8 14 8v18" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M18 36V24h12v12" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "gold") {
    return (
      <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none">
        <path d="M12 15h24l-5 18H17l-5-18Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M19 21h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none">
      <rect x="10" y="10" width="28" height="28" rx="8" stroke="currentColor" strokeWidth="2.4" />
      <path d="M16 20h16M16 28h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function ProductCard({ title, description, icon }) {
  return (
    <article className="surface-card group flex flex-col p-6 h-full relative cursor-pointer">
      <div className="flex justify-between items-start mb-4 gap-4">
        <h3 className="text-xl font-bold text-bank-blue leading-tight pt-1">{title}</h3>
        <div className="shrink-0 flex items-center justify-center w-[54px] h-[54px] rounded-full bg-bank-red/[0.08] text-bank-red group-hover:scale-110 group-hover:bg-bank-red/15 transition-all duration-300">
          <ProductIcon icon={icon} />
        </div>
      </div>
      
      <p className="text-[15px] leading-relaxed text-muted mb-6 flex-grow">{description}</p>
      
      <div className="mt-auto flex items-center text-bank-red font-semibold text-sm">
         <span className="flex items-center gap-1 group-hover:gap-2 transition-all">
           View <span aria-hidden="true" className="text-lg leading-none">&rsaquo;</span>
         </span>
      </div>
    </article>
  );
}
