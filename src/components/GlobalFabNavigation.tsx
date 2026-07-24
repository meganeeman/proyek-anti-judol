'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Home as HomeIcon,
    History as HistoryIcon,
    User,
    Plus,
    Clock,
    X,
    Loader2,
    TrendingUp,
    Sparkles,
    Trash2
} from 'lucide-react';
import Toast from '@/components/Toast';

interface WalletItem {
    id: number;
    name: string;
    balance: number;
}

interface ItemRow {
    description: string;
    amount: string;
}

const SENSITIVE_KEYWORDS = [
    'slot', 'depo', 'judol', 'zeus', 'olympus', 'gacor',
    'maxwin', 'pragmatic', 'habanero', 'sbobet', 'judi', 'judionline', 'poker'
];

const RECOVERY_ADVICES = [
    'Transaksi dicatat ke Recovery Budget. Ingat, fokus pada tujuan finansial jangka panjang dan hindari impulsivitas demi masa depan yang lebih stabil!',
    'Tetap tenang dan kendalikan keuanganmu. Setiap rupiah yang kamu hemat adalah langkah menuju kebebasan finansial!',
    'Ingat komitmen awalmu! Uangmu jauh lebih berharga jika dialokasikan untuk hal-hal yang benar-benar produktif.'
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

export default function GlobalFabNavigation() {
    const pathname = usePathname();
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [wallets, setWallets] = useState<WalletItem[]>([]);
    const [selectedWallet, setSelectedWallet] = useState('');
    const [transactionType, setTransactionType] = useState('EXPENSE');
    const [transactionDate, setTransactionDate] = useState(getCurrentLocalDateTime());
    const [items, setItems] = useState<ItemRow[]>([{ description: '', amount: '' }]);

    const amountInputRef = useRef<HTMLInputElement>(null);

    const fetchWallets = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', session.user.id)
            .order('id', { ascending: true });

        if (data && data.length > 0) {
            setWallets(data);
            if (!selectedWallet) setSelectedWallet(data[0].name);
        }
    };

    useEffect(() => {
        fetchWallets();
    }, [pathname]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                amountInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setToast({ message: 'Sesi habis, silakan login ulang', type: 'error' });
            return;
        }

        const validItems = items.filter(
            item => item.description.trim() !== '' && parseRupiahNumber(item.amount) > 0
        );

        if (validItems.length === 0 || !selectedWallet) {
            setToast({ message: 'Lengkapi data transaksi dengan benar ya!', type: 'error' });
            return;
        }

        setSubmitting(true);
        const finalIsoDate = new Date(transactionDate).toISOString();
        let containsSensitiveExpense = false;

        for (const item of validItems) {
            const numericAmount = parseRupiahNumber(item.amount);
            const hasKeyword = SENSITIVE_KEYWORDS.some(kw =>
                item.description.toLowerCase().includes(kw)
            );

            const isSensitiveExpense = hasKeyword && transactionType === 'EXPENSE';
            if (isSensitiveExpense) containsSensitiveExpense = true;

            let finalCategory = 'Survival Mode';
            if (transactionType === 'INCOME') {
                finalCategory = 'Main Cashflow';
            } else if (isSensitiveExpense) {
                finalCategory = 'Special Recovery Tracker';
            }

            await supabase.from('transactions').insert([{
                description: item.description,
                amount: numericAmount,
                type: transactionType,
                category: finalCategory,
                wallet_name: selectedWallet,
                created_at: finalIsoDate,
                user_id: session.user.id
            }]);
        }

        setSubmitting(false);
        setIsOpen(false);
        setItems([{ description: '', amount: '' }]);
        setTransactionDate(getCurrentLocalDateTime());

        if (containsSensitiveExpense) {
            const randomAdvice = RECOVERY_ADVICES[Math.floor(Math.random() * RECOVERY_ADVICES.length)];
            setToast({ message: randomAdvice, type: 'error' });
        } else {
            setToast({ message: 'Transaksi berhasil dicatat!', type: 'success' });
        }

        router.refresh();
    };

    return (
        <>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-2 py-2 border-t backdrop-blur-xl bg-zinc-900/95 border-zinc-800 text-zinc-400">
                <div className="grid grid-cols-5 items-center w-full max-w-sm mx-auto">
                    <Link
                        href="/"
                        className={`flex flex-col items-center justify-center gap-1 text-[10px] ${pathname === '/' ? 'text-emerald-500 font-bold' : 'font-semibold text-zinc-400'
                            }`}
                    >
                        <HomeIcon className="w-5 h-5" />
                        <span>Dashboard</span>
                    </Link>

                    <Link
                        href="/history"
                        className={`flex flex-col items-center justify-center gap-1 text-[10px] ${pathname === '/history' ? 'text-emerald-500 font-bold' : 'font-semibold text-zinc-400'
                            }`}
                    >
                        <HistoryIcon className="w-5 h-5" />
                        <span>Laporan</span>
                    </Link>

                    <div className="flex justify-center items-center relative -top-5">
                        <button
                            onClick={() => setIsOpen(true)}
                            className="w-12 h-12 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 border border-emerald-400"
                        >
                            <Plus className="w-6 h-6 stroke-[3]" />
                        </button>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-1 font-semibold text-[10px] opacity-40">
                        <Sparkles className="w-5 h-5" />
                        <span>Secret</span>
                    </div>

                    <Link
                        href="/profile"
                        className={`flex flex-col items-center justify-center gap-1 text-[10px] ${pathname === '/profile' ? 'text-emerald-500 font-bold' : 'font-semibold text-zinc-400'
                            }`}
                    >
                        <User className="w-5 h-5" />
                        <span>Profil</span>
                    </Link>
                </div>
            </nav>

            {isOpen && (
                <div className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end animate-in fade-in duration-200">
                    <div className="w-full p-5 rounded-t-3xl border-t space-y-4 max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-zinc-100">
                        <div className="w-12 h-1.5 bg-zinc-700/60 rounded-full mx-auto -mt-1 mb-2"></div>

                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-500" /> Catat Transaksi Instan
                            </h2>
                            <button onClick={() => setIsOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-100">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label className="text-xs mb-1.5 block font-semibold text-zinc-400">Tipe Transaksi</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTransactionType('EXPENSE')}
                                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${transactionType === 'EXPENSE'
                                                ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                                                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                                            }`}
                                    >
                                        Pengeluaran (Keluar)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTransactionType('INCOME')}
                                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${transactionType === 'INCOME'
                                                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                                                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                                            }`}
                                    >
                                        Pemasukan (Masuk)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs mb-1.5 block font-semibold text-zinc-400">Pilih Dompet</label>
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                    {wallets.map((w) => (
                                        <button
                                            key={w.id}
                                            type="button"
                                            onClick={() => setSelectedWallet(w.name)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border shrink-0 transition-all ${selectedWallet === w.name
                                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                                                }`}
                                        >
                                            {w.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs block font-bold text-zinc-400">Baris Barang Belanjaan</label>
                                {items.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            ref={index === 0 ? amountInputRef : undefined}
                                            type="text"
                                            placeholder={`Item ${index + 1}`}
                                            value={item.description}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            className="flex-1 border border-zinc-800 bg-zinc-950 text-zinc-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500"
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Rp 0"
                                            value={item.amount}
                                            onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                                            className="w-32 border border-zinc-800 bg-zinc-950 text-zinc-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
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

                            <button
                                type="button"
                                onClick={handleAddItemRow}
                                className="w-full py-2 rounded-xl border border-dashed border-emerald-500/40 text-emerald-500 text-xs font-bold hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" /> Tambah Baris Nota
                            </button>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs block text-zinc-400">Waktu</label>
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
                                    className="w-full border border-zinc-800 bg-zinc-950 text-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full mt-2 font-bold py-3.5 rounded-xl transition-all shadow-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Transaksi'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}