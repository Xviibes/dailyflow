import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  Clock, 
  Calendar, 
  AlertCircle,
  Tag,
  CheckCheck,
  X,
  Sparkles
} from 'lucide-react';
import { playSound } from '../../utils/audio';
import { fireConfetti } from '../../utils/confetti';
import { useConfirm } from '../Modals/ConfirmDialog';
import { CustomSelect } from '../UI/CustomSelect';
import { ModalPortal } from '../UI/ModalPortal';

const CATEGORIES = ['Semua', 'Kerja', 'Belajar', 'Pribadi', 'Kesehatan', 'Belanja', 'Finansial'];
const PRIORITIES = ['Semua', 'Tinggi', 'Sedang', 'Rendah'];

export function TodoView({ todos, setTodos, soundEnabled = true }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all', 'active', 'completed'
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedPriority, setSelectedPriority] = useState('Semua');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'Kerja',
    priority: 'Sedang',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '12:00',
  });

  const confirm = useConfirm();

  // Calculate stats
  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered todos
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      // Search
      if (searchQuery.trim() && !todo.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Status
      if (selectedStatus === 'active' && todo.completed) return false;
      if (selectedStatus === 'completed' && !todo.completed) return false;
      // Category
      if (selectedCategory !== 'Semua' && todo.category !== selectedCategory) return false;
      // Priority
      if (selectedPriority !== 'Semua' && todo.priority !== selectedPriority) return false;
      return true;
    });
  }, [todos, searchQuery, selectedStatus, selectedCategory, selectedPriority]);

  const handleToggleTodo = (id) => {
    setTodos(prev => {
      const next = prev.map(t => {
        if (t.id === id) {
          const willBeCompleted = !t.completed;
          if (willBeCompleted) {
            playSound('check', soundEnabled);
            fireConfetti('#6366f1');
          }
          return { ...t, completed: willBeCompleted };
        }
        return t;
      });
      return next;
    });
  };

  const handleOpenAddModal = () => {
    setEditingTodo(null);
    setFormData({
      title: '',
      category: 'Kerja',
      priority: 'Sedang',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '12:00',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      category: todo.category || 'Kerja',
      priority: todo.priority || 'Sedang',
      dueDate: todo.dueDate || new Date().toISOString().split('T')[0],
      dueTime: todo.dueTime || '12:00',
    });
    setIsModalOpen(true);
  };

  const handleSaveTodo = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingTodo) {
      setTodos(prev => prev.map(t => t.id === editingTodo.id ? { ...t, ...formData } : t));
      playSound('click', soundEnabled);
    } else {
      const newTodo = {
        id: `td-${Date.now()}`,
        ...formData,
        completed: false,
        createdAt: Date.now(),
      };
      setTodos(prev => [newTodo, ...prev]);
      playSound('success', soundEnabled);
      fireConfetti('#10b981');
    }

    setIsModalOpen(false);
  };

  const handleDeleteTodo = async (id) => {
    if (await confirm('Yakin ingin menghapus tugas ini?')) {
      setTodos(prev => prev.filter(t => t.id !== id));
      playSound('delete', soundEnabled);
    }
  };

  const handleClearCompleted = async () => {
    if (await confirm('Hapus semua tugas yang sudah selesai?')) {
      setTodos(prev => prev.filter(t => !t.completed));
      playSound('delete', soundEnabled);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Tinggi':
        return 'bg-gradient-to-r from-rose-500/25 to-pink-500/20 text-rose-300 border-rose-400/40';
      case 'Sedang':
        return 'bg-gradient-to-r from-amber-500/25 to-orange-500/20 text-amber-300 border-amber-400/40';
      case 'Rendah':
        return 'bg-gradient-to-r from-emerald-500/25 to-teal-500/20 text-emerald-300 border-emerald-400/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats Card */}
      <div className="glass-panel bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-indigo-950/90 border border-white/15 shadow-inner p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/15 rounded-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/25 via-purple-500/25 to-cyan-500/20 border border-indigo-400/40 text-indigo-200 text-xs font-bold shadow-inner mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>To-Do List Harian Produktif</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Daftar Tugas Hari Ini
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Catat, atur prioritas, dan raih kepuasan menyelesaikan setiap target harianmu.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-indigo-950/90 p-4 rounded-2xl border border-white/15 shadow-inner shrink-0">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" className="text-slate-700" fill="transparent" />
                <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" 
                  strokeDasharray={138} 
                  strokeDashoffset={138 - (138 * progressPercent) / 100} 
                  className="text-indigo-400 transition-all duration-700 ease-out" 
                  fill="transparent" 
                />
              </svg>
              <span className="absolute text-xs font-bold text-white">{progressPercent}%</span>
            </div>
            <div>
              <div className="text-xs text-slate-300 font-medium">Pencapaian Hari Ini</div>
              <div className="text-lg font-bold text-white">
                {completedCount} <span className="text-sm font-normal text-slate-300">dari {totalCount} Selesai</span>
              </div>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="ml-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:opacity-95 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tugas</span>
            </button>
          </div>
        </div>

        {/* Progress bar line */}
        <div className="w-full h-2.5 bg-slate-950/80 border border-white/10 rounded-full mt-6 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStatus === 'all' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              onClick={() => setSelectedStatus('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStatus === 'active' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Belum ({totalCount - completedCount})
            </button>
            <button
              onClick={() => setSelectedStatus('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStatus === 'completed' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Selesai ({completedCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tugas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs sm:text-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Priority & Category Dropdowns */}
          <div className="flex items-center gap-2">
            <CustomSelect
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs text-slate-300 cursor-pointer min-w-[155px]"
            >
              <option value="Semua" className="bg-slate-900">Prioritas: Semua</option>
              <option value="Tinggi" className="bg-slate-900">Prioritas: Tinggi</option>
              <option value="Sedang" className="bg-slate-900">Prioritas: Sedang</option>
              <option value="Rendah" className="bg-slate-900">Prioritas: Rendah</option>
            </CustomSelect>

            {completedCount > 0 && (
              <button
                onClick={handleClearCompleted}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-all"
                title="Hapus tugas selesai"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bersihkan Selesai</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Kategori:
          </span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Task List Items */}
      <div className="space-y-2.5">
        {filteredTodos.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
              <CheckCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Tidak Ada Tugas yang Sesuai</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'Semua' || selectedPriority !== 'Semua'
                ? 'Coba sesuaikan kata kunci pencarian atau filter yang dipilih.'
                : 'Semua target terselesaikan atau kamu belum menambahkan tugas baru hari ini.'}
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tugas Baru</span>
            </button>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            return (
              <div
                key={todo.id}
                className={`
                  glass-card p-4 rounded-2xl flex items-center justify-between gap-4 transition-all
                  ${todo.completed ? 'opacity-65 bg-slate-900/40' : ''}
                `}
              >
                {/* Left: Checkbox & Title */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggleTodo(todo.id)}
                    className="shrink-0 text-slate-400 hover:text-indigo-400 transition-colors focus:outline-none"
                    title={todo.completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-6 h-6 hover:scale-110 transition-transform" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm sm:text-base font-semibold text-slate-100 truncate ${
                      todo.completed ? 'line-through text-slate-400 font-normal' : ''
                    }`}>
                      {todo.title}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                      {/* Priority Badge */}
                      <span className={`px-2 py-0.5 rounded-md border font-semibold ${getPriorityBadge(todo.priority)}`}>
                        {todo.priority}
                      </span>

                      {/* Category Tag */}
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300">
                        📁 {todo.category}
                      </span>

                      {/* Due Time */}
                      {todo.dueTime && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          <span>{todo.dueTime}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEditModal(todo)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                    title="Edit Tugas"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors"
                    title="Hapus Tugas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Task Modal */}
      <ModalPortal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="max-w-lg">
        <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span>{editingTodo ? 'Edit Tugas Harian' : 'Tambah Tugas Baru'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTodo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Judul Tugas / Aktivitas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Selesaikan laporan Q3 & presentasi..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kategori
                  </label>
                  <CustomSelect
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm cursor-pointer"
                  >
                    {CATEGORIES.filter(c => c !== 'Semua').map(cat => (
                      <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                    ))}
                  </CustomSelect>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tingkat Prioritas
                  </label>
                  <CustomSelect
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm cursor-pointer"
                  >
                    <option value="Tinggi" className="bg-slate-900">🔴 Tinggi (High Priority)</option>
                    <option value="Sedang" className="bg-slate-900">🟡 Sedang (Medium)</option>
                    <option value="Rendah" className="bg-slate-900">🟢 Rendah (Low)</option>
                  </CustomSelect>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Tanggal
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Jam (WIB)
                  </label>
                  <input
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueTime: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all"
                >
                  {editingTodo ? 'Simpan Perubahan' : 'Tambahkan ke Daftar'}
                </button>
              </div>
            </form>
        </div>
      </ModalPortal>
    </div>
  );
}
