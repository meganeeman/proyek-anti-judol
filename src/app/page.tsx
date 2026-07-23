'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  CreditCard,
  TrendingUp,
  Receipt,
  Sparkles,
  ShieldCheck,
  Loader2,
  X,
  Target,
  AlertTriangle,
  Gift,
  CalendarCheck,
  Sun,
  Moon,
  Flame,
  HelpCircle
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

export default function Home() {
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyLimit, setMonthlyLimit] = useState(1500000);
  const [judolLimit, setJudolLimit] = useState(300000);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Form Transaction State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [category, setCategory] = useState('Survival Mode');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [isJudolDetected, setIsJudolDetected] = useState(false);

  // Form Wallet State
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletBalance, setNewWalletBalance] = useState('');

  const fetchData = async () => {
    setLoading(true);

    // Fetch Wallets
    const { data: walletData } = await supabase.from('wallets').select('*').order('id', { ascending: true });
    if (walletData) {
      setWallets(walletData);
      if (walletData.length > 0 && !selectedWallet) {
        setSelectedWallet(walletData[0].name);
      }
    }

    // Fetch Transactions
    const { data: transData } = await supabase
      .from('transactions')
      .select('*')
      .order('id', { ascending: false });

    if (transData) setTransactions(transData);

    // Fetch Budget Settings
    const { data: budgetData } = await supabase.from('budgets').select('*').limit(1).single();
    if (budgetData) {
      setMonthlyLimit(Number(budgetData.monthly_limit) || 1500000);
      setJudolLimit(Number(budgetData.judol_limit) || 300000);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Cek kata kunci secara otomatis pas ngetik keterangan
  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    const lowerText = text.toLowerCase();
    const detected = SENSITIVE_KEYWORDS.some(kw => lowerText.includes(kw));
    setIsJudolDetected(detected);

    if (detected) {
      setType('EXPENSE');
      setCategory('Special Recovery Tracker');
    } else if (category === 'Special Recovery Tracker') {
      setCategory('Survival Mode');
    }
  };

  // Trigger Efek Confetti Selebrasi 🎉
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Handle Tambah Transaksi
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !selectedWallet) {
      alert('Isi semua bidang dulu ya, sayang!');
      return;
    }

    setSubmitting(true);
    const numericAmount = Number(amount);
    const finalCategory = isJudolDetected ? 'Special Recovery Tracker' : category;

    const { error: transError } = await supabase.from('transactions').insert([
      {
        description,
        amount: numericAmount,
        type,
        category: finalCategory,
        wallet_name: selectedWallet,
      }
    ]);

    if (transError) {
      alert('Gagal simpan transaksi: ' + transError.message);
      setSubmitting(false);
      return;
    }

    // Update Saldo Dompet
    const targetWallet = wallets.find(w => w.name === selectedWallet);
    if (targetWallet) {
      const newBalance = type === 'INCOME'
        ? Number(targetWallet.balance) + numericAmount
        : Number(targetWallet.balance) - numericAmount;

      await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', targetWallet.id);
    }

    // Selebrasi kalau hemat (bukan transaksi judol)
    if (!isJudolDetected) {
      triggerConfetti();
    }

    setDescription('');
    setAmount('');
    setIsJudolDetected(false);
    setSubmitting(false);
    setIsMobileFormOpen(false);
    fetchData();
  };

  // Handle Tambah Dompet Baru
  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName || !newWalletBalance) return;

    setSubmitting(true);
    const { error } = await supabase.from('wallets').insert([
      {
        name: newWalletName,
        balance: Number(newWalletBalance),
      }
    ]);

    if (error) {
      alert('Gagal menambah dompet: ' + error.message);
    } else {
      setNewWalletName('');
      setNewWalletBalance('');
      setIsWalletModalOpen(false);
      triggerConfetti();
      fetchData();
    }
    setSubmitting(false);
  };

  // KALKULASI STREAK HARI BEBAS SLOT 🔥
  const calculateStreakDays = () => {
    const judolTransactions = transactions.filter(t =>
      t.type?.toUpperCase() === 'EXPENSE' &&
      (t.category === 'Special Recovery Tracker' || SENSITIVE_KEYWORDS.some(kw => t.description?.toLowerCase().includes(kw)))
    );

    if (judolTransactions.length === 0) return 30; // Jika tidak ada, anggap 30 hari bersih!

    const lastJudolDate = new Date(judolTransactions[0].created_at);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastJudolDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const streakDays = calculateStreakDays();

  // Kalkulasi Keuangan
  const totalBalance = wallets.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);

  const totalExpenseThisMonth = transactions
    .filter(t => t.type?.toUpperCase() === 'EXPENSE')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const totalJudolExpense = transactions
    .filter(t => {
      const isExpense = t.type?.toUpperCase() === 'EXPENSE';
      const isJudolCategory = t.category === 'Special Recovery Tracker';
      const hasKeyword = SENSITIVE_KEYWORDS.some(kw => t.description?.toLowerCase().includes(kw));
      return isExpense && (isJudolCategory || hasKeyword);
    })
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // Kalkulasi Limit Harian
  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpense = transactions
    .filter(t => {
      const isExpense = t.type?.toUpperCase() === 'EXPENSE';
      const isToday = t.created_at && t.created_at.startsWith(todayStr);
      return isExpense && isToday;
    })
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const baseDailyLimit = Math.round(monthlyLimit / 30);
  const rewardBonus = Math.max(judolLimit - totalJudolExpense, 0);
  const totalDailyLimit = baseDailyLimit + Math.round(rewardBonus / 30);
  const remainingDailyLimit = totalDailyLimit - todayExpense;
  const dailyUsagePercentage = Math.min(Math.round((todayExpense / totalDailyLimit) * 100), 100);

  const budgetUsagePercentage = Math.min(Math.round((totalExpenseThisMonth / monthlyLimit) * 100), 100);
  const judolUsagePercentage = Math.min(Math.round((totalJudolExpense / judolLimit) * 100), 100);

  // Dynamic Theme Styling Classes
  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-100 text-slate-900';
  const cardClass = isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white/80 border-slate-200/80 shadow-sm';
  const inputBgClass = isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-300 text-slate-800';
  const subTextClass = isDark ? 'text-zinc-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen font-sans p-4 md:p-8 pb-24 md:pb-8 transition-colors duration-300 ${bgClass}`}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header Section */}
        <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border backdrop-blur-xl transition-all ${cardClass}`}>
          <div>
            <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold tracking-wider uppercase mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Financial Health Zone</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Anti-Judol Hub <Sparkles className="inline-block w-5 h-5 text-yellow-400" />
            </h1>
            <p className={`text-sm mt-1 ${subTextClass}`}>
              Smart Financial Tracker • Bebas Slot, Dompet Sehat!
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak Counter Counter Badge 🔥 */}
            <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-orange-500/30 text-orange-400 font-bold text-xs" title="Hari beruntun bersih dari judi online!">
              <Flame className="w-4 h-4 fill-orange-500 animate-pulse" />
              <span>{streakDays} Hari Clean!</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-3 rounded-2xl border transition-all active:scale-95 flex items-center justify-center ${isDark ? 'bg-zinc-800/80 border-zinc-700/60 text-yellow-400 hover:bg-zinc-700' : 'bg-slate-200 border-slate-300 text-indigo-600 hover:bg-slate-300'
                }`}
              title="Ganti Tema Dark/Light"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Total Balance Card */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-medium block ${subTextClass}`}>Total Ammo</span>
                <span className="cursor-pointer" title="Total akumulasi nilai bersih kekayaan dari seluruh dompet aktif kamu.">
                  <HelpCircle className="w-3 h-3 text-zinc-500" />
                </span>
              </div>
              <span className="text-2xl md:text-3xl font-black text-emerald-500 tracking-tight">
                {loading ? 'Loading...' : `Rp ${totalBalance.toLocaleString('id-ID')}`}
              </span>
            </div>
          </div>
        </header>

        {/* Daily Allowance Tracker Widget */}
        <section className={`p-6 rounded-3xl border space-y-3 ${isDark
            ? 'bg-gradient-to-r from-emerald-950/30 via-zinc-900 to-zinc-900 border-emerald-500/30'
            : 'bg-gradient-to-r from-emerald-50 via-white to-white border-emerald-200 shadow-sm'
          }`}>
          <div className="flex justify-between items-center">
            <div className={`flex items-center gap-2 text-sm font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              <CalendarCheck className="w-4 h-4 text-emerald-500" /> Daily Limit Tracker (Hari Ini)
            </div>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Sisa Limit: Rp {remainingDailyLimit.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className={`flex justify-between text-xs font-medium ${subTextClass}`}>
              <span>Terpakai Hari Ini: Rp {todayExpense.toLocaleString('id-ID')}</span>
              <span>Jatah Harian (+Reward): Rp {totalDailyLimit.toLocaleString('id-ID')}</span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-200 border-slate-300'}`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${dailyUsagePercentage > 85 ? 'bg-rose-500' : dailyUsagePercentage > 60 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                style={{ width: `${dailyUsagePercentage}%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* Budget Trackers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Monthly Budget Tracker */}
          <section className={`p-6 rounded-3xl border space-y-3 ${cardClass}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Target className="w-4 h-4 text-emerald-500" /> Monthly Budget Limit
              </div>
              <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {budgetUsagePercentage}% Terpakai
              </span>
            </div>

            <div className="space-y-1.5">
              <div className={`flex justify-between text-xs font-medium ${subTextClass}`}>
                <span>Pengeluaran: Rp {totalExpenseThisMonth.toLocaleString('id-ID')}</span>
                <span>Limit: Rp {monthlyLimit.toLocaleString('id-ID')}</span>
              </div>
              <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-200 border-slate-300'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${budgetUsagePercentage > 85 ? 'bg-rose-500' : budgetUsagePercentage > 60 ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                  style={{ width: `${budgetUsagePercentage}%` }}
                ></div>
              </div>
            </div>
          </section>

          {/* Special Recovery Limit (High-Contrast Red Coral) */}
          <section className={`p-6 rounded-3xl border space-y-3 ${isDark ? 'bg-zinc-900/60 border-rose-500/40' : 'bg-white border-rose-300 shadow-sm'}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-400">
                <AlertTriangle className="w-4 h-4 text-rose-500" /> Recovery Budget (Max 300k)
                <span className="cursor-pointer" title="Alokasi batas darurat pemulihan secara bertahap.">
                  <HelpCircle className="w-3.5 h-3.5 text-rose-400/70" />
                </span>
              </div>
              <span className="text-xs font-bold text-rose-400 bg-rose-500/15 px-3 py-1 rounded-full border border-rose-500/30">
                {judolUsagePercentage}% Terpakai
              </span>
            </div>

            <div className="space-y-1.5">
              <div className={`flex justify-between text-xs font-medium ${subTextClass}`}>
                <span>Terpakai: Rp {totalJudolExpense.toLocaleString('id-ID')}</span>
                <span>Max: Rp {judolLimit.toLocaleString('id-ID')}</span>
              </div>
              <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-200 border-slate-300'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${judolUsagePercentage > 80 ? 'bg-rose-500' : judolUsagePercentage > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  style={{ width: `${judolUsagePercentage}%` }}
                ></div>
              </div>
            </div>
          </section>

        </div>

        {/* Rewarding System Banner */}
        <section className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isDark
            ? 'bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border-emerald-500/30'
            : 'bg-gradient-to-r from-emerald-50 via-white to-white border-emerald-200 shadow-sm'
          }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                Rewarding System Active <Sparkles className="w-4 h-4 text-yellow-400" />
              </h3>
              <p className={`text-xs mt-0.5 ${subTextClass}`}>
                Sisa hemat recovery otomatis menambah limit harian kamu sebesar <strong className="text-emerald-500">+Rp {Math.round(rewardBonus / 30).toLocaleString('id-ID')}/hari</strong>!
              </p>
            </div>
          </div>
          <div className={`px-4 py-2.5 rounded-2xl border text-right w-full sm:w-auto ${isDark ? 'bg-zinc-950/80 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
            }`}>
            <span className={`text-[10px] block font-semibold uppercase tracking-wider ${subTextClass}`}>Potensi Bonus Reward</span>
            <span className="text-lg font-black text-emerald-500">+ Rp {rewardBonus.toLocaleString('id-ID')}</span>
          </div>
        </section>

        {/* Wallets Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${subTextClass}`}>
              <CreditCard className="w-4 h-4 text-emerald-500" /> Active Wallets
            </h2>
            <button
              onClick={() => setIsWalletModalOpen(true)}
              className="text-xs text-emerald-500 hover:underline flex items-center gap-1 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Dompet
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loading ? (
              <p className={`text-xs col-span-3 ${subTextClass}`}>Memuat dompet...</p>
            ) : (
              wallets.map((w) => (
                <div
                  key={w.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 group ${cardClass} hover:border-emerald-500/40`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700/50' : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                      {w.name}
                    </span>
                    <Wallet className={`w-4 h-4 transition-colors ${subTextClass} group-hover:text-emerald-500`} />
                  </div>
                  <div className="text-xl font-bold">
                    Rp {(Number(w.balance) || 0).toLocaleString('id-ID')}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Form Transaction & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Form Quick Add (Desktop View) */}
          <section className={`hidden lg:block lg:col-span-2 p-6 rounded-3xl border backdrop-blur-xl space-y-4 ${cardClass}`}>
            <h2 className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Catat Transaksi
            </h2>

            <form className="space-y-3" onSubmit={handleAddTransaction}>
              <div>
                <label className={`text-xs mb-1 block ${subTextClass}`}>Keterangan</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="misal: Kopi / Depo (Auto Detect)"
                    value={description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all ${inputBgClass} ${isJudolDetected ? 'border-rose-500 ring-1 ring-rose-500' : 'focus:border-emerald-500'
                      }`}
                    required
                  />
                  {isJudolDetected && (
                    <span className="absolute right-3 top-2.5 text-xs text-rose-400 font-semibold flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                      <AlertTriangle className="w-3 h-3 text-rose-500" /> Auto-Detected
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className={`text-xs mb-1 block ${subTextClass}`}>Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-all ${inputBgClass}`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-xs mb-1 block ${subTextClass}`}>Tipe</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      if (!isJudolDetected) {
                        setCategory(e.target.value === 'EXPENSE' ? 'Survival Mode' : 'Main Cashflow');
                      }
                    }}
                    disabled={isJudolDetected}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-60 ${inputBgClass}`}
                  >
                    <option value="EXPENSE">Keluar</option>
                    <option value="INCOME">Masuk</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs mb-1 block ${subTextClass}`}>Dompet</label>
                  <select
                    value={selectedWallet}
                    onChange={(e) => setSelectedWallet(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 ${inputBgClass}`}
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
                className={`w-full mt-2 font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${isJudolDetected
                    ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20'
                  }`}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Catat Sekarang ✨'}
              </button>
            </form>
          </section>

          {/* Transactions List */}
          <section className={`lg:col-span-3 p-6 rounded-3xl border backdrop-blur-xl space-y-4 ${cardClass}`}>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-500" /> Transaksi Terakhir
            </h2>

            <div className="space-y-3">
              {loading ? (
                <p className={`text-xs ${subTextClass}`}>Memuat data transaksi...</p>
              ) : transactions.length === 0 ? (
                <p className={`text-xs ${subTextClass}`}>Belum ada transaksi di Supabase.</p>
              ) : (
                transactions.map((t) => {
                  const isIncome = t.type?.toUpperCase() === 'INCOME';
                  const isJudol = t.category === 'Special Recovery Tracker' || SENSITIVE_KEYWORDS.some(kw => t.description?.toLowerCase().includes(kw));

                  return (
                    <div
                      key={t.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${isJudol
                          ? isDark ? 'bg-rose-950/20 border-rose-500/40' : 'bg-rose-50 border-rose-300'
                          : isDark ? 'bg-zinc-950/60 border-zinc-800/60' : 'bg-slate-50 border-slate-200'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isJudol
                            ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                            : isIncome
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700/50' : 'bg-slate-200 text-slate-600 border-slate-300'
                          }`}>
                          {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">{t.description}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isJudol
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold'
                                : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'
                              }`}>
                              {t.category || 'General'}
                            </span>
                            {t.wallet_name && <span className={`text-[10px] ${subTextClass}`}>• {t.wallet_name}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-sm font-bold ${isIncome ? 'text-emerald-500' : isJudol ? 'text-rose-400' : isDark ? 'text-zinc-200' : 'text-slate-800'
                          }`}>
                          {isIncome ? '+' : '-'} Rp {(Number(t.amount) || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

        </div>

      </div>

      {/* Floating Action Button (FAB) Mobile ✨ */}
      <button
        onClick={() => setIsMobileFormOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 p-4 bg-emerald-500 text-zinc-950 rounded-full shadow-2xl shadow-emerald-500/50 border border-emerald-400 active:scale-90 transition-all z-40 flex items-center gap-2 font-bold"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
        <span className="text-xs pr-1">Catat</span>
      </button>

      {/* Bottom Sheet Form Mobile ✨ */}
      {isMobileFormOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end animate-in fade-in duration-200">
          <div className={`w-full p-6 rounded-t-3xl border-t space-y-4 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Catat Transaksi Instan
              </h2>
              <button onClick={() => setIsMobileFormOpen(false)} className={`p-1 ${subTextClass}`}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleAddTransaction}>
              <div>
                <label className={`text-xs mb-1 block ${subTextClass}`}>Keterangan</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="misal: Kopi / Depo (Auto Detect)"
                    value={description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none transition-all ${inputBgClass} ${isJudolDetected ? 'border-rose-500 ring-1 ring-rose-500' : 'focus:border-emerald-500'
                      }`}
                    required
                  />
                  {isJudolDetected && (
                    <span className="absolute right-3 top-3 text-xs text-rose-400 font-semibold flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                      <AlertTriangle className="w-3 h-3 text-rose-500" /> Auto-Detected
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className={`text-xs mb-1 block ${subTextClass}`}>Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-all ${inputBgClass}`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-xs mb-1 block ${subTextClass}`}>Tipe</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      if (!isJudolDetected) {
                        setCategory(e.target.value === 'EXPENSE' ? 'Survival Mode' : 'Main Cashflow');
                      }
                    }}
                    disabled={isJudolDetected}
                    className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-60 ${inputBgClass}`}
                  >
                    <option value="EXPENSE">Keluar</option>
                    <option value="INCOME">Masuk</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs mb-1 block ${subTextClass}`}>Dompet</label>
                  <select
                    value={selectedWallet}
                    onChange={(e) => setSelectedWallet(e.target.value)}
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
                className={`w-full mt-3 font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${isJudolDetected
                    ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20'
                  }`}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Catat Sekarang ✨'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Popup Tambah Dompet */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`p-6 rounded-3xl w-full max-w-md space-y-4 relative border animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-2xl'
            }`}>
            <button
              onClick={() => setIsWalletModalOpen(false)}
              className={`absolute top-4 right-4 p-1 ${subTextClass}`}
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-500" /> Tambah Dompet Baru
            </h3>

            <form className="space-y-3" onSubmit={handleAddWallet}>
              <div>
                <label className={`text-xs mb-1 block ${subTextClass}`}>Nama Dompet / Bank</label>
                <input
                  type="text"
                  placeholder="misal: BCA / GoPay / Seabank"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 ${inputBgClass}`}
                  required
                />
              </div>

              <div>
                <label className={`text-xs mb-1 block ${subTextClass}`}>Saldo Awal (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newWalletBalance}
                  onChange={(e) => setNewWalletBalance(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 ${inputBgClass}`}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Dompet ✨'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}