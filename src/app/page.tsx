'use client';

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabase';

interface Wallet {
  id: number;
  name: string;
  type: string;
}

interface Transaction {
  id: string | number;
  amount: number;
  type: string;
  category?: string;
  description?: string;
  wallet_id?: number;
  created_at?: string;
  wallets?: { name: string };
}

interface Budget {
  id: string | number;
  category: string;
  limit_amount: number;
}

interface PaymentRow {
  walletId: number;
  amount: number;
  displayAmount: string;
}

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Transaksi Utama
  const [description, setDescription] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Kebutuhan Harian');

  // Multi-Bayar (Split Payment Rows)
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: txData } = await supabase
      .from('transactions')
      .select('*, wallets(name)')
      .order('id', { ascending: false });

    const { data: bgData } = await supabase
      .from('budgets')
      .select('*');

    const { data: wlData } = await supabase
      .from('wallets')
      .select('*')
      .order('id', { ascending: true });

    setTransactions(txData || []);
    setBudgets(bgData || []);
    setWallets(wlData || []);

    if (wlData && wlData.length > 0 && payments.length === 0) {
      setPayments([{ walletId: wlData[0].id, amount: 0, displayAmount: '' }]);
    }

    setLoading(false);
  };

  const handleAddPaymentRow = () => {
    if (wallets.length === 0) return;
    setPayments([...payments, { walletId: wallets[0].id, amount: 0, displayAmount: '' }]);
  };

  const handleRemovePaymentRow = (index: number) => {
    if (payments.length <= 1) return;
    const newPayments = payments.filter((_, i) => i !== index);
    setPayments(newPayments);
  };

  const handlePaymentChange = (index: number, field: 'walletId' | 'amount', value: any) => {
    const updated = [...payments];
    if (field === 'walletId') {
      updated[index].walletId = Number(value);
    } else if (field === 'amount') {
      const cleanVal = value.replace(/\D/g, '');
      const numVal = Number(cleanVal);
      updated[index].amount = numVal;
      updated[index].displayAmount = cleanVal === '' ? '' : `Rp ${numVal.toLocaleString('id-ID')}`;
    }
    setPayments(updated);
  };

  const handleAddTransaction = async (e: FormEvent) => {
    e.preventDefault();
    if (!description) return;

    const validPayments = payments.filter((p) => p.amount > 0);
    if (validPayments.length === 0) {
      alert('Masukkan minimal 1 nominal pembayaran!');
      return;
    }

    setSubmitting(true);

    const inserts = validPayments.map((p) => ({
      description: validPayments.length > 1 ? `${description} (${wallets.find(w => w.id === p.walletId)?.name})` : description,
      amount: p.amount,
      type,
      category,
      wallet_id: p.walletId,
    }));

    const { error } = await supabase.from('transactions').insert(inserts);

    if (error) {
      console.error('Error adding transaction:', error.message);
      alert('Gagal menambah transaksi: ' + error.message);
    } else {
      setDescription('');
      setPayments([{ walletId: wallets[0]?.id || 1, amount: 0, displayAmount: '' }]);
      fetchData();
    }
    setSubmitting(false);
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'income' || t.type === 'pemasukan')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense' || t.type === 'pengeluaran')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const balance = totalIncome - totalExpense;

  const getCategoryExpense = (catName: string) => {
    return transactions
      .filter((t) => (t.type === 'expense' || t.type === 'pengeluaran') && t.category === catName)
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  };

  const getWalletBalance = (walletId: number) => {
    const txList = transactions.filter((t) => Number(t.wallet_id) === Number(walletId));
    const inc = txList
      .filter((t) => t.type === 'income' || t.type === 'pemasukan')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const exp = txList
      .filter((t) => t.type === 'expense' || t.type === 'pengeluaran')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    return inc - exp;
  };

  const totalFormAmount = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-slate-800 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              Dashboard Keuangan Personal
            </h1>
            <p className="text-slate-400 mt-1">
              Sistem Proteksi & Kontrol Keuangan Anti Judol 🛡️✨
            </p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition text-sm font-medium"
          >
            Refresh Data
          </button>
        </header>

        {/* Ringkasan Total Keuangan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/50">
            <p className="text-sm text-slate-400">Total Saldo Gabungan</p>
            <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {loading ? '...' : `Rp ${balance.toLocaleString('id-ID')}`}
            </p>
          </div>

          <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/50">
            <p className="text-sm text-slate-400">Total Pemasukan</p>
            <p className="text-2xl font-bold mt-1 text-teal-400">
              {loading ? '...' : `Rp ${totalIncome.toLocaleString('id-ID')}`}
            </p>
          </div>

          <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/50">
            <p className="text-sm text-slate-400">Total Pengeluaran</p>
            <p className="text-2xl font-bold mt-1 text-rose-400">
              {loading ? '...' : `Rp ${totalExpense.toLocaleString('id-ID')}`}
            </p>
          </div>
        </div>

        {/* Fitur Wallet / Sumber Rekening */}
        <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700/50 space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Daftar Rekening / Dompet (Wallets) 💳</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {wallets.map((w) => {
              const currentBalance = getWalletBalance(w.id);
              return (
                <div key={w.id} className="bg-slate-900/80 p-4 rounded-lg border border-slate-700/60">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{w.type}</p>
                  <p className="text-sm font-semibold text-slate-200 mt-1">{w.name}</p>
                  <p className={`text-lg font-bold mt-2 ${currentBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Rp {currentBalance.toLocaleString('id-ID')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fitur Target Budgets / Batas Pengeluaran */}
        <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700/50 space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Batas Anggaran Bulanan (Budgets) 🎯</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((b) => {
              const used = getCategoryExpense(b.category);
              const percentage = Math.min(Math.round((used / b.limit_amount) * 100), 100);
              const isOver = used > b.limit_amount;

              return (
                <div key={b.id} className="bg-slate-900/80 p-4 rounded-lg border border-slate-700/60 space-y-2">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-slate-200">{b.category}</span>
                    <span className={isOver ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      Rp {used.toLocaleString('id-ID')} / Rp {Number(b.limit_amount).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        isOver
                          ? 'bg-rose-500'
                          : percentage > 75
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{percentage}% Terpakai</span>
                    {isOver && <span className="text-rose-400 font-semibold">⚠️ Melebihi Batas!</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Tambah Transaksi dengan Multi-Bayar */}
        <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700/50 space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Catat Transaksi Baru ➕</h2>
          
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Keterangan (mis: Makan Malam, Belanja)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
              </select>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Kebutuhan Harian">Kebutuhan Harian</option>
                <option value="Pemasukan Utama">Pemasukan Utama</option>
                <option value="Tabungan/Investasi">Tabungan/Investasi</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {/* Sub-Form Multi Baris Pembayaran */}
            <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/60 space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Rincian Pembayaran / Metode Bayar
                </p>
                <p className="text-xs font-semibold text-teal-400">
                  Total: Rp {totalFormAmount.toLocaleString('id-ID')}
                </p>
              </div>

              {payments.map((p, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <select
                    value={p.walletId}
                    onChange={(e) => handlePaymentChange(index, 'walletId', e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 flex-1"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Rp 0"
                    value={p.displayAmount}
                    onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 flex-1"
                    required
                  />

                  {payments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePaymentRow(index)}
                      className="px-2.5 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded transition text-xs font-bold"
                      title="Hapus Metode Ini"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddPaymentRow}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium underline transition"
              >
                + Tambah Metode Bayar Lain (Split Payment)
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition text-sm disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </form>
        </div>

        {/* Tabel Data */}
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-slate-200">Riwayat Transaksi</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Mengambil data dari Supabase...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Belum ada data transaksi. Coba tambah transaksi pertama kamu di atas! 👆
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Keterangan</th>
                    <th className="px-6 py-3">Dompet</th>
                    <th className="px-6 py-3">Kategori</th>
                    <th className="px-6 py-3">Tipe</th>
                    <th className="px-6 py-3">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4 font-mono">{t.id}</td>
                      <td className="px-6 py-4 font-medium text-white">{t.description || '-'}</td>
                      <td className="px-6 py-4 text-slate-400 font-medium">
                        {t.wallets?.name || 'Umum'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs bg-slate-700 text-emerald-300">
                          {t.category || 'Umum'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${
                          t.type === 'income' || t.type === 'pemasukan' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-semibold ${
                        t.type === 'income' || t.type === 'pemasukan' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        Rp {Number(t.amount || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}