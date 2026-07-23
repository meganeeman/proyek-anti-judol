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
  ShieldCheck
} from 'lucide-react';

interface WalletItem {
  id: string;
  name: string;
  balance: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  wallet?: string;
}

export default function Home() {
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    // Fetch Wallets
    const { data: walletData } = await supabase.from('wallets').select('*');
    if (walletData) setWallets(walletData);

    // Fetch Transactions
    const { data: transData } = await supabase
      .from('transactions')
      .select('*')
      .order('id', { ascending: false });

    if (transData) setTransactions(transData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalBalance = wallets.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);

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

        {/* Wallets Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" /> Active Wallets
            </h2>
            <button className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium">
              <Plus className="w-3 h-3" /> Tambah Dompet
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {wallets.length === 0 && !loading ? (
              <p className="text-xs text-zinc-500 col-span-3">Belum ada data dompet di Supabase.</p>
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
                  <div className="text-lg font-bold text-zinc-100">
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

            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Keterangan</label>
                <input
                  type="text"
                  placeholder="misal: Kopi / Nasi Goreng"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Tipe</label>
                  <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500">
                    <option value="EXPENSE">Survival (Keluar)</option>
                    <option value="INCOME">Income (Masuk)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Dompet</label>
                  <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500">
                    {wallets.map(w => (
                      <option key={w.id} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              >
                Lock It In ✨
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
                  const isIncome = t.type?.toLowerCase() === 'income';
                  return (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-between gap-3 hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isIncome
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                          {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-100">{t.description}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                              {t.category || 'General'}
                            </span>
                            {t.wallet && <span className="text-[10px] text-zinc-500">• {t.wallet}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-sm font-bold ${isIncome ? 'text-emerald-400' : 'text-zinc-200'
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
    </div>
  );
}