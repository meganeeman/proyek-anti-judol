'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, Mail, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import Toast from '@/components/Toast';

const AVATAR_OPTIONS = [
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Aiden&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Zoe&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Leo&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Maya&backgroundColor=c0aede',
];

export default function SignUpPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
    const [loading, setLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setToastMessage(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName,
                    avatar_url: selectedAvatar,
                },
            },
        });

        if (error) {
            setToastMessage({ message: error.message, type: 'error' });
            setLoading(false);
        } else {
            setLoading(false);
            setToastMessage({ message: 'Pendaftaran berhasil! Mengalihkan ke halaman utama...', type: 'success' });
            setTimeout(() => {
                router.push('/');
            }, 1500);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 font-sans relative">

            {toastMessage && (
                <Toast
                    message={toastMessage.message}
                    type={toastMessage.type}
                    onClose={() => setToastMessage(null)}
                />
            )}

            <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">

                <div className="text-center space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Buat Akun Baru</span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                        Bergabung Sekarang
                    </h1>
                    <p className="text-xs text-zinc-400">
                        Atur profil dan avatar pilihanmu sebelum mulai.
                    </p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">

                    <div>
                        <label className="text-xs mb-1 block font-semibold text-zinc-400">Display Name</label>
                        <div className="relative">
                            <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Nama panggilan kerenmu"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-3 text-sm font-semibold text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs mb-1 block font-semibold text-zinc-400">Email Address</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                placeholder="nama@domain.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-3 text-sm font-semibold text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs mb-1 block font-semibold text-zinc-400">Password</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-3 text-sm font-semibold text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <label className="text-xs block font-semibold text-zinc-400">Pilih Avatar Karaktermu</label>
                        <div className="flex items-center justify-between gap-3">
                            {AVATAR_OPTIONS.map((url, idx) => (
                                <button
                                    type="button"
                                    key={idx}
                                    onClick={() => setSelectedAvatar(url)}
                                    className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all p-1 ${selectedAvatar === url
                                        ? 'border-emerald-500 scale-105 shadow-lg shadow-emerald-500/20 bg-emerald-500/10'
                                        : 'border-zinc-800 bg-zinc-950/50 opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover rounded-xl" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2 text-xs mt-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span className="font-extrabold">Daftar Sekarang</span> <ArrowRight className="w-4 h-4" /></>}
                    </button>
                </form>

                <div className="text-center pt-2 border-t border-zinc-800/80">
                    <p className="text-xs text-zinc-400">
                        Sudah punya akun?{' '}
                        <Link href="/login" className="text-emerald-400 font-bold hover:underline">
                            Masuk di sini
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    );
}