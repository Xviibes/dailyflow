import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Edit3, 
  Tag, 
  Sparkles, 
  StickyNote, 
  X 
} from 'lucide-react';
import { playSound } from '../../utils/audio';
import { useConfirm } from '../Modals/ConfirmDialog';
import { CustomSelect } from '../UI/CustomSelect';
import { ModalPortal } from '../UI/ModalPortal';
import { AiAssistantCard } from '../AI/AiAssistantCard';

const NOTE_COLORS = [
  { id: 'amber', name: 'Kuning Hangat', bg: 'bg-amber-950/90 border-amber-500/30 text-amber-200', dot: 'bg-amber-400' },
  { id: 'emerald', name: 'Mint Segar', bg: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200', dot: 'bg-emerald-400' },
  { id: 'indigo', name: 'Lavender Elegan', bg: 'bg-indigo-950/90 border-indigo-500/30 text-indigo-200', dot: 'bg-indigo-400' },
  { id: 'rose', name: 'Soft Rose', bg: 'bg-rose-950/90 border-rose-500/30 text-rose-200', dot: 'bg-rose-400' },
  { id: 'cyan', name: 'Sky Breeze', bg: 'bg-cyan-950/90 border-cyan-500/30 text-cyan-200', dot: 'bg-cyan-400' },
  { id: 'purple', name: 'Violet Dream', bg: 'bg-purple-950/90 border-purple-500/30 text-purple-200', dot: 'bg-purple-400' },
];

const NOTE_CATEGORIES = ['Semua', 'Ide', 'Resep', 'Buku', 'Pribadi', 'Kerja', 'Kutipan'];

export function NotesView({
  notes,
  setNotes,
  setTodos,
  setSchedule,
  setFinance,
  setWellness,
  soundEnabled,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Ide',
    color: 'amber',
    pinned: false
  });

  const confirm = useConfirm();

  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = note.title.toLowerCase().includes(q);
          const matchContent = note.content.toLowerCase().includes(q);
          if (!matchTitle && !matchContent) return false;
        }
        if (selectedCategory !== 'Semua' && note.category !== selectedCategory) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Pinned notes come first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
  }, [notes, searchQuery, selectedCategory]);

  const handleOpenAdd = () => {
    setEditingNote(null);
    setFormData({
      title: '',
      content: '',
      category: 'Ide',
      color: 'amber',
      pinned: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      category: note.category || 'Ide',
      color: note.color || 'amber',
      pinned: !!note.pinned
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    if (editingNote) {
      setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...n, ...formData, updatedAt: Date.now() } : n));
      playSound('click', soundEnabled);
    } else {
      const newNote = {
        id: `note-${Date.now()}`,
        ...formData,
        updatedAt: Date.now()
      };
      setNotes(prev => [newNote, ...prev]);
      playSound('success', soundEnabled);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (await confirm('Hapus catatan ini?')) {
      setNotes(prev => prev.filter(n => n.id !== id));
      playSound('delete', soundEnabled);
    }
  };

  const handleTogglePin = (id) => {
    setNotes(prev => prev.map(n => {
      if (n.id === id) {
        const nextPin = !n.pinned;
        playSound('click', soundEnabled);
        return { ...n, pinned: nextPin };
      }
      return n;
    }));
  };

  const getColorConfig = (colorId) => {
    return NOTE_COLORS.find(c => c.id === colorId) || NOTE_COLORS[0];
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pojok Catatan & Inspirasi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Aesthetic Notes & Memo
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Simpan ide cemerlang, rangkuman penting, dan inspirasi kapan saja.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Catatan Baru</span>
        </button>
      </div>

      {/* 🤖 ASISTEN AI KHUSUS NOTES & MEMO */}
      <AiAssistantCard
        mode="notes"
        setNotes={setNotes}
        setTodos={setTodos}
        setSchedule={setSchedule}
        setFinance={setFinance}
        setWellness={setWellness}
        soundEnabled={soundEnabled}
        contextSnapshot={{
          totalNotes: notes.length,
        }}
      />

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari dalam catatan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs sm:text-sm"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {NOTE_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full glass-panel p-12 rounded-3xl text-center space-y-3">
            <StickyNote className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Belum Ada Catatan</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Tulis ide spontan atau catatan pentingmu sekarang juga!
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              + Buat Catatan
            </button>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const colorCfg = getColorConfig(note.color);

            return (
              <div
                key={note.id}
                className={`
                  p-5 rounded-3xl border transition-all flex flex-col justify-between group
                  ${colorCfg.bg} shadow-xl hover:-translate-y-1
                `}
              >
                <div>
                  {/* Top Bar of Note */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-white uppercase tracking-wider">
                      {note.category}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePin(note.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          note.pinned 
                            ? 'text-amber-400 bg-amber-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                        title={note.pinned ? 'Lepas Pin' : 'Pin ke Atas'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(note)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Body */}
                  <h4 className="text-base font-bold text-white font-display mb-2">
                    {note.title}
                  </h4>
                  <p className="text-xs text-slate-200/90 whitespace-pre-line leading-relaxed font-normal">
                    {note.content}
                  </p>
                </div>

                {/* Footer of note */}
                <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${colorCfg.dot}`} />
                    <span>{colorCfg.name}</span>
                  </div>
                  <span>
                    {new Date(note.updatedAt || Date.now()).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Note Modal */}
      <ModalPortal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="max-w-lg">
        <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-400" />
                <span>{editingNote ? 'Edit Catatan' : 'Buat Catatan Baru'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Judul Catatan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Rangkuman Buku Atomic Habits..."
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  autoFocus
                />
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
                    {NOTE_CATEGORIES.filter(c => c !== 'Semua').map(cat => (
                      <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                    ))}
                  </CustomSelect>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Warna Tema Catatan
                  </label>
                  <CustomSelect
                    value={formData.color}
                    onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs"
                  >
                    {NOTE_COLORS.map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                    ))}
                  </CustomSelect>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Isi Catatan *
                </label>
                <textarea
                  rows="6"
                  required
                  placeholder="Tulis ide, poin penting, daftar bahan, atau kutipan di sini..."
                  value={formData.content}
                  onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinNote"
                  checked={formData.pinned}
                  onChange={e => setFormData(p => ({ ...p, pinned: e.target.checked }))}
                  className="rounded text-amber-500 cursor-pointer"
                />
                <label htmlFor="pinNote" className="text-xs text-slate-300 cursor-pointer flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sematkan catatan ini di bagian atas (Pin to Top)</span>
                </label>
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
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-lg"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
        </div>
      </ModalPortal>
    </div>
  );
}
