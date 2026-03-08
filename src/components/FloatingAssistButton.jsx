import { useState } from "react";
import { languages } from "../data/mockData";

export function FloatingAssistButton({ onClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  function handleLanguageSelect(langName) {
    // Only Marathi and Gujarati are supported in the mock demo
    if (langName !== "Marathi" && langName !== "Gujarati") {
      alert("This language is not supported in the current demo version.");
      return;
    }

    setSelectedLanguage(langName);
    setIsOpen(false);
    setIsListening(true);

    // Simulate detecting a banking intent after 3 seconds, then navigate
    setTimeout(() => {
      setIsListening(false);
      onClick(langName); // Pass language to the dashboard
    }, 3000);
  }

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col flex-col-reverse items-end gap-4 sm:bottom-8 sm:right-6 lg:bottom-10 lg:right-10">
      <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => !isListening && setIsOpen(!isOpen)} role="button">
        <div className={`rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] shadow-sm transition-colors ${isListening ? "text-bank-red animate-pulse border border-bank-red/20" : "text-bank-blue"
          }`}>
          {isListening ? `Listening (${selectedLanguage})...` : "Branch Assist"}
        </div>

        <div className="relative">
          {/* Ripple effect when listening */}
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-bank-red/30 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
              <div className="absolute inset-0 rounded-full bg-bank-red/20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_100ms]" />
            </>
          )}

          <div
            className={`relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-[0_18px_44px_rgba(0,87,156,0.38)] transition-all hover:scale-[1.02] ${isListening ? "bg-bank-red scale-[1.05] shadow-[0_18px_44px_rgba(218,37,28,0.4)]" : "bg-bank-blue hover:bg-bank-blue/95"
              }`}
          >
            {isListening ? (
              <svg viewBox="0 0 24 24" className="h-7 w-7 animate-pulse" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : isOpen ? (
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
                <path
                  d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3M8.5 20h7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Language Selection Modal */}
      {isOpen && (
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-stroke p-5 w-80 animate-in slide-in-from-bottom-4 fade-in duration-200 origin-bottom-right">
          <div className="mb-4">
            <h3 className="text-bank-blue font-bold text-lg leading-tight">Select Customer Language</h3>
            <p className="text-muted text-xs mt-1">Which language is the customer speaking?</p>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
            {languages.map((lang) => {
              // We make all look clickable in UI, but only Marathi/Gujarati actually work 
              return (
                <button
                  key={lang.name}
                  onClick={() => handleLanguageSelect(lang.name)}
                  className="text-left px-3 py-2.5 rounded-xl border border-stroke hover:border-bank-blue hover:bg-bank-blue/5 transition-all text-sm font-semibold text-ink"
                >
                  {lang.name}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-stroke flex items-center justify-between text-xs text-muted font-medium">
            <span>Auto-detect is disabled</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> System Online</span>
          </div>
        </div>
      )}
    </div>
  );
}
