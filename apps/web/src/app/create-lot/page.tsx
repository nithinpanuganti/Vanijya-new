'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useLanguage } from '../../lib/language-context';
import { useToast } from '../../components/ui/toast';
import {
  Sprout,
  ArrowLeft,
  Loader2,
  Sparkles,
  MapPin,
  LogIn,
  Package,
  Scale,
  IndianRupee,
  ShieldCheck,
  Wallet,
  PlusCircle,
  Info,
} from 'lucide-react';

export default function CreateLotPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, tCrop } = useLanguage();
  const { showToast } = useToast();

  const [crops, setCrops] = useState<{ id: string; name: string }[]>([
    { id: 'crop-1', name: 'Tomato' },
    { id: 'crop-2', name: 'Onion' },
    { id: 'crop-3', name: 'Potato' },
    { id: 'crop-4', name: 'Wheat' },
    { id: 'crop-5', name: 'Paddy' },
    { id: 'crop-6', name: 'Maize' },
  ]);

  const [cropId, setCropId] = useState('crop-1');
  const [selectedCropName, setSelectedCropName] = useState('Tomato');
  const [quantity, setQuantity] = useState('100');
  const [unit, setUnit] = useState('QUINTAL');
  const [expectedPrice, setExpectedPrice] = useState('2200');
  const [qualityGrade, setQualityGrade] = useState('GRADE_A');
  const [location, setLocation] = useState('Village Pimpalgaon, Niphad Taluka, Nashik, Maharashtra');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.get<any[]>('/crops')
      .then((res) => {
        if (res && res.length > 0) {
          setCrops(res);
          setCropId(res[0].id);
          setSelectedCropName(res[0].name);
        }
      })
      .catch(() => {});

    if (user?.location) {
      setLocation(user.location);
    } else if (user?.district && user?.state) {
      setLocation(`${user.village ? `${user.village}, ` : ''}${user.district}, ${user.state}`);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="max-w-[760px] mx-auto py-16 px-4 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#F4B400]" />
        <span className="font-semibold text-slate-700">{t.commonLoading}</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-[760px] mx-auto py-12 px-4 animate-in fade-in duration-300">
        <div className="max-w-md mx-auto bg-white p-8 sm:p-10 rounded-3xl border border-[#F4D35E]/60 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-amber-50 text-[#04142A] border border-[#F4D35E] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <LogIn className="w-8 h-8 text-[#F4B400]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-[#04142A] tracking-tight">{t.farmerLoginRequiredTitle}</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t.farmerLoginRequiredDesc}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login?redirect=/create-lot"
              className="block w-full h-14 leading-[56px] bg-gradient-to-r from-[#F4B400] via-amber-400 to-[#E0A000] text-[#04142A] font-black rounded-2xl text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {t.btnSignIn}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== 'FARMER' && user.role !== 'ADMIN') {
    return (
      <div className="max-w-[760px] mx-auto py-12 px-4 animate-in fade-in duration-300">
        <div className="max-w-md mx-auto bg-white p-8 sm:p-10 rounded-3xl border border-[#F4D35E]/60 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-amber-50 text-[#04142A] border border-[#F4D35E] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Sprout className="w-8 h-8 text-[#F4B400]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-[#04142A] tracking-tight">{t.farmerRoleTitle}</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t.msgFarmerOnlyAccess}
            </p>
          </div>
          <div className="pt-2 space-y-3">
            <Link
              href="/login?redirect=/create-lot"
              className="block w-full h-14 leading-[56px] bg-gradient-to-r from-[#F4B400] via-amber-400 to-[#E0A000] text-[#04142A] font-black rounded-2xl text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {t.btnSignIn}
            </Link>
            <Link
              href="/browse-lots"
              className="block w-full h-12 leading-[48px] border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-800 font-bold rounded-2xl text-xs transition"
            >
              {t.browseMarketplaceBtn}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const numQty = parseFloat(quantity) || 0;
  const numPrice = parseFloat(expectedPrice) || 0;
  const estimatedTotal = numQty * numPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (numQty <= 0) {
      showToast(t.msgQuantityRequired, 'error');
      return;
    }

    if (numPrice <= 0) {
      showToast(t.msgPriceRequired, 'error');
      return;
    }

    if (!location.trim()) {
      showToast(t.msgLocationRequired, 'error');
      return;
    }

    setIsSubmitting(true);

    const chosenCrop = crops.find((c) => c.name === selectedCropName) || crops.find((c) => c.id === cropId) || crops[0];
    const finalCropId = chosenCrop?.id || cropId || 'crop-1';

    try {
      await api.post('/lots', {
        cropId: finalCropId,
        quantity: numQty,
        unit,
        expectedPrice: numPrice,
        qualityGrade,
        location: location.trim(),
      });

      showToast(t.msgLotPublishedSuccess, 'success');
      router.push('/my-lots');
    } catch (err: any) {
      const msg = err.message || t.msgLoginFailed;
      if (err.status === 401) {
        showToast(t.msgSessionExpired, 'error');
        router.push(`/login?redirect=${encodeURIComponent('/create-lot')}`);
      } else if (err.status === 403) {
        showToast(t.msgFarmerOnlyAccess, 'error');
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[760px] mx-auto py-8 sm:py-10 px-4 animate-in fade-in duration-300">
      {/* Back Link */}
      <div className="mb-5">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-700 hover:text-[#04142A] font-bold transition group"
        >
          <div className="w-7 h-7 rounded-full bg-amber-50 border border-[#F4D35E]/60 flex items-center justify-center group-hover:bg-[#F4B400] transition">
            <ArrowLeft className="w-3.5 h-3.5 text-[#04142A]" />
          </div>
          <span>{t.commonBack}</span>
        </Link>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-[#F4D35E]/60 p-6 sm:p-10 space-y-7">
        {/* Header Section */}
        <div className="space-y-3 pb-2 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-[#F4B400] text-[#04142A] text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              {t.zeroCommissionBadge}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-500">
              {t.directFarmGateListing}
            </span>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black text-[#04142A] tracking-tight leading-tight">
              {t.createLotTitle}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {t.createLotSubtitle}
            </p>
          </div>
        </div>

        {/* Form Elements */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Commodity (Full Width) */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#04142A] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#F4B400]" />
              <span>{t.lotCropLabel}</span>
              <span className="text-amber-600">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedCropName}
                onChange={(e) => {
                  setSelectedCropName(e.target.value);
                  const found = crops.find((c) => c.name === e.target.value);
                  if (found) setCropId(found.id);
                }}
                className="h-14 w-full px-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-[#F4B400] focus:ring-4 focus:ring-[#F4B400]/20 text-base font-bold text-slate-900 transition-all outline-none cursor-pointer"
              >
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.name}>
                    {tCrop(crop.name)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: 3-Column Responsive Grid (Quantity, Unit, Expected Price) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* Quantity */}
            <div className="md:col-span-5 space-y-2">
              <label className="text-sm font-bold text-[#04142A] flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#F4B400]" />
                <span>{t.lotQtyLabel}</span>
                <span className="text-amber-600">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="100"
                className="h-14 w-full px-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-[#F4B400] focus:ring-4 focus:ring-[#F4B400]/20 text-base font-bold text-slate-900 transition-all outline-none"
              />
            </div>

            {/* Unit */}
            <div className="md:col-span-3 space-y-2">
              <label className="text-sm font-bold text-[#04142A] block">
                <span>{t.unitLabel}</span>
                <span className="text-amber-600 ml-1">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-14 w-full px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-[#F4B400] focus:ring-4 focus:ring-[#F4B400]/20 text-base font-bold text-slate-900 transition-all outline-none cursor-pointer"
              >
                <option value="QUINTAL">{t.commonQuintal}</option>
                <option value="KG">{t.commonKg}</option>
                <option value="TONNE">{t.commonTonne}</option>
              </select>
            </div>

            {/* Expected Price */}
            <div className="md:col-span-4 space-y-2">
              <label className="text-sm font-bold text-[#04142A] flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-[#F4B400]" />
                <span>{t.lotPriceLabel}</span>
                <span className="text-amber-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  value={expectedPrice}
                  onChange={(e) => setExpectedPrice(e.target.value)}
                  placeholder="2200"
                  className="h-14 w-full pl-8 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-[#F4B400] focus:ring-4 focus:ring-[#F4B400]/20 text-base font-bold text-slate-900 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Quality Grade & Pickup Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quality Grade */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#04142A] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#F4B400]" />
                <span>{t.lotGradeLabel}</span>
                <span className="text-amber-600">*</span>
              </label>
              <select
                value={qualityGrade}
                onChange={(e) => setQualityGrade(e.target.value)}
                className="h-14 w-full px-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-[#F4B400] focus:ring-4 focus:ring-[#F4B400]/20 text-sm sm:text-base font-semibold text-slate-900 transition-all outline-none cursor-pointer"
              >
                <option value="GRADE_A">{t.gradeAPremium}</option>
                <option value="GRADE_B">{t.gradeBStandard}</option>
                <option value="GRADE_C">{t.gradeCProcessing}</option>
              </select>
            </div>

            {/* Pickup Location */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#04142A] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#F4B400]" />
                <span>{t.lotLocationLabel}</span>
                <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Village Pimpalgaon, Niphad Taluka, Nashik, Maharashtra"
                className="h-14 w-full px-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-[#F4B400] focus:ring-4 focus:ring-[#F4B400]/20 text-sm font-medium text-slate-900 transition-all outline-none"
              />
            </div>
          </div>

          {/* Estimated Value Card */}
          <div className="p-6 sm:p-7 rounded-2xl border border-[#F4D35E] bg-gradient-to-br from-amber-50/80 via-[#FFFDF5] to-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                <Wallet className="w-3.5 h-3.5 text-[#F4B400]" />
                <span>{t.estimatedTotalValue}</span>
              </div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-[#04142A] tracking-tight">
                ₹{estimatedTotal > 0 ? estimatedTotal.toLocaleString('en-IN') : '0'}
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.directFarmPayoutBadge}</span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                {t.noMiddlemanBadge}
              </p>
            </div>
          </div>

          {/* Helpful Information Strip */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70 text-blue-950 flex items-start gap-3 text-xs sm:text-sm leading-relaxed">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <span className="font-bold">{t.marketplaceGuaranteeTitle}:</span> {t.marketplaceGuaranteeText}
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[60px] rounded-2xl bg-gradient-to-r from-[#F4B400] via-amber-400 to-[#E0A000] hover:from-[#f5ba14] hover:to-[#d49600] text-[#04142A] font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t.publishingToMarketplace}</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <span>{t.btnPublishLot}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
