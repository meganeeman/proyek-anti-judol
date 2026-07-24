'use client';

import React, { useState, useEffect } from 'react';
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
    Loader2,
    Eye,
    EyeOff,
    Flame
} from 'lucide-react';
import Toast from '@/components/Toast';

interface Transaction {
    id: number;
    created_at: string;
    description: string;
    amount: number;
    type: string;
    category: string;
}

const SENSITIVE_KEYWORDS = [
    'slot', 'depo', 'judol', 'zeus', 'olympus', 'gacor',
    'maxwin', 'pragmatic', 'habanero', 'sbobet', 'judi', 'judionline', 'poker'
];

const MIN_LIMIT_VALUE = 100000;

const AVATAR_SEEDS = [
    'Aiden', 'Felix', 'Luna', 'Milo', 'Oliver', 'Sofia', 'Zoe', 'Leo'
];

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
    const [streakDays, setStreakDays] = useState(30);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

        const { data: transData } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (transData) {
            const judolTransactions = transData.filter((t: Transaction) =>
                t.type?.toUpperCase() === 'EXPENSE' &&
                (t.category === 'Special Recovery Tracker' || SENSITIVE_KEYWORDS.some(kw => t.description?.toLowerCase().includes(kw)))
            );

            if (judolTransactions.length === 0) {
                setStreakDays(30);
            } else {
                const lastJudolDate = new Date(judolTransactions[0].created_at);
                const today = new Date();
                const diffTime = Math.abs(today.getTime() - lastJudolDate.getTime());
                setStreakDays(Math.floor(diffTime / (1000 * 60 * 60 * 24)));
            }
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
                        <section className={`p-6 rounded-3xl border space-y-5 ${cardClass}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

                                <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border font-bold text-xs bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-orange-500/30 text-orange-400`}>
                                    <Flame className="w-4 h-4 fill-orange-500 animate-pulse" />
                                    <span>{streakDays} Hari Clean Streak!</span>
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
        </div>
    );
}