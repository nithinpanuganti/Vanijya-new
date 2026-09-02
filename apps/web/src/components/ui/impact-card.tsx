'use client';

import React from 'react';
import { useLanguage } from '../../lib/language-context';
import { Sparkles } from 'lucide-react';

export function ImpactCard() {
  const { t } = useLanguage();

  return (
    <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white rounded-3xl p-5 md:p-6 shadow-xl border border-amber-500/30 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center font-bold shadow-md shadow-amber-400/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-sm md:text-base text-white tracking-tight">
              {t.impactTitle}
            </h3>
            <p className="text-[11px] text-amber-200/90">
              {t.impactSubtitle}
            </p>
          </div>
        </div>
        <span className="bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
          {t.zeroCommissionBadge}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-amber-500/20">
          <span className="text-[10px] text-amber-200 font-bold block">{t.incomeBoost}</span>
          <span className="text-lg font-black text-amber-300 mt-0.5 block">+11.4%</span>
        </div>
        <div className="bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-amber-500/20">
          <span className="text-[10px] text-amber-200 font-bold block">{t.arbitrageGain}</span>
          <span className="text-lg font-black text-yellow-400 mt-0.5 block">+₹96/Qtl</span>
        </div>
        <div className="bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-amber-500/20">
          <span className="text-[10px] text-amber-200 font-bold block">{t.commissionSaved}</span>
          <span className="text-lg font-black text-white mt-0.5 block">₹19,125</span>
        </div>
        <div className="bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-amber-500/20">
          <span className="text-[10px] text-amber-200 font-bold block">{t.connectedMandis}</span>
          <span className="text-lg font-black text-amber-300 mt-0.5 block">8 APMCs</span>
        </div>
      </div>
    </div>
  );
}
