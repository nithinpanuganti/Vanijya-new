'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useLanguage } from '../../lib/language-context';
import { useToast } from '../../components/ui/toast';
import { CardSkeleton } from '../../components/ui/skeleton';
import {
  User,
  ShieldCheck,
  Building2,
  Sprout,
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  LogIn,
  FileCheck,
  CreditCard,
  Edit3,
} from 'lucide-react';

export default function UserProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const { t, tCrop } = useLanguage();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [locationAddress, setLocationAddress] = useState('');

  // Farmer specific
  const [primaryCrop, setPrimaryCrop] = useState('Tomato');
  const [farmSize, setFarmSize] = useState('5');
  const [kccNumber, setKccNumber] = useState('');
  const [apmcNumber, setApmcNumber] = useState('');

  // Buyer specific
  const [organizationName, setOrganizationName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [gstin, setGstin] = useState('');
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [warehouseLocation, setWarehouseLocation] = useState('');

  const [photoUrl, setPhotoUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setState(user.state || 'Maharashtra');
      setDistrict(user.district || 'Nashik');
      setVillage(user.village || '');
      setLocationAddress(user.location || '');
      setPhotoUrl(user.photoUrl || '');

      setPrimaryCrop(user.primaryCrop || 'Tomato');
      setFarmSize(user.farmSize?.toString() || '5');
      setKccNumber(user.kccNumber || '');
      setApmcNumber(user.apmcRegistrationNumber || '');

      setOrganizationName(user.organizationName || '');
      setContactPerson(user.contactPerson || user.name || '');
      setBusinessType(user.businessType || '');
      setGstin(user.gstin || '');
      setFssaiNumber(user.fssaiNumber || '');
      setWarehouseLocation(user.warehouseLocation || '');
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

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

  const isFarmer = user.role === 'FARMER';
  const isBuyer = user.role === 'BUYER';
  const isAdmin = user.role === 'ADMIN';

  // Profile completion score calculation
  const getProfileCompletion = () => {
    let fields = [user.name, user.phone, user.state, user.district, user.location, user.photoUrl];
    if (isFarmer) {
      fields.push(user.primaryCrop, user.kccNumber, user.apmcRegistrationNumber);
    } else if (isBuyer) {
      fields.push(user.organizationName, user.gstin, user.fssaiNumber);
    }
    const completed = fields.filter((f) => !!f).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completionRate = getProfileCompletion();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPhotoUrl(dataUrl);
      try {
        await api.patch('/profile', { photoUrl: dataUrl });
        showToast(t.msgPhotoUpdatedSuccess, 'success');
        refreshUser();
      } catch (err: any) {
        showToast(err.message || t.msgLoginFailed, 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        name,
        email: email.trim() || undefined,
        state,
        district,
        village: village.trim() || undefined,
        location: locationAddress.trim() || undefined,
      };

      if (isFarmer) {
        payload.primaryCrop = primaryCrop;
        payload.farmSize = parseFloat(farmSize) || 5;
        payload.kccNumber = kccNumber.trim() || undefined;
        payload.apmcRegistrationNumber = apmcNumber.trim() || undefined;
      } else if (isBuyer) {
        payload.organizationName = organizationName.trim() || undefined;
        payload.contactPerson = contactPerson.trim() || undefined;
        payload.businessType = businessType.trim() || undefined;
        payload.gstin = gstin.trim() || undefined;
        payload.fssaiNumber = fssaiNumber.trim() || undefined;
        payload.warehouseLocation = warehouseLocation.trim() || undefined;
      }

      await api.patch('/profile', payload);
      showToast(t.msgProfileUpdatedSuccess, 'success');
      setIsEditing(false);
      refreshUser();
    } catch (err: any) {
      showToast(err.message || t.msgLoginFailed, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t.brandGovtBadge}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-amber-300 tracking-tight">
            {t.userAccountVerificationTitle}
          </h1>
          <p className="text-xs text-slate-300 font-medium max-w-xl">
            {t.userAccountVerificationSubtitle}
          </p>
        </div>

        {/* Profile Completion Indicator */}
        <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-amber-400/30 text-right space-y-1 self-start md:self-auto min-w-[140px]">
          <span className="text-[10px] text-amber-200 uppercase font-black tracking-wider block">
            {t.profileCompletionTitle}
          </span>
          <div className="text-2xl font-black text-amber-300">{completionRate}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-400 h-full transition-all" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Photo & Credentials Badge */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm text-center space-y-4">
            {/* Profile Avatar with Photo Upload */}
            <div className="relative w-28 h-28 mx-auto rounded-3xl bg-amber-100 border-2 border-amber-300 overflow-hidden shadow-inner flex items-center justify-center group">
              {photoUrl ? (
                <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-amber-700" />
              )}

              <label className="absolute inset-0 bg-black/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer">
                <Camera className="w-5 h-5 mb-1 text-amber-300" />
                <span>Change</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900">{name}</h2>
              <span className="inline-block bg-amber-100 text-amber-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border border-amber-300">
                {user.role}
              </span>
              <p className="text-xs text-slate-500 font-mono">📞 {phone}</p>
            </div>

            {/* Verification Status Pill */}
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{user.status === 'VERIFIED' ? t.verifiedBadge : t.pendingBadge}</span>
            </div>
          </div>

          {/* Compliance & Verification Info Card */}
          <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              {t.kycVerificationLabel}
            </h3>

            {isFarmer && (
              <div className="space-y-2 text-slate-600">
                <p>
                  <strong>{t.farmerKccBadgeText}:</strong> {t.farmerKccBadgeDesc}
                </p>
                <div className="p-2 bg-amber-50 rounded-xl font-mono text-[11px] text-amber-900">
                  KCC: {kccNumber || 'KCC-MH-882194'}
                </div>
              </div>
            )}

            {isBuyer && (
              <div className="space-y-2 text-slate-600">
                <p>
                  <strong>{t.buyerFssaiBadgeText}:</strong> {t.buyerFssaiBadgeDesc}
                </p>
                <div className="p-2 bg-blue-50 rounded-xl font-mono text-[11px] text-blue-950">
                  GSTIN: {gstin || '27AABCF1234E1Z6'}
                </div>
              </div>
            )}

            {isAdmin && (
              <p className="text-slate-600">
                <strong>{t.adminAccessBadgeText}:</strong> {t.adminAccessBadgeDesc}
              </p>
            )}
          </div>
        </div>

        {/* Right 2 Cols: Profile Form & Details */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-amber-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-amber-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {t.userProfileTitle}
              </h2>

              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl text-xs font-black border border-amber-300 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t.editProfileDetailsBtn}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.fullLegalNameLabel}</label>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.emailAddressLabel}</label>
                  <input
                    type="email"
                    disabled={!isEditing}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 disabled:opacity-75"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.stateLabel}</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl font-bold text-slate-900 focus:bg-white disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.districtLabel}</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl font-bold text-slate-900 focus:bg-white disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.villageTownLabel}</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl font-bold text-slate-900 focus:bg-white disabled:opacity-75"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isFarmer ? t.farmPickupLocationFieldLabel : t.procurementOfficeFieldLabel}
                </label>
                <textarea
                  rows={2}
                  disabled={!isEditing}
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl font-bold text-slate-900 focus:bg-white disabled:opacity-75"
                />
              </div>

              {/* Role Specific Extended Form Fields */}
              {isFarmer && (
                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3">
                  <span className="font-black text-amber-950 uppercase tracking-wider block">
                    🌾 {t.farmerBenefitsTitle}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t.primaryCropFieldLabel}</label>
                      <select
                        disabled={!isEditing}
                        value={primaryCrop}
                        onChange={(e) => setPrimaryCrop(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl font-bold text-slate-900 disabled:opacity-75"
                      >
                        <option value="Tomato">{tCrop('Tomato')}</option>
                        <option value="Onion">{tCrop('Onion')}</option>
                        <option value="Potato">{tCrop('Potato')}</option>
                        <option value="Wheat">{tCrop('Wheat')}</option>
                        <option value="Paddy">{tCrop('Paddy')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t.farmSizeAcresFieldLabel}</label>
                      <input
                        type="number"
                        disabled={!isEditing}
                        value={farmSize}
                        onChange={(e) => setFarmSize(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl font-bold text-slate-900 disabled:opacity-75"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t.kccNumberLabel}</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={kccNumber}
                        onChange={(e) => setKccNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl font-mono text-slate-900 disabled:opacity-75"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t.apmcNumberLabel}</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={apmcNumber}
                        onChange={(e) => setApmcNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl font-mono text-slate-900 disabled:opacity-75"
                      />
                    </div>
                  </div>
                </div>
              )}

              {isBuyer && (
                <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-200 space-y-3">
                  <span className="font-black text-blue-950 uppercase tracking-wider block">
                    🏢 {t.buyerBenefitsTitle}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t.organizationNameFieldLabel}</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl font-bold text-slate-900 disabled:opacity-75"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t.contactPersonFieldLabel}</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl font-bold text-slate-900 disabled:opacity-75"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t.gstinAdminLabel}</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl font-mono text-slate-900 disabled:opacity-75"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t.fssaiNumberAdminLabel}</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={fssaiNumber}
                        onChange={(e) => setFssaiNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl font-mono text-slate-900 disabled:opacity-75"
                      />
                    </div>
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black rounded-2xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t.commonLoading}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>{t.saveProfileChangesBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
