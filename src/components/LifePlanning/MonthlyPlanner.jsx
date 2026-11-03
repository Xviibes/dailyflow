import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Target,
  X,
  Flag
} from 'lucide-react';
import { playSound } from '../../utils/audio';
import { CustomSelect } from '../UI/CustomSelect';
import { ModalPortal } from '../UI/ModalPortal';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const WEEK_DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export function MonthlyPlanner({ monthlyData, setMonthlyData, soundEnabled }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // Selected date modal / view
  const [selectedDay, setSelectedDay] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    category: 'Kerja',
    color: 'indigo'
  });

  // Editing Monthly Focus
  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const [focusText, setFocusText] = useState(monthlyData.focus || '');

  // Priorities
  const [newPriorityText, setNewPriorityText] = useState('');
  const [isAddingPriority, setIsAddingPriority] = useState(false);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Calendar calculations
  // Get first day of month (0 = Sun, 1 = Mon ... 6 = Sat)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust so Monday = 0, Sunday = 6
  const startingDayIndex = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Save Focus
  const handleSaveFocus = () => {
    setMonthlyData(prev => ({ ...prev, focus: focusText }));
    setIsEditingFocus(false);
    playSound('click', soundEnabled);
  };

  // Toggle Priority
  const handleTogglePriority = (id) => {
    setMonthlyData(prev => ({
      ...prev,
      topPriorities: prev.topPriorities.map(p => {
        if (p.id === id) {
          const nextDone = !p.done;
          if (nextDone) playSound('check', soundEnabled);
          return { ...p, done: nextDone };
        }
        return p;
      })
    }));
  };

  // Add Priority
  const handleAddPriority = (e) => {
    e.preventDefault();
    if (!newPriorityText.trim()) return;
    const newP = {
      id: `mp-${Date.now()}`,
      text: newPriorityText.trim(),
      done: false
    };
    setMonthlyData(prev => ({
      ...prev,
      topPriorities: [...prev.topPriorities, newP]
    }));
    setNewPriorityText('');
    setIsAddingPriority(false);
    playSound('success', soundEnabled);
  };

  // Delete Priority
  const handleDeletePriority = (id) => {
    setMonthlyData(prev => ({
      ...prev,
      topPriorities: prev.topPriorities.filter(p => p.id !== id)
    }));
    playSound('delete', soundEnabled);
  };

  // Events on specific day
  const getEventsForDay = (day) => {
    return (monthlyData.events || []).filter(e => e.day === day);
  };

  // Add Event on selectedDay
  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !selectedDay) return;

    const newEvent = {
      id: `me-${Date.now()}`,
      day: selectedDay,
      title: eventForm.title.trim(),
      category: eventForm.category,
      color: eventForm.color
    };

    setMonthlyData(prev => ({
      ...prev,
      events: [...(prev.events || []), newEvent]
    }));

    setEventForm({ title: '', category: 'Kerja', color: 'indigo' });
    setIsEventModalOpen(false);
    playSound('success', soundEnabled);
  };

  // Delete Event
  const handleDeleteEvent = (id) => {
    setMonthlyData(prev => ({
      ...prev,
      events: (prev.events || []).filter(e => e.id !== id)
    }));
    playSound('delete', soundEnabled);
  };

  return (
    <div className="space-y-6">
      {/* Monthly Focus & Top Priorities Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Focus Banner */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold">
                <Target className="w-3.5 h-3.5" />
                <span>Fokus Utama Bulan {MONTH_NAMES[currentMonth]} {currentYear}</span>
              </span>

              <button
                onClick={() => {
                  setFocusText(monthlyData.focus || '');
                  setIsEditingFocus(!isEditingFocus);
                }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                title="Edit Fokus Bulanan"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {isEditingFocus ? (
              <div className="space-y-3 mt-2">
                <textarea
                  rows="3"
                  value={focusText}
                  onChange={e => setFocusText(e.target.value)}
                  className="w-full p-3 rounded-xl glass-input text-sm"
                  placeholder="Tuliskan komitmen atau fokus utama bulan ini..."
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingFocus(false)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-xs"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveFocus}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                  >
                    Simpan Fokus
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-base sm:text-lg font-medium text-slate-100 italic leading-relaxed">
                "{monthlyData.focus || 'Belum ada fokus bulan ini. Klik ikon edit untuk menetapkannya.'}"
              </p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Kalender Aktif: {MONTH_NAMES[currentMonth]} {currentYear}</span>
            <span className="text-indigo-400 font-semibold">{daysInMonth} Hari</span>
          </div>
        </div>

        {/* Top 3 Monthly Priorities */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Flag className="w-4 h-4 text-rose-400" />
                <span>Prioritas Utama Bulan Ini</span>
              </h4>
              <button
                onClick={() => setIsAddingPriority(true)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-rose-300"
                title="Tambah Prioritas"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 mt-2">
              {monthlyData.topPriorities.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-2 group text-xs"
                >
                  <button
                    onClick={() => handleTogglePriority(item.id)}
                    className="text-slate-400 hover:text-rose-400 shrink-0"
                  >
                    {item.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>

                  <span className={`flex-1 font-medium text-slate-200 truncate ${item.done ? 'line-through text-slate-500' : ''}`}>
                    {item.text}
                  </span>

                  <button
                    onClick={() => handleDeletePriority(item.id)}
                    className="text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {isAddingPriority && (
                <form onSubmit={handleAddPriority} className="space-y-2 pt-2">
                  <input
                    type="text"
                    required
                    placeholder="Tulis prioritas baru..."
                    value={newPriorityText}
                    onChange={e => setNewPriorityText(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
                    autoFocus
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingPriority(false)}
                      className="px-2 py-1 rounded bg-white/5 text-slate-400 text-[11px]"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded bg-rose-600 text-white text-[11px] font-bold"
                    >
                      Tambah
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Monthly Interactive Calendar */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        {/* Calendar Nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-display">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h3>
              <p className="text-xs text-slate-400">
                Klik tanggal untuk melihat atau menambah agenda dan milestone.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentMonth(today.getMonth());
                setCurrentYear(today.getFullYear());
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold"
            >
              Bulan Ini
            </button>
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 py-2 border-b border-white/10">
          {WEEK_DAYS.map(d => (
            <div key={d} className={d === 'Sab' || d === 'Min' ? 'text-purple-400' : ''}>
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells before month start */}
          {Array.from({ length: startingDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[85px] rounded-xl bg-slate-900/20 border border-transparent" />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const events = getEventsForDay(dayNum);
            const isToday =
              today.getDate() === dayNum &&
              today.getMonth() === currentMonth &&
              today.getFullYear() === currentYear;

            return (
              <div
                key={dayNum}
                onClick={() => {
                  setSelectedDay(dayNum);
                  setIsEventModalOpen(true);
                }}
                className={`
                  min-h-[85px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between
                  hover:scale-[1.02] hover:border-indigo-400/50 hover:bg-indigo-950/30 group
                  ${isToday 
                    ? 'border-indigo-500 bg-indigo-500/15 shadow-lg shadow-indigo-950/40' 
                    : 'border-white/5 bg-slate-900/50'}
                `}
              >
                <div className="flex items-center justify-between">
                  <span className={`
                    text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center
                    ${isToday ? 'bg-indigo-500 text-white' : 'text-slate-300'}
                  `}>
                    {dayNum}
                  </span>

                  {events.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300">
                      {events.length}
                    </span>
                  )}
                </div>

                {/* Event previews in calendar tile */}
                <div className="space-y-1 mt-1 overflow-hidden">
                  {events.slice(0, 2).map((evt) => (
                    <div
                      key={evt.id}
                      className="text-[10px] truncate px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium"
                    >
                      {evt.title}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div className="text-[9px] text-slate-400 pl-1">
                      +{events.length - 2} lainnya
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Detail & Add Event Modal */}
      <ModalPortal isOpen={Boolean(isEventModalOpen && selectedDay)} onClose={() => setIsEventModalOpen(false)} maxWidth="max-w-md">
        <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-indigo-400" />
                  <span>Agenda {selectedDay} {MONTH_NAMES[currentMonth]} {currentYear}</span>
                </h3>
                <span className="text-xs text-slate-400">Daftar agenda & tonggak penting</span>
              </div>
              <button onClick={() => setIsEventModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing events for selected day */}
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {getEventsForDay(selectedDay).length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4 italic">
                  Belum ada agenda di tanggal ini.
                </div>
              ) : (
                getEventsForDay(selectedDay).map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">{evt.title}</div>
                      <div className="text-[10px] text-slate-400">{evt.category}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(evt.id)}
                      className="text-slate-400 hover:text-rose-400 p-1"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add New Event Form */}
            <form onSubmit={handleAddEvent} className="space-y-3 pt-3 border-t border-white/10">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tambah Agenda Baru
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Deadline Proposal Q4..."
                  value={eventForm.title}
                  onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kategori
                </label>
                <CustomSelect
                  value={eventForm.category}
                  onChange={e => setEventForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-xl text-xs"
                >
                  <option value="Kerja" className="bg-slate-900">Kerja</option>
                  <option value="Finansial" className="bg-slate-900">Finansial</option>
                  <option value="Kesehatan" className="bg-slate-900">Kesehatan</option>
                  <option value="Belajar" className="bg-slate-900">Belajar</option>
                  <option value="Pribadi" className="bg-slate-900">Pribadi</option>
                </CustomSelect>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
        </div>
      </ModalPortal>
    </div>
  );
}
