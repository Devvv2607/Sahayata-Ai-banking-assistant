import { useState } from "react";
import {
  bankingCategories,
  languages,
  productCards,
  topNavItems
} from "../data/mockData";
import { BankLogo } from "../components/BankLogo";
import { FloatingAssistButton } from "../components/FloatingAssistButton";
import { LanguageSelector } from "../components/LanguageSelector";
import { PhoneMockup } from "../components/PhoneMockup";
import { ProductCard } from "../components/ProductCard";

export function HomePage({ navigate }) {
  const [selectedLanguage, setSelectedLanguage] = useState("Marathi");

  return (
    <div className="relative pb-40 min-h-screen bg-page">
      {/* Top Banner section */}
      <div className="bg-page border-b border-stroke">
        <div className="shell flex items-end justify-between h-11 text-sm font-medium text-muted">
          <div className="flex gap-2">
            {topNavItems.map((item, idx) => (
              <button
                key={item}
                className={`transition px-6 py-2.5 rounded-t-lg border-x border-t border-transparent hover:text-bank-blue ${idx === 0
                  ? "text-bank-blue bg-white border-stroke relative top-[1px]"
                  : ""
                  }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-6 pb-2.5">
            <button className="hover:text-bank-blue flex items-center gap-2 transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              Contact Us
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white sticky top-0 z-40 shadow-sm">
        <div className="shell flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <BankLogo />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center">
              <label className="flex h-[42px] items-center gap-2 rounded-l-full border border-stroke border-r-0 bg-page pl-5 pr-2 focus-within:ring-2 focus-within:ring-bank-blue/20 transition-all">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full min-w-[160px] bg-transparent outline-none placeholder:text-muted/70 text-sm"
                />
              </label>
              <button className="h-[42px] px-4 rounded-r-full border border-stroke bg-page hover:bg-stroke/50 transition-colors flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-bank-blue" strokeWidth="2.5" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
                </svg>
              </button>
            </div>
            <button className="btn-gradient py-2 text-sm shadow-[0_4px_10px_rgba(0,87,156,0.2)]">
              Internet Banking
            </button>
          </div>
        </div>

        <div className="border-t border-stroke/50">
          <div className="shell flex min-h-[56px] flex-wrap items-center gap-x-8 gap-y-3 py-2 lg:py-0">
            {bankingCategories.map((item) => (
              <button
                key={item}
                type="button"
                className="text-sm font-semibold text-ink transition hover:text-bank-red relative group py-[18px]"
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-[3px] bg-bank-red transition-all group-hover:w-full rounded-t-full"></span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="shell flex flex-col gap-10">
        {/* Call to action bar matching second screenshot */}
        <section className="mt-8 flex flex-wrap gap-4 items-center justify-end">
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-end items-center">
            <div className="max-w-[260px] bg-page rounded-lg flex border border-stroke p-1 h-11 items-center overflow-hidden focus-within:ring-2 ring-bank-blue/20">
              <input type="email" placeholder="Enter Your Email id" className="bg-transparent px-3 outline-none flex-grow text-[15px] placeholder:text-muted" />
            </div>
            <button className="btn-gradient py-2.5 px-6 shadow-md shadow-bank-red/10">Submit</button>
            <button className="btn-gradient py-2.5 px-6 shadow-md shadow-bank-red/10">Lodge a Complaint</button>
            <button className="btn-gradient py-2.5 px-6 shadow-md shadow-bank-red/10">Report Unauthorised Transaction</button>
          </div>
        </section>

        <section className="surface-card overflow-hidden relative border-0 ring-1 ring-stroke ring-inset">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,87,156,0.04),rgba(218,37,28,0.04))]" />
          <div className="grid min-h-[460px] gap-12 px-8 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-14 lg:py-16 relative z-10">
            <div className="flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-white backdrop-blur shadow-sm w-fit mb-6 text-sm font-semibold text-bank-blue uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-bank-red animate-pulse" />
                Public Banking Website
              </div>
              <h1 className="text-[42px] leading-[1.15] font-bold text-bank-blue tracking-tight">
                A smoother way to <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-bank-blue to-bank-red">banking begins today</span>
              </h1>
              <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-ink/75">
                A cleaner Union Bank-inspired homepage designed for faster discovery, stronger
                branch guidance, and a direct path into multilingual assistance for staff.
              </p>
              <div className="mt-10 flex gap-4">
                <button className="btn-gradient px-8 shadow-lg shadow-bank-red/20 shadow-none">Apply Now</button>
                <button className="px-8 py-2.5 rounded-full font-semibold text-bank-blue bg-bank-blue/5 hover:bg-bank-blue/10 transition-colors border border-bank-blue/20">
                  Open Account
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-bank-blue/10 to-bank-red/10 rounded-[40px] rotate-3 scale-[1.03]" />
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-[40px] border border-white" />
              <div className="relative z-10 p-6">
                <PhoneMockup />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex flex-col gap-1.5 mb-8">
            <h2 className="text-[26px] font-bold text-bank-blue uppercase tracking-wide">
              Digital Banking Services
            </h2>
            <p className="text-muted font-medium text-[17px]">Convenient. Futuristic. Personalized</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {productCards.map((card) => (
              <ProductCard key={card.title} {...card} />
            ))}
          </div>
        </section>
      </main>

      <LanguageSelector
        languages={languages}
        selectedLanguage={selectedLanguage}
        onSelect={setSelectedLanguage}
      />
      <FloatingAssistButton onClick={(lang) => navigate(`/branch-assist?lang=${lang}`)} />
    </div>
  );
}
