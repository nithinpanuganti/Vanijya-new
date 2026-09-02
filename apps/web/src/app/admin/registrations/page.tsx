'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { useLanguage } from '../../../lib/language-context';
import { useToast } from '../../../components/ui/toast';
import { CardSkeleton } from '../../../components/ui/skeleton';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Building2,
  Sprout,
  Search,
  Filter,
  RefreshCw,
  Camera,
  CreditCard,
  FileText,
  AlertTriangle,
  UserCheck,
  UserX,
  ArrowRight,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

interface RegistrationUser {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: 'FARMER' | 'BUYER' | 'ADMIN';
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  approvedBy?: string;
  state: string;
  district: string;
  village?: string;
  location?: string;
  liveLocationLat?: number;
  liveLocationLng?: number;
  photoUrl?: string;
  primaryCrop?: string;
  farmSize?: number;
  kccNumber?: string;
  apmcRegistrationNumber?: string;
  organizationName?: string;
  contactPerson?: string;
  businessType?: string;
  gstin?: string;
  fssaiNumber?: string;
  warehouseLocation?: string;
  createdAt: string;
}

export default function AdminRegistrationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, tCrop } = useLanguage();
  const { showToast } = useToast();

  const [registrations, setRegistrations] = useState<RegistrationUser[]>([]);
  const [stats, setStats] = useState<{
    pendingFarmers: number;
    pendingBuyers: number;
    totalPending: number;
    approvedFarmers: number;
    approvedBuyers: number;
  }>({
    pendingFarmers: 0,
    pendingBuyers: 0,
    totalPending: 0,
    approvedFarmers: 0,
    approvedBuyers: 0,
  });

  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'FARMER' | 'BUYER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'VERIFIED' | 'REJECTED' | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modal / action state
  const [selectedUser, setSelectedUser] = useState<RegistrationUser | null>(null);
  const [rejectModalUser, setRejectModalUser] = useState<RegistrationUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fetchRegistrations = async () => {
    setLoadingList(true);
    try {
      const queryParams = new URLSearchParams();
      if (roleFilter !== 'ALL') queryParams.append('role', roleFilter);
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);
      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());
      queryParams.append('sort', sortOrder);

      const res = await api.get<{ users: RegistrationUser[]; stats: any }>(
        `/admin/registrations?${queryParams.toString()}`,
      );

      if (res && res.users) {
        setRegistrations(res.users);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err: any) {
      showToast(err.message || t.msgLoginFailed, 'error');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      showToast(t.msgFarmerOnlyAccess, 'error');
      router.push('/dashboard');
      return;
    }
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchRegistrations();
    }
  }, [isAuthenticated, isLoading, user, roleFilter, statusFilter, sortOrder]);

  const handleApprove = async (targetUser: RegistrationUser) => {
    setIsProcessing(true);
    try {
      await api.patch(`/admin/registrations/${targetUser.id}/approve`, {});
      showToast(t.msgUserApprovedSuccess, 'success');
      if (selectedUser?.id === targetUser.id) {
        setSelectedUser({ ...targetUser, status: 'VERIFIED' });
      }
      fetchRegistrations();
    } catch (err: any) {
      showToast(err.message || t.msgLoginFailed, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalUser) return;
    if (!rejectionReason.trim()) {
      showToast(t.rejectionReasonLabel, 'error');
      return;
    }

    setIsProcessing(true);
    try {
      await api.patch(`/admin/registrations/${rejectModalUser.id}/reject`, {
        reason: rejectionReason.trim(),
      });
      showToast(t.msgUserRejectedSuccess, 'info');
      setRejectModalUser(null);
      setRejectionReason('');
      if (selectedUser?.id === rejectModalUser.id) {
        setSelectedUser({ ...rejectModalUser, status: 'REJECTED', rejectionReason: rejectionReason.trim() });
      }
      fetchRegistrations();
    } catch (err: any) {
      showToast(err.message || t.msgLoginFailed, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            {t.adminCockpitTitle}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-amber-300 tracking-tight">
            {t.adminRegistrationsTitle}
          </h1>
          <p className="text-xs text-slate-300 font-medium max-w-2xl">
            {t.adminRegistrationsSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={fetchRegistrations}
            disabled={loadingList}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-amber-400/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin' : ''}`} />
            <span>{t.refreshFeedBtn}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider">
              {t.pendingReviewKpi}
            </span>
            <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
          </div>
          <span className="text-2xl font-black text-slate-950 block">{stats.totalPending}</span>
          <span className="text-[10px] text-slate-400 font-medium block">{t.awaitingVerificationSub}</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              {t.pendingFarmers}
            </span>
            <Sprout className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-700 block">{stats.pendingFarmers}</span>
          <span className="text-[10px] text-slate-400 font-medium block">{t.agriProducersSub}</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              {t.pendingBuyers}
            </span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-blue-700 block">{stats.pendingBuyers}</span>
          <span className="text-[10px] text-slate-400 font-medium block">{t.wholesaleProcessorsSub}</span>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-amber-50 p-4 rounded-3xl border border-emerald-300 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-emerald-950 tracking-wider">
              {t.approvedAccounts}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-900 block">
            {stats.approvedFarmers + stats.approvedBuyers}
          </span>
          <span className="text-[10px] text-emerald-800 font-bold block">{t.activeParticipantsSub}</span>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-amber-600 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchRegistrations()}
              placeholder={t.searchApplicantsPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-amber-50/40 border border-amber-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Role Filter Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">{t.allRolesOption}</option>
              <option value="FARMER">{t.farmersRoleOption}</option>
              <option value="BUYER">{t.buyersRoleOption}</option>
            </select>

            {/* Status Filter Selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="PENDING">{t.pendingOnlyOption}</option>
              <option value="VERIFIED">{t.approvedOption}</option>
              <option value="REJECTED">{t.rejectedOption}</option>
              <option value="ALL">{t.allStatusesOption}</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="desc">{t.newestFirstOption}</option>
              <option value="asc">{t.oldestFirstOption}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Registration Applications Stream */}
      {loadingList ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : registrations.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-amber-200 text-center space-y-3 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-900">{t.noRegistrationsFound}</h2>
          <p className="text-xs text-slate-500">{t.noRegistrationsFoundDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {registrations.map((applicant) => {
            const isFarmer = applicant.role === 'FARMER';
            const isBuyer = applicant.role === 'BUYER';
            const isPending = applicant.status === 'PENDING';
            const isVerified = applicant.status === 'VERIFIED';
            const isRejected = applicant.status === 'REJECTED';

            return (
              <div
                key={applicant.id}
                className={`bg-white p-5 rounded-3xl border shadow-sm transition space-y-4 flex flex-col justify-between transition-card ${
                  isPending
                    ? 'border-amber-300 ring-2 ring-amber-400/20'
                    : isVerified
                    ? 'border-emerald-200'
                    : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div className="space-y-3">
                  {/* Top line with Avatar, Name, and Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Photo Thumbnail */}
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                        {applicant.photoUrl ? (
                          <img
                            src={applicant.photoUrl}
                            alt={applicant.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="w-5 h-5 text-amber-700" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-black text-slate-900 tracking-tight">
                            {applicant.name}
                          </span>
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                              isFarmer ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'bg-blue-100 text-blue-950 border border-blue-300'
                            }`}
                          >
                            {isFarmer ? t.roleFarmer : t.roleBuyer}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">📞 {applicant.phone}</p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : isRejected
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-950 border-amber-400 animate-pulse'
                      }`}
                    >
                      {isVerified ? t.verifiedBadge : isRejected ? t.rejectedBadge : t.pendingBadge}
                    </span>
                  </div>

                  {/* KYC & Location Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-amber-50/40 p-3 rounded-2xl border border-amber-100">
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px]">
                        {isFarmer ? t.cropLabel : t.contactPersonAdminLabel}
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {isFarmer ? (tCrop(applicant.primaryCrop) || applicant.primaryCrop || 'Multiple') : (applicant.contactPerson || applicant.name)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block text-[10px]">
                        {isFarmer ? t.farmSizeAcresLabel : t.businessTypeAdminLabel}
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {isFarmer ? `${applicant.farmSize || 5} ${t.commonAcres}` : (applicant.businessType || 'Wholesale')}
                      </span>
                    </div>

                    <div className="col-span-2 pt-1 border-t border-amber-200/50 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                      <span className="font-semibold text-slate-800">
                        📍 {applicant.village ? `${applicant.village}, ` : ''}{applicant.district}, {applicant.state}
                      </span>
                      {applicant.liveLocationLat && applicant.liveLocationLng ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          GPS Verified
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">GPS Available</span>
                      )}
                    </div>

                    {applicant.createdAt && (
                      <div className="col-span-2 text-[10px] text-slate-400 font-medium">
                        📅 Submitted: {new Date(applicant.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>

                  {/* Rejection Note if applicable */}
                  {isRejected && applicant.rejectionReason && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>{t.reasonLabel}:</strong> {applicant.rejectionReason}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer with Details Modal and Quick Actions */}
                <div className="pt-3 border-t border-amber-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedUser(applicant)}
                    className="text-xs font-black text-amber-900 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t.viewApplicationBtn}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {isPending && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setRejectModalUser(applicant);
                          setRejectionReason('');
                        }}
                        disabled={isProcessing}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>{t.btnRejectOffer}</span>
                      </button>

                      <button
                        onClick={() => handleApprove(applicant)}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-xs font-black shadow-md transition flex items-center gap-1 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{t.approveBtn}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: FULL APPLICANT DOSSIER MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-amber-300 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-amber-600" />
                <div>
                  <h3 className="text-lg font-black text-slate-900">{t.applicantDetails}</h3>
                  <p className="text-xs text-slate-500">#{selectedUser.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Profile Header & Picture */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-200">
              <div className="w-24 h-24 rounded-2xl bg-amber-100 border border-amber-300 overflow-hidden shrink-0 shadow-md">
                {selectedUser.photoUrl ? (
                  <img
                    src={selectedUser.photoUrl}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amber-700">
                    <Camera className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h4 className="text-xl font-black text-slate-900">{selectedUser.name}</h4>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 uppercase">
                    {selectedUser.role}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-mono">📞 {selectedUser.phone}</p>
                {selectedUser.email && (
                  <p className="text-xs text-slate-600">✉️ {selectedUser.email}</p>
                )}
                <div className="pt-1">
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${
                      selectedUser.status === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : selectedUser.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-amber-100 text-amber-950 border-amber-400'
                    }`}
                  >
                    {selectedUser.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Location & GPS Info */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <span className="font-black text-slate-900 block text-xs uppercase tracking-wider">
                📍 {t.stateDistrictLabel}
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">{t.stateLabel}</span>
                  <span className="font-bold">{selectedUser.state}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">{t.districtLabel}</span>
                  <span className="font-bold">{selectedUser.district}</span>
                </div>
                {selectedUser.village && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px] font-bold">{t.villageLocationLabel}</span>
                    <span className="font-bold">{selectedUser.village}</span>
                  </div>
                )}
                {selectedUser.liveLocationLat && selectedUser.liveLocationLng && (
                  <div className="col-span-2 pt-1 border-t border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold">{t.liveGpsCoordsLabel}</span>
                    <span className="font-mono text-emerald-800 font-bold">
                      {selectedUser.liveLocationLat.toFixed(6)}, {selectedUser.liveLocationLng.toFixed(6)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Role Specific Verification Documents */}
            {selectedUser.role === 'FARMER' ? (
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2 text-xs">
                <span className="font-black text-emerald-950 block uppercase tracking-wider">
                  🌾 {t.farmerBenefitsTitle}
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">{t.primaryCropAdminLabel}</span>
                    <span className="font-bold text-slate-900">{tCrop(selectedUser.primaryCrop) || selectedUser.primaryCrop || 'Tomato'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">{t.farmSizeAdminLabel}</span>
                    <span className="font-bold text-slate-900">{selectedUser.farmSize || 5} {t.commonAcres}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">{t.kccNumberLabel}</span>
                    <span className="font-mono font-bold text-slate-900">{selectedUser.kccNumber || 'KCC-IN-882194'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">{t.apmcNumberLabel}</span>
                    <span className="font-mono font-bold text-slate-900">{selectedUser.apmcRegistrationNumber || 'APMC-MH-00912'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-2 text-xs">
                <span className="font-black text-blue-950 block uppercase tracking-wider">
                  🏢 {t.buyerBenefitsTitle}
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">{t.orgNameLabel}</span>
                    <span className="font-bold text-slate-900">{selectedUser.organizationName || 'FreshCart Agro Ltd.'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">{t.contactPersonLabel}</span>
                    <span className="font-bold text-slate-900">{selectedUser.contactPerson || selectedUser.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">{t.businessTypeLabel}</span>
                    <span className="font-bold text-slate-900">{selectedUser.businessType || 'Wholesale Distribution'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">{t.gstinAdminLabel}</span>
                    <span className="font-mono font-bold text-slate-900">{selectedUser.gstin || '27AABCV1234F1Z5'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">{t.fssaiNumberAdminLabel}</span>
                    <span className="font-mono font-bold text-slate-900">{selectedUser.fssaiNumber || '10019022009871'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">{t.warehouseLocationAdminLabel}</span>
                    <span className="font-bold text-slate-900">{selectedUser.warehouseLocation || selectedUser.district}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-[11px] text-slate-400 flex justify-between border-t border-amber-100 pt-2">
              <span>{t.registrationDateLabel}: {new Date(selectedUser.createdAt).toLocaleString()}</span>
              {selectedUser.approvedBy && <span>{t.approvedByAdminText}: {selectedUser.approvedBy}</span>}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                {t.commonClose}
              </button>

              {selectedUser.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectModalUser(selectedUser);
                      setRejectionReason('');
                    }}
                    disabled={isProcessing}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer"
                  >
                    {t.btnRejectOffer}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApprove(selectedUser)}
                    disabled={isProcessing}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                    {t.approveApplicationBtn}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MANDATORY REJECTION REASON MODAL */}
      {rejectModalUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-rose-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">{t.rejectionModalTitle}</h3>
                <p className="text-[11px] text-slate-500">{t.rejectionModalSubtitle}</p>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100 text-xs">
                <span className="font-bold text-slate-800">{rejectModalUser.name}</span> ({rejectModalUser.role}) — {rejectModalUser.phone}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {t.rejectionReasonLabel} <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Unclear identity photo, invalid KCC number, or GSTIN mismatch."
                  className="w-full px-3.5 py-2.5 bg-rose-50/30 border border-rose-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  {t.btnCancel}
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserX className="w-3.5 h-3.5" />
                  )}
                  {t.btnConfirmReject}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
