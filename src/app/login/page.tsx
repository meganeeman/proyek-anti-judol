'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, Loader2, ArrowRight, Sun, Moon } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    const isDark = theme === 'dark';
    const bgClass = isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-100 text-slate-900';
    const cardClass = isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-slate-200 shadow-xl';
    const inputBgClass = isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-300 text-slate-800';

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');

        if (isSignUp) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                setErrorMessage(error.message);
            } else if (data.user) {
                alert('Pendaftaran berhasil! Silakan masuk dengan akun kamu.');
                setIsSignUp(false);
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setErrorMessage('Email atau password salah, silahkan coba kembali.');
            } else {
                router.push('/');
                router.refresh();
            }
        }

        setLoading(false);
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${bgClass}`}>
            <div className="w-full max-w-md space-y-6">
                <div className="flex justify-between items-center px-2">
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm tracking-wider uppercase">
                        <ShieldCheck className="w-5 h-5" />
                        <span>Anti-Judol Hub</span>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-2xl border transition-all active:scale-95 ${isDark ? 'bg-zinc-800 border-zinc-700 text-yellow-400' : 'bg-slate-200 border-slate-300 text-indigo-600'
                            }`}
                    >
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>

                <div className={`p-8 rounded-3xl border backdrop-blur-xl space-y-6 ${cardClass}`}>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">
                            {isSignUp ? 'Buat Akun Baru' : 'Selamat Datang Kembali'}
                        </h1>
                        <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                            {isSignUp
                                ? 'Mulai perjalanan finansial sehat dan bebas judol kamu hari ini.'
                                : 'Masuk ke akun kamu untuk mengelola arus kas dan limit harian.'}
                        </p>
                    </div>

                    {errorMessage && (
                        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                                Email
                            </label>
                            <div className="relative">
                                <Mail className={`w-4 h-4 absolute left-3.5 top-3.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                                <input
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-2xl text-xs focus:outline-none focus:border-emerald-500 transition-all ${inputBgClass}`}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                                Password
                            </label>
                            <div className="relative">
                                <Lock className={`w-4 h-4 absolute left-3.5 top-3.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-2xl text-xs focus:outline-none focus:border-emerald-500 transition-all ${inputBgClass}`}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>{isSignUp ? 'Daftar Sekarang' : 'Masuk ke Dashboard'}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="pt-2 text-center border-t border-zinc-800/40">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setErrorMessage('');
                            }}
                            className="text-xs text-emerald-500 hover:underline font-semibold"
                        >
                            {isSignUp ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun? Daftar gratis'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}