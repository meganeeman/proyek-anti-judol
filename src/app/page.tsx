'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
  Gift
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

    setDescription('');
    setAmount('');
    setIsJudolDetected(false);
    setSubmitting(false);
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
      fetchData();
    }
    setSubmitting(false);
  };

  // Kalkulasi Keuangan
  const totalBalance = wallets.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
  
  const totalExpenseThisMonth = transactions
    .filter(t => t.type?.toUpperCase() === 'EXPENSE')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // Kalkulasi khusus pengeluaran terdeteksi recovery
  const totalJudolExpense = transactions
    .filter(t => {
      const isExpense = t.type?.toUpperCase() === 'EXPENSE';
      const isJudolCategory = t.category === 'Special Recovery Tracker';
      const hasKeyword = SENSITIVE_KEYWORDS.some(kw => t.description?.toLowerCase().includes(kw));
      return isExpense && (isJudolCategory || hasKeyword);
    })
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const budgetUsagePercentage = Math.min(Math.round((totalExpenseThisMonth / monthlyLimit) * 100), 100);
  const judolUsagePercentage = Math.min(Math.round((totalJudolExpense / judolLimit) * 100), 100);

  // Reward System: Sisa limit yang berhasil dihemat dikonversi jadi Bonus Allowance
  const rewardBonus = Math.max(judolLimit - totalJudolExpense, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Financial Health Zone</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Anti-Judol Hub <Sparkles className="inline-block w-5 h-5 text-yellow-400" />
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Smart Financial Tracker • Bebas Slot, Dompet Sehat!
            </p>
          </div>
          <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
            <span className="text-xs text-zinc-400 font-medium block">Total Ammo (Net Worth)</span>
            <span className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tight">
              {loading ? 'Loading...' : `Rp ${totalBalance.toLocaleString('id-ID')}`}
            </span>
          </div>
        </header>

        {/* Budget Trackers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Monthly Budget Tracker */}
          <section className="p-6 rounded-3xl bg-gradient-to-r from-zinc-900 to-zinc-900/80 border border-zinc-800/80 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-200">
                <Target className="w-4 h-4 text-emerald-400" /> Monthly Budget Limit
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {budgetUsagePercentage}% Terpakai
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-400 font-medium">
                <span>Pengeluaran: Rp {totalExpenseThisMonth.toLocaleString('id-ID')}</span>
                <span>Limit: Rp {monthlyLimit.toLocaleString('id-ID')}</span>
              </div>
              <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetUsagePercentage > 85 ? 'bg-rose-500' : budgetUsagePercentage > 60 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${budgetUsagePercentage}%` }}
                ></div>
              </div>
            </div>
          </section>

          {/* Special Recovery Limit (Harm Reduction) */}
          <section className="p-6 rounded-3xl bg-gradient-to-r from-zinc-900 to-zinc-900/80 border border-rose-900/30 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> Recovery Budget (Max 300k)
              </div>
              <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                {judolUsagePercentage}% Terpakai
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-400 font-medium">
                <span>Terpakai: Rp {totalJudolExpense.toLocaleString('id-ID')}</span>
                <span>Max: Rp {judolLimit.toLocaleString('id-ID')}</span>
              </div>
              <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    judolUsagePercentage > 80 ? 'bg-rose-600' : judolUsagePercentage > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${judolUsagePercentage}%` }}
                ></div>
              </div>
            </div>
          </section>

        </div>

        {/* Rewarding System Banner */}
        <section className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                Rewarding System Active <Sparkles className="w-4 h-4 text-yellow-400" />
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Hemat anggaran recovery bulan ini untuk dijadikan bonus limit pengeluaran harian!
              </p>
            </div>
          </div>
          <div className="bg-zinc-950/80 px-4 py-2.5 rounded-2xl border border-emerald-500/20 text-right w-full sm:w-auto">
            <span className="text-[10px] text-zinc-400 block font-semibold uppercase tracking-wider">Potensi Bonus Reward</span>
            <span className="text-lg font-black text-emerald-400">+ Rp {rewardBonus.toLocaleString('id-ID')}</span>
          </div>
        </section>

        {/* Wallets Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" /> Active Wallets
            </h2>
            <button 
              onClick={() => setIsWalletModalOpen(true)}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Dompet
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loading ? (
              <p className="text-xs text-zinc-500 col-span-3">Memuat dompet...</p>
            ) : (
              wallets.map((w) => (
                <div 
                  key={w.id} 
                  className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-900/40 border border-zinc-800/80 hover:border-emerald-500/40 transition-all duration-300 group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/50 group-hover:border-emerald-500/50">
                      {w.name}
                    </span>
                    <Wallet className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <div className="text-xl font-bold text-zinc-100">
                    Rp {(Number(w.balance) || 0).toLocaleString('id-ID')}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Form Transaction & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Form Quick Add */}
          <section className="lg:col-span-2 p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl space-y-4">
            <h2 className="text-base font-bold text-zinc-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Catat Transaksi
            </h2>

            <form className="space-y-3" onSubmit={handleAddTransaction}>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Keterangan</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="misal: Kopi / Depo (Auto Detect)" 
                    value={description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    className={`w-full bg-zinc-950 border rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none transition-all ${
                      isJudolDetected ? 'border-rose-500/80 ring-1 ring-rose-500' : 'border-zinc-800 focus:border-emerald-500'
                    }`}
                    required
                  />
                  {isJudolDetected && (
                    <span className="absolute right-3 top-2.5 text-xs text-rose-400 font-semibold flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                      <AlertTriangle className="w-3 h-3" /> Auto-Detected
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Nominal (Rp)</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Tipe</label>
                  <select 
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      if (!isJudolDetected) {
                        setCategory(e.target.value === 'EXPENSE' ? 'Survival Mode' : 'Main Cashflow');
                      }
                    }}
                    disabled={isJudolDetected}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                  >
                    <option value="EXPENSE">Keluar</option>
                    <option value="INCOME">Masuk</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Dompet</label>
                  <select 
                    value={selectedWallet}
                    onChange={(e) => setSelectedWallet(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
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
                className={`w-full mt-2 font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${
                  isJudolDetected 
                    ? 'bg-rose-500 hover:bg-rose-400 text-zinc-950 shadow-rose-500/20' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20'
                }`}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lock It In ✨'}
              </button>
            </form>
          </section>

          {/* Transactions List */}
          <section className="lg:col-span-3 p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl space-y-4">
            <h2 className="text-base font-bold text-zinc-200 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" /> Transaksi Terakhir
            </h2>

            <div className="space-y-3">
              {loading ? (
                <p className="text-xs text-zinc-500">Memuat data transaksi...</p>
              ) : transactions.length === 0 ? (
                <p className="text-xs text-zinc-500">Belum ada transaksi di Supabase.</p>
              ) : (
                transactions.map((t) => {
                  const isIncome = t.type?.toUpperCase() === 'INCOME';
                  const isJudol = t.category === 'Special Recovery Tracker' || SENSITIVE_KEYWORDS.some(kw => t.description?.toLowerCase().includes(kw));

                  return (
                    <div 
                      key={t.id} 
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isJudol 
                          ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/50' 
                          : 'bg-zinc-950/60 border-zinc-800/60 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${
                          isJudol
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isIncome 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                        }`}>
                          {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-100">{t.description}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              isJudol 
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                                : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {t.category || 'General'}
                            </span>
                            {t.wallet_name && <span className="text-[10px] text-zinc-500">• {t.wallet_name}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-sm font-bold ${
                          isIncome ? 'text-emerald-400' : isJudol ? 'text-rose-400' : 'text-zinc-200'
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

      {/* Modal Popup Tambah Dompet */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-md space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsWalletModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" /> Tambah Dompet Baru
            </h3>

            <form className="space-y-3" onSubmit={handleAddWallet}>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Nama Dompet / Bank</label>
                <input 
                  type="text" 
                  placeholder="misal: BCA / GoPay / Seabank" 
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Saldo Awal (Rp)</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={newWalletBalance}
                  onChange={(e) => setNewWalletBalance(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
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