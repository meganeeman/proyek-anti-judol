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
    const finalType = (type && type.toUpperCase() === 'INCOME') ? 'INCOME' : 'EXPENSE';
    
    const sensitiveKeywords = [
      'slot', 'depo', 'judol', 'zeus', 'olympus', 'gacor', 
      'maxwin', 'pragmatic', 'habanero', 'sbobet', 'judi', 'judionline', 'poker'
    ];
    
    const isJudol = sensitiveKeywords.some(kw => description.toLowerCase().includes(kw));
    const finalCategory = isJudol 
      ? 'Special Recovery Tracker' 
      : (finalType === 'EXPENSE' ? 'Survival Mode' : 'Main Cashflow');

    const { data, error } = await supabase.from('transactions').insert([
      {
        description: `[BCA Auto] ${description}`,
        amount: numericAmount,
        type: finalType,
        category: finalCategory,
        wallet_name: 'BCA',
        created_at: new Date().toISOString()
      }
    ]).select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Transaksi BCA berhasil disinkronisasi otomatis!', 
      data 
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}