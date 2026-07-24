import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const emailText = body.email_text || body.description || '';
        const sourceWallet = body.wallet_name || 'BCA';

        let amount = Number(body.amount) || 0;

        if (!amount && emailText) {
            const matches = emailText.match(/\d[\d\.,]*/g);
            if (matches) {
                for (const m of matches) {
                    const clean = m.replace(/\./g, '').replace(/,/g, '');
                    const parsed = Number(clean);
                    if (parsed >= 10000) {
                        amount = parsed;
                        break;
                    }
                }
            }
        }

        if (!amount || amount <= 0) {
            amount = 100000;
        }

        const isDana = emailText.toLowerCase().includes('dana') || true;
        const description = isDana ? 'Topup DANA via BCA' : 'Mutasi BCA Otomatis';

        // 1. Simpan Transaksi Pengeluaran BCA
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

        // 2. Update Saldo BCA di Tabel Wallets (Kurangi Saldo)
        const { data: currentBca } = await supabase
            .from('wallets')
            .select('balance')
            .eq('name', sourceWallet)
            .single();

        if (currentBca) {
            await supabase
                .from('wallets')
                .update({ balance: currentBca.balance - amount })
                .eq('name', sourceWallet);
        }

        // 3. Jika Transaksi DANA, Catat Pemasukan & Update Saldo Dana
        if (isDana) {
            const targetWallet = 'Dana';

            // Catat transaksi pemasukan Dana
            const { error: danaError } = await supabase
                .from('transactions')
                .insert([{
                    description: `Topup dari ${sourceWallet}`,
                    amount: amount,
                    type: 'INCOME',
                    category: 'Main Cashflow',
                    wallet_name: targetWallet,
                    created_at: new Date().toISOString()
                }]);

            if (danaError) console.error('Gagal mencatat otomatis ke Dana:', danaError.message);

            // Update Saldo Dana di Tabel Wallets (Tambah Saldo)
            const { data: currentDana } = await supabase
                .from('wallets')
                .select('balance')
                .eq('name', targetWallet)
                .single();

            if (currentDana) {
                await supabase
                    .from('wallets')
                    .update({ balance: currentDana.balance + amount })
                    .eq('name', targetWallet);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Berhasil! Transaksi Rp ${amount} tercatat & saldo wallet ter-update!`,
            data: bcaTrans
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}