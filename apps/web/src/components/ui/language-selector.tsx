'use client';

import React from 'react';
import { useLanguage } from '../../i18n';
import { Globe } from 'lucide-react';
import { Language } from '../../i18n/types';

export function LanguageSelector({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  const options: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'te', label: 'తెలుగు' },
  ];

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`inline-flex items-center gap-1.5 bg-[#04142A] p-1 rounded-2xl border border-[#F4B400]/40 text-xs shadow-md transition-all ${className}`}
    >
      <div className="pl-1.5 pr-0.5 flex items-center text-[#F4B400]">
        <Globe className="w-3.5 h-3.5 shrink-0 animate-pulse" />
      </div>

      <div className="flex items-center gap-1">
        {options.map((opt) => {
          const isActive = language === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => setLanguage(opt.code)}
              aria-pressed={isActive}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#F4B400] to-yellow-400 text-[#04142A] font-black shadow-sm scale-105'
                  : 'text-slate-300 hover:text-amber-200 hover:bg-slate-800/60'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
