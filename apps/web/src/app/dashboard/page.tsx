'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useLanguage } from '../../lib/language-context';
import { StatusBadge } from '../../components/ui/status-badge';
import { CardSkeleton } from '../../components/ui/skeleton';
import { formatINR, formatDate } from '@vanijya/shared-utils';
import {
  TrendingUp,
  Sprout,
  ShoppingBag,
  Gavel,
  FileCheck,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Package,
  Layers,
  MapPin,
  LogIn,
  BarChart3,
  Flame,
  CheckCircle2,
  Clock,
  XCircle,
  Edit3,
  CreditCard,
  Users,
  Activity,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

type AdminTab = 'OVERVIEW' | 'LOTS' | 'BIDS' | 'USERS' | 'TRANSACTIONS' | 'ACTIVITY';

export default function SmartDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, tCrop } = useLanguage();

  const [farmerLots, setFarmerLots] = useState<any[]>([]);
  const [farmerBids, setFarmerBids] = useState<any[]>([]);
  const [buyerLots, setBuyerLots] = useState<any[]>([]);
  const [buyerBids, setBuyerBids] = useState<any[]>([]);

  // Admin states
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminLots, setAdminLots] = useState<any[]>([]);
  const [adminBids, setAdminBids] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any>({ farmers: [], buyers: [] });
  const [adminTransactions, setAdminTransactions] = useState<any[]>([]);
  const [adminActivity, setAdminActivity] = useState<any[]>([]);
  const [adminTab, setAdminTab] = useState<AdminTab>('OVERVIEW');

  const [loadingContent, setLoadingContent] = useState(true);

  const loadData = () => {
    if (!isAuthenticated) return;

    if (user?.role === 'FARMER') {
      Promise.all([
        api.get<any[]>('/lots'),
        api.get<any[]>('/bids/my'),
      ])
        .then(([lotsRes, bidsRes]) => {
          const userLots = lotsRes ? lotsRes.filter((l) => l.farmerId === user.id || l.farmer?.name === user.name) : [];
          setFarmerLots(userLots.length > 0 ? userLots : lotsRes || []);
          setFarmerBids(bidsRes || []);
        })
        .catch(() => {})
        .finally(() => setLoadingContent(false));
    } else if (user?.role === 'BUYER') {
      Promise.all([
        api.get<any[]>('/lots'),
        api.get<any[]>('/bids/my'),
      ])
        .then(([lotsRes, bidsRes]) => {
          setBuyerLots(lotsRes || []);
          setBuyerBids(bidsRes || []);
        })
        .catch(() => {})
        .finally(() => setLoadingContent(false));
    } else if (user?.role === 'ADMIN') {
      Promise.all([
        api.get<any>('/admin/dashboard'),
        api.get<any[]>('/admin/lots'),
        api.get<any[]>('/admin/bids'),
        api.get<any>('/admin/users'),
        api.get<any[]>('/admin/transactions'),
        api.get<any[]>('/admin/activity'),
      ])
        .then(([stats, lots, bids, users, txns, activity]) => {
          setAdminStats(stats);
          setAdminLots(lots || []);
          setAdminBids(bids || []);
          setAdminUsers(users || { farmers: [], buyers: [] });
          setAdminTransactions(txns || []);
          setAdminActivity(activity || []);
        })
        .catch(() => {})
        .finally(() => setLoadingContent(false));
    } else {
      setLoadingContent(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login');
      return;
    }
    loadData();
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, [user, isAuthenticated, isLoading]);

  if (isLoading || loadingContent) {
    return (
      <div className="space-y-6">
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

  // ==========================================
  // VIEW 1: FARMER COMMAND CENTER
  // ==========================================
  if (user.role === 'FARMER') {
    const activeBiddingLots = farmerLots.filter((l) => l.status === 'BIDDING');
    const soldLots = farmerLots.filter((l) => l.status === 'SOLD');
    const openLots = farmerLots.filter((l) => l.status === 'OPEN');
    const pendingBidsCount = farmerBids.filter((b) => b.status === 'PENDING').length;

    const completedSalesCount = soldLots.length;
    const totalSaleValue = soldLots.reduce((acc, l) => acc + (l.transaction?.totalAmount || (l.expectedPrice * l.quantity)), 0);
    const pendingPaymentsValue = soldLots
      .filter((l) => l.transaction?.payment?.status !== 'PAID')
      .reduce((acc, l) => acc + (l.transaction?.totalAmount || 0), 0);

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 p-6 md:p-8 rounded-3xl text-slate-950 shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-slate-950 text-amber-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              <Sprout className="w-3.5 h-3.5" /> {t.farmerDashboardTitle}
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight">
              {t.greetingNamaste}, {user.name} 👋
            </h1>
            <p className="text-xs md:text-sm font-bold text-slate-900/90 max-w-xl">
              {t.farmerHubHeadlineSub}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5 relative z-10">
            <Link
              href="/create-lot"
              className="bg-slate-950 hover:bg-slate-900 text-amber-400 font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> {t.btnPublishLot}
            </Link>
            <Link
              href="/my-lots"
              className="bg-white/90 hover:bg-white text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Layers className="w-4 h-4" /> {t.tabAllListings} ({farmerLots.length})
            </Link>
          </div>
        </div>

        {/* 6 REAL FARMER KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-3xl border border-orange-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-orange-900 tracking-wider">{t.tabActiveBidding}</span>
              <Flame className="w-4 h-4 text-orange-600 fill-orange-500 animate-pulse" />
            </div>
            <span className="text-2xl font-black text-slate-950 block">{activeBiddingLots.length}</span>
            <span className="text-[10px] text-orange-800 font-bold block">{t.activelyReceivingOffers}</span>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-3xl border border-emerald-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider">{t.tabSoldFinalized}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-2xl font-black text-slate-950 block">{soldLots.length}</span>
            <span className="text-[10px] text-emerald-800 font-bold block">{t.acceptedDealsKpi}</span>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{t.pendingBadge}</span>
              <Gavel className="w-4 h-4 text-amber-700" />
            </div>
            <span className="text-2xl font-black text-slate-950 block">{pendingBidsCount}</span>
            <span className="text-[10px] text-slate-500 font-bold block">{t.awaitingBuyerOffersTitle}</span>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{t.tabOpenAwaiting}</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-2xl font-black text-slate-950 block">{openLots.length}</span>
            <span className="text-[10px] text-slate-500 font-bold block">{t.activeLotsTitle}</span>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-3xl border border-amber-300 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-amber-950 tracking-wider">{t.contractTotalLabel}</span>
              <DollarSign className="w-4 h-4 text-amber-800" />
            </div>
            <span className="text-xl font-black text-slate-950 block">{formatINR(totalSaleValue)}</span>
            <span className="text-[10px] text-amber-900 font-bold block">{t.contractValueLabel}</span>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{t.paymentSettlementLabel}</span>
              <CreditCard className="w-4 h-4 text-amber-700" />
            </div>
            <span className="text-xl font-black text-slate-950 block">{formatINR(pendingPaymentsValue)}</span>
            <span className="text-[10px] text-slate-500 font-bold block">{t.inProcessLabel}</span>
          </div>
        </div>

        {/* ACTIVE BIDDING HIGHLIGHT ROW */}
        {activeBiddingLots.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border-2 border-orange-300 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-orange-100 text-orange-800">
                  <Flame className="w-5 h-5 fill-orange-500" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-slate-900">{t.activelyReceivingOffers}</h2>
                  <p className="text-xs text-slate-500">{t.directBuyerOffersSubtitle}</p>
                </div>
              </div>
              <Link
                href="/my-lots"
                className="text-xs font-black text-orange-800 hover:text-orange-950 flex items-center gap-1 cursor-pointer"
              >
                {t.navMyLots} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeBiddingLots.map((lot) => (
                <div
                  key={lot.id}
                  className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="font-black text-slate-900 text-sm block">
                      {tCrop(lot.crop?.name)} ({lot.quantity} {lot.unit === 'QUINTAL' || !lot.unit ? t.commonQuintal : lot.unit === 'KG' ? t.commonKg : lot.unit === 'TONNE' ? t.commonTonne : lot.unit})
                    </span>
                    <span className="text-xs text-slate-500">
                      {t.askingPriceLabel}: ₹{lot.expectedPrice}/{t.commonQuintal} | <strong>{t.topBuyerOfferLabel}: ₹{lot.highestBid || lot.expectedPrice}/{t.commonQuintal}</strong>
                    </span>
                  </div>
                  <Link
                    href={`/my-lots/${lot.id}`}
                    className="bg-orange-500 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow hover:bg-orange-400 transition cursor-pointer"
                  >
                    {t.btnAcceptOffer}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOLD LISTINGS ROW */}
        {soldLots.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-slate-900">{t.recentlyFinalizedSalesTitle}</h2>
                  <p className="text-xs text-slate-500">{t.recentlyFinalizedSalesSub}</p>
                </div>
              </div>
              <Link
                href="/transactions"
                className="text-xs font-black text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
              >
                {t.viewPurchaseOrdersBtn} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {soldLots.map((lot) => (
                <div
                  key={lot.id}
                  className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-black text-slate-900 text-sm block">
                      {tCrop(lot.crop?.name)} — {lot.quantity} {t.commonQuintal}
                    </span>
                    <span className="text-slate-600">
                      {t.buyerLabel}: <strong>{lot.transaction?.buyer?.name || 'FreshCart Agro Ltd.'}</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-900 text-sm block">
                      {formatINR(lot.transaction?.totalAmount || (lot.expectedPrice * lot.quantity))}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700">{t.statusContractCompleted}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: BUYER COMMAND CENTER
  // ==========================================
  if (user.role === 'BUYER') {
    const activeBids = buyerBids.filter((b) => b.status === 'PENDING');
    const acceptedBids = buyerBids.filter((b) => b.status === 'ACCEPTED');
    const withdrawnBids = buyerBids.filter((b) => b.status === 'WITHDRAWN');
    const totalProcurementGMV = acceptedBids.reduce((acc, b) => acc + (b.price * b.quantity), 0);

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 md:p-8 rounded-3xl text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              <ShoppingBag className="w-3.5 h-3.5" /> {t.buyerMarketplaceTitle}
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-amber-300">
              {t.greetingWelcome}, {user.name} 🏢
            </h1>
            <p className="text-xs md:text-sm font-medium text-slate-300 max-w-xl">
              {t.buyerHubHeadlineSub}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5 relative z-10">
            <Link
              href="/browse-lots"
              className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" /> {t.browseMarketplaceBtn}
            </Link>
            <Link
              href="/my-bids"
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow transition border border-amber-400/30 cursor-pointer"
            >
              <Gavel className="w-4 h-4" /> {t.myBidsTitle} ({buyerBids.length})
            </Link>
          </div>
        </div>

        {/* 4 BUYER KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-sm space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">{t.activeBidsKpi}</span>
            <span className="text-2xl font-black text-slate-950 block">{activeBids.length}</span>
            <span className="text-[10px] text-amber-700 font-bold block">{t.awaitingFarmerDecision}</span>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-3xl border border-emerald-200 shadow-sm space-y-1">
            <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider block">{t.acceptedDealsKpi}</span>
            <span className="text-2xl font-black text-slate-950 block">{acceptedBids.length}</span>
            <span className="text-[10px] text-emerald-800 font-bold block">{t.finalizedSaleContract}</span>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">{t.withdrawnBidsKpi}</span>
            <span className="text-2xl font-black text-slate-950 block">{withdrawnBids.length}</span>
            <span className="text-[10px] text-slate-400 font-bold block">{t.statusCancelled}</span>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-3xl border border-amber-300 shadow-sm space-y-1">
            <span className="text-[10px] font-black uppercase text-amber-950 tracking-wider block">{t.procurementGmvKpi}</span>
            <span className="text-xl font-black text-slate-950 block">{formatINR(totalProcurementGMV)}</span>
            <span className="text-[10px] text-amber-900 font-bold block">{t.totalOrderValueLabel}</span>
          </div>
        </div>

        {/* LIVE MARKETPLACE PICKS */}
        <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">{t.featuredFarmGateLotsTitle}</h2>
              <p className="text-xs text-slate-500">{t.featuredFarmGateLotsSub}</p>
            </div>
            <Link
              href="/browse-lots"
              className="text-xs font-black text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {t.commonView} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {buyerLots.slice(0, 3).map((lot) => (
              <div
                key={lot.id}
                className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">
                      {tCrop(lot.crop?.name)} ({lot.quantity} {lot.unit === 'QUINTAL' || !lot.unit ? t.commonQuintal : lot.unit === 'KG' ? t.commonKg : lot.unit === 'TONNE' ? t.commonTonne : lot.unit})
                    </span>
                    <StatusBadge status={lot.status} />
                  </div>
                  <div className="text-xs space-y-0.5 text-slate-600">
                    <div>{t.expectedRateLabel}: <strong className="text-slate-900">₹{lot.expectedPrice}/{t.commonQuintal}</strong></div>
                    <div className="text-[10px] text-slate-400">📍 {lot.location}</div>
                  </div>
                </div>

                <Link
                  href={`/browse-lots/${lot.id}`}
                  className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs py-2 rounded-xl text-center shadow-sm hover:from-amber-300 hover:to-yellow-400 transition cursor-pointer"
                >
                  {t.placeProcurementBidBtn}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: ADMIN COMPREHENSIVE MONITORING
  // ==========================================
  if (user.role === 'ADMIN') {
    const stats = adminStats || {
      totalFarmers: 2,
      totalBuyers: 2,
      activeLots: 3,
      activeBiddingLots: 1,
      soldLots: 1,
      cancelledLots: 0,
      pendingBids: 1,
      acceptedBids: 1,
      cancelledBids: 1,
      modifiedBids: 1,
      totalTransactionValue: 174000,
      pendingPaymentsValue: 0,
      completedPaymentsValue: 174000,
      recentActivity: [],
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 md:p-8 rounded-3xl text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> {t.adminTitle}
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-amber-300">
              {t.adminCockpitTitle}
            </h1>
            <p className="text-xs md:text-sm font-medium text-slate-300 max-w-2xl">
              {t.adminCockpitSubtitle}
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <Link
              href="/admin/registrations"
              className="px-5 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 rounded-2xl text-xs font-black shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>{t.adminRegistrationsTitle}</span>
              {(stats.pendingRegistrations ?? 0) > 0 && (
                <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full animate-pulse">
                  {stats.pendingRegistrations}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* ADMIN KPI CARDS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-sm space-y-0.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">{t.totalFarmersKpi}</span>
            <span className="text-2xl font-black text-slate-950">{stats.totalFarmers}</span>
            <span className="text-[10px] text-amber-800 font-bold block">{t.verifiedBadge}</span>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-sm space-y-0.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">{t.totalBuyersKpi}</span>
            <span className="text-2xl font-black text-slate-950">{stats.totalBuyers}</span>
            <span className="text-[10px] text-amber-800 font-bold block">{t.buyerRoleTitle}</span>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-3xl border border-orange-200 shadow-sm space-y-0.5">
            <span className="text-[10px] font-black uppercase text-orange-900 tracking-wider block">{t.activeBiddingLotsKpi}</span>
            <span className="text-2xl font-black text-slate-950">{stats.activeBiddingLots}</span>
            <span className="text-[10px] text-orange-800 font-bold block">{t.tabActiveBidding}</span>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-3xl border border-emerald-200 shadow-sm space-y-0.5">
            <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider block">{t.soldLotsKpi}</span>
            <span className="text-2xl font-black text-slate-950">{stats.soldLots}</span>
            <span className="text-[10px] text-emerald-800 font-bold block">{t.tabSoldFinalized}</span>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-sm space-y-0.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">{t.modifiedBidsKpi}</span>
            <span className="text-2xl font-black text-slate-950">{stats.modifiedBids}</span>
            <span className="text-[10px] text-amber-700 font-bold block">{t.modifyQuantityBtn}</span>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-0.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">{t.cancelledBidsKpi}</span>
            <span className="text-2xl font-black text-slate-950">{stats.cancelledBids}</span>
            <span className="text-[10px] text-slate-400 font-bold block">{t.statusCancelled}</span>
          </div>

          <div className="col-span-2 md:col-span-3 lg:col-span-3 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-3xl border border-amber-300 shadow-sm space-y-0.5">
            <span className="text-[10px] font-black uppercase text-amber-950 tracking-wider block">{t.totalGmvTradedKpi}</span>
            <span className="text-2xl font-black text-slate-950">{formatINR(stats.totalTransactionValue)}</span>
            <span className="text-[10px] text-amber-900 font-bold block">{t.totalGMV}</span>
          </div>

          <div className="col-span-2 md:col-span-3 lg:col-span-3 bg-white p-4 rounded-3xl border border-emerald-200 shadow-sm space-y-0.5">
            <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider block">{t.completedSettlementsKpi}</span>
            <span className="text-2xl font-black text-slate-950">{formatINR(stats.completedPaymentsValue)}</span>
            <span className="text-[10px] text-emerald-700 font-bold block">{t.directFarmPayoutBadge}</span>
          </div>
        </div>

        {/* MONITORING NAVIGATION TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-amber-200">
          <button
            onClick={() => setAdminTab('OVERVIEW')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer ${
              adminTab === 'OVERVIEW'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-white border border-amber-200 text-slate-600 hover:bg-amber-50'
            }`}
          >
            {t.overviewSummaryTab}
          </button>
          <button
            onClick={() => setAdminTab('LOTS')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer ${
              adminTab === 'LOTS'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-white border border-amber-200 text-slate-600 hover:bg-amber-50'
            }`}
          >
            {t.cropLotsMonitorTab} ({adminLots.length})
          </button>
          <button
            onClick={() => setAdminTab('BIDS')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer ${
              adminTab === 'BIDS'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-white border border-amber-200 text-slate-600 hover:bg-amber-50'
            }`}
          >
            {t.bidsCounterOffersTab} ({adminBids.length})
          </button>
          <button
            onClick={() => setAdminTab('USERS')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer ${
              adminTab === 'USERS'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-white border border-amber-200 text-slate-600 hover:bg-amber-50'
            }`}
          >
            {t.userDirectoriesTab}
          </button>
          <button
            onClick={() => setAdminTab('TRANSACTIONS')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer ${
              adminTab === 'TRANSACTIONS'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-white border border-amber-200 text-slate-600 hover:bg-amber-50'
            }`}
          >
            {t.transactionsContractsTab}
          </button>
          <button
            onClick={() => setAdminTab('ACTIVITY')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1 cursor-pointer ${
              adminTab === 'ACTIVITY'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-white border border-amber-200 text-slate-600 hover:bg-amber-50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-700" />
            {t.liveAuditStreamTab}
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {adminTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Live Activity Stream */}
            <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-600" />
                  <h3 className="font-black text-slate-900 text-base">{t.realTimeAuditFeedTitle}</h3>
                </div>
                <button
                  onClick={() => setAdminTab('ACTIVITY')}
                  className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
                >
                  {t.commonView}
                </button>
              </div>

              <div className="space-y-3">
                {(adminActivity.length > 0 ? adminActivity.slice(0, 6) : stats.recentActivity || []).map((act: any) => (
                  <div key={act.id} className="p-3 bg-amber-50/40 rounded-2xl border border-amber-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">{act.actorName} ({act.actorRole})</span>
                      <span className="text-[10px] text-slate-400">{new Date(act.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-600">
                      {act.action === 'LOT_CREATED' && `${t.btnPublishLot}: ${tCrop(act.metadata?.cropName) || act.metadata?.cropName || 'Crop'} (${act.newQuantity} ${t.commonQuintal} @ ₹${act.price}/${t.commonQuintal})`}
                      {act.action === 'BID_PLACED' && `${t.btnPlaceBid}: ₹${act.price}/${t.commonQuintal} (${act.newQuantity} ${t.commonQuintal})`}
                      {act.action === 'QUANTITY_MODIFIED' && `${t.modifyQuantityBtn}: ${act.oldQuantity} ${t.commonQuintal} → ${act.newQuantity} ${t.commonQuintal}`}
                      {act.action === 'BID_CANCELLED' && `${t.cancelBidBtn} #${act.lotId?.substring(0, 8)}`}
                      {act.action === 'BID_ACCEPTED' && `${t.dealAcceptedByFarmer}: ₹${act.price}/${t.commonQuintal} (${t.contractTotalLabel}: ₹${act.metadata?.totalAmount?.toLocaleString('en-IN')})`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-base">{t.platformHealthTitle}</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                  <span className="font-black text-emerald-950 block">{t.directFarmPayoutBadge}</span>
                  <p className="text-emerald-800 text-[11px]">
                    {stats.totalFarmers} {t.verifiedBadge} {t.farmersDirectoryTitle}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-black text-slate-900 block">{t.finalizedSaleContract}</span>
                  <p className="text-slate-600 text-[11px]">
                    {stats.soldLots} {t.completedSettlementsKpi}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CROP LOTS MONITOR */}
        {adminTab === 'LOTS' && (
          <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-4 overflow-x-auto">
            <h3 className="font-black text-slate-900 text-base">{t.allMarketplaceCropLotsTitle}</h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-amber-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5">{t.contractNumberLabel}</th>
                  <th>{t.farmerSellerLabel}</th>
                  <th>{t.cropLabel}</th>
                  <th>{t.lotQtyLabel}</th>
                  <th>{t.askingPriceLabel}</th>
                  <th>{t.accountStatusLabel}</th>
                  <th>{t.topBuyerOfferLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {adminLots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-amber-50/40">
                    <td className="py-3 font-mono font-bold text-slate-600">#{lot.id.substring(0, 8)}</td>
                    <td className="font-extrabold text-slate-900">{lot.farmer?.name || 'Ramesh Patel'}</td>
                    <td>{tCrop(lot.crop?.name)}</td>
                    <td>{lot.quantity} {lot.unit || t.commonQuintal}</td>
                    <td className="font-bold">₹{lot.expectedPrice}/{t.commonQuintal}</td>
                    <td><StatusBadge status={lot.status} /></td>
                    <td className="font-black text-orange-700">{lot.highestBid ? `₹${lot.highestBid}/${t.commonQuintal}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: BIDS MONITOR */}
        {adminTab === 'BIDS' && (
          <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-4 overflow-x-auto">
            <h3 className="font-black text-slate-900 text-base">{t.allBiddingOperationsTitle}</h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-amber-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5">{t.contractNumberLabel}</th>
                  <th>{t.buyerLabel}</th>
                  <th>{t.cropLabel}</th>
                  <th>{t.enterBidAmountLabel}</th>
                  <th>{t.bidQuantityLabel}</th>
                  <th>{t.totalOrderValueLabel}</th>
                  <th>{t.accountStatusLabel}</th>
                  <th>{t.registrationDateLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {adminBids.map((bid) => (
                  <tr key={bid.id} className="hover:bg-amber-50/40">
                    <td className="py-3 font-mono font-bold text-slate-600">#{bid.id.substring(0, 8)}</td>
                    <td className="font-extrabold text-slate-900">{bid.buyer?.name || 'FreshCart Agro'}</td>
                    <td>{tCrop(bid.lot?.crop?.name) || 'Crop'}</td>
                    <td className="font-black text-slate-900">₹{bid.price}/{t.commonQuintal}</td>
                    <td>{bid.quantity} {t.commonQuintal}</td>
                    <td className="font-bold text-amber-900">{formatINR(bid.price * bid.quantity)}</td>
                    <td>
                      {bid.status === 'WITHDRAWN' ? (
                        <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {t.statusCancelled}
                        </span>
                      ) : (
                        <StatusBadge status={bid.status} type="bid" />
                      )}
                    </td>
                    <td className="text-[11px] text-slate-400">{new Date(bid.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: USER DIRECTORIES */}
        {adminTab === 'USERS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Farmers Directory */}
            <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-600" /> {t.farmersDirectoryTitle} ({adminUsers.farmers?.length || 0})
              </h3>
              <div className="space-y-3">
                {adminUsers.farmers?.map((f: any) => (
                  <div key={f.id} className="p-3.5 bg-amber-50/40 rounded-2xl border border-amber-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900">{f.name}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full">{t.verifiedBadge}</span>
                    </div>
                    <div className="text-slate-500">📍 {f.district}, {f.state} | 📞 {f.phone}</div>
                    <div className="pt-1 flex items-center justify-between border-t border-amber-200/50 text-[11px]">
                      <span>{t.activeLotsTitle}: <strong>{f.activeLots || 0}</strong></span>
                      <span>{t.tabSoldFinalized}: <strong>{f.soldLots || 0}</strong></span>
                      <span className="font-black text-emerald-800">{formatINR(f.totalSales || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buyers Directory */}
            <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" /> {t.buyersDirectoryTitle} ({adminUsers.buyers?.length || 0})
              </h3>
              <div className="space-y-3">
                {adminUsers.buyers?.map((b: any) => (
                  <div key={b.id} className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900">{b.organizationName || b.name}</span>
                      <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded-full">{b.businessType || 'Wholesale'}</span>
                    </div>
                    <div className="text-slate-500">📍 {b.district}, {b.state} | 👤 {b.contactPerson || b.name}</div>
                    <div className="pt-1 flex items-center justify-between border-t border-slate-200 text-[11px]">
                      <span>{t.myBidsTitle}: <strong>{b.totalBids || 0}</strong></span>
                      <span>{t.purchasesTitle}: <strong>{b.totalPurchases || 0}</strong></span>
                      <span className="font-black text-amber-800">{formatINR(b.totalSpent || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TRANSACTIONS */}
        {adminTab === 'TRANSACTIONS' && (
          <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-4 overflow-x-auto">
            <h3 className="font-black text-slate-900 text-base">{t.transactionsContractsTab}</h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-amber-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5">{t.contractNumberLabel}</th>
                  <th>{t.farmerSellerLabel}</th>
                  <th>{t.buyerLabel}</th>
                  <th>{t.cropLabel}</th>
                  <th>{t.contractTotalLabel}</th>
                  <th>{t.paymentMilestoneLabel}</th>
                  <th>{t.registrationDateLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {adminTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-amber-50/40">
                    <td className="py-3 font-mono font-bold text-slate-600">#{txn.id.substring(0, 8)}</td>
                    <td className="font-extrabold text-slate-900">{txn.farmer?.name || 'Farmer'}</td>
                    <td className="font-extrabold text-slate-900">{txn.buyer?.name || 'Buyer'}</td>
                    <td>{tCrop(txn.lot?.crop?.name) || 'Crop'} ({txn.quantity} {t.commonQuintal})</td>
                    <td className="font-black text-emerald-800">{formatINR(txn.totalAmount)}</td>
                    <td><StatusBadge status={txn.payment?.status || 'PENDING'} type="payment" /></td>
                    <td className="text-[11px] text-slate-400">{new Date(txn.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 6: ACTIVITY STREAM */}
        {adminTab === 'ACTIVITY' && (
          <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base">{t.liveAuditStreamTab}</h3>
            <div className="space-y-2">
              {adminActivity.map((act) => (
                <div key={act.id} className="p-3 bg-amber-50/40 rounded-2xl border border-amber-100 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-black text-slate-900">{act.actorName} ({act.actorRole})</span>: <span className="text-slate-600">{act.action}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{new Date(act.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
