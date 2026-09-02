'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/language-context';
import { ImpactCard } from '../components/ui/impact-card';
import { api } from '../lib/api';
import {
  TrendingUp,
  Sprout,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
  CheckCircle2,
  Building2,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
} from 'lucide-react';

export default function UnifiedHomePage() {
  const { user, isAuthenticated } = useAuth();
  const { t, tCrop } = useLanguage();
  const [heroPriceData, setHeroPriceData] = useState<any>(null);

  useEffect(() => {
    api.get<any>('/prices/dashboard?cropName=Tomato')
      .then((data) => setHeroPriceData(data))
      .catch(() => {
        setHeroPriceData({
          crop: 'Tomato',
          todayPrice: { modalPrice: 2233, minPrice: 1950, maxPrice: 2450 },
          analytics: { sma7: 2213, trend: 'BULLISH', percentChange: 6.8 },
          sellingWindow: { recommendation: 'Sell within next 24-48 Hours', confidence: 'HIGH' },
          comparison: { bestNearbyMarket: { marketName: 'Lasalgaon APMC', netGainPerQtl: 96 } },
        });
      });
  }, []);

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      {/* 1. Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-950 via-slate-900 to-amber-900 rounded-3xl p-6 md:p-12 text-white shadow-2xl border border-amber-500/30">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            {t.heroPill}
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
            {t.heroHeadline}
          </h1>

          <p className="text-amber-100/90 text-sm md:text-base leading-relaxed max-w-2xl font-medium">
            {t.heroSubheadline}
          </p>

          {/* Action Gateway Buttons */}
          <div className="flex flex-wrap gap-3.5 pt-4">
            <Link
              href="/prices"
              className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 transition transform active:scale-95"
            >
              <TrendingUp className="w-4 h-4 text-slate-950" />
              {t.btnExplorePrices}
            </Link>

            <Link
              href={isAuthenticated && user?.role === 'FARMER' ? '/create-lot' : '/login'}
              className="bg-amber-600 hover:bg-amber-500 text-white font-black px-6 py-3.5 rounded-2xl text-sm flex items-center gap-2 shadow-lg shadow-amber-600/30 transition transform active:scale-95"
            >
              <Sprout className="w-4 h-4 text-yellow-300" />
              {t.btnStartSelling}
            </Link>

            <Link
              href="/browse-lots"
              className="bg-slate-900/90 hover:bg-slate-800 text-amber-200 border border-amber-500/30 font-black px-6 py-3.5 rounded-2xl text-sm flex items-center gap-2 transition"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              {t.btnSourceProduce}
            </Link>
          </div>
        </div>

        {/* Hero Live Mandi Card Widget */}
        <div className="mt-8 pt-6 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-amber-500/20 space-y-1">
            <div className="flex items-center justify-between text-xs text-amber-200 font-bold">
              <span>{tCrop('Tomato')} ({t.todayRate})</span>
              <span className="text-amber-400 font-black">▲ +6.8%</span>
            </div>
            <div className="text-2xl font-black text-white">
              ₹{heroPriceData?.todayPrice?.modalPrice || 2233} <span className="text-xs font-normal text-amber-200">/ {t.commonQuintal}</span>
            </div>
            <p className="text-[10px] text-amber-200/80">Nashik APMC</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-amber-500/20 space-y-1">
            <div className="flex items-center justify-between text-xs text-amber-200 font-bold">
              <span>{t.nearbyArbitrage}</span>
              <span className="text-yellow-400 font-black">+₹96 {t.netGain}</span>
            </div>
            <div className="text-2xl font-black text-yellow-300">
              ₹2,380 <span className="text-xs font-normal text-amber-200">/ {t.commonQuintal}</span>
            </div>
            <p className="text-[10px] text-amber-200/80">Lasalgaon APMC (24 {t.commonKm})</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-amber-500/20 space-y-1">
            <div className="flex items-center justify-between text-xs text-amber-200 font-bold">
              <span>{t.sellingWindow}</span>
              <span className="bg-amber-400/30 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded">
                {t.sellingWindowOptimal}
              </span>
            </div>
            <div className="text-sm font-black text-white leading-snug">
              {heroPriceData?.sellingWindow?.recommendation || 'Sell within next 24-48 Hours'}
            </div>
            <p className="text-[10px] text-amber-300">{t.sellingWindowDesc}</p>
          </div>
        </div>
      </div>

      {/* 2. Today's Impact Card Component */}
      <ImpactCard />

      {/* 3. How Vanijya Works (4 Transparent Steps) */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {t.howItWorksTitle}
          </h2>
          <p className="text-xs md:text-sm text-slate-600 font-medium">
            {t.howItWorksSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm space-y-3 transition-card">
            <div className="w-10 h-10 bg-amber-100 text-amber-900 rounded-2xl flex items-center justify-center font-black">
              1
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">{t.step1Title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t.step1Desc}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm space-y-3 transition-card">
            <div className="w-10 h-10 bg-yellow-100 text-yellow-900 rounded-2xl flex items-center justify-center font-black">
              2
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">{t.step2Title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t.step2Desc}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm space-y-3 transition-card">
            <div className="w-10 h-10 bg-amber-200 text-amber-950 rounded-2xl flex items-center justify-center font-black">
              3
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">{t.step3Title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t.step3Desc}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm space-y-3 transition-card">
            <div className="w-10 h-10 bg-amber-600 text-white rounded-2xl flex items-center justify-center font-black">
              4
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">{t.step4Title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t.step4Desc}</p>
          </div>
        </div>
      </div>

      {/* 4. Farmer Benefits vs Buyer Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Farmer Benefits */}
        <div className="bg-gradient-to-br from-amber-50 via-yellow-50/60 to-orange-50/40 p-6 md:p-8 rounded-3xl border border-amber-300/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 text-slate-950 rounded-2xl flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Sprout className="w-5 h-5 text-slate-950" />
            </div>
            <h3 className="font-black text-xl text-amber-950">{t.farmerBenefitsTitle}</h3>
          </div>

          <ul className="space-y-3 text-xs font-semibold text-amber-950">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
              <span><strong>{t.farmerBenefit1Title}:</strong> {t.farmerBenefit1Desc}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
              <span><strong>{t.farmerBenefit2Title}:</strong> {t.farmerBenefit2Desc}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
              <span><strong>{t.farmerBenefit3Title}:</strong> {t.farmerBenefit3Desc}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
              <span><strong>{t.farmerBenefit4Title}:</strong> {t.farmerBenefit4Desc}</span>
            </li>
          </ul>

          <div className="pt-2">
            <Link
              href="/prices"
              className="inline-flex items-center gap-1.5 text-xs font-black text-amber-900 hover:underline"
            >
              {t.explorePriceDiscoveryLink}
            </Link>
          </div>
        </div>

        {/* Buyer Benefits */}
        <div className="bg-gradient-to-br from-slate-50 via-amber-50/30 to-yellow-50/40 p-6 md:p-8 rounded-3xl border border-amber-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 text-amber-400 rounded-2xl flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-black text-xl text-slate-900">{t.buyerBenefitsTitle}</h3>
          </div>

          <ul className="space-y-3 text-xs font-semibold text-slate-800">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>{t.buyerBenefit1Title}:</strong> {t.buyerBenefit1Desc}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>{t.buyerBenefit2Title}:</strong> {t.buyerBenefit2Desc}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>{t.buyerBenefit3Title}:</strong> {t.buyerBenefit3Desc}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>{t.buyerBenefit4Title}:</strong> {t.buyerBenefit4Desc}</span>
            </li>
          </ul>

          <div className="pt-2">
            <Link
              href="/browse-lots"
              className="inline-flex items-center gap-1.5 text-xs font-black text-amber-900 hover:underline"
            >
              {t.exploreMarketplaceLink}
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Policy & Government Alignment Banner */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-amber-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-black text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>{t.govtAlignmentTitle}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {t.govtAlignmentDesc}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="bg-amber-50 text-amber-900 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-amber-200">
            {t.badgeAgmarknetSynced}
          </span>
          <span className="bg-amber-50 text-amber-900 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-amber-200">
            {t.badgeEnamCompliant}
          </span>
        </div>
      </div>
    </div>
  );
}
