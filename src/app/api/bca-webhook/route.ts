import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { description, amount, type, wallet_name } = body;

        const finalDesc = description && description.trim() !== '' ? description : 'Mutasi BCA Otomatis';
        const numericAmount = Number(amount) || 0;

        if (numericAmount <= 0) {
            return NextResponse.json({ error: 'Nominal transaksi harus lebih dari 0' }, { status: 400 });
        }

        const sourceWallet = wallet_name || 'BCA';
        const isDana = finalDesc.toLowerCase().includes('dana');

        const { data: bcaTrans, error: bcaError } = await supabase
            .from('transactions')
            .insert([{
                description: finalDesc,
                amount: numericAmount,
                type: type || 'EXPENSE',
                category: isDana ? 'Topup E-Wallet' : 'Survival Mode',
                wallet_name: sourceWallet,
                created_at: new Date().toISOString()
            }])
            .select();

        if (bcaError) throw bcaError;

        if (isDana) {
            const { error: danaError } = await supabase
                .from('transactions')
                .insert([{
                    description: `Topup dari ${sourceWallet}`,
                    amount: numericAmount,
                    type: 'INCOME',
                    category: 'Main Cashflow',
                    wallet_name: 'DANA',
                    created_at: new Date().toISOString()
                }]);

            if (danaError) console.error('Gagal mencatat otomatis ke DANA:', danaError.message);
        }

        return NextResponse.json({
            success: true,
            message: isDana ? 'Transaksi BCA & Auto-Topup DANA berhasil dicatat!' : 'Transaksi BCA berhasil dicatat!',
            data: bcaTrans
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}