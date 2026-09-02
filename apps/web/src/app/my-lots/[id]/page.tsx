'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { useLanguage } from '../../../lib/language-context';
import { useToast } from '../../../components/ui/toast';
import { StatusBadge } from '../../../components/ui/status-badge';
import { CardSkeleton } from '../../../components/ui/skeleton';
import {
  Package,
  ArrowLeft,
  Gavel,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  Check,
  Loader2,
  FileCheck,
} from 'lucide-react';

export default function LotDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t, tCrop } = useLanguage();
  const { showToast } = useToast();

  const [lot, setLot] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchLotData = () => {
    if (!id) return;
    Promise.all([
      api.get<any>(`/lots/${id}`),
      api.get<any[]>(`/lots/${id}/bids`).catch(() => []),
    ])
      .then(([lotRes, bidsRes]) => {
        setLot(lotRes);
        setBids(bidsRes || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLotData();
    const interval = setInterval(fetchLotData, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const handleAcceptBid = async (bidId: string) => {
    setActionLoading(bidId);
    try {
      await api.patch(`/bids/${bidId}/accept`);
      showToast(t.msgOfferAcceptedSuccess, 'success');
      fetchLotData();
    } catch (err: any) {
      showToast(err.message || t.msgLoginFailed, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectBid = async (bidId: string) => {
    setActionLoading(bidId);
    try {
      await api.patch(`/bids/${bidId}/reject`);
      showToast(t.msgOfferRejectedSuccess, 'info');
      fetchLotData();
    } catch (err: any) {
      showToast(err.message || t.msgLoginFailed, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-amber-200 text-center space-y-4">
        <h2 className="text-xl font-black text-slate-900">{t.lotNotFoundTitle}</h2>
        <Link href="/my-lots" className="inline-block text-xs font-bold text-amber-800 hover:underline">
          {t.returnToMyLots}
        </Link>
      </div>
    );
  }

  const isSold = lot.status === 'SOLD';
  const highestPrice = bids.length > 0 ? Math.max(...bids.map((b) => b.price)) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Link href="/my-lots" className="inline-flex items-center gap-1 text-xs text-amber-800 font-bold hover:underline">
        <ArrowLeft className="w-3.5 h-3.5" /> {t.backToMyLots}
      </Link>

      {/* Lot Summary Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-amber-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              {t.contractNumberLabel} #{lot.id?.substring(0, 8)}
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {tCrop(lot.crop?.name) || lot.crop?.name || 'Crop'} — {lot.quantity} {lot.unit === 'QUINTAL' || !lot.unit ? t.commonQuintal : lot.unit === 'KG' ? t.commonKg : lot.unit === 'TONNE' ? t.commonTonne : lot.unit}
            </h1>
          </div>
          <StatusBadge status={lot.status} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
            <span className="text-slate-400 font-bold block text-[10px]">{t.expectedRateLabel}</span>
            <span className="font-black text-slate-900 text-sm">₹{lot.expectedPrice}/{t.commonQuintal}</span>
          </div>
          <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
            <span className="text-slate-400 font-bold block text-[10px]">{t.qualityGradeLabel}</span>
            <span className="font-black text-amber-800 text-sm">
              {lot.qualityGrade === 'GRADE_A' ? t.commonGradeA : lot.qualityGrade === 'GRADE_B' ? t.commonGradeB : lot.qualityGrade === 'GRADE_C' ? t.commonGradeC : (lot.qualityGrade || t.commonGradeA)}
            </span>
          </div>
          <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
            <span className="text-slate-400 font-bold block text-[10px]">{t.estimatedTotalValue}</span>
            <span className="font-black text-slate-900 text-sm">
              ₹{(lot.expectedPrice * lot.quantity)?.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
            <span className="text-slate-400 font-bold block text-[10px]">{t.commissionCutLabel}</span>
            <span className="font-black text-amber-600 text-sm">{t.zeroDirectLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{t.farmPickupAddressLabel}: <strong>{lot.location || 'Nashik Farm Gate'}</strong></span>
        </div>
      </div>

      {/* Transaction & Settlement Timeline (if Sold) */}
      {isSold && lot.transaction && (
        <div className="bg-gradient-to-br from-amber-950 to-amber-900 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-amber-500/40 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-yellow-300" />
              <h2 className="text-lg font-black text-white">{t.purchaseContractTimeline}</h2>
            </div>
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              {lot.transaction.status || t.statusContractCompleted}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
            <div>
              <span className="text-amber-200 block text-[10px]">{t.agreedDealRateLabel}</span>
              <span className="text-base font-black text-white">₹{lot.transaction.agreedPrice}/{t.commonQuintal}</span>
            </div>
            <div>
              <span className="text-amber-200 block text-[10px]">{t.totalContractAmountLabel}</span>
              <span className="text-base font-black text-yellow-300">
                ₹{lot.transaction.totalAmount?.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-amber-200 block text-[10px]">{t.paymentSettlementLabel}</span>
              <span className="text-base font-black text-amber-300">
                {lot.transaction.payment?.status === 'PAID' ? t.paidAndVerifiedLabel : t.inProcessLabel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Bids Review Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {t.incomingOffersTitle} ({bids.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">{t.directBuyerOffersSubtitle}</span>
        </div>

        {bids.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-amber-200 text-center space-y-2 text-xs text-slate-500">
            <Clock className="w-8 h-8 mx-auto text-amber-300 mb-1" />
            <p className="font-bold text-slate-700">{t.awaitingBuyerOffersTitle}</p>
            <p>{t.awaitingBuyerOffersDesc}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bids.map((bid) => {
              const isHighest = bid.price === highestPrice && bids.length > 1;
              const isAccepted = bid.status === 'ACCEPTED';
              const isPending = bid.status === 'PENDING';

              return (
                <div
                  key={bid.id}
                  className={`p-5 rounded-3xl border transition space-y-3 ${
                    isAccepted
                      ? 'bg-amber-50/80 border-amber-400 shadow-sm'
                      : 'bg-white border-amber-200 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-600" />
                        <span className="font-extrabold text-slate-900 text-sm">
                          {bid.buyer?.name || t.verifiedBadge}
                        </span>
                        {isHighest && (
                          <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase">
                            {t.highestOfferBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{bid.message || 'Farm-gate pickup with instant digital settlement'}</p>
                    </div>

                    <div className="text-right sm:self-center">
                      <div className="text-xl font-black text-slate-900">
                        ₹{bid.price} <span className="text-xs font-normal text-slate-500">/ {t.commonQuintal}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-bold block">
                        {t.totalOrderValueLabel}: ₹{(bid.price * bid.quantity)?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Actions for Farmer */}
                  {!isSold && isPending && (
                    <div className="pt-3 border-t border-amber-100 flex gap-2 justify-end">
                      <button
                        onClick={() => handleRejectBid(bid.id)}
                        disabled={!!actionLoading}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        {t.btnRejectOffer}
                      </button>
                      <button
                        onClick={() => handleAcceptBid(bid.id)}
                        disabled={!!actionLoading}
                        className="px-5 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {actionLoading === bid.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        {t.acceptAndFinalizeDeal}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
