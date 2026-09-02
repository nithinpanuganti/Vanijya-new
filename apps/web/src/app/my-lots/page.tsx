'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useLanguage } from '../../lib/language-context';
import { StatusBadge } from '../../components/ui/status-badge';
import { CardSkeleton } from '../../components/ui/skeleton';
import { formatINR } from '@vanijya/shared-utils';
import {
  Package,
  PlusCircle,
  Gavel,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  AlertCircle,
  LogIn,
  Flame,
  CheckCircle2,
  Clock,
  XCircle,
  Layers,
  ShoppingBag,
  CreditCard,
  UserCheck,
} from 'lucide-react';

type LotTab = 'ALL' | 'BIDDING' | 'SOLD' | 'OPEN' | 'CANCELLED';

export default function MyLotsPage() {
  const { user, isAuthenticated } = useAuth();
  const { t, tCrop } = useLanguage();
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LotTab>('ALL');

  const fetchLots = () => {
    api.get<any[]>('/lots')
      .then((res) => {
        if (res) {
          const userLots = user?.id ? res.filter((l) => l.farmerId === user.id || l.farmer?.name === user.name) : res;
          setLots(userLots.length > 0 ? userLots : res);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLots();
    const interval = setInterval(fetchLots, 10000);
    return () => clearInterval(interval);
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-amber-200 shadow-md text-center space-y-4 my-8">
        <div className="w-14 h-14 bg-amber-100 text-amber-900 rounded-full flex items-center justify-center mx-auto">
          <LogIn className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">{t.farmerLoginRequiredTitle}</h2>
        <p className="text-xs text-slate-600">{t.farmerLoginRequiredDesc}</p>
        <div className="pt-2">
          <Link
            href="/login"
            className="block w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black py-3 rounded-2xl text-xs transition shadow"
          >
            {t.btnSignIn}
          </Link>
        </div>
      </div>
    );
  }

  // Filter lots according to tab
  const filteredLots = lots.filter((lot) => {
    if (activeTab === 'ALL') return true;
    return lot.status === activeTab;
  });

  const countAll = lots.length;
  const countBidding = lots.filter((l) => l.status === 'BIDDING').length;
  const countSold = lots.filter((l) => l.status === 'SOLD').length;
  const countOpen = lots.filter((l) => l.status === 'OPEN').length;
  const countCancelled = lots.filter((l) => l.status === 'CANCELLED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-200/80 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {t.activeLotsTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{t.activeLotsSubtitle}</p>
        </div>

        <Link
          href="/create-lot"
          className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-md shadow-amber-500/25 transition transform active:scale-95 self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-slate-950" />
          {t.btnPublishLot}
        </Link>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'ALL'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white border border-amber-200 text-slate-600 hover:bg-amber-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          {t.tabAllListings}
          <span className={`text-[10px] px-2 py-0.2 rounded-full ${activeTab === 'ALL' ? 'bg-slate-950 text-amber-400' : 'bg-amber-100 text-slate-700'}`}>
            {countAll}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('BIDDING')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'BIDDING'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
              : 'bg-white border border-amber-200 text-slate-600 hover:bg-amber-50'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500" />
          {t.tabActiveBidding}
          <span className={`text-[10px] px-2 py-0.2 rounded-full ${activeTab === 'BIDDING' ? 'bg-slate-950 text-amber-400' : 'bg-amber-100 text-slate-700'}`}>
            {countBidding}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('SOLD')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'SOLD'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white border border-amber-200 text-slate-600 hover:bg-amber-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {t.tabSoldFinalized}
          <span className={`text-[10px] px-2 py-0.2 rounded-full ${activeTab === 'SOLD' ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-50 text-emerald-800'}`}>
            {countSold}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('OPEN')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'OPEN'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white border border-amber-200 text-slate-600 hover:bg-amber-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          {t.tabOpenAwaiting}
          <span className={`text-[10px] px-2 py-0.2 rounded-full ${activeTab === 'OPEN' ? 'bg-slate-950 text-amber-400' : 'bg-amber-100 text-slate-700'}`}>
            {countOpen}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CANCELLED')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'CANCELLED'
              ? 'bg-slate-700 text-white shadow-md'
              : 'bg-white border border-amber-200 text-slate-600 hover:bg-amber-50'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          {t.tabCancelled}
          <span className={`text-[10px] px-2 py-0.2 rounded-full ${activeTab === 'CANCELLED' ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            {countCancelled}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredLots.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-amber-200 shadow-sm text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-amber-50 text-amber-700 rounded-3xl flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900">
              {t.noLotsInTab}
            </h2>
            <p className="text-xs text-slate-500">
              {activeTab === 'BIDDING'
                ? t.emptyBiddingDesc
                : activeTab === 'SOLD'
                ? t.emptySoldDesc
                : t.emptyGeneralDesc}
            </p>
          </div>
          <Link
            href="/create-lot"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs shadow-md transition"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            {t.btnPublishLot}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLots.map((lot) => {
            const bidsCount = lot.bids?.length || lot._count?.bids || 0;
            const highestBid = lot.highestBid || (lot.bids && lot.bids.length > 0 ? Math.max(...lot.bids.map((b: any) => b.price)) : null);
            const isBidding = lot.status === 'BIDDING';
            const isSold = lot.status === 'SOLD';

            return (
              <div
                key={lot.id}
                className={`bg-white p-5 rounded-3xl border shadow-sm transition space-y-4 flex flex-col justify-between transition-card ${
                  isBidding
                    ? 'border-orange-300 ring-2 ring-orange-400/20'
                    : isSold
                    ? 'border-emerald-300 bg-gradient-to-b from-white to-emerald-50/20'
                    : 'border-amber-200 hover:border-amber-500 hover:shadow-md'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900 tracking-tight">
                        {tCrop(lot.crop?.name) || lot.crop?.name || 'Crop'} ({lot.quantity} {lot.unit === 'QUINTAL' || !lot.unit ? t.commonQuintal : lot.unit === 'KG' ? t.commonKg : lot.unit === 'TONNE' ? t.commonTonne : lot.unit})
                      </span>
                      {isBidding && (
                        <span className="bg-orange-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <Flame className="w-3 h-3 fill-slate-950" /> {t.liveOffersBadge}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={lot.status} />
                  </div>

                  {/* ACTIVE BIDDING SPECIFIC VIEW */}
                  {isBidding && (
                    <div className="p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-orange-950 flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-orange-600 fill-orange-500" />
                          {t.activelyReceivingOffers}
                        </span>
                        <span className="bg-orange-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full">
                          {bidsCount} {t.offersReceivedCount}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-orange-200/60">
                        <div>
                          <span className="text-slate-500 text-[10px] font-bold block">{t.askingPriceLabel}</span>
                          <span className="font-black text-slate-900">₹{lot.expectedPrice}/{t.commonQuintal}</span>
                        </div>
                        <div>
                          <span className="text-orange-900 text-[10px] font-bold block">{t.topBuyerOfferLabel}</span>
                          <span className="font-black text-orange-800 text-sm">
                            {highestBid ? `₹${highestBid}/${t.commonQuintal}` : t.offersArrivingLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SOLD SPECIFIC VIEW */}
                  {isSold && lot.transaction && (
                    <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-300 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          {t.finalizedSaleContract}
                        </span>
                        <span className="bg-emerald-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full">
                          {t.statusSoldLocked}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-emerald-200">
                        <div>
                          <span className="text-slate-400 text-[9px] font-bold block">{t.acceptedPriceLabel}</span>
                          <span className="font-black text-emerald-900">₹{lot.transaction.agreedPrice}/{t.commonQuintal}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[9px] font-bold block">{t.soldQtyLabel}</span>
                          <span className="font-black text-slate-900">{lot.transaction.quantity} {t.commonQuintal}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[9px] font-bold block">{t.contractValueLabel}</span>
                          <span className="font-black text-emerald-800">{formatINR(lot.transaction.totalAmount)}</span>
                        </div>
                      </div>
                      <div className="pt-1 flex items-center justify-between text-[11px] text-emerald-900 font-bold border-t border-emerald-200">
                        <span>{t.buyerLabel}: {lot.transaction.buyer?.name || 'FreshCart Agro Ltd.'}</span>
                        <span className="flex items-center gap-1">
                          {t.paymentLabel}: <strong className="text-emerald-700">{lot.transaction.payment?.status || t.statusSettledPaid}</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Standard Pricing Grid if Open or Cancelled */}
                  {!isBidding && !isSold && (
                    <div className="grid grid-cols-2 gap-2 text-xs bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">{t.expectedRateLabel}</span>
                        <span className="font-black text-slate-900">₹{lot.expectedPrice}/{t.commonQuintal}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">{t.qualityGradeLabel}</span>
                        <span className="font-black text-amber-800">
                          {lot.qualityGrade === 'GRADE_A' ? t.commonGradeA : lot.qualityGrade === 'GRADE_B' ? t.commonGradeB : lot.qualityGrade === 'GRADE_C' ? t.commonGradeC : (lot.qualityGrade || t.commonGradeA)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{lot.location || 'Nashik Farm Gate'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-amber-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {t.listedOnLabel}: {new Date(lot.createdAt).toLocaleDateString('en-IN')}
                  </span>
                  <Link
                    href={`/my-lots/${lot.id}`}
                    className={`inline-flex items-center gap-1.5 text-xs font-black ${
                      isBidding ? 'text-orange-800 hover:text-orange-950' : 'text-amber-800 hover:text-amber-950'
                    }`}
                  >
                    {isBidding ? t.reviewAcceptOffersBtn : isSold ? t.viewSaleReceiptBtn : t.viewOffersDetailsBtn} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
