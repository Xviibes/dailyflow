import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  DollarSign, 
  Sparkles, 
  Calendar, 
  Tag, 
  X 
} from 'lucide-react';
import { playSound } from '../../utils/audio';
import { useConfirm } from '../Modals/ConfirmDialog';
import { CustomSelect } from '../UI/CustomSelect';
import { ModalPortal } from '../UI/ModalPortal';
import { PAYMENT_METHODS, PaymentLogo, resolvePaymentMethod } from './PaymentLogos';
import { AiAssistantCard } from '../AI/AiAssistantCard';

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Format angka input jadi ribuan bertitik: 1000 -> 1.000, 1000000 -> 1.000.000
function formatThousand(value) {
  const digits = String(value ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function FinanceView({
  finance,
  setFinance,
  setTodos,
  setSchedule,
  setNotes,
  setWellness,
  soundEnabled,
}) {
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'expense',
    amount: '',
    category: 'Makanan & Belanja',
    wallet: 'shopeepay',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const confirm = useConfirm();

  const paymentSelectOptions = useMemo(
    () =>
      PAYMENT_METHODS.map((m) => ({
        value: m.id,
        label: `${m.name} (${m.group})`,
        icon: <PaymentLogo id={m.id} size="sm" />,
      })),
    []
  );

  // Calculate totals
  const totalIncome = useMemo(() => {
    return finance.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [finance.transactions]);

  const totalExpense = useMemo(() => {
    return finance.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [finance.transactions]);

  const netBalance = totalIncome - totalExpense;

  // Expense categories breakdown
  const expenseCategories = useMemo(() => {
    const map = {};
    finance.transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + Number(t.amount || 0);
      });
    return Object.entries(map).map(([cat, total]) => ({
      category: cat,
      amount: total,
      percent: totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [finance.transactions, totalExpense]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return finance.transactions.filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory !== 'Semua' && t.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pm = resolvePaymentMethod(t);
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchNotes = (t.notes || '').toLowerCase().includes(q);
        const matchWallet = pm.name.toLowerCase().includes(q) || pm.shortLabel.toLowerCase().includes(q);
        if (!matchTitle && !matchNotes && !matchWallet) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [finance.transactions, filterType, filterCategory, searchQuery]);

  const handleOpenAdd = () => {
    setEditingTx(null);
    setFormData({
      title: '',
      type: 'expense',
      amount: '',
      category: 'Makanan & Belanja',
      wallet: 'shopeepay',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setFormData({
      title: tx.title,
      type: tx.type,
      amount: tx.amount ? formatThousand(tx.amount) : '',
      category: tx.category,
      wallet: resolvePaymentMethod(tx).id,
      date: tx.date || new Date().toISOString().split('T')[0],
      notes: tx.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount) return;

    const amountNum = parseInt(String(formData.amount).replace(/\D/g, ''), 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Masukkan jumlah uang yang valid.');
      return;
    }

    if (editingTx) {
      setFinance(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => t.id === editingTx.id ? { ...t, ...formData, amount: amountNum } : t)
      }));
      playSound('click', soundEnabled);
    } else {
      const newTx = {
        id: `tx-${Date.now()}`,
        ...formData,
        amount: amountNum
      };
      setFinance(prev => ({
        ...prev,
        transactions: [newTx, ...prev.transactions]
      }));
      playSound('success', soundEnabled);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (await confirm('Hapus transaksi ini?')) {
      setFinance(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id)
      }));
      playSound('delete', soundEnabled);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
            <Wallet className="w-3.5 h-3.5" />
            <span>Manajemen Keuangan Pribadi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Finance & Cashflow Tracker
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Catat arus kas masuk, pengeluaran, dan pantau saldo bersihmu secara real-time.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Transaksi</span>
        </button>
      </div>

      {/* 🤖 ASISTEN AI KHUSUS FINANCE */}
      <AiAssistantCard
        mode="finance"
        setFinance={setFinance}
        setTodos={setTodos}
        setSchedule={setSchedule}
        setNotes={setNotes}
        setWellness={setWellness}
        soundEnabled={soundEnabled}
        contextSnapshot={{
          netBalance,
          totalIncome,
          totalExpense,
          txCount: finance.transactions.length,
        }}
      />

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Net Balance */}
        <div className="glass-panel p-5 rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Saldo Bersih</span>
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${netBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {formatRupiah(netBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Pemasukan dikurangi total pengeluaran
          </div>
        </div>

        {/* Total Income */}
        <div className="glass-panel p-5 rounded-3xl border border-emerald-500/20 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-400">Total Pemasukan</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
            +{formatRupiah(totalIncome)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Dari {finance.transactions.filter(t => t.type === 'income').length} transaksi
          </div>
        </div>

        {/* Total Expense */}
        <div className="glass-panel p-5 rounded-3xl border border-rose-500/20 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-400">Total Pengeluaran</span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono tracking-tight">
            -{formatRupiah(totalExpense)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Dari {finance.transactions.filter(t => t.type === 'expense').length} pengeluaran
          </div>
        </div>

      </div>

      {/* Main Content: Breakdown & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Category Breakdown */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            <span>Distribusi Pengeluaran</span>
          </h3>

          <div className="space-y-3">
            {expenseCategories.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">
                Belum ada pengeluaran yang tercatat.
              </div>
            ) : (
              expenseCategories.map(item => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium">{item.category}</span>
                    <span className="text-slate-400 font-mono">{formatRupiah(item.amount)} ({item.percent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Transactions History */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Type selector */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filterType === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filterType === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pemasukan
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filterType === 'expense' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pengeluaran
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                Tidak ada transaksi yang cocok.
              </div>
            ) : (
              filteredTransactions.map(tx => {
                const isIncome = tx.type === 'income';
                const paymentMethod = resolvePaymentMethod(tx);

                return (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-3 text-xs group hover:border-white/15 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <PaymentLogo id={paymentMethod.id} size="md" />

                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-100 truncate text-sm">
                          {tx.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400 mt-0.5">
                          <span className={`px-1.5 py-0.5 rounded border font-semibold whitespace-nowrap ${paymentMethod.badgeClass}`}>
                            {paymentMethod.shortLabel}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-white/5 whitespace-nowrap">{tx.category}</span>
                          <span>•</span>
                          <span className="whitespace-nowrap">{tx.date}</span>
                          {tx.notes && (
                            <>
                              <span>•</span>
                              <span className="truncate italic text-slate-400">{tx.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className={`font-mono text-sm sm:text-base font-bold whitespace-nowrap shrink-0 ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                      </div>

                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Add / Edit Transaction Modal */}
      <ModalPortal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="max-w-md">
        <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>{editingTx ? 'Edit Transaksi' : 'Catat Transaksi Baru'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, type: 'expense', category: 'Makanan & Belanja' }))}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    formData.type === 'expense' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pengeluaran (-)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, type: 'income', category: 'Gaji' }))}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    formData.type === 'income' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pemasukan (+)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deskripsi / Judul Transaksi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Belanja bulanan supermarket..."
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Jumlah Uang (Rupiah) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="Misal: 150.000"
                  value={formData.amount}
                  onChange={e => setFormData(p => ({ ...p, amount: formatThousand(e.target.value) }))}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono"
                />
              </div>

              {/* Pilihan E-Wallet / Bank */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  E-Wallet / Bank Pembayaran
                </label>
                <CustomSelect
                  value={formData.wallet}
                  onChange={e => setFormData(p => ({ ...p, wallet: e.target.value }))}
                  options={paymentSelectOptions}
                  className="w-full px-3 py-2 rounded-xl text-xs mb-2.5"
                />
                {/* Quick-Tap Grid Logo E-Wallet & Bank */}
                <div className="grid grid-cols-5 gap-1.5 p-2 rounded-2xl bg-slate-900/60 border border-white/10">
                  {PAYMENT_METHODS.slice(0, 10).map(method => {
                    const active = formData.wallet === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, wallet: method.id }))}
                        className={`flex flex-col items-center justify-center gap-1 p-1.5 rounded-xl border transition-all active:scale-95 ${
                          active
                            ? 'bg-indigo-500/20 border-indigo-400 shadow-md shadow-indigo-500/20 scale-[1.03]'
                            : 'bg-white/[0.03] border-transparent hover:bg-white/10 opacity-75 hover:opacity-100'
                        }`}
                        title={method.name}
                      >
                        <PaymentLogo id={method.id} size="sm" />
                        <span className={`text-[9px] font-bold truncate max-w-full ${active ? 'text-white' : 'text-slate-400'}`}>
                          {method.shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kategori
                  </label>
                  <CustomSelect
                    value={formData.category}
                    onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs"
                  >
                    {finance.categories[formData.type].map(cat => (
                      <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                    ))}
                  </CustomSelect>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tanggal Transaksi
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Dibayar pakai e-wallet..."
                  value={formData.notes}
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
        </div>
      </ModalPortal>
    </div>
  );
}
