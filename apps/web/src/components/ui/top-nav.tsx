'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { useLanguage } from '../../lib/language-context';
import { LanguageSelector } from './language-selector';
import {
  Sprout,
  TrendingUp,
  PlusCircle,
  Package,
  ShoppingCart,
  Gavel,
  FileCheck,
  LayoutDashboard,
  ShieldCheck,
  User,
  LogIn,
  LogOut,
  UserPlus,
  ShieldAlert,
} from 'lucide-react';

export function TopNav() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { t, language } = useLanguage();

  let navItems: { label: string; href: string; icon: any }[] = [];

  if (!isAuthenticated || !user) {
    navItems = [
      { label: t.navHome, href: '/', icon: Sprout },
      { label: t.navPrices, href: '/prices', icon: TrendingUp },
      { label: t.navMarketplace, href: '/browse-lots', icon: ShoppingCart },
    ];
  } else if (user.role === 'FARMER') {
    navItems = [
      { label: t.navDashboard, href: '/dashboard', icon: LayoutDashboard },
      { label: t.navPrices, href: '/prices', icon: TrendingUp },
      { label: t.navSell, href: '/create-lot', icon: PlusCircle },
      { label: t.navMyLots, href: '/my-lots', icon: Package },
      { label: t.navProfile, href: '/profile', icon: User },
    ];
  } else if (user.role === 'BUYER') {
    navItems = [
      { label: t.navDashboard, href: '/dashboard', icon: LayoutDashboard },
      { label: t.navMarketplace, href: '/browse-lots', icon: ShoppingCart },
      { label: t.navPrices, href: '/prices', icon: TrendingUp },
      { label: t.navMyBids, href: '/my-bids', icon: Gavel },
      { label: t.navPurchases, href: '/transactions', icon: FileCheck },
      { label: t.navProfile, href: '/profile', icon: User },
    ];
  } else if (user.role === 'ADMIN') {
    navItems = [
      { label: t.navDashboard, href: '/dashboard', icon: LayoutDashboard },
      { label: t.navAdminRegistrations, href: '/admin/registrations', icon: ShieldAlert },
      { label: t.navPrices, href: '/prices', icon: TrendingUp },
      { label: t.navMarketplace, href: '/browse-lots', icon: ShoppingCart },
      { label: t.navProfile, href: '/profile', icon: User },
    ];
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-950 text-white shadow-xl border-b border-amber-500/20">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-95 transition shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 text-slate-950 rounded-2xl flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
            <Sprout className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="font-black text-base md:text-lg tracking-tight flex items-center gap-1.5 leading-none text-white">
              {language === 'hi' ? 'वाणिज्य' : language === 'te' ? 'వాణిజ్య' : 'Vanijya'}
              <span className="text-amber-400 text-xs font-black">
                {language === 'hi' ? 'Vanijya' : language === 'te' ? 'Vanijya' : 'वाणिज्य'}
              </span>
            </div>
            <p className="text-[10px] text-amber-200/80 mt-0.5 leading-none hidden sm:block">
              {t.brandSubtitle}
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-amber-300 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Language Selector + User Session */}
        <div className="flex items-center gap-2">
          <LanguageSelector />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/profile"
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-full text-xs font-semibold border border-amber-500/30 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="max-w-[110px] truncate text-slate-200">
                  {user.name.split(' ')[0]}
                </span>
                <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                  {user.role}
                </span>
              </Link>
              <button
                onClick={logout}
                title={t.navLogout}
                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-slate-300 hover:text-white px-3 py-1.5 rounded-full text-xs font-bold transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                {t.navLogin}
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 px-4 py-1.5 rounded-full text-xs font-black transition shadow-md shadow-amber-400/20"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {t.navSignup}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800 px-2 py-1.5 text-xs bg-slate-950">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
