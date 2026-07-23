'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Search, 
  Filter, 
  Home as HomeIcon, 
  History as HistoryIcon, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Calendar,
  Tag,
  TrendingDown,
  TrendingUp,
  Scale,
  Plus,
  Clock,
  X,
  Loader2
} from 'lucide-react';

interface WalletItem {
  id: number;
  name: string;
  balance: number;
}

interface Transaction {
  id: number;
  created_at: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  wallet_name: string;
}

const SENSITIVE_KEYWORDS = [
  'slot', 'depo', 'judol', 'zeus', 'olympus', 'gacor', 
  'maxwin', 'pragmatic', 'habanero', 'sbobet', 'judi', 'judionline', 'poker'
];

const getCurrentLocalDateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

const formatRupiahInput = (val: string) => {
  const numberString = val.replace(/[^0-9]/g, '');
  if (!numberString) return '';
  return 'Rp ' + Number(numberString).toLocaleString('id-ID');
};

const parseRupiahNumber = (val: string) => {
  return Number(val.replace(/[^0-9]/g, '')) || 0;
};

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Form Mobile Modal State
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);
  const [mobileDesc, setMobileDesc] = useState('');
  const [mobileAmount, setMobileAmount] = useState('');
  const [mobileType, setMobileType] = useState('EXPENSE');
  const [mobileWallet, setMobileWallet] = useState('');
  const [mobileDate, setMobileDate] = useState(getCurrentLocalDateTime());

  const fetchData = async () => {
    setLoading(true);

    const { data: walletData } = await supabase.from('wallets').select('*').order('id', { ascending: true });
    if (walletData) {
      setWallets(walletData);
      if (walletData.length > 0 && !mobileWallet) {
        setMobileWallet(walletData[0].name);
      }
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseRupiahNumber(mobileAmount);
    if (!mobileDesc.trim() || numericAmount <= 0 || !mobileWallet) return;

    setSubmitting(true);
    const isJudol = SENSITIVE_KEYWORDS.some(kw => mobileDesc.toLowerCase().includes(kw));
    const finalCategory = isJudol ? 'Special Recovery Tracker' : (mobileType === 'EXPENSE' ? 'Survival Mode' : 'Main Cashflow');

    await supabase.from('transactions').insert([{
      description: mobileDesc,
      amount: numericAmount,
      type: mobileType,
      category: finalCategory,
      wallet_name: mobileWallet,
      created_at: new Date(mobileDate).toISOString()
    }]);

    if (!isJudol) triggerConfetti();

    setMobileDesc('');
    setMobileAmount('');
    setMobileDate(getCurrentLocalDateTime());
    setSubmitting(false);
    setIsMobileFormOpen(false);
    fetchData();
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.wallet_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === 'ALL' ? true : t.type?.toUpperCase() === typeFilter;

    return matchesSearch && matchesType;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type?.toUpperCase() === 'INCOME')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type?.toUpperCase() === 'EXPENSE')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const netCashflow = totalIncome - totalExpense;

  const groupTransactionsByDate = (transList: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};

    transList.forEach(t => {
      if (!t.created_at) return;
      const dateObj = new Date(t.created_at);
      
      const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      const transDateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

      let groupLabel = transDateStr;
      if (transDateStr === todayStr) {
        groupLabel = `Hari Ini - ${transDateStr}`;
      }

      if (!groups[groupLabel]) {
        groups[groupLabel] = [];
      }
      groups[groupLabel].push(t);
    });

    return groups;
  };

  const groupedData = groupTransactionsByDate(filteredTransactions);

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-100 text-slate-900';
  const cardClass = isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white/80 border-slate-200/80 shadow-sm';
  const inputBgClass = isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-300 text-slate-800';
  const subTextClass = isDark ? 'text-zinc-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen font-sans p-4 md:p-8 pb-28 md:pb-8 transition-colors duration-300 ${bgClass}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Navigation Section */}
        <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 md:p-6 rounded-3xl border backdrop-blur-xl ${cardClass}`}>
          <div>
            <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold tracking-wider uppercase mb-0.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Financial Health Zone</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
              Laporan & Riwayat Transaksi
            </h1>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3">
            <nav className="hidden lg:flex items-center p-1.5 rounded-2xl border bg-zinc-950/40 border-zinc-800/80 gap-1">
              <Link 
                href="/"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${subTextClass} hover:text-zinc-200`}
              >
                <HomeIcon className="w-3.5 h-3.5" /> Dashboard
              </Link>
              <Link 
                href="/history"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 flex items-center gap-2"
              >
                <HistoryIcon className="w-3.5 h-3.5" /> Laporan
              </Link>
            </nav>

            <button 
              onClick={toggleTheme}
              className={`p-2.5 rounded-2xl border transition-all active:scale-95 flex items-center justify-center ${
                isDark ? 'bg-zinc-800/80 border-zinc-700/60 text-yellow-400 hover:bg-zinc-700' : 'bg-slate-200 border-slate-300 text-indigo-600 hover:bg-slate-300'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* SUMMARY CARDS 📊 */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Total Pemasukan
            </span>
            <p className="text-lg font-black text-emerald-500 mt-1">
              Rp {totalIncome.toLocaleString('id-ID')}
            </p>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Total Pengeluaran
            </span>
            <p className="text-lg font-black text-rose-400 mt-1">
              Rp {totalExpense.toLocaleString('id-ID')}
            </p>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${subTextClass}`}>
              <Scale className="w-3.5 h-3.5 text-emerald-500" /> Nett Cashflow
            </span>
            <p className={`text-lg font-black mt-1 ${netCashflow >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {netCashflow >= 0 ? '+' : ''} Rp {netCashflow.toLocaleString('id-ID')}
            </p>
          </div>
        </section>

        {/* SEARCH & FILTER BAR 🔎 */}
        <section className={`p-4 rounded-3xl border space-y-3 ${cardClass}`}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className={`w-4 h-4 absolute left-3.5 top-3 ${subTextClass}`} />
              <input 
                type="text" 
                placeholder="Cari transaksi (misal: Rokok, Es Krim, DANA)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 ${inputBgClass}`}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-500" />
              <div className={`p-1 rounded-2xl border flex gap-1 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200'}`}>
                <button
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    typeFilter === 'ALL' ? 'bg-emerald-500 text-zinc-950' : `${subTextClass} hover:text-zinc-200`
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setTypeFilter('EXPENSE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    typeFilter === 'EXPENSE' ? 'bg-rose-500 text-white' : `${subTextClass} hover:text-zinc-200`
                  }`}
                >
                  Keluar
                </button>
                <button
                  onClick={() => setTypeFilter('INCOME')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    typeFilter === 'INCOME' ? 'bg-emerald-500 text-zinc-950' : `${subTextClass} hover:text-zinc-200`
                  }`}
                >
                  Masuk
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* GROUPED TRANSACTIONS LIST 📅 */}
        <section className="space-y-6">
          {loading ? (
            <p className={`text-center py-12 text-xs ${subTextClass}`}>Memuat riwayat transaksi...</p>
          ) : Object.keys(groupedData).length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border ${cardClass}`}>
              <p className={`text-sm font-semibold ${subTextClass}`}>Tidak ada riwayat transaksi yang ditemukan.</p>
            </div>
          ) : (
            Object.keys(groupedData).map((dateGroup) => (
              <div key={dateGroup} className="space-y-2.5">
                <div className="flex items-center gap-2 px-2">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  <span className={`text-xs font-extrabold tracking-wider uppercase ${subTextClass}`}>
                    {dateGroup}
                  </span>
                </div>

                <div className="space-y-2">
                  {groupedData[dateGroup].map((t) => {
                    const isIncome = t.type?.toUpperCase() === 'INCOME';
                    const isJudol = t.category === 'Special Recovery Tracker';
                    const formattedTime = t.created_at 
                      ? new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <div 
                        key={t.id} 
                        className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 ${cardClass} hover:border-emerald-500/30`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border ${
                            isIncome 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : isJudol
                                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          }`}>
                            {isIncome ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                          </div>

                          <div className="space-y-0.5">
                            <h3 className="text-sm font-bold tracking-tight">
                              {t.description}
                            </h3>
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className={`px-2 py-0.5 rounded-md font-medium border ${
                                isDark ? 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                              }`}>
                                {t.wallet_name}
                              </span>
                              <span className={`flex items-center gap-1 ${subTextClass}`}>
                                <Tag className="w-3 h-3 text-emerald-500/70" /> {t.category || 'Survival Mode'}
                              </span>
                              <span className={subTextClass}>• {formattedTime} WIB</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-base font-black ${
                            isIncome ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isIncome ? '+' : '-'} Rp {(Number(t.amount) || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>

      </div>

      {/* STICKY BOTTOM NAVIGATION BAR MOBILE */}
      <nav className={`lg:hidden fixed bottom-0 inset-x-0 z-40 p-2.5 border-t backdrop-blur-xl flex justify-around items-center ${
        isDark ? 'bg-zinc-900/90 border-zinc-800 text-zinc-400' : 'bg-white/90 border-slate-200 text-slate-600'
      }`}>
        <Link 
          href="/" 
          className={`flex flex-col items-center gap-1 font-semibold text-[10px] ${subTextClass}`}
        >
          <HomeIcon className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        <Link 
          href="/history" 
          className="flex flex-col items-center gap-1 text-emerald-500 font-bold text-[10px]"
        >
          <HistoryIcon className="w-5 h-5" />
          <span>Laporan</span>
        </Link>
      </nav>

      {/* Floating Action Button Mobile (+ Catat Instan) */}
      <button 
        onClick={() => setIsMobileFormOpen(true)}
        className="lg:hidden fixed bottom-16 right-5 p-3.5 bg-emerald-500 text-zinc-950 rounded-full shadow-2xl shadow-emerald-500/50 border border-emerald-400 active:scale-90 transition-all z-50 flex items-center gap-2 font-bold"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* Bottom Sheet Form Mobile */}
      {isMobileFormOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end animate-in fade-in duration-200">
          <div className={`w-full p-6 rounded-t-3xl border-t space-y-4 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Catat Transaksi Instan
              </h2>
              <button onClick={() => setIsMobileFormOpen(false)} className={`p-1 ${subTextClass}`}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleMobileSubmit}>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className={`text-xs block ${subTextClass}`}>Waktu</label>
                  <button 
                    type="button" 
                    onClick={() => setMobileDate(getCurrentLocalDateTime())}
                    className="text-[10px] text-emerald-500 hover:underline flex items-center gap-0.5"
                  >
                    <Clock className="w-2.5 h-2.5" /> Set Jam Sekarang
                  </button>
                </div>
                <input 
                  type="datetime-local" 
                  value={mobileDate}
                  onChange={(e) => setMobileDate(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 ${inputBgClass}`}
                />
              </div>

              <div>
                <label className={`text-xs mb-1 block ${subTextClass}`}>Keterangan</label>
                <input 
                  type="text" 
                  placeholder="misal: Kopi / Depo" 
                  value={mobileDesc}
                  onChange={(e) => setMobileDesc(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none transition-all ${inputBgClass}`}
                  required
                />
              </div>

              <div>
                <label className={`text-xs mb-1 block ${subTextClass}`}>Nominal (Rp)</label>
                <input 
                  type="text" 
                  placeholder="Rp 0" 
                  value={mobileAmount}
                  onChange={(e) => setMobileAmount(formatRupiahInput(e.target.value))}
                  className={`w-full border rounded-xl px-3 py-3 text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-all ${inputBgClass}`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-xs mb-1 block ${subTextClass}`}>Tipe</label>
                  <select 
                    value={mobileType}
                    onChange={(e) => setMobileType(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-emerald-500 ${inputBgClass}`}
                  >
                    <option value="EXPENSE">Keluar</option>
                    <option value="INCOME">Masuk</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs mb-1 block ${subTextClass}`}>Dompet</label>
                  <select 
                    value={mobileWallet}
                    onChange={(e) => setMobileWallet(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-emerald-500 ${inputBgClass}`}
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full mt-3 font-bold py-3.5 rounded-xl transition-all shadow-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Catat Sekarang ✨'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}