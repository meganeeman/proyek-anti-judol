import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const emailText = body.email_text || body.description || '';
        const sourceWallet = body.wallet_name || 'BCA';

        // 1. Ekstrak Nominal Angka dari Teks Email
        const match = emailText.match(/(?:Rp|IDR)?\s*([\d\.,]+)/i);
        let amount = 0;

        if (match && match[1]) {
            // Bersihkan titik dan koma format rupiah (misal: 100.000,00 -> 100000)
            const cleanAmount = match[1].replace(/\./g, '').replace(/,/g, '');
            amount = Number(cleanAmount) || 0;
        }

        // Fallback jika amount dari request manual langsung diisi angka
        if (!amount && body.amount) {
            amount = Number(body.amount) || 0;
        }

        if (amount <= 0) {
            return NextResponse.json({ error: 'Nominal transaksi tidak ditemukan dari email' }, { status: 400 });
        }

        const isDana = emailText.toLowerCase().includes('dana');
        const description = isDana ? 'Topup DANA via BCA' : 'Mutasi BCA Otomatis';

        // 2. Simpan Transaksi Pengeluaran BCA
        const { data: bcaTrans, error: bcaError } = await supabase
            .from('transactions')
            .insert([{
                description: description,
                amount: amount,
                type: 'EXPENSE',
                category: isDana ? 'Topup E-Wallet' : 'Survival Mode',
                wallet_name: sourceWallet,
                created_at: new Date().toISOString()
            }])
            .select();

        if (bcaError) throw bcaError;

        // 3. Jika Transaksi DANA, Otomatis Tambah Saldo / Transaksi Masuk DANA
        if (isDana) {
            const { error: danaError } = await supabase
                .from('transactions')
                .insert([{
                    description: `Topup dari ${sourceWallet}`,
                    amount: amount,
                    type: 'INCOME',
                    category: 'Main Cashflow',
                    wallet_name: 'DANA',
                    created_at: new Date().toISOString()
                }]);

            if (danaError) console.error('Gagal mencatat otomatis ke DANA:', danaError.message);
        }

        return NextResponse.json({
            success: true,
            message: isDana ? `Berhasil! Topup DANA sebesar Rp ${amount} tercatat otomatis!` : `Transaksi BCA Rp ${amount} berhasil dicatat!`,
            data: bcaTrans
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}