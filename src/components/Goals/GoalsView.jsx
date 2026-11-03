import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  Calendar, 
  Trophy, 
  Sparkles,
  ChevronRight,
  X 
} from 'lucide-react';
import { playSound } from '../../utils/audio';
import { fireConfetti, fireSuperConfetti } from '../../utils/confetti';
import { useConfirm } from '../Modals/ConfirmDialog';
import { CustomSelect } from '../UI/CustomSelect';
import { ModalPortal } from '../UI/ModalPortal';

const GOAL_TABS = [
  { id: 'today', label: 'Hari Ini', icon: '🎯', desc: 'Target 24 Jam' },
  { id: 'week', label: 'Minggu Ini', icon: '📅', desc: 'Target 7 Hari' },
  { id: 'month', label: 'Bulan Ini', icon: '🗓️', desc: 'Target 30 Hari' },
  { id: 'year', label: 'Tahun Ini', icon: '🚀', desc: 'Target Tahunan' },
  { id: 'life', label: 'Tujuan Hidup', icon: '🌟', desc: 'Life Goals & Bucket List' },
];

export function GoalsView({ goals, setGoals, soundEnabled }) {
  const [activeTab, setActiveTab] = useState('today');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'today',
    targetDate: '',
    progress: 0,
    milestones: []
  });

  const confirm = useConfirm();

  const [milestoneInput, setMilestoneInput] = useState('');

  const filteredGoals = goals.filter(g => g.category === activeTab);

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setFormData({
      title: '',
      category: activeTab,
      targetDate: '',
      progress: 0,
      milestones: []
    });
    setMilestoneInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      category: goal.category,
      targetDate: goal.targetDate || '',
      progress: goal.progress || 0,
      milestones: goal.milestones || []
    });
    setMilestoneInput('');
    setIsModalOpen(true);
  };

  const handleAddMilestone = () => {
    if (!milestoneInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { text: milestoneInput.trim(), done: false }]
    }));
    setMilestoneInput('');
  };

  const handleRemoveMilestone = (idx) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== idx)
    }));
  };

  const handleSaveGoal = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingGoal) {
      setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, ...formData } : g));
      playSound('click', soundEnabled);
    } else {
      const newGoal = {
        id: `goal-${Date.now()}`,
        ...formData,
      };
      setGoals(prev => [newGoal, ...prev]);
      playSound('success', soundEnabled);
      fireConfetti('#6366f1');
    }

    setIsModalOpen(false);
  };

  const handleDeleteGoal = async (id) => {
    if (await confirm('Hapus tujuan ini?')) {
      setGoals(prev => prev.filter(g => g.id !== id));
      playSound('delete', soundEnabled);
    }
  };

  const handleToggleMilestone = (goalId, milestoneIdx) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const nextMilestones = goal.milestones.map((m, idx) => {
          if (idx === milestoneIdx) {
            return { ...m, done: !m.done };
          }
          return m;
        });

        // Recalculate progress based on milestones
        const total = nextMilestones.length;
        const done = nextMilestones.filter(m => m.done).length;
        const newProgress = total > 0 ? Math.round((done / total) * 100) : goal.progress;

        if (newProgress === 100) {
          playSound('fanfare', soundEnabled);
          fireSuperConfetti();
        } else {
          playSound('check', soundEnabled);
        }

        return {
          ...goal,
          milestones: nextMilestones,
          progress: newProgress
        };
      }
      return goal;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>Sistem Sasaran & Pencapaian</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Quick Goals
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Petakan impianmu mulai dari target hari ini hingga tujuan hidup jangka panjang.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Sasaran</span>
        </button>
      </div>

      {/* Goal Category Tabs */}
      <div className="glass-panel p-2 rounded-2xl flex items-center gap-2 overflow-x-auto">
        {GOAL_TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const count = goals.filter(g => g.category === tab.id).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0
                ${isActive 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
            >
              <span className="text-base">{tab.icon}</span>
              <div className="text-left">
                <div>{tab.label}</div>
                <div className="text-[10px] font-normal opacity-80">{tab.desc} ({count})</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Goal Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredGoals.length === 0 ? (
          <div className="col-span-full glass-panel p-12 rounded-3xl text-center space-y-3">
            <Target className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Belum Ada Target di Kategori Ini</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Mulai tetapkan target untuk kategori "{GOAL_TABS.find(t => t.id === activeTab)?.label}".
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              + Tetapkan Sasaran
            </button>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const isFinished = goal.progress >= 100;

            return (
              <div
                key={goal.id}
                className={`
                  glass-panel p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4
                  ${isFinished ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-white/10'}
                `}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-white/10 uppercase font-semibold text-slate-300">
                          {GOAL_TABS.find(t => t.id === goal.category)?.label}
                        </span>
                        {goal.targetDate && (
                          <span className="flex items-center gap-1 text-indigo-300">
                            <Calendar className="w-3 h-3" />
                            {goal.targetDate}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-white font-display">
                        {goal.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div className="space-y-1.5 mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Progres Pencapaian</span>
                      <span className={`font-bold ${isFinished ? 'text-emerald-400' : 'text-indigo-400'}`}>
                        {goal.progress}% {isFinished && '🎉 Tuntas!'}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFinished 
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-400' 
                            : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones Checklist */}
                  {goal.milestones && goal.milestones.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Tonggak Milestone ({goal.milestones.filter(m => m.done).length}/{goal.milestones.length})
                      </div>
                      <div className="space-y-1.5">
                        {goal.milestones.map((m, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleToggleMilestone(goal.id, idx)}
                            className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-white/5 flex items-center gap-2.5 cursor-pointer text-xs transition-colors"
                          >
                            {m.done ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className={`text-slate-200 ${m.done ? 'line-through text-slate-500' : ''}`}>
                              {m.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Goal Modal */}
      <ModalPortal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="max-w-lg">
        <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>{editingGoal ? 'Edit Sasaran' : 'Buat Sasaran Baru'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Sasaran / Impian *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Membaca 12 buku dan rutin olahraga..."
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jangka Waktu
                  </label>
                  <CustomSelect
                    value={formData.category}
                    onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs"
                  >
                    {GOAL_TABS.map(tab => (
                      <option key={tab.id} value={tab.id} className="bg-slate-900">
                        {tab.icon} {tab.label}
                      </option>
                    ))}
                  </CustomSelect>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Tanggal / Waktu
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: 31 Des 2026 atau Akhir Bulan"
                    value={formData.targetDate}
                    onChange={e => setFormData(p => ({ ...p, targetDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Progres Manual ({formData.progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={e => setFormData(p => ({ ...p, progress: parseInt(e.target.value, 10) }))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Milestones Builder */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tambah Tonggak Pencapaian (Milestones)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Contoh: Beli buku, Selesaikan bab 1-5..."
                    value={milestoneInput}
                    onChange={e => setMilestoneInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMilestone();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl glass-input text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                  >
                    + Tambah
                  </button>
                </div>

                {formData.milestones.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {formData.milestones.map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 text-xs text-slate-200">
                        <span>• {m.text}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(i)}
                          className="text-slate-400 hover:text-rose-400 text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Simpan Sasaran
                </button>
              </div>
            </form>
        </div>
      </ModalPortal>
    </div>
  );
}
