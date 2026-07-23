'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
    Receipt,
    ArrowUpRight,
    ArrowDownLeft,
    ShieldCheck,
    Sparkles,
    Menu,
    X,
    Home as HomeIcon,
    History as HistoryIcon,
    Sun,
    Moon,
    Calendar
} from 'lucide-react';

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

export default function HistoryPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    const fetchTransactions = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setTransactions(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const isDark = theme === 'dark';
    const bgClass = isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-100 text-slate-900';
    const cardClass = isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white/80 border-slate-200/80 shadow-sm';
    const subTextClass = isDark ? 'text-zinc-400' : 'text-slate-500';

    return (
        <div className={`min-h-screen font-sans p-4 md:p-8 transition-colors duration-300 ${bgClass}`}>
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header Section */}
                <header className={`flex items-center justify-between p-5 md:p-6 rounded-3xl border backdrop-blur-xl ${cardClass}`}>
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
                                Laporan Transaksi <Sparkles className="inline-block w-4 h-4 text-yellow-400" />
                            </h1>
                        </div>
                    </div>

                    <nav className="hidden lg:flex items-center p-1.5 rounded-2xl border bg-zinc-950/40 border-zinc-800/80 gap-1">
                        <Link
                            href="/"
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${subTextClass} hover:text-zinc-200`}
                        >
                            <HomeIcon className="w-3.5 h-3.5" /> Dashboard & Chart
                        </Link>
                        <Link
                            href="/history"
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 flex items-center gap-2"
                        >
                            <HistoryIcon className="w-3.5 h-3.5" /> Laporan Transaksi
                        </Link>
                    </nav>

                    <button
                        onClick={toggleTheme}
                        className={`p-2.5 rounded-2xl border transition-all active:scale-95 flex items-center justify-center ${isDark ? 'bg-zinc-800/80 border-zinc-700/60 text-yellow-400' : 'bg-slate-200 border-slate-300 text-indigo-600'
                            }`}
                    >
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </header>

                {/* Laporan Transaksi Full List */}
                <section className={`p-6 rounded-3xl border backdrop-blur-xl space-y-4 ${cardClass}`}>
                    <div className="flex justify-between items-center">
                        <h2 className="text-base font-bold flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-emerald-500" /> Riwayat Transaksi Lengkap
                        </h2>
                        <span className={`text-xs ${subTextClass}`}>Total: {transactions.length} Transaksi</span>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <p className={`text-xs ${subTextClass}`}>Memuat riwayat transaksi...</p>
                        ) : transactions.length === 0 ? (
                            <p className={`text-xs ${subTextClass}`}>Belum ada riwayat transaksi.</p>
                        ) : (
                            transactions.map((t) => {
                                const isIncome = t.type?.toUpperCase() === 'INCOME';
                                const isJudol = t.category === 'Special Recovery Tracker' || SENSITIVE_KEYWORDS.some(kw => t.description?.toLowerCase().includes(kw));
                                const dateFormatted = t.created_at ? new Date(t.created_at).toLocaleString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) : 'Waktu tidak tercatat';

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
                                                    <span className={`text-[10px] flex items-center gap-1 ${subTextClass}`}>
                                                        <Calendar className="w-3 h-3 text-emerald-500" /> {dateFormatted}
                                                    </span>
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
                                className={`w-full p-3 rounded-2xl flex items-center gap-3 font-semibold text-sm transition-all ${isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'
                                    }`}
                            >
                                <HomeIcon className="w-4 h-4" /> Dashboard & Chart
                            </Link>

                            <Link
                                href="/history"
                                onClick={() => setIsSidebarOpen(false)}
                                className="w-full p-3 rounded-2xl flex items-center gap-3 font-semibold text-sm bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20"
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
        </div>
    );
}