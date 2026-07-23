'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    User,
    ShieldCheck,
    Target,
    LogOut,
    Home as HomeIcon,
    History as HistoryIcon,
    Moon,
    Sun,
    Plus,
    Clock,
    X,
    Loader2,
    TrendingUp,
    Eye,
    EyeOff
} from 'lucide-react';
import Toast from '@/components/Toast';

interface WalletItem {
    id: number;
    name: string;
    balance: number;
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

const MIN_LIMIT_VALUE = 100000;

const AVATAR_SEEDS = [
    'Aiden', 'Felix', 'Luna', 'Milo', 'Oliver', 'Sofia', 'Zoe', 'Leo'
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

const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return email;
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
};

export default function ProfilePage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [displayName, setDisplayName] = useState('');
    const [avatarSeed, setAvatarSeed] = useState('Aiden');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [showFullEmail, setShowFullEmail] = useState(false);

    const [monthlyLimit, setMonthlyLimit] = useState('');
    const [judolLimit, setJudolLimit] = useState('');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [wallets, setWallets] = useState<WalletItem[]>([]);
    const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);
    const [mobileDesc, setMobileDesc] = useState('');
    const [mobileAmount, setMobileAmount] = useState('');
    const [mobileType, setMobileType] = useState('EXPENSE');
    const [mobileWallet, setMobileWallet] = useState('');
    const [mobileDate, setMobileDate] = useState(getCurrentLocalDateTime());

    const amountInputRef = useRef<HTMLInputElement>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const fetchUserDataAndWallets = async (user: any) => {
        setLoading(true);

        const meta = user.user_metadata || {};
        setDisplayName(meta.display_name || user.email?.split('@')[0] || '');

        if (meta.avatar_url && meta.avatar_url.includes('seed=')) {
            const seedParam = meta.avatar_url.split('seed=')[1]?.split('&')[0];
            if (seedParam) setAvatarSeed(seedParam);
        }

        const { data: walletData } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', user.id)
            .order('id', { ascending: true });

        if (walletData) {
            setWallets(walletData);
            if (walletData.length > 0 && !mobileWallet) {
                setMobileWallet(walletData[0].name);
            }
        }

        const { data: budgetData } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', user.id)
            .limit(1)
            .single();

        if (budgetData) {
            setMonthlyLimit('Rp ' + (Number(budgetData.monthly_limit) || 1500000).toLocaleString('id-ID'));
            setJudolLimit('Rp ' + (Number(budgetData.judol_limit) || 300000).toLocaleString('id-ID'));
        } else {
            setMonthlyLimit('Rp 1.500.000');
            setJudolLimit('Rp 300.000');
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

        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }
            setCurrentUser(session.user);
            fetchUserDataAndWallets(session.user);
        };

        checkUser();
    }, [router]);

    useEffect(() => {
        if (isMobileFormOpen) {
            setTimeout(() => {
                amountInputRef.current?.focus();
            }, 100);
        }
    }, [isMobileFormOpen]);

    const handleThemeToggle = (newTheme: 'dark' | 'light') => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        showToast(`Mode tema diubah ke ${newTheme === 'dark' ? 'Gelap (Dark)' : 'Terang (Light)'}`, 'success');
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        setSubmitting(true);
        const avatarUrl = `https://api.dicebear.com/7.x/lorelei/svg?seed=${avatarSeed}&backgroundColor=b6e3f4`;

        const { error } = await supabase.auth.updateUser({
            data: {
                display_name: displayName,
                avatar_url: avatarUrl
            }
        });

        setSubmitting(false);

        if (error) {
            showToast('Gagal memperbarui profil: ' + error.message, 'error');
        } else {
            showToast('Profil berhasil diperbarui!', 'success');
        }
    };

    const handleUpdateBudget = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        const newMonthly = parseRupiahNumber(monthlyLimit);
        const newJudol = parseRupiahNumber(judolLimit);

        if (newMonthly < MIN_LIMIT_VALUE || newJudol < MIN_LIMIT_VALUE) {
            showToast('Nilai limit tidak boleh kosong atau di bawah Rp 100.000!', 'error');
            return;
        }

        setSubmitting(true);

        const { data: existingBudget } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', currentUser.id)
            .limit(1)
            .single();

        let error = null;
        if (existingBudget) {
            const res = await supabase
                .from('budgets')
                .update({ monthly_limit: newMonthly, judol_limit: newJudol })
                .eq('user_id', currentUser.id);
            error = res.error;
        } else {
            const res = await supabase
                .from('budgets')
                .insert([{ monthly_limit: newMonthly, judol_limit: newJudol, user_id: currentUser.id }]);
            error = res.error;
        }

        setSubmitting(false);

        if (error) {
            showToast('Gagal memperbarui limit: ' + error.message, 'error');
        } else {
            showToast('Target limit keuangan berhasil disimpan!', 'success');
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        showToast('Berhasil keluar dari akun.', 'success');
        setTimeout(() => {
            router.push('/login');
        }, 800);
    };

    const handleMobileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        const numericAmount = parseRupiahNumber(mobileAmount);
        if (!mobileDesc.trim() || numericAmount <= 0 || !mobileWallet) {
            showToast('Lengkapi semua data transaksi dengan benar ya!', 'error');
            return;
        }

        setSubmitting(true);
        const isJudol = SENSITIVE_KEYWORDS.some(kw => mobileDesc.toLowerCase().includes(kw));
        const finalCategory = isJudol ? 'Special Recovery Tracker' : (mobileType === 'EXPENSE' ? 'Survival Mode' : 'Main Cashflow');

        const { error } = await supabase.from('transactions').insert([{
            description: mobileDesc,
            amount: numericAmount,
            type: mobileType,
            category: finalCategory,
            wallet_name: mobileWallet,
            created_at: new Date(mobileDate).toISOString(),
            user_id: currentUser.id
        }]);

        setSubmitting(false);

        if (error) {
            showToast('Gagal mencatat transaksi: ' + error.message, 'error');
        } else {
            if (isJudol) {
                const randomAdvice = RECOVERY_ADVICES[Math.floor(Math.random() * RECOVERY_ADVICES.length)];
                showToast(randomAdvice, 'error');
            } else {
                showToast('Transaksi berhasil dicatat!', 'success');
            }
            setMobileDesc('');
            setMobileAmount('');
            setMobileDate(getCurrentLocalDateTime());
            setIsMobileFormOpen(false);
        }
    };

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

            <div className="max-w-2xl mx-auto space-y-6">

                {/* HEADER */}
                <header className={`flex items-center justify-between p-5 md:p-6 rounded-3xl border backdrop-blur-xl ${cardClass}`}>
                    <div>
                        <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold tracking-wider uppercase mb-0.5">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Account & Settings</span>
                        </div>
                        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                            Pengaturan Profil
                        </h1>
                    </div>

                    <nav className="hidden lg:flex items-center p-1.5 rounded-2xl border bg-zinc-950/40 border-zinc-800/80 gap-1">
                        <Link
                            href="/"
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${subTextClass} hover:text-zinc-200`}
                        >
                            <HomeIcon className="w-3.5 h-3.5" /> Dashboard
                        </Link>
                        <Link
                            href="/history"
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${subTextClass} hover:text-zinc-200`}
                        >
                            <HistoryIcon className="w-3.5 h-3.5" /> Laporan
                        </Link>
                        <Link
                            href="/profile"
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 flex items-center gap-2"
                        >
                            <User className="w-3.5 h-3.5" /> Profil
                        </Link>
                    </nav>
                </header>

                {loading ? (
                    <div className={`p-12 text-center rounded-3xl border ${cardClass}`}>
                        <p className={`text-xs ${subTextClass}`}>Memuat data profil...</p>
                    </div>
                ) : (
                    <>
                        {/* PROFILE CARD */}
                        <section className={`p-6 rounded-3xl border space-y-5 ${cardClass}`}>
                            <div className="flex items-center gap-4">
                                <img
                                    src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${avatarSeed}&backgroundColor=b6e3f4`}
                                    alt="Avatar Preview"
                                    className="w-16 h-16 rounded-2xl border-2 border-emerald-500/50 object-cover bg-emerald-500/10 shadow-md shrink-0"
                                />
                                <div className="space-y-0.5 overflow-hidden">
                                    <h2 className="text-lg font-black tracking-tight truncate">{displayName || 'Pengguna'}</h2>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-xs ${subTextClass} font-medium`}>
                                            {showFullEmail ? currentUser?.email : maskEmail(currentUser?.email || '')}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setShowFullEmail(!showFullEmail)}
                                            className={`p-1 rounded-lg transition-colors hover:text-emerald-500 ${subTextClass}`}
                                            title={showFullEmail ? "Sembunyikan Email" : "Tampilkan Email"}
                                        >
                                            {showFullEmail ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
                                <div>
                                    <label className={`text-xs mb-1.5 block font-semibold ${subTextClass}`}>Nama Tampilan</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Nama kamu"
                                        className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-all ${inputBgClass}`}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className={`text-xs mb-1.5 block font-semibold ${subTextClass}`}>Pilih Karakter Avatar</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                        {AVATAR_SEEDS.map((seed) => (
                                            <button
                                                key={seed}
                                                type="button"
                                                onClick={() => setAvatarSeed(seed)}
                                                className={`p-1 rounded-xl border shrink-0 transition-all ${avatarSeed === seed
                                                    ? 'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/30'
                                                    : 'border-transparent opacity-60 hover:opacity-100'
                                                    }`}
                                            >
                                                <img
                                                    src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}&backgroundColor=b6e3f4`}
                                                    alt={seed}
                                                    className="w-10 h-10 rounded-lg object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Perubahan Profil'}
                                </button>
                            </form>
                        </section>

                        {/* BUDGET TARGET CARD */}
                        <section className={`p-6 rounded-3xl border space-y-4 ${cardClass}`}>
                            <div className="flex items-center gap-2 text-sm font-bold text-emerald-500">
                                <Target className="w-5 h-5" />
                                <h2>Target & Limit Keuangan (Minimal Rp 100.000)</h2>
                            </div>

                            <form onSubmit={handleUpdateBudget} className="space-y-4">
                                <div>
                                    <label className={`text-xs mb-1.5 block font-semibold ${subTextClass}`}>Monthly Budget Limit (Rp)</label>
                                    <input
                                        type="text"
                                        value={monthlyLimit}
                                        onChange={(e) => setMonthlyLimit(formatRupiahInput(e.target.value))}
                                        placeholder="Rp 1.500.000"
                                        className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all ${inputBgClass}`}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className={`text-xs mb-1.5 block font-semibold ${subTextClass}`}>Recovery Budget Limit (Rp)</label>
                                    <input
                                        type="text"
                                        value={judolLimit}
                                        onChange={(e) => setJudolLimit(formatRupiahInput(e.target.value))}
                                        placeholder="Rp 300.000"
                                        className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all ${inputBgClass}`}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Target Keuangan'}
                                </button>
                            </form>
                        </section>

                        {/* SETTINGS & THEME CARD */}
                        <section className={`p-6 rounded-3xl border space-y-4 ${cardClass}`}>
                            <h2 className="text-sm font-bold">Tema Aplikasi</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleThemeToggle('dark')}
                                    className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${isDark
                                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                        : `${inputBgClass} ${subTextClass}`
                                        }`}
                                >
                                    <Moon className="w-4 h-4" /> Gelap (Dark)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleThemeToggle('light')}
                                    className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${!isDark
                                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600'
                                        : `${inputBgClass} ${subTextClass}`
                                        }`}
                                >
                                    <Sun className="w-4 h-4" /> Terang (Light)
                                </button>
                            </div>
                        </section>

                        {/* LOGOUT BUTTON */}
                        <section>
                            <button
                                onClick={handleLogout}
                                className="w-full py-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <LogOut className="w-4 h-4" /> Keluar Dari Akun (Logout)
                            </button>
                        </section>
                    </>
                )}

            </div>

            {/* BOTTOM NAVIGATION (MOBILE) - PRESISI 3 KOLOM SIMETRIS */}
            <nav className={`lg:hidden fixed bottom-0 inset-x-0 z-40 px-4 py-2 border-t backdrop-blur-xl ${isDark ? 'bg-zinc-900/95 border-zinc-800 text-zinc-400' : 'bg-white/95 border-slate-200 text-slate-600'
                }`}>
                <div className="grid grid-cols-3 items-center w-full max-w-sm mx-auto">

                    <div className="flex items-center justify-around">
                        <Link
                            href="/"
                            className={`flex flex-col items-center justify-center gap-1 font-semibold text-[10px] ${subTextClass}`}
                        >
                            <HomeIcon className="w-5 h-5" />
                            <span>Dashboard</span>
                        </Link>

                        <Link
                            href="/history"
                            className={`flex flex-col items-center justify-center gap-1 font-semibold text-[10px] ${subTextClass}`}
                        >
                            <HistoryIcon className="w-5 h-5" />
                            <span>Laporan</span>
                        </Link>
                    </div>

                    <div className="flex justify-center items-center relative -top-5">
                        <button
                            onClick={() => setIsMobileFormOpen(true)}
                            className="w-12 h-12 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 border border-emerald-400"
                        >
                            <Plus className="w-6 h-6 stroke-[3]" />
                        </button>
                    </div>

                    <div className="flex items-center justify-center">
                        <Link
                            href="/profile"
                            className="flex flex-col items-center justify-center gap-1 text-emerald-500 font-bold text-[10px]"
                        >
                            <User className="w-5 h-5" />
                            <span>Profil</span>
                        </Link>
                    </div>

                </div>
            </nav>

            {/* MOBILE MODAL */}
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

                        <form className="space-y-4" onSubmit={handleMobileSubmit}>
                            <div>
                                <label className={`text-xs mb-1 block font-semibold ${subTextClass}`}>Nominal (Rp)</label>
                                <input
                                    ref={amountInputRef}
                                    type="text"
                                    placeholder="Rp 0"
                                    value={mobileAmount}
                                    onChange={(e) => setMobileAmount(formatRupiahInput(e.target.value))}
                                    className={`w-full border rounded-2xl px-4 py-3 text-lg font-black focus:outline-none focus:border-emerald-500 transition-all ${inputBgClass}`}
                                    required
                                />
                            </div>

                            <div>
                                <label className={`text-xs mb-1 block font-semibold ${subTextClass}`}>Keterangan</label>
                                <input
                                    type="text"
                                    placeholder="misal: Kopi / Nasi Goreng"
                                    value={mobileDesc}
                                    onChange={(e) => setMobileDesc(e.target.value)}
                                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-all ${inputBgClass}`}
                                    required
                                />
                            </div>

                            <div>
                                <label className={`text-xs mb-1.5 block font-semibold ${subTextClass}`}>Tipe Transaksi</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setMobileType('EXPENSE')}
                                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${mobileType === 'EXPENSE'
                                            ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                                            : `${inputBgClass} ${subTextClass}`
                                            }`}
                                    >
                                        Pengeluaran (Keluar)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMobileType('INCOME')}
                                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${mobileType === 'INCOME'
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
                                            onClick={() => setMobileWallet(w.name)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border shrink-0 transition-all ${mobileWallet === w.name
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
                                        onClick={() => setMobileDate(getCurrentLocalDateTime())}
                                        className="text-[10px] text-emerald-500 hover:underline flex items-center gap-0.5"
                                    >
                                        <Clock className="w-2.5 h-2.5" /> Jam Sekarang
                                    </button>
                                </div>
                                <input
                                    type="datetime-local"
                                    value={mobileDate}
                                    onChange={(e) => setMobileDate(e.target.value)}
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
        </div>
    );
}