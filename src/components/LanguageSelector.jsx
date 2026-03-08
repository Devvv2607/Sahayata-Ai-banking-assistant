import { useState } from "react";

export function LanguageSelector({
  languages,
  selectedLanguage,
  onSelect
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="fixed bottom-6 left-4 z-30 w-[260px] sm:bottom-8 sm:left-6 lg:bottom-10 lg:left-10">
      {isOpen ? (
        <div className="mb-3 rounded-2xl border border-bank-blue/15 bg-white/95 p-3 shadow-[0_20px_50px_rgba(15,23,42,0.15)] backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Language Support
              </div>
              <div className="text-sm font-semibold text-ink">Select customer language</div>
            </div>
            <span className="rounded-full bg-highlight px-2 py-1 text-[11px] font-medium text-bank-blue">
              Hindi + Marathi live
            </span>
          </div>
          <div className="grid max-h-[420px] grid-cols-2 gap-2 overflow-y-auto pr-1">
            {languages.map((language) => {
              const isActive = language.active;
              const isSelected = selectedLanguage === language.name;

              return (
                <button
                  key={language.name}
                  type="button"
                  disabled={!isActive}
                  onClick={() => onSelect(language.name)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                    isSelected
                      ? "border-bank-blue bg-highlight text-bank-blue"
                      : "border-stroke bg-white text-ink"
                  } ${isActive ? "hover:border-bank-blue/40 hover:bg-highlight/60" : "cursor-not-allowed opacity-50"}`}
                >
                  {language.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex h-[52px] w-full items-center justify-between rounded-[10px] bg-bank-blue px-4 text-left text-white shadow-[0_18px_40px_rgba(0,87,156,0.28)] transition hover:bg-bank-blue/95"
      >
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/70">Customer Language</div>
          <div className="text-sm font-semibold">{selectedLanguage}</div>
        </div>
        <span className="text-xl leading-none">{isOpen ? "−" : "+"}</span>
      </button>
    </div>
  );
}
