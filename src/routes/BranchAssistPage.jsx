import { useEffect, useState } from "react";
import { BankLogo } from "../components/BankLogo";
import { DashboardPanel } from "../components/DashboardPanel";
import { marathiDemoScript, gujaratiDemoScript, sessionDetails } from "../data/mockData";
import { synthesizeText, VOICES, translateTextToRegional } from "../services/elevenlabs";

function PlayAudioButton({ text, voiceId }) { // ...
  const [status, setStatus] = useState("idle");

  async function handlePlay() {
    if (status !== "idle") return;
    try {
      setStatus("loading");
      const url = await synthesizeText(text, voiceId);
      const audio = new Audio(url);

      audio.onended = () => setStatus("idle");
      audio.play();
      setStatus("playing");
    } catch (e) {
      console.error(e);
      setStatus("idle");
    }
  }

  return (
    <button onClick={handlePlay} disabled={status !== "idle"} className={`text-muted hover:text-bank-blue transition-colors ${status === 'loading' ? 'animate-pulse' : ''}`} title="Play Audio">
      {status === 'playing' ? (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-bank-blue" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 19h4.5a2 2 0 001.5-.7l4-4.5h0a2 2 0 000-2.6l-4-4.5a2 2 0 00-1.5-.7H5a2 2 0 00-2 2v9a2 2 0 002 2z"></path></svg>
      ) : (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      )}
    </button>
  );
}

