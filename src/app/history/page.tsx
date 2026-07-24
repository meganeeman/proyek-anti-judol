'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
    ArrowUpCircle,
    ArrowDownCircle,
    Search,
    Home as HomeIcon,
    History as HistoryIcon,
    ShieldCheck,
    Calendar,
    Tag,
    TrendingDown,
    TrendingUp,
    Scale,
    X,
    User
} from 'lucide-react';
import Toast from '@/components/Toast';

interface Transaction {
    id: number;
    created_at: string;
    description: string;
    amount: number;
    type: string;
    category: string;
    wallet_name: string;
}

export default function HistoryPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
    const [dateFilter, setDateFilter] = useState<string>('');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchData = async () => {
        setLoading(true);

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
        const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
        if (savedTheme) {
            setTheme(savedTheme);
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
        fetchData();
    }, []);

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.wallet_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesType = typeFilter === 'ALL' ? true : t.type?.toUpperCase() === typeFilter;

        const matchesDate = dateFilter ? (t.created_at && t.created_at.startsWith(dateFilter)) : true;

        return matchesSearch && matchesType && matchesDate;
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
        <div className={`min-h-screen font-sans p-4 md:p-8 pb-32 md:pb-8 transition-colors duration-300 ${bgClass}`}>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="max-w-4xl mx-auto space-y-6">

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
                            <Link
                                href="/profile"
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${subTextClass} hover:text-zinc-200`}
                            >
                                <User className="w-3.5 h-3.5" /> Profil
                            </Link>
                        </nav>
                    </div>
                </header>

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

                        <div className="flex flex-wrap items-center gap-2">
                            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-2xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200'}`}>
                                <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <input
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className={`bg-transparent text-xs font-bold focus:outline-none ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}
                                />
                                {dateFilter && (
                                    <button
                                        onClick={() => setDateFilter('')}
                                        className="p-0.5 text-zinc-400 hover:text-rose-400 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className={`p-1 rounded-2xl border flex gap-1 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200'}`}>
                                <button
                                    onClick={() => setTypeFilter('ALL')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${typeFilter === 'ALL' ? 'bg-emerald-500 text-zinc-950' : `${subTextClass} hover:text-zinc-200`
                                        }`}
                                >
                                    Semua
                                </button>
                                <button
                                    onClick={() => setTypeFilter('EXPENSE')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${typeFilter === 'EXPENSE' ? 'bg-rose-500 text-white' : `${subTextClass} hover:text-zinc-200`
                                        }`}
                                >
                                    Keluar
                                </button>
                                <button
                                    onClick={() => setTypeFilter('INCOME')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${typeFilter === 'INCOME' ? 'bg-emerald-500 text-zinc-950' : `${subTextClass} hover:text-zinc-200`
                                        }`}
                                >
                                    Masuk
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-6 pb-6">
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
                                                    <div className={`p-2.5 rounded-xl border ${isIncome
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
                                                            <span className={`px-2 py-0.5 rounded-md font-medium border ${isDark ? 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-700'
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
                                                    <span className={`text-base font-black ${isIncome ? 'text-emerald-400' : 'text-rose-400'
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
        </div>
    );
}