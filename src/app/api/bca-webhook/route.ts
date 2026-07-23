import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const WEBHOOK_SECRET = process.env.BCA_WEBHOOK_SECRET || 'secret-bca-anti-judol-123';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('x-bca-secret');
        if (authHeader !== WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized payload access' }, { status: 401 });
        }

        const body = await request.json();
        const { description, amount, type } = body;

        if (!description || !amount) {
            return NextResponse.json({ error: 'Data deskripsi dan nominal wajib diisi' }, { status: 400 });
        }

        const numericAmount = Number(amount) || 0;
        const descLower = description.toLowerCase();

        const sensitiveKeywords = [
            'slot', 'depo', 'judol', 'zeus', 'olympus', 'gacor',
            'maxwin', 'pragmatic', 'habanero', 'sbobet', 'judi', 'judionline', 'poker'
        ];
        const isJudol = sensitiveKeywords.some(kw => descLower.includes(kw));

        const isDanaTopup = descLower.includes('dana') || descLower.includes('topup') || descLower.includes('virtual account');

        const transactionsToInsert = [];

        if (isJudol) {
            transactionsToInsert.push({
                description: `[BCA Auto] ${description}`,
                amount: numericAmount,
                type: 'EXPENSE',
                category: 'Special Recovery Tracker',
                wallet_name: 'BCA',
                created_at: new Date().toISOString()
            });
        } else if (isDanaTopup) {
            transactionsToInsert.push(
                {
                    description: `[BCA Auto Topup] ${description}`,
                    amount: numericAmount,
                    type: 'EXPENSE',
                    category: 'Transfer / Topup',
                    wallet_name: 'BCA',
                    created_at: new Date().toISOString()
                },
                {
                    description: `[Auto Sync DANA] Topup dari BCA`,
                    amount: numericAmount,
                    type: 'INCOME',
                    category: 'Topup Wallet',
                    wallet_name: 'DANA',
                    created_at: new Date().toISOString()
                }
            );
        } else {
            const finalType = (type && type.toUpperCase() === 'INCOME') ? 'INCOME' : 'EXPENSE';
            transactionsToInsert.push({
                description: `[BCA Auto] ${description}`,
                amount: numericAmount,
                type: finalType,
                category: finalType === 'EXPENSE' ? 'Survival Mode' : 'Main Cashflow',
                wallet_name: 'BCA',
                created_at: new Date().toISOString()
            });
        }

        const { data, error } = await supabase.from('transactions').insert(transactionsToInsert).select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Sinkronisasi otomatis BCA & DANA berhasil!',
            data
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}