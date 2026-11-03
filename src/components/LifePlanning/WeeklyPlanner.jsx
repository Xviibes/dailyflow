import React, { useState } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Calendar, 
  ChevronRight, 
  Sparkles,
  X
} from 'lucide-react';
import { playSound } from '../../utils/audio';
import { CustomSelect } from '../UI/CustomSelect';
import { ModalPortal } from '../UI/ModalPortal';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export function WeeklyPlanner({ weeklyData, setWeeklyData, soundEnabled }) {
  const [activeDayModal, setActiveDayModal] = useState(null); // day name when modal open
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('Kerja');
  const [taskPriority, setTaskPriority] = useState('Sedang');

  const handleOpenAddModal = (day) => {
    setActiveDayModal(day);
    setTaskTitle('');
    setTaskCategory('Kerja');
    setTaskPriority('Sedang');
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !activeDayModal) return;

    const newTask = {
      id: `wp-${Date.now()}`,
      title: taskTitle.trim(),
      category: taskCategory,
      priority: taskPriority,
      done: false
    };

    setWeeklyData(prev => ({
      ...prev,
      [activeDayModal]: [...(prev[activeDayModal] || []), newTask]
    }));

    playSound('success', soundEnabled);
    setActiveDayModal(null);
  };

  const handleToggleTask = (day, taskId) => {
    setWeeklyData(prev => ({
      ...prev,
      [day]: (prev[day] || []).map(t => {
        if (t.id === taskId) {
          const nextDone = !t.done;
          if (nextDone) playSound('check', soundEnabled);
          return { ...t, done: nextDone };
        }
        return t;
      })
    }));
  };

  const handleDeleteTask = (day, taskId) => {
    setWeeklyData(prev => ({
      ...prev,
      [day]: (prev[day] || []).filter(t => t.id !== taskId)
    }));
    playSound('delete', soundEnabled);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <span>Weekly Planner (Rencana 7 Hari)</span>
        </h3>
        <p className="text-xs text-slate-400">
          Susun strategi mingguanmu dari Senin hingga Minggu. Pantau ritme kesibukan setiap hari.
        </p>
      </div>

      {/* 7 Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {DAYS.map((day) => {
          const tasks = weeklyData[day] || [];
          const doneCount = tasks.filter(t => t.done).length;
          const totalCount = tasks.length;
          const isWeekend = day === 'Sabtu' || day === 'Minggu';

          return (
            <div 
              key={day}
              className={`
                glass-panel p-4 rounded-2xl flex flex-col justify-between min-h-[280px] border transition-all
                ${isWeekend ? 'border-purple-500/20 bg-purple-950/20' : 'border-white/10'}
              `}
            >
              <div>
                {/* Day Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{day}</span>
                      {isWeekend && <span className="text-[10px] text-purple-400 font-semibold">✨ Libur</span>}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {doneCount}/{totalCount} Selesai
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenAddModal(day)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-300 transition-colors"
                    title={`Tambah task di hari ${day}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day Tasks List */}
                <div className="space-y-2">
                  {tasks.length === 0 ? (
                    <div className="text-[11px] text-slate-400 text-center py-6 italic">
                      Tidak ada agenda
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`
                          p-2.5 rounded-xl bg-slate-900/70 border border-white/5 transition-all text-xs
                          flex items-start justify-between gap-2 group
                          ${task.done ? 'opacity-60 bg-slate-900/30' : ''}
                        `}
                      >
                        <button
                          onClick={() => handleToggleTask(day, task.id)}
                          className="mt-0.5 text-slate-400 hover:text-indigo-400 shrink-0"
                        >
                          {task.done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className={`font-medium text-slate-200 leading-tight ${task.done ? 'line-through text-slate-500' : ''}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-[10px]">
                            <span className="text-slate-400">{task.category}</span>
                            <span className="text-slate-600">•</span>
                            <span className={task.priority === 'Tinggi' ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                              {task.priority}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteTask(day, task.id)}
                          className="text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                          title="Hapus"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Quick Add Pill */}
              <button
                onClick={() => handleOpenAddModal(day)}
                className="mt-3 w-full py-1.5 rounded-xl border border-dashed border-white/10 hover:border-indigo-400/50 hover:bg-white/5 text-[11px] text-slate-400 hover:text-indigo-300 font-medium flex items-center justify-center gap-1 transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>Tambah</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal for Specific Day */}
      <ModalPortal isOpen={Boolean(activeDayModal)} onClose={() => setActiveDayModal(null)} maxWidth="max-w-md">
        <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Tambah Agenda: {activeDayModal}</span>
              </h3>
              <button onClick={() => setActiveDayModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Agenda / Tugas *</label>
                <input
                  type="text"
                  required
                  placeholder={`Misal: Target hari ${activeDayModal}...`}
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori</label>
                  <CustomSelect
                    value={taskCategory}
                    onChange={e => setTaskCategory(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl text-xs"
                  >
                    <option value="Kerja" className="bg-slate-900">Kerja</option>
                    <option value="Belajar" className="bg-slate-900">Belajar</option>
                    <option value="Kesehatan" className="bg-slate-900">Kesehatan</option>
                    <option value="Finansial" className="bg-slate-900">Finansial</option>
                    <option value="Pribadi" className="bg-slate-900">Pribadi</option>
                    <option value="Sosial" className="bg-slate-900">Sosial</option>
                  </CustomSelect>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Prioritas</label>
                  <CustomSelect
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl text-xs"
                  >
                    <option value="Tinggi" className="bg-slate-900">Tinggi</option>
                    <option value="Sedang" className="bg-slate-900">Sedang</option>
                    <option value="Rendah" className="bg-slate-900">Rendah</option>
                  </CustomSelect>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveDayModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Tambahkan
                </button>
              </div>
            </form>
        </div>
      </ModalPortal>
    </div>
  );
}