function StatusPill({ children, active = false }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold max-w-[200px] truncate ${active
        ? "bg-bank-blue text-white"
        : "border border-stroke bg-white text-muted"
        }`}
    >
      {children}
    </span>
  );
}

// Accept the selectedLanguage passed from HomePage navigation state or props
export function BranchAssistPage({ navigate, selectedLanguage = "Marathi" }) {
  const [demoStep, setDemoStep] = useState(0);
  const [draftReply, setDraftReply] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Select the appropriate script
  const activeScript = selectedLanguage === "Gujarati" ? gujaratiDemoScript : marathiDemoScript;

  // Derived state from the current progress through activeScript
  const currentEvents = activeScript.slice(0, demoStep + 1);

  const customerSpeech = currentEvents
    .filter(e => e.type === "customer_speaking")
    .map(e => e.content);

  const translations = currentEvents
    .filter(e => e.type === "translation_complete")
    .map(e => e.content);

  const intentEvents = currentEvents
    .filter(e => e.type === "intent_detected" || e.type === "intent_updated");

  const activeIntent = intentEvents.length > 0 ? intentEvents[intentEvents.length - 1].content : null;

  // Auto-advance script logic
  useEffect(() => {
    if (demoStep >= activeScript.length - 1) return;

    const currentEvent = activeScript[demoStep];
    const nextEvent = activeScript[demoStep + 1];

    if (currentEvent.type === "customer_speaking" && nextEvent.type === "translation_complete") {
      const timer = setTimeout(() => {
        setDemoStep(s => s + 1);

        // Auto-play the English translation aloud for the staff immediately!
        if (nextEvent.content?.text) {
          setIsSynthesizing(true);
          synthesizeText(nextEvent.content.text, VOICES.STAFF)
            .then(url => {
              const audio = new Audio(url);
              setIsSynthesizing(false);
              audio.play().catch(e => console.error("Auto-play blocked", e));
            })
            .catch(e => {
              console.error("Auto-TTS failed", e);
              setIsSynthesizing(false);
            });
        }
      }, 1500); // 1.5s delay for translation to appear
      return () => clearTimeout(timer);
    }

    if (currentEvent.type === "translation_complete" && nextEvent.type.includes("intent")) {
      const timer = setTimeout(() => {
        setDemoStep(s => s + 1);
      }, 1200); // 1.2s delay for intent to be extracted
      return () => clearTimeout(timer);
    }

    if (currentEvent.type === "staff_speaking" && nextEvent.type === "customer_speaking") {
      // We wait for the user to trigger the next step manually by stopping the "listening"
      setIsListening(true);
    }
  }, [demoStep, activeScript]);

  function applySuggestedReply() {
    if (activeIntent) {
      setDraftReply(activeIntent.suggestedReplyEnglish);
      // Automatically trigger the audio playback directly on suggestion click!
      playAudio(activeIntent[`suggestedReply${selectedLanguage}`]);
    }
  }

  async function playAudio(overrideText) {
    if (isPlaying || isSynthesizing) return;

    setIsSynthesizing(true);
    let textToSpeak = "";
    const isOverrideStr = typeof overrideText === "string";

    if (isOverrideStr) {
      // Triggered automatically by clicking "Use This"
      textToSpeak = overrideText;
    } else if (draftReply) {
      // Triggered by clicking "Translate & Speak"
      if (activeIntent && draftReply === activeIntent.suggestedReplyEnglish) {
        textToSpeak = activeIntent[`suggestedReply${selectedLanguage}`];
      } else {
        // User typed a custom manual reply! Translate it on the fly:
        textToSpeak = await translateTextToRegional(draftReply, selectedLanguage);
      }
    } else {
      textToSpeak = activeIntent[`suggestedReply${selectedLanguage}`];
    }

    if (!textToSpeak) {
      console.error("Missing localized reply text to speak");
      setIsSynthesizing(false);
      return;
    }

    setDraftReply(""); // clear input early for UX snap

    try {
      // We use the CUSTOMER voice to speak back to them (like passing a phone/device) or a localized voice if available
      const url = await synthesizeText(textToSpeak, VOICES.CUSTOMER);
      const audio = new Audio(url);

      setIsSynthesizing(false);
      setIsPlaying(true);

      audio.onended = () => {
        setIsPlaying(false);
        // If the next step in the script is staff_speaking, advance
        if (activeScript[demoStep + 1]?.type === "staff_speaking") {
          setDemoStep(s => s + 1);
        }
      };

      await audio.play();
    } catch (e) {
      console.error("TTS fallback:", e);
      setIsSynthesizing(false);
      setIsPlaying(true);
      // fallback simulation
      setTimeout(() => {
        setIsPlaying(false);
        if (activeScript[demoStep + 1]?.type === "staff_speaking") {
          setDemoStep(s => s + 1);
        }
      }, 2500);
    }
  }

  function triggerCustomerReply() {
    setIsListening(false);
    setDemoStep(s => s + 1);
  }

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <header className="border-b border-stroke bg-white/95 backdrop-blur sticky top-0 z-40">
        <div className="shell flex min-h-[70px] flex-col gap-4 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <BankLogo />
            <div className="hidden h-8 w-px bg-stroke md:block" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-bank-red flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-bank-red animate-pulse" />
                Live Assist Mode
              </div>
              <div className="text-sm text-muted">
                Multilingual AI Copilot for frontline staff
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill>{`Customer: ${selectedLanguage}`}</StatusPill>
            <StatusPill>{`Staff: ${sessionDetails.staffLanguage}`}</StatusPill>
            <StatusPill active={!isListening && !isPlaying && !isSynthesizing}>
              {isSynthesizing ? "Synthesizing Audio" : isPlaying ? "System Speaking" : isListening ? "Listening..." : "Processing"}
            </StatusPill>
            <button
              onClick={() => navigate("/")}
              className="ml-0 rounded-lg border border-stroke px-4 py-2 text-sm font-semibold text-ink transition hover:border-bank-blue/30 hover:text-bank-blue xl:ml-2 bg-white"
            >
              End Session
            </button>
          </div>
        </div>
      </header>

      <main className="shell flex-1 flex flex-col gap-6 py-6 h-full">
        <section className="grid gap-6 xl:grid-cols-[2fr_2fr_3fr] flex-1">
          {/* Panel 1: Customer Speech */}
          <DashboardPanel
            title="Customer Speech"
            subtitle={`Live ${selectedLanguage} Transcript`}
          >
            <div className="flex flex-col gap-4 overflow-y-auto h-[60vh] pr-2">
              {customerSpeech.map((msg, idx) => (
                <div key={idx} className="rounded-2xl border border-stroke bg-white p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="pill">{msg.language}</span>
                    <PlayAudioButton text={msg.text} voiceId={VOICES.CUSTOMER} />
                  </div>
                  <div className="text-lg leading-8 font-medium text-ink">{msg.text}</div>
                </div>
              ))}
              {isListening && (
                <div onClick={triggerCustomerReply} className="cursor-pointer rounded-2xl border border-dashed border-bank-blue/30 bg-bank-blue/5 p-4 flex items-center justify-center gap-3 animate-pulse">
                  <div className="w-2 h-2 bg-bank-blue rounded-full" />
                  <div className="w-2 h-2 bg-bank-blue rounded-full animation-delay-200" />
                  <div className="w-2 h-2 bg-bank-blue rounded-full animation-delay-400" />
                  <span className="text-sm font-medium text-bank-blue ml-2">Listening to customer... (Click to force reply)</span>
                </div>
              )}
            </div>
          </DashboardPanel>

          {/* Panel 2: Live Translation */}
          <DashboardPanel
            title="Live Translation"
            subtitle="English interpretation"
          >
            <div className="flex flex-col gap-4 overflow-y-auto h-[60vh] pr-2">
              {translations.map((msg, idx) => {
                const isLatest = idx === translations.length - 1;
                return (
                  <div key={idx} className={`rounded-2xl border p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 ${isLatest ? 'border-bank-blue bg-highlight' : 'border-stroke bg-white'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="pill">{msg.language}</span>
                        {isLatest && <span className="text-[10px] uppercase tracking-wider font-bold text-bank-blue bg-bank-blue/10 px-2 py-0.5 rounded-full">New</span>}
                      </div>
                      <PlayAudioButton text={msg.text} voiceId={VOICES.STAFF} />
                    </div>
                    <div className="text-lg leading-8 font-medium text-ink">{msg.text}</div>
                  </div>
                );
              })}
            </div>
          </DashboardPanel>

          {/* Panel 3: AI Copilot Context */}
          <DashboardPanel
            title="AI Copilot Context"
            subtitle="Intent detection & suggested workflow"
          >
            <div className="flex flex-col gap-5 overflow-y-auto h-[60vh] pr-2">
              {!activeIntent ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted gap-4">
                  <div className="w-10 h-10 rounded-full border-2 border-stroke border-t-bank-blue animate-spin" />
                  <p className="text-sm font-medium">Analyzing conversation context...</p>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">

                  {/* Intent Header */}
                  <div className="rounded-2xl bg-white border border-bank-blue/20 p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-bank-blue" />
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-bank-blue mb-1">Detected Intent</div>
                        <div className="text-xl font-bold text-ink">{activeIntent.intent}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[22px] font-bold text-bank-blue">{activeIntent.confidence}%</span>
                        <span className="text-[10px] font-semibold uppercase text-muted tracking-wider">Confidence</span>
                      </div>
                    </div>
                  </div>

                  {/* Process Guide */}
                  <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm">
                    <div className="text-sm font-bold text-ink uppercase tracking-wider border-b border-stroke pb-3 mb-4">{activeIntent.processTitle}</div>
                    <div className="space-y-3">
                      {activeIntent.processSteps.map((step, idx) => {
                        const isCompleted = step.startsWith("✅") || step.startsWith("❌");
                        const cleanStep = step.replace("✅ ", "").replace("❌ ", "");

                        return (
                          <div key={idx} className={`flex items-center gap-3 ${isCompleted ? 'opacity-50' : ''}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted ? (step.startsWith("✅") ? 'bg-green-100 text-green-700' : 'bg-red-100 text-bank-red') : 'bg-highlight text-bank-blue'}`}>
                              {isCompleted ? (step.startsWith("✅") ? '✓' : '!') : idx + 1}
                            </div>
                            <span className={`text-[15px] font-medium ${isCompleted ? 'line-through text-muted' : 'text-ink'}`}>{cleanStep}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Requirements */}
                  {activeIntent.requiredDocuments && (
                    <div className="rounded-2xl border border-stroke bg-white p-4">
                      <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">Required Documents</div>
                      <div className="flex gap-2 flex-wrap">
                        {activeIntent.requiredDocuments.map(doc => (
                          <span key={doc} className="bg-page border border-stroke text-ink text-xs font-medium px-3 py-1.5 rounded-lg">{doc}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Staff Response with visual pointer for demo */}
                  <div className="rounded-2xl border-2 border-bank-blue/30 bg-highlight relative p-5 shadow-md">
                    {/* Pulsing visual cue pointing down to the input box to show where the staff attention should be */}
                    <button type="button" onClick={applySuggestedReply} className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-bank-blue text-white rounded-full flex items-center justify-center shadow-lg animate-bounce z-10 cursor-pointer hover:bg-bank-blue/90 hover:scale-110 transition-all focus:outline-none focus:ring-2 focus:ring-bank-blue focus:ring-offset-2">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                    </button>

                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-bold text-bank-blue uppercase tracking-wider">Suggested Response</div>
                      <button onClick={applySuggestedReply} className="text-[11px] font-bold bg-bank-blue text-white px-3 py-1 rounded-full hover:bg-bank-blue/90 transition-colors">
                        Use This
                      </button>
                    </div>

                    <div className="text-[15px] font-medium text-ink leading-relaxed mb-3">"{activeIntent.suggestedReplyEnglish}"</div>
                    <div className="text-[13px] text-muted italic border-t border-bank-blue/10 pt-3">
                      Translates to {selectedLanguage}: {activeIntent[`suggestedReply${selectedLanguage}`]}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </DashboardPanel>
        </section>

        {/* Unified Input and Control Footer */}
        <section className="surface-card flex flex-col md:flex-row items-center gap-4 p-4 shadow-lg border-bank-blue/10 z-20">
          <div className="flex-1 w-full relative">
            <input
              type="text"
              value={draftReply}
              onChange={(e) => setDraftReply(e.target.value)}
              placeholder="Type or select a generated response..."
              className="w-full h-14 bg-page border border-stroke rounded-xl px-5 text-[15px] font-medium outline-none focus:border-bank-blue/50 focus:ring-4 ring-bank-blue/5 transition-all"
            />
            {isSynthesizing && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-bank-blue font-bold text-xs uppercase tracking-wider">
                <div className="w-3.5 h-3.5 rounded-full border-[2.5px] border-bank-blue border-t-transparent animate-spin" />
                Synthesizing...
              </div>
            )}
            {isPlaying && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-bank-red font-bold text-xs uppercase tracking-wider">
                <div className="flex items-end gap-[1.5px] h-3 mr-1">
                  <span className="w-[3px] bg-bank-red rounded-full animate-pulse h-full" />
                  <span className="w-[3px] bg-bank-red rounded-full animate-pulse h-1/2 [animation-delay:-0.2s]" />
                  <span className="w-[3px] bg-bank-red rounded-full animate-pulse h-3/4 [animation-delay:-0.4s]" />
                  <span className="w-[3px] bg-bank-red rounded-full animate-pulse h-2/3 [animation-delay:-0.1s]" />
                </div>
                Speaking Response...
              </div>
            )}
          </div>
          <button
            onClick={playAudio}
            disabled={!draftReply || isPlaying || isSynthesizing}
            className={`h-14 px-8 rounded-xl font-bold text-white transition-all shadow-md flex items-center gap-3 shrink-0 ${!draftReply || isPlaying || isSynthesizing ? 'bg-muted cursor-not-allowed opacity-50' : 'bg-[linear-gradient(90deg,#00579c,#da251c)] hover:opacity-95 hover:scale-[1.02]'
              }`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 19h4.5a2 2 0 001.5-.7l4-4.5h0a2 2 0 000-2.6l-4-4.5a2 2 0 00-1.5-.7H5a2 2 0 00-2 2v9a2 2 0 002 2z"></path></svg>
            Translate & Speak
          </button>
        </section>
      </main>
    </div>
  );
}
