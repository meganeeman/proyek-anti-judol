'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid
} from 'recharts';
import {
  Wallet,
  Plus,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  Loader2,
  X,
  Target,
  AlertTriangle,
  CalendarCheck,
  Sun,
  Moon,
  Flame,
  HelpCircle,
  BarChart3,
  History as HistoryIcon,
  Home as HomeIcon,
  Trash2,
  Layers,
  Clock,
  Filter,
  PieChart,
  ArrowUpCircle,
  ArrowDownCircle
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

export default function Home() {
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyLimit, setMonthlyLimit] = useState(1500000);
  const [judolLimit, setJudolLimit] = useState(300000);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [items, setItems] = useState<ItemRow[]>([{ description: '', amount: '' }]);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [transactionType, setTransactionType] = useState('EXPENSE');
  const [transactionDate, setTransactionDate] = useState(getCurrentLocalDateTime());

  const [isSplitBill, setIsSplitBill] = useState(false);
  const [secondaryWallet, setSecondaryWallet] = useState('');
  const [splitRatio, setSplitRatio] = useState(50);

  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletBalance, setNewWalletBalance] = useState('');

  const amountInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (isMobileFormOpen) {
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [isMobileFormOpen]);

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
    if (field === 'amount') {
      updated[index].amount = formatRupiahInput(value);
    } else {
      updated[index][field] = value;
    }
    setItems(updated);
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const getWalletCalculatedBalance = (walletName: string) => {
    const initialWallet = wallets.find(w => w.name === walletName);
    const initialBalance = Number(initialWallet?.balance) || 0;

    const netTransactionChange = transactions
      .filter(t => t.wallet_name === walletName)
      .reduce((acc, curr) => {
        const amt = Number(curr.amount) || 0;
        return curr.type?.toUpperCase() === 'INCOME' ? acc + amt : acc - amt;
      }, 0);

    return initialBalance + netTransactionChange;
  };

  const totalCalculatedBalance = wallets.reduce((acc, curr) => acc + getWalletCalculatedBalance(curr.name), 0);

  const filteredTransactions = transactions.filter(t => {
    if (!t.created_at) return false;
    return t.created_at.startsWith(selectedMonth);
  });

  const totalIncomeThisMonth = filteredTransactions
    .filter(t => t.type?.toUpperCase() === 'INCOME')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const totalExpenseThisMonth = filteredTransactions
    .filter(t => t.type?.toUpperCase() === 'EXPENSE')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const netSavingsThisMonth = totalIncomeThisMonth - totalExpenseThisMonth;

  const totalJudolExpense = filteredTransactions
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
  const remainingDailyLimit = baseDailyLimit - todayExpense;
  const isDailyOverbudget = remainingDailyLimit < 0;
  const overbudgetAmount = isDailyOverbudget ? Math.abs(remainingDailyLimit) : 0;

  const effectiveJudolExpense = totalJudolExpense + overbudgetAmount;
  const dailyUsagePercentage = Math.min(Math.round((todayExpense / baseDailyLimit) * 100), 100);

  const budgetUsagePercentage = Math.min(Math.round((totalExpenseThisMonth / monthlyLimit) * 100), 100);
  const judolUsagePercentage = Math.min(Math.round((effectiveJudolExpense / judolLimit) * 100), 100);

  const calculateStreakDays = () => {
    if (isDailyOverbudget) return 0;

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

  const getDailyChartData = () => {
    const daysMap: { [key: string]: { income: number; expense: number } } = {};
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      daysMap[dateStr] = { income: 0, expense: 0 };

      transactions.forEach(t => {
        if (t.created_at && t.created_at.startsWith(dateStr)) {
          const amt = Number(t.amount) || 0;
          if (t.type?.toUpperCase() === 'INCOME') daysMap[dateStr].income += amt;
          else daysMap[dateStr].expense += amt;
        }
      });

      result.push({
        date: displayLabel,
        Pemasukan: daysMap[dateStr].income,
        Pengeluaran: daysMap[dateStr].expense
      });
    }

    return result;
  };

  const chartData = getDailyChartData();

  const today = new Date();
  const currentDay = today.getDate();
  const proRataLimitAllowed = currentDay * baseDailyLimit;
  const isProRataOverbudget = totalExpenseThisMonth > proRataLimitAllowed;

  const getProRataSmartInsight = () => {
    const diff = proRataLimitAllowed - totalExpenseThisMonth;

    if (totalExpenseThisMonth === 0) {
      return "Disiplin sempurna! Belum ada pengeluaran yang tercatat di bulan ini. Pertahankan!";
    }

    if (!isProRataOverbudget) {
      return `Disiplin Hebat! Pengeluaran kamu hemat Rp ${diff.toLocaleString('id-ID')} dari jatah pro-rata s/d hari ke-${currentDay}!`;
    } else {
      return `Peringatan Overbudget! Pengeluaran melebihi target jatah pro-rata s/d hari ke-${currentDay} sebesar Rp ${Math.abs(diff).toLocaleString('id-ID')}.`;
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) return alert('Pilih dompet dulu ya, sayang!');

    const validItems = items.filter(item => item.description.trim() !== '' && parseRupiahNumber(item.amount) > 0);
    if (validItems.length === 0) return alert('Isi nominal dan keterangan yang valid ya!');

    setSubmitting(true);
    let hasJudol = false;
    const finalIsoDate = new Date(transactionDate).toISOString();

    for (const item of validItems) {
      const numericAmount = parseRupiahNumber(item.amount);
      const isJudol = SENSITIVE_KEYWORDS.some(kw => item.description.toLowerCase().includes(kw));
      if (isJudol) hasJudol = true;

      const finalCategory = isJudol ? 'Special Recovery Tracker' : (transactionType === 'EXPENSE' ? 'Survival Mode' : 'Main Cashflow');

      if (isSplitBill && secondaryWallet && selectedWallet !== secondaryWallet) {
        const primaryAmount = Math.round((numericAmount * splitRatio) / 100);
        const secondaryAmount = numericAmount - primaryAmount;

        await supabase.from('transactions').insert([{
          description: `${item.description} (Split ${splitRatio}%)`,
          amount: primaryAmount,
          type: transactionType,
          category: finalCategory,
          wallet_name: selectedWallet,
          created_at: finalIsoDate
        }]);

        await supabase.from('transactions').insert([{
          description: `${item.description} (Split ${100 - splitRatio}%)`,
          amount: secondaryAmount,
          type: transactionType,
          category: finalCategory,
          wallet_name: secondaryWallet,
          created_at: finalIsoDate
        }]);

      } else {
        await supabase.from('transactions').insert([{
          description: item.description,
          amount: numericAmount,
          type: transactionType,
          category: finalCategory,
          wallet_name: selectedWallet,
          created_at: finalIsoDate
        }]);
      }
    }

    if (!hasJudol) triggerConfetti();

    setItems([{ description: '', amount: '' }]);
    setTransactionDate(getCurrentLocalDateTime());
    setSubmitting(false);
    setIsMobileFormOpen(false);
    fetchData();
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName || !newWalletBalance) return;

    setSubmitting(true);
    const numericBalance = parseRupiahNumber(newWalletBalance);
    const { error } = await supabase.from('wallets').insert([
      { name: newWalletName, balance: numericBalance }
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

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-100 text-slate-900';
  const cardClass = isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white/80 border-slate-200/80 shadow-sm';
  const inputBgClass = isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-300 text-slate-800';
  const subTextClass = isDark ? 'text-zinc-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen font-sans p-4 md:p-8 pb-28 md:pb-8 transition-colors duration-300 ${bgClass}`}>
      <div className="max-w-4xl mx-auto space-y-6">

        <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 md:p-6 rounded-3xl border backdrop-blur-xl ${cardClass}`}>
          <div className="flex items-center justify-between w-full md:w-auto">
            <div>
              <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold tracking-wider uppercase mb-0.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Financial Health Zone</span>
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                Anti-Judol Hub
              </h1>
            </div>

            <div className={`md:hidden p-2.5 rounded-2xl border text-right ${isDark ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[9px] font-medium block uppercase ${subTextClass}`}>Total Ammo</span>
              <span className="text-sm font-black text-emerald-500">
                Rp {(totalCalculatedBalance / 1000).toFixed(0)}k
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
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border font-bold text-xs ${isDailyOverbudget
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
              : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-orange-500/30 text-orange-400'
              }`}>
              <Flame className={`w-4 h-4 ${isDailyOverbudget ? 'text-rose-500' : 'fill-orange-500 animate-pulse'}`} />
              <span>{isDailyOverbudget ? 'Streak Pecah!' : `${streakDays} Hari Clean!`}</span>
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
                {loading ? 'Loading...' : `Rp ${totalCalculatedBalance.toLocaleString('id-ID')}`}
              </span>
            </div>
          </div>
        </header>

        <section className="space-y-3">
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

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4">
            {loading ? (
              <p className={`text-xs ${subTextClass}`}>Memuat dompet...</p>
            ) : (
              wallets.map((w) => {
                const calculatedBalance = getWalletCalculatedBalance(w.name);

                return (
                  <div
                    key={w.id}
                    className={`min-w-[140px] max-w-[160px] shrink-0 snap-align-start p-3.5 rounded-2xl border transition-all duration-300 group ${cardClass} hover:border-emerald-500/40`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border truncate max-w-[90px] ${isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700/50' : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                        {w.name}
                      </span>
                      <Wallet className={`w-4 h-4 shrink-0 transition-colors ${subTextClass} group-hover:text-emerald-500`} />
                    </div>
                    <div className="text-sm font-bold truncate">
                      Rp {calculatedBalance.toLocaleString('id-ID')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className={`p-6 rounded-3xl border space-y-3 transition-all ${isDailyOverbudget
          ? 'bg-rose-950/20 border-rose-500/40'
          : isDark
            ? 'bg-gradient-to-r from-emerald-950/30 via-zinc-900 to-zinc-900 border-emerald-500/30'
            : 'bg-gradient-to-r from-emerald-50 via-white to-white border-emerald-200 shadow-sm'
          }`}>
          <div className="flex justify-between items-center">
            <div className={`flex items-center gap-2 text-sm font-bold ${isDailyOverbudget ? 'text-rose-400' : isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              <CalendarCheck className="w-4 h-4 text-emerald-500" /> Daily Limit Tracker (Hari Ini)
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${isDailyOverbudget
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
              }`}>
              {isDailyOverbudget ? `Overbudget: -Rp ${overbudgetAmount.toLocaleString('id-ID')}` : `Sisa Limit: Rp ${remainingDailyLimit.toLocaleString('id-ID')}`}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className={`flex justify-between text-xs font-medium ${subTextClass}`}>
              <span>Terpakai Hari Ini: Rp {todayExpense.toLocaleString('id-ID')}</span>
              <span>Target Limit Harian: Rp {baseDailyLimit.toLocaleString('id-ID')}</span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-200 border-slate-300'}`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${isDailyOverbudget ? 'bg-rose-500' : dailyUsagePercentage > 85 ? 'bg-rose-500' : dailyUsagePercentage > 60 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                style={{ width: `${dailyUsagePercentage}%` }}
              ></div>
            </div>
          </div>

          {isDailyOverbudget && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>PUNISHMENT: Overbudget Rp {overbudgetAmount.toLocaleString('id-ID')} dialihkan memotong Recovery Budget & Streak Clean kamu pecah!</span>
            </div>
          )}
        </section>

        <section className={`p-6 rounded-3xl border space-y-4 ${cardClass}`}>
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" /> Tren Pemasukan vs Pengeluaran Harian
            </h2>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-500"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Masuk</span>
              <span className="flex items-center gap-1 text-rose-500"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Keluar</span>
            </div>
          </div>

          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e2e8f0'} />
                <XAxis dataKey="date" stroke={isDark ? '#71717a' : '#64748b'} fontSize={11} tickLine={false} />
                <YAxis
                  stroke={isDark ? '#71717a' : '#64748b'}
                  fontSize={10}
                  tickLine={false}
                  width={60}
                  tickFormatter={(val) => `Rp ${(val / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip
                  formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, '']}
                  contentStyle={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderColor: isDark ? '#27272a' : '#e2e8f0',
                    borderRadius: '12px',
                    color: isDark ? '#f4f4f5' : '#0f172a'
                  }}
                />
                <Line type="monotone" dataKey="Pemasukan" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Pengeluaran" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

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
                <span>Terpakai (+Penalty): Rp {effectiveJudolExpense.toLocaleString('id-ID')}</span>
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

        <section className={`p-6 rounded-3xl border space-y-4 ${cardClass}`}>
          <div className="space-y-2">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-500" /> Rekapitulasi Financial Bulanan
            </h2>

            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border transition-all cursor-pointer ${isDark
                ? 'bg-zinc-950/80 border-emerald-500/40 hover:border-emerald-400 [color-scheme:dark]'
                : 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 shadow-sm [color-scheme:light]'
              }`}>
              <Filter className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`bg-transparent text-xs font-extrabold focus:outline-none cursor-pointer ${isDark ? 'text-emerald-400' : 'text-emerald-800'
                  }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-slate-50/80 border-slate-200 shadow-sm'
              }`}>
              <span className={`text-[10px] uppercase font-bold flex items-center gap-1 text-emerald-500`}>
                <ArrowDownCircle className="w-3.5 h-3.5" /> Total Pemasukan
              </span>
              <p className="text-lg font-black mt-1 text-emerald-500">
                Rp {totalIncomeThisMonth.toLocaleString('id-ID')}
              </p>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-slate-50/80 border-slate-200 shadow-sm'
              }`}>
              <span className={`text-[10px] uppercase font-bold flex items-center gap-1 text-rose-500`}>
                <ArrowUpCircle className="w-3.5 h-3.5" /> Total Pengeluaran
              </span>
              <p className="text-lg font-black mt-1 text-rose-500">
                Rp {totalExpenseThisMonth.toLocaleString('id-ID')}
              </p>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-slate-50/80 border-slate-200 shadow-sm'
              }`}>
              <span className={`text-[10px] uppercase font-bold flex items-center gap-1 ${subTextClass}`}>
                Nett Cashflow
              </span>
              <p className={`text-lg font-black mt-1 ${netSavingsThisMonth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {netSavingsThisMonth >= 0 ? '+' : ''} Rp {netSavingsThisMonth.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed font-medium transition-colors ${isProRataOverbudget
            ? 'bg-rose-950/20 border-rose-500/40 text-rose-400'
            : isDark
              ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-300'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
            Smart Pro-Rata Evaluator: {getProRataSmartInsight()}
          </div>
        </section>

        <section className={`hidden lg:block p-6 rounded-3xl border backdrop-blur-xl space-y-4 ${cardClass}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Catat Transaksi / Batch Nota
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
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-xs block ${subTextClass}`}>Waktu</label>
                  <button
                    type="button"
                    onClick={() => setTransactionDate(getCurrentLocalDateTime())}
                    className="text-[10px] text-emerald-500 hover:underline flex items-center gap-0.5"
                  >
                    <Clock className="w-2.5 h-2.5" /> Now
                  </button>
                </div>
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

            {isSplitBill && (
              <div className={`p-3.5 rounded-2xl border space-y-2 animate-in fade-in duration-200 ${isDark ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'
                }`}>
                <div className="flex justify-between items-center text-xs font-bold text-indigo-400">
                  <span>Bagi Pengeluaran Ke 2 Dompet</span>
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
                    type="text"
                    placeholder="Rp 0"
                    value={item.amount}
                    onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                    className={`w-36 border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 ${inputBgClass}`}
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
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Semua Nota'}
              </button>
            </div>
          </form>
        </section>

      </div>

      <nav className={`lg:hidden fixed bottom-0 inset-x-0 z-40 px-6 py-2 border-t backdrop-blur-xl flex justify-between items-center ${isDark ? 'bg-zinc-900/90 border-zinc-800 text-zinc-400' : 'bg-white/90 border-slate-200 text-slate-600'
        }`}>
        <Link
          href="/"
          className="flex flex-col items-center gap-1 text-emerald-500 font-bold text-[10px]"
        >
          <HomeIcon className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>

        <div className="relative -top-5">
          <button
            onClick={() => setIsMobileFormOpen(true)}
            className="w-12 h-12 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 border border-emerald-400"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        <Link
          href="/history"
          className={`flex flex-col items-center gap-1 font-semibold text-[10px] ${subTextClass}`}
        >
          <HistoryIcon className="w-5 h-5" />
          <span>Laporan</span>
        </Link>
      </nav>

      {isMobileFormOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end animate-in fade-in duration-200">
          <div className={`w-full p-5 rounded-t-3xl border-t space-y-4 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>

            <div className="w-12 h-1.5 bg-zinc-700/60 rounded-full mx-auto -mt-1 mb-2"></div>

            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Catat Transaksi Instan
              </h2>
              <button onClick={() => setIsMobileFormOpen(false)} className={`p-1 ${subTextClass}`}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleAddTransaction}>
              <div>
                <label className={`text-xs mb-1 block font-semibold ${subTextClass}`}>Nominal (Rp)</label>
                <input
                  ref={amountInputRef}
                  type="text"
                  placeholder="Rp 0"
                  value={items[0].amount}
                  onChange={(e) => handleItemChange(0, 'amount', e.target.value)}
                  className={`w-full border rounded-2xl px-4 py-3 text-lg font-black focus:outline-none focus:border-emerald-500 transition-all ${inputBgClass}`}
                  required
                />
              </div>

              <div>
                <label className={`text-xs mb-1 block font-semibold ${subTextClass}`}>Keterangan</label>
                <input
                  type="text"
                  placeholder="misal: Kopi / Nasi Goreng"
                  value={items[0].description}
                  onChange={(e) => handleItemChange(0, 'description', e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-all ${inputBgClass}`}
                  required
                />
              </div>

              <div>
                <label className={`text-xs mb-1.5 block font-semibold ${subTextClass}`}>Tipe Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransactionType('EXPENSE')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${transactionType === 'EXPENSE'
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                        : `${inputBgClass} ${subTextClass}`
                      }`}
                  >
                    Pengeluaran (Keluar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionType('INCOME')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${transactionType === 'INCOME'
                        ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                        : `${inputBgClass} ${subTextClass}`
                      }`}
                  >
                    Pemasukan (Masuk)
                  </button>
                </div>
              </div>

              <div>
                <label className={`text-xs mb-1.5 block font-semibold ${subTextClass}`}>Pilih Dompet</label>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {wallets.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWallet(w.name)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border shrink-0 transition-all ${selectedWallet === w.name
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : `${inputBgClass} ${subTextClass}`
                        }`}
                    >
                      {w.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className={`text-xs block ${subTextClass}`}>Waktu</label>
                  <button
                    type="button"
                    onClick={() => setTransactionDate(getCurrentLocalDateTime())}
                    className="text-[10px] text-emerald-500 hover:underline flex items-center gap-0.5"
                  >
                    <Clock className="w-2.5 h-2.5" /> Jam Sekarang
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 ${inputBgClass}`}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 font-bold py-3.5 rounded-xl transition-all shadow-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Catat Sekarang'}
              </button>
            </form>
          </div>
        </div>
      )}

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
                  type="text"
                  placeholder="Rp 0"
                  value={newWalletBalance}
                  onChange={(e) => setNewWalletBalance(formatRupiahInput(e.target.value))}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-500 ${inputBgClass}`}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Dompet'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}