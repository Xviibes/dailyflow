import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Flame, 
  Sparkles, 
  Clock,
  X 
} from 'lucide-react';
import { playSound } from '../../utils/audio';
import { fireConfetti, fireSuperConfetti } from '../../utils/confetti';
import { useConfirm } from '../Modals/ConfirmDialog';
import { ModalPortal } from '../UI/ModalPortal';

export function RoutinesView({ routines, setRoutines, soundEnabled }) {
  const [activeModalType, setActiveModalType] = useState(null); // 'morning' | 'night' | null
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    targetTime: '06:00',
    icon: '✨'
  });

  const confirm = useConfirm();

  const morningTotal = routines.morning.length;
  const morningDone = routines.morning.filter(i => i.completed).length;
  const morningPercent = morningTotal > 0 ? Math.round((morningDone / morningTotal) * 100) : 0;

  const nightTotal = routines.night.length;
  const nightDone = routines.night.filter(i => i.completed).length;
  const nightPercent = nightTotal > 0 ? Math.round((nightDone / nightTotal) * 100) : 0;

  const handleToggle = (type, id) => {
    setRoutines(prev => {
      const items = prev[type].map(item => {
        if (item.id === id) {
          const nextCompleted = !item.completed;
          if (nextCompleted) {
            playSound('check', soundEnabled);
          }
          return { ...item, completed: nextCompleted };
        }
        return item;
      });

      // Check if all completed in this routine
      const allDone = items.length > 0 && items.every(i => i.completed);
      if (allDone) {
        playSound('fanfare', soundEnabled);
        fireSuperConfetti();
      }

      return {
        ...prev,
        [type]: items
      };
    });
  };

  const handleOpenAdd = (type) => {
    setActiveModalType(type);
    setEditingItem(null);
    setFormData({
      title: '',
      targetTime: type === 'morning' ? '06:30' : '21:30',
      icon: type === 'morning' ? '☀️' : '🌙'
    });
  };

  const handleOpenEdit = (type, item) => {
    setActiveModalType(type);
    setEditingItem(item);
    setFormData({
      title: item.title,
      targetTime: item.targetTime || '07:00',
      icon: item.icon || '✨'
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !activeModalType) return;

    setRoutines(prev => {
      const list = prev[activeModalType];
      if (editingItem) {
        return {
          ...prev,
          [activeModalType]: list.map(item => item.id === editingItem.id ? { ...item, ...formData } : item)
        };
      } else {
        const newItem = {
          id: `${activeModalType === 'morning' ? 'mr' : 'nr'}-${Date.now()}`,
          ...formData,
          completed: false
        };
        return {
          ...prev,
          [activeModalType]: [...list, newItem]
        };
      }
    });

    playSound('success', soundEnabled);
    setActiveModalType(null);
  };

  const handleDelete = async (type, id) => {
    if (await confirm('Hapus rutinitas ini?')) {
      setRoutines(prev => ({
        ...prev,
        [type]: prev[type].filter(i => i.id !== id)
      }));
      playSound('delete', soundEnabled);
    }
  };

  const handleResetDay = async (type) => {
    if (await confirm(`Reset checklist ${type === 'morning' ? 'pagi' : 'malam'} untuk hari ini?`, { tone: 'warning', confirmLabel: 'Reset' })) {
      setRoutines(prev => ({
        ...prev,
        [type]: prev[type].map(i => ({ ...i, completed: false }))
      }));
      playSound('click', soundEnabled);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ritual & Kebiasaan Disiplin</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Morning & Night Routine
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Awali hari dengan energi positif, akhiri malam dengan ketenangan batin.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-bounce" />
              <div>
                <div className="text-xs font-bold">{routines.streaks.morning} Hari Streak Pagi</div>
                <div className="text-[10px] text-amber-400/80">{routines.streaks.night} Hari Streak Malam</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Routine Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 🌅 MORNING ROUTINE */}
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-lg shadow-amber-500/20">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Sun className="w-6 h-6 text-amber-400 animate-spin-slow" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">
                    Rutinitas Pagi 🌅
                  </h3>
                  <div className="text-xs text-amber-400 font-medium">
                    {morningDone}/{morningTotal} Kebiasaan ({morningPercent}%)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleResetDay('morning')}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Reset status hari ini"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenAdd('morning')}
                  className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all shadow-md"
                  title="Tambah Kebiasaan Pagi"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full mb-5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 rounded-full"
                style={{ width: `${morningPercent}%` }}
              />
            </div>

            {/* Checklist */}
            <div className="space-y-2.5">
              {routines.morning.map((item) => (
                <div
                  key={item.id}
                  className={`
                    p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-3 group transition-all
                    ${item.completed ? 'opacity-65 bg-slate-900/30' : 'hover:border-amber-500/30'}
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => handleToggle('morning', item.id)}
                      className="shrink-0 text-slate-400 hover:text-amber-400"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <span className="text-lg shrink-0">{item.icon}</span>

                    <div className="min-w-0 flex-1">
                      <span className={`text-sm font-semibold text-slate-100 block truncate ${
                        item.completed ? 'line-through text-slate-400 font-normal' : ''
                      }`}>
                        {item.title}
                      </span>
                      {item.targetTime && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-amber-400" /> {item.targetTime} WIB
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit('morning', item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete('morning', item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 🌙 NIGHT ROUTINE */}
        <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Moon className="w-6 h-6 text-indigo-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">
                    Rutinitas Malam 🌙
                  </h3>
                  <div className="text-xs text-indigo-400 font-medium">
                    {nightDone}/{nightTotal} Kebiasaan ({nightPercent}%)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleResetDay('night')}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Reset status hari ini"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenAdd('night')}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md"
                  title="Tambah Kebiasaan Malam"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full mb-5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 rounded-full"
                style={{ width: `${nightPercent}%` }}
              />
            </div>

            {/* Checklist */}
            <div className="space-y-2.5">
              {routines.night.map((item) => (
                <div
                  key={item.id}
                  className={`
                    p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-3 group transition-all
                    ${item.completed ? 'opacity-65 bg-slate-900/30' : 'hover:border-indigo-500/30'}
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => handleToggle('night', item.id)}
                      className="shrink-0 text-slate-400 hover:text-indigo-400"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <span className="text-lg shrink-0">{item.icon}</span>

                    <div className="min-w-0 flex-1">
                      <span className={`text-sm font-semibold text-slate-100 block truncate ${
                        item.completed ? 'line-through text-slate-400 font-normal' : ''
                      }`}>
                        {item.title}
                      </span>
                      {item.targetTime && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-indigo-400" /> {item.targetTime} WIB
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit('night', item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete('night', item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Add / Edit Routine Modal */}
      <ModalPortal isOpen={Boolean(activeModalType)} onClose={() => setActiveModalType(null)} maxWidth="max-w-md">
        <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{activeModalType === 'morning' ? '☀️' : '🌙'}</span>
                <span>{editingItem ? 'Edit Rutinitas' : 'Tambah Kebiasaan Baru'}</span>
              </h3>
              <button onClick={() => setActiveModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Kebiasaan / Ritual *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Meditasi nafas dalam 10 menit..."
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Jam (WIB)
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.targetTime}
                    onChange={e => setFormData(p => ({ ...p, targetTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl glass-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Emoji Ikon
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl glass-input text-sm text-center"
                    placeholder="✨, 💧, 📖"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveModalType(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Simpan Kebiasaan
                </button>
              </div>
            </form>
        </div>
      </ModalPortal>
    </div>
  );
}
