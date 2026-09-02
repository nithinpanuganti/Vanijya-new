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
import { formatINR } from '@vanijya/shared-utils';
import {
  ShoppingBag,
  ArrowLeft,
  Gavel,
  ShieldCheck,
  Building2,
  MapPin,
  Sparkles,
  TrendingUp,
  Loader2,
  CheckCircle2,
  Info,
} from 'lucide-react';

export default function BuyerLotDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t, tCrop } = useLanguage();
  const { showToast } = useToast();

  const [lot, setLot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [bidPrice, setBidPrice] = useState('2200');
  const [bidQuantity, setBidQuantity] = useState('100');
  const [bidMessage, setBidMessage] = useState('Farm gate pickup with instant electronic settlement.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<any>(`/lots/${id}`)
      .then((res) => {
        setLot(res);
        if (res) {
          setBidPrice(res.expectedPrice.toString());
          setBidQuantity(res.quantity.toString());
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast(t.buyerLoginRequiredDesc, 'info');
      router.push('/login');
      return;
    }

    if (user?.role === 'FARMER') {
      showToast(t.msgFarmerOnlyAccess, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/lots/${id}/bids`, {
        price: parseFloat(bidPrice),
        quantity: parseFloat(bidQuantity),
        message: bidMessage,
      });

      showToast(t.msgBidPlacedSuccess, 'success');
      router.push('/my-bids');
    } catch (err: any) {
      showToast(err.message || t.msgLoginFailed, 'error');
    } finally {
      setIsSubmitting(false);
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
        <Link href="/browse-lots" className="inline-block text-xs font-bold text-amber-800 hover:underline">
          {t.returnToMarketplace}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <Link href="/browse-lots" className="inline-flex items-center gap-1 text-xs text-amber-800 font-bold hover:underline">
        <ArrowLeft className="w-3.5 h-3.5" /> {t.backToMarketplace}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Lot Specifications */}
        <div className="md:col-span-2 space-y-5">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-amber-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-amber-100 pb-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  {t.contractNumberLabel} #{lot.id?.substring(0, 8)}
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {tCrop(lot.crop?.name) || lot.crop?.name || 'Crop'} ({lot.quantity} {lot.unit === 'QUINTAL' || !lot.unit ? t.commonQuintal : lot.unit === 'KG' ? t.commonKg : lot.unit === 'TONNE' ? t.commonTonne : lot.unit})
                </h1>
              </div>
              <StatusBadge status={lot.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
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
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-amber-100">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{t.farmPickupLocationLabel}: <strong>{lot.location || 'Nashik Farm Gate'}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Col: Live Bidding Console */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
              <Gavel className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-black text-slate-900">{t.biddingDeskTitle}</h2>
            </div>

            <form onSubmit={handlePlaceBid} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.yourBidPriceLabel}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-base font-black focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.sourcingQuantityLabel}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={lot.quantity}
                  value={bidQuantity}
                  onChange={(e) => setBidQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-base font-black focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {t.maxAvailableLabel}: {lot.quantity} {lot.unit === 'QUINTAL' || !lot.unit ? t.commonQuintal : lot.unit === 'KG' ? t.commonKg : lot.unit === 'TONNE' ? t.commonTonne : lot.unit}
                </span>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                <span className="text-slate-500 block text-[10px] font-bold">{t.totalBidSourcingValueLabel}</span>
                <span className="text-base font-black text-slate-900">
                  {formatINR((parseFloat(bidPrice || '0') * parseFloat(bidQuantity || '0')))}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || lot.status === 'SOLD' || lot.status === 'CANCELLED'}
                className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black py-3.5 rounded-2xl text-xs shadow-md shadow-amber-500/20 transition transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.submittingOffer}
                  </>
                ) : lot.status === 'SOLD' ? (
                  t.lotAlreadySold
                ) : (
                  t.confirmAndSubmitBid
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
