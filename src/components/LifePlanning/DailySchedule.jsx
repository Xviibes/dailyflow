import React, { useState } from 'react';
import { 
  Plus, 
  Clock, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Tag, 
  X,
  Sparkles,
  MapPin,
  Calendar
} from 'lucide-react';
import { playSound } from '../../utils/audio';
import { useConfirm } from '../Modals/ConfirmDialog';
import { CustomSelect } from '../UI/CustomSelect';
import { ModalPortal } from '../UI/ModalPortal';

const COLOR_MAP = {
  indigo: 'border-l-indigo-500 bg-indigo-500/10 text-indigo-300',
  emerald: 'border-l-emerald-500 bg-emerald-500/10 text-emerald-300',
  amber: 'border-l-amber-500 bg-amber-500/10 text-amber-300',
  rose: 'border-l-rose-500 bg-rose-500/10 text-rose-300',
  purple: 'border-l-purple-500 bg-purple-500/10 text-purple-300',
  cyan: 'border-l-cyan-500 bg-cyan-500/10 text-cyan-300',
};

export function DailySchedule({ schedule, setSchedule, soundEnabled, currentHourWib }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    startTime: '08:00',
    endTime: '09:00',
    title: '',
    category: 'Kerja',
    color: 'indigo',
    notes: '',
    status: 'Pending'
  });

  const confirm = useConfirm();

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      startTime: '08:00',
      endTime: '09:00',
      title: '',
      category: 'Kerja',
      color: 'indigo',
      notes: '',
      status: 'Pending'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      startTime: item.startTime,
      endTime: item.endTime,
      title: item.title,
      category: item.category || 'Kerja',
      color: item.color || 'indigo',
      notes: item.notes || '',
      status: item.status || 'Pending'
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingItem) {
      setSchedule(prev => prev.map(s => s.id === editingItem.id ? { ...s, ...formData } : s));
      playSound('click', soundEnabled);
    } else {
      const newItem = {
        id: `ds-${Date.now()}`,
        ...formData
      };
      // Sort schedule by startTime
      setSchedule(prev => [...prev, newItem].sort((a, b) => a.startTime.localeCompare(b.startTime)));
      playSound('success', soundEnabled);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (await confirm('Hapus jadwal ini?')) {
      setSchedule(prev => prev.filter(s => s.id !== id));
      playSound('delete', soundEnabled);
    }
  };

  const handleToggleStatus = (id) => {
    setSchedule(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === 'Done' ? 'Pending' : 'Done';
        if (nextStatus === 'Done') playSound('check', soundEnabled);
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  // Helper to check if an event is happening now
  const isNowActive = (startTime, endTime) => {
    if (!currentHourWib) return false;
    const nowTimeStr = currentHourWib; // e.g. "15:20"
    return nowTimeStr >= startTime && nowTimeStr <= endTime;
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>Time-Blocking & Jadwal Harian</span>
          </h3>
          <p className="text-xs text-slate-400">
            Atur alur aktivitas harianmu berdasarkan slot waktu agar tetap fokus dan terstruktur.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 shrink-0 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Blok Waktu</span>
        </button>
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-500/20 space-y-4 my-4">
        {schedule.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 text-xs">
            Belum ada jadwal harian. Klik "+ Tambah Blok Waktu" untuk memulai.
          </div>
        ) : (
          schedule.map((item) => {
            const isActive = isNowActive(item.startTime, item.endTime);
            const isDone = item.status === 'Done';

            return (
              <div key={item.id} className="relative group">
                {/* Timeline Dot Indicator */}
                <div className={`
                  absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full border-2 
                  transition-all duration-300 flex items-center justify-center
                  ${isActive 
                    ? 'bg-emerald-400 border-white ring-4 ring-emerald-500/30 animate-pulse' 
                    : isDone
                      ? 'bg-slate-700 border-emerald-500'
                      : 'bg-slate-900 border-indigo-400'}
                `}>
                  {isDone && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </div>

                {/* Card */}
                <div className={`
                  glass-card p-4 sm:p-5 rounded-2xl border-l-4 transition-all
                  ${COLOR_MAP[item.color] || COLOR_MAP.indigo}
                  ${isActive ? 'ring-2 ring-emerald-400/40 shadow-xl shadow-emerald-950/40' : ''}
                  ${isDone ? 'opacity-65' : ''}
                `}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    
                    {/* Time & Title */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-black/40 text-white tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          {item.startTime} - {item.endTime} WIB
                        </span>

                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                            Sedang Berlangsung
                          </span>
                        )}

                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                          {item.category}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isDone ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <h4 className={`text-base font-bold text-white ${isDone ? 'line-through text-slate-400' : ''}`}>
                        {item.title}
                      </h4>

                      {item.notes && (
                        <p className="text-xs text-slate-300 font-normal leading-relaxed pt-0.5">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 sm:self-center">
                      <button
                        onClick={() => handleToggleStatus(item.id)}
                        className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                          isDone 
                            ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' 
                            : 'bg-white/10 hover:bg-white/20 text-slate-200'
                        }`}
                        title={isDone ? 'Tandai belum selesai' : 'Tandai selesai'}
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-[11px]">{isDone ? 'Selesai' : 'Check'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                        title="Edit Jadwal"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400"
                        title="Hapus Jadwal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add / Edit */}
      <ModalPortal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="max-w-lg">
        <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <span>{editingItem ? 'Edit Jadwal Harian' : 'Tambah Jadwal Baru'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Aktivitas *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Focus Deep Work Session..."
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mulai (WIB)</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={e => setFormData(p => ({ ...p, startTime: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl glass-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Selesai (WIB)</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={e => setFormData(p => ({ ...p, endTime: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori</label>
                  <CustomSelect
                    value={formData.category}
                    onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl text-sm"
                  >
                    <option value="Kerja" className="bg-slate-900">Kerja</option>
                    <option value="Kesehatan" className="bg-slate-900">Kesehatan</option>
                    <option value="Pribadi" className="bg-slate-900">Pribadi</option>
                    <option value="Belajar" className="bg-slate-900">Belajar</option>
                    <option value="Sosial" className="bg-slate-900">Sosial</option>
                  </CustomSelect>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Aksen Warna</label>
                  <CustomSelect
                    value={formData.color}
                    onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl text-sm"
                  >
                    <option value="indigo" className="bg-slate-900">Indigo (Ungu Muda)</option>
                    <option value="emerald" className="bg-slate-900">Emerald (Hijau Segar)</option>
                    <option value="amber" className="bg-slate-900">Amber (Kuning Emas)</option>
                    <option value="rose" className="bg-slate-900">Rose (Merah Muda)</option>
                    <option value="cyan" className="bg-slate-900">Cyan (Biru Muda)</option>
                  </CustomSelect>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan Tambahan</label>
                <textarea
                  rows="2"
                  placeholder="Catatan kecil, lokasi, atau fokus..."
                  value={formData.notes}
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl glass-input text-sm"
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
        </div>
      </ModalPortal>
    </div>
  );
}
