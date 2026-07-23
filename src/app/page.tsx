'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip
} from 'recharts';
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
  HelpCircle,
  Menu,
  BarChart3,
  History as HistoryIcon,
  Home as HomeIcon,
  Trash2,
  Calendar,
  Layers
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

interface ItemRow {
  description: string;
  amount: string;
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

  // Navigation & Modal State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Multi-Row Item State (Batch Input Nota 🧾)
  const [items, setItems] = useState<ItemRow[]>([{ description: '', amount: '' }]);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [transactionType, setTransactionType] = useState('EXPENSE');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().slice(0, 16));

  // Split-Bill State 🔀
  const [isSplitBill, setIsSplitBill] = useState(false);
  const [secondaryWallet, setSecondaryWallet] = useState('');
  const [splitRatio, setSplitRatio] = useState(50); // % Porsi Dompet Utama

  // Form Wallet State
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletBalance, setNewWalletBalance] = useState('');

  const fetchData = async () => {
    setLoading(true);

    const { data: walletData } = await supabase.from('wallets').select('*').order('id', { ascending: true });
    if (walletData) {
      setWallets(walletData);
      if (walletData.length > 0 && !selectedWallet) {
        setSelectedWallet(walletData[0].name);
        if (walletData.length > 1) setSecondaryWallet(walletData[1].name);
      }
    }

    const { data: transData } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (transData) setTransactions(transData);

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

  const handleAddItemRow = () => {
    setItems(prev => [...prev, { description: '', amount: '' }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: 'description' | 'amount', value: string) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  // Handle Multi-Item & Split Bill Transaction Input 🚀
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) return alert('Pilih dompet dulu ya, sayang!');

    const validItems = items.filter(item => item.description.trim() !== '' && Number(item.amount) > 0);
    if (validItems.length === 0) return alert('Isi minimal 1 barang dengan nominal valid ya!');

    setSubmitting(true);
    let hasJudol = false;

    for (const item of validItems) {
      const numericAmount = Number(item.amount);
      const isJudol = SENSITIVE_KEYWORDS.some(kw => item.description.toLowerCase().includes(kw));
      if (isJudol) hasJudol = true;

      const finalCategory = isJudol ? 'Special Recovery Tracker' : (transactionType === 'EXPENSE' ? 'Survival Mode' : 'Main Cashflow');

      if (isSplitBill && secondaryWallet && selectedWallet !== secondaryWallet) {
        const primaryAmount = Math.round((numericAmount * splitRatio) / 100);
        const secondaryAmount = numericAmount - primaryAmount;

        // Insert Transaction 1 (Dompet Utama)
        await supabase.from('transactions').insert([{
          description: `${item.description} (Split ${splitRatio}%)`,
          amount: primaryAmount,
          type: transactionType,
          category: finalCategory,
          wallet_name: selectedWallet,
          created_at: new Date(transactionDate).toISOString()
        }]);

        // Insert Transaction 2 (Dompet Sekunder)
        await supabase.from('transactions').insert([{
          description: `${item.description} (Split ${100 - splitRatio}%)`,
          amount: secondaryAmount,
          type: transactionType,
          category: finalCategory,
          wallet_name: secondaryWallet,
          created_at: new Date(transactionDate).toISOString()
        }]);

        // Update Saldo Keduanya
        const w1 = wallets.find(w => w.name === selectedWallet);
        const w2 = wallets.find(w => w.name === secondaryWallet);
        if (w1) {
          const b1 = transactionType === 'INCOME' ? Number(w1.balance) + primaryAmount : Number(w1.balance) - primaryAmount;
          await supabase.from('wallets').update({ balance: b1 }).eq('id', w1.id);
        }
        if (w2) {
          const b2 = transactionType === 'INCOME' ? Number(w2.balance) + secondaryAmount : Number(w2.balance) - secondaryAmount;
          await supabase.from('wallets').update({ balance: b2 }).eq('id', w2.id);
        }

      } else {
        // Single Wallet Transaction
        await supabase.from('transactions').insert([{
          description: item.description,
          amount: numericAmount,
          type: transactionType,
          category: finalCategory,
          wallet_name: selectedWallet,
          created_at: new Date(transactionDate).toISOString()
        }]);

        const targetWallet = wallets.find(w => w.name === selectedWallet);
        if (targetWallet) {
          const newBalance = transactionType === 'INCOME'
            ? Number(targetWallet.balance) + numericAmount
            : Number(targetWallet.balance) - numericAmount;

          await supabase.from('wallets').update({ balance: newBalance }).eq('id', targetWallet.id);
        }
      }
    }

    if (!hasJudol) triggerConfetti();

    setItems([{ description: '', amount: '' }]);
    setSubmitting(false);
    setIsMobileFormOpen(false);
    fetchData();
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName || !newWalletBalance) return;

    setSubmitting(true);
    const { error } = await supabase.from('wallets').insert([
      { name: newWalletName, balance: Number(newWalletBalance) }
    ]);

    if (!error) {
      setNewWalletName('');
      setNewWalletBalance('');
      setIsWalletModalOpen(false);
      triggerConfetti();
      fetchData();
    }
    setSubmitting(false);
  };

  // Streak Counter
  const calculateStreakDays = () => {
    const judolTransactions = transactions.filter(t =>
      t.type?.toUpperCase() === 'EXPENSE' &&
      (t.category === 'Special Recovery Tracker' || SENSITIVE_KEYWORDS.some(kw => t.description?.toLowerCase().includes(kw)))
    );

    if (judolTransactions.length === 0) return 30;

    const lastJudolDate = new Date(judolTransactions[0].created_at);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastJudolDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const streakDays = calculateStreakDays();

  // Financial Calculations
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

  // Data Chart
  const chartData = transactions
    .filter(t => t.type?.toUpperCase() === 'EXPENSE')
    .slice(0, 7)
    .reverse()
    .map(t => ({
      name: t.description.length > 8 ? t.description.substring(0, 8) + '...' : t.description,
      amount: Number(t.amount) || 0
    }));

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-100 text-slate-900';
  const cardClass = isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white/80 border-slate-200/80 shadow-sm';
  const inputBgClass = isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-300 text-slate-800';
  const subTextClass = isDark ? 'text-zinc-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen font-sans p-4 md:p-8 pb-24 md:pb-8 transition-colors duration-300 ${bgClass}`}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header Section */}
        <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 md:p-6 rounded-3xl border backdrop-blur-xl ${cardClass}`}>
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`lg:hidden p-2.5 rounded-2xl border transition-all active:scale-95 flex items-center justify-center ${isDark ? 'bg-zinc-800/80 border-zinc-700/60 text-emerald-400' : 'bg-slate-100 border-slate-300 text-emerald-600'
                  }`}
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold tracking-wider uppercase mb-0.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Financial Health Zone</span>
                </div>
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                  Anti-Judol Hub <Sparkles className="inline-block w-4 h-4 text-yellow-400" />
                </h1>
              </div>
            </div>

            <div className={`md:hidden p-2.5 rounded-2xl border text-right ${isDark ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[9px] font-medium block uppercase ${subTextClass}`}>Total Ammo</span>
              <span className="text-sm font-black text-emerald-500">
                Rp {(totalBalance / 1000).toFixed(0)}k
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center p-1.5 rounded-2xl border bg-zinc-950/40 border-zinc-800/80 gap-1">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 flex items-center gap-2"
            >
              <HomeIcon className="w-3.5 h-3.5" /> Dashboard & Chart
            </Link>
            <Link
              href="/history"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${subTextClass} hover:text-zinc-200`}
            >
              <HistoryIcon className="w-3.5 h-3.5" /> Laporan Transaksi
            </Link>
          </nav>

          <div className="flex items-center justify-between md:justify-end gap-3">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-orange-500/30 text-orange-400 font-bold text-xs">
              <Flame className="w-4 h-4 fill-orange-500 animate-pulse" />
              <span>{streakDays} Hari Clean!</span>
            </div>

            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-2xl border transition-all active:scale-95 flex items-center justify-center ${isDark ? 'bg-zinc-800/80 border-zinc-700/60 text-yellow-400 hover:bg-zinc-700' : 'bg-slate-200 border-slate-300 text-indigo-600 hover:bg-slate-300'
                }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className={`hidden md:block p-3.5 rounded-2xl border ${isDark ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] font-medium block uppercase tracking-wider ${subTextClass}`}>Total Ammo</span>
                <button onClick={() => setActiveTooltip('totalAmmo')} className="text-zinc-500 hover:text-emerald-400 p-0.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xl md:text-2xl font-black text-emerald-500 tracking-tight">
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

        {/* GRAFIK CHART ANALYTICS 📊 */}
        <section className={`p-6 rounded-3xl border space-y-4 ${cardClass}`}>
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" /> Tren Pengeluaran Terakhir
            </h2>
            <span className={`text-xs ${subTextClass}`}>7 Transaksi Terakhir</span>
          </div>

          {chartData.length === 0 ? (
            <p className={`text-xs py-8 text-center ${subTextClass}`}>Belum ada grafik pengeluaran.</p>
          ) : (
            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke={isDark ? '#71717a' : '#64748b'} fontSize={11} tickLine={false} />
                  <YAxis stroke={isDark ? '#71717a' : '#64748b'} fontSize={10} tickLine={false} width={40} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#18181b' : '#ffffff',
                      borderColor: isDark ? '#27272a' : '#e2e8f0',
                      borderRadius: '12px',
                      color: isDark ? '#f4f4f5' : '#0f172a'
                    }}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Budget Trackers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <section className={`p-6 rounded-3xl border space-y-3 ${isDark ? 'bg-zinc-900/60 border-rose-500/40' : 'bg-white border-rose-300 shadow-sm'}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-400">
                <AlertTriangle className="w-4 h-4 text-rose-500" /> Recovery Budget (Max 300k)
                <button onClick={() => setActiveTooltip('recoveryBudget')} className="p-0.5">
                  <HelpCircle className="w-3.5 h-3.5 text-rose-400/70" />
                </button>
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

        {/* Form Input Batch Nota & Split Bill (Desktop Only) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <section className={`hidden lg:block lg:col-span-3 p-6 rounded-3xl border backdrop-blur-xl space-y-4 ${cardClass}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Catat Transaksi / Batch Nota 🧾
              </h2>
              <button
                type="button"
                onClick={() => setIsSplitBill(!isSplitBill)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${isSplitBill ? 'bg-indigo-500 text-white border-indigo-400' : `${inputBgClass} hover:border-indigo-500/50`
                  }`}
              >
                <Layers className="w-3.5 h-3.5" /> Split Bill {isSplitBill ? 'ON' : 'OFF'}
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleAddTransaction}>
              {/* Controls: Date, Type, Wallet */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={`text-xs mb-1 block ${subTextClass}`}>Waktu</label>
                  <input
                    type="datetime-local"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className={`w-full border rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500 ${inputBgClass}`}
                  />
                </div>
                <div>
                  <label className={`text-xs mb-1 block ${subTextClass}`}>Tipe</label>
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                    className={`w-full border rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500 ${inputBgClass}`}
                  >
                    <option value="EXPENSE">Keluar</option>
                    <option value="INCOME">Masuk</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs mb-1 block ${subTextClass}`}>Dompet Utama</label>
                  <select
                    value={selectedWallet}
                    onChange={(e) => setSelectedWallet(e.target.value)}
                    className={`w-full border rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500 ${inputBgClass}`}
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Split Bill Config Panel */}
              {isSplitBill && (
                <div className={`p-3.5 rounded-2xl border space-y-2 animate-in fade-in duration-200 ${isDark ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'
                  }`}>
                  <div className="flex justify-between items-center text-xs font-bold text-indigo-400">
                    <span>🔀 Bagi Pengeluaran Ke 2 Dompet</span>
                    <span>{splitRatio}% : {100 - splitRatio}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className={`text-[10px] block ${subTextClass}`}>Dompet Kedua</span>
                      <select
                        value={secondaryWallet}
                        onChange={(e) => setSecondaryWallet(e.target.value)}
                        className={`w-full border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none ${inputBgClass}`}
                      >
                        {wallets.map(w => (
                          <option key={w.id} value={w.name}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className={`text-[10px] block ${subTextClass}`}>Porsi Dompet Utama</span>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        step="10"
                        value={splitRatio}
                        onChange={(e) => setSplitRatio(Number(e.target.value))}
                        className="w-full accent-indigo-500 mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Multi Item Rows (Batch Input Nota 🧾) */}
              <div className="space-y-2">
                <label className={`text-xs block font-bold ${subTextClass}`}>Baris Barang Belanjaan</label>
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Item ${index + 1} (misal: Nasi Goreng / Depo)`}
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className={`flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 ${inputBgClass}`}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Rp Nominal"
                      value={item.amount}
                      onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                      className={`w-32 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 ${inputBgClass}`}
                      required
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="flex-1 py-2.5 rounded-xl border border-dashed border-emerald-500/40 text-emerald-500 text-xs font-bold hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Baris Barang Nota Baru
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Semua Nota ✨'}
                </button>
              </div>
            </form>
          </section>

          {/* Wallets Grid */}
          <section className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${subTextClass}`}>
                <CreditCard className="w-4 h-4 text-emerald-500" /> Active Wallets
              </h2>
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="text-xs text-emerald-500 hover:underline flex items-center gap-1 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Dompet
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {loading ? (
                <p className={`text-xs ${subTextClass}`}>Memuat dompet...</p>
              ) : (
                wallets.map((w) => (
                  <div
                    key={w.id}
                    className={`p-4 rounded-2xl border transition-all duration-300 group ${cardClass} hover:border-emerald-500/40`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700/50' : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                        {w.name}
                      </span>
                      <Wallet className={`w-4 h-4 transition-colors ${subTextClass} group-hover:text-emerald-500`} />
                    </div>
                    <div className="text-lg font-bold">
                      Rp {(Number(w.balance) || 0).toLocaleString('id-ID')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

      </div>

      {/* LEFT SIDEBAR DRAWER WITH SMOOTH TRANSITION 🍔 */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-300 lg:hidden ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsSidebarOpen(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-72 h-full p-6 border-r flex flex-col justify-between transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'}`}
        >
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span className="font-extrabold text-base">Anti-Judol Hub</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className={`p-1 ${subTextClass}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-2">
              <Link
                href="/"
                onClick={() => setIsSidebarOpen(false)}
                className="w-full p-3 rounded-2xl flex items-center gap-3 font-semibold text-sm bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20"
              >
                <HomeIcon className="w-4 h-4" /> Dashboard & Chart
              </Link>

              <Link
                href="/history"
                onClick={() => setIsSidebarOpen(false)}
                className={`w-full p-3 rounded-2xl flex items-center gap-3 font-semibold text-sm transition-all ${isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
              >
                <HistoryIcon className="w-4 h-4" /> Laporan Transaksi
              </Link>
            </nav>
          </div>

          <div className={`text-xs text-center py-3 border-t ${isDark ? 'border-zinc-800 text-zinc-500' : 'border-slate-200 text-slate-400'}`}>
            Version 2.0 • Financial Health Zone
          </div>
        </div>
      </div>

      {/* Floating Action Button Mobile */}
      <button
        onClick={() => setIsMobileFormOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 p-4 bg-emerald-500 text-zinc-950 rounded-full shadow-2xl shadow-emerald-500/50 border border-emerald-400 active:scale-90 transition-all z-40 flex items-center gap-2 font-bold"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
        <span className="text-xs pr-1">Catat</span>
      </button>

      {/* Bottom Sheet Form Mobile */}
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
                <input
                  type="text"
                  placeholder="misal: Kopi / Depo"
                  value={items[0].description}
                  onChange={(e) => handleItemChange(0, 'description', e.target.value)}
                  className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none transition-all ${inputBgClass}`}
                  required
                />
              </div>

              <div>
                <label className={`text-xs mb-1 block ${subTextClass}`}>Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={items[0].amount}
                  onChange={(e) => handleItemChange(0, 'amount', e.target.value)}
                  className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-all ${inputBgClass}`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-xs mb-1 block ${subTextClass}`}>Tipe</label>
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-emerald-500 ${inputBgClass}`}
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
                className="w-full mt-3 font-bold py-3.5 rounded-xl transition-all shadow-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Catat Sekarang ✨'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Popup Tooltip Mobile */}
      {activeTooltip && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`p-6 rounded-3xl w-full max-w-sm space-y-3 relative border animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}>
            <button onClick={() => setActiveTooltip(null)} className={`absolute top-4 right-4 p-1 ${subTextClass}`}>
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold flex items-center gap-2 text-emerald-500">
              <HelpCircle className="w-5 h-5" /> Info Istilah
            </h3>

            <p className="text-xs leading-relaxed">
              {activeTooltip === 'totalAmmo' && 'Total Ammo adalah akumulasi total saldo kekayaan kamu dari seluruh dompet aktif yang terdaftar di Supabase.'}
              {activeTooltip === 'recoveryBudget' && 'Recovery Budget adalah alokasi batas maksimal pengeluaran sensitif/darurat bulanan (Max 300rb) untuk membantu proses pemulihan secara bertahap.'}
            </p>
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