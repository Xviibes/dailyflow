import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Timer, 
  Play, 
  Pause, 
  Sparkles, 
  Flame, 
  ChevronRight,
  Info,
  X 
} from 'lucide-react';
import { playSound } from '../../utils/audio';
import { fireConfetti, fireSuperConfetti } from '../../utils/confetti';
import { useJakartaTime } from '../../hooks/useJakartaTime';
import { useConfirm } from '../Modals/ConfirmDialog';
import { ModalPortal } from '../UI/ModalPortal';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const COLOR_MAP = {
  indigo: 'from-indigo-600/30 to-purple-600/20 border-indigo-500/40 text-indigo-300',
  emerald: 'from-emerald-600/30 to-teal-600/20 border-emerald-500/40 text-emerald-300',
  amber: 'from-amber-600/30 to-yellow-600/20 border-amber-500/40 text-amber-300',
  rose: 'from-rose-600/30 to-red-600/20 border-rose-500/40 text-rose-300',
  purple: 'from-purple-600/30 to-pink-600/20 border-purple-500/40 text-purple-300',
  cyan: 'from-cyan-600/30 to-blue-600/20 border-cyan-500/40 text-cyan-300',
};

export function PersonalWorkoutTracker({ workoutSchedule, setWorkoutSchedule, soundEnabled }) {
  const jakartaTime = useJakartaTime();
  const currentDayName = jakartaTime.dayName || 'Senin'; // e.g. "Minggu" or "Senin"
  
  // Active selected day tab (defaults to today)
  const [selectedDay, setSelectedDay] = useState(currentDayName);

  // Sync to today initially if user switches days or on mount
  useEffect(() => {
    if (DAYS.includes(currentDayName)) {
      setSelectedDay(currentDayName);
    }
  }, [currentDayName]);

  // Rest Timer State
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [initialSeconds, setInitialSeconds] = useState(60);

  useEffect(() => {
    let interval = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(sec => sec - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
      playSound('fanfare', soundEnabled);
      alert('⏰ Waktu istirahat set selesai! Siap untuk set berikutnya!');
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds, soundEnabled]);

  const startRestTimer = (seconds) => {
    setInitialSeconds(seconds);
    setTimerSeconds(seconds);
    setTimerActive(true);
    playSound('click', soundEnabled);
  };

  const toggleTimerPause = () => {
    setTimerActive(!timerActive);
    playSound('click', soundEnabled);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimerSeconds(initialSeconds);
    playSound('click', soundEnabled);
  };

  // Exercise CRUD Modal State
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    sets: '3 Set x 12 Reps',
    notes: ''
  });

  // Edit Day Focus Modal State
  const [isDayFocusModalOpen, setIsDayFocusModalOpen] = useState(false);
  const [dayFocusForm, setDayFocusForm] = useState({
    focus: '',
    subtitle: '',
    icon: '🏋️‍♂️'
  });

  const confirm = useConfirm();

  const activeDayData = workoutSchedule?.[selectedDay] || {
    focus: 'Sesi Latihan',
    subtitle: '',
    icon: '💪',
    color: 'indigo',
    exercises: []
  };

  const totalExercises = activeDayData.exercises?.length || 0;
  const completedExercises = activeDayData.exercises?.filter(e => e.done)?.length || 0;
  const progressPercent = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  // Toggle Exercise Completion
  const handleToggleExercise = (exerciseId) => {
    setWorkoutSchedule(prev => {
      const dayData = prev[selectedDay] || activeDayData;
      const updatedExercises = (dayData.exercises || []).map(ex => {
        if (ex.id === exerciseId) {
          const nextDone = !ex.done;
          if (nextDone) {
            playSound('check', soundEnabled);
          }
          return { ...ex, done: nextDone };
        }
        return ex;
      });

      // Check if all exercises done
      const allDone = updatedExercises.length > 0 && updatedExercises.every(e => e.done);
      if (allDone) {
        playSound('fanfare', soundEnabled);
        fireSuperConfetti();
      }

      return {
        ...prev,
        [selectedDay]: {
          ...dayData,
          exercises: updatedExercises,
          completed: allDone
        }
      };
    });
  };

  // Open Add Exercise Modal
  const handleOpenAddExercise = () => {
    setEditingExercise(null);
    setExerciseForm({
      name: '',
      sets: '3 Set x 12 Reps',
      notes: ''
    });
    setIsExerciseModalOpen(true);
  };

  // Open Edit Exercise Modal
  const handleOpenEditExercise = (exercise) => {
    setEditingExercise(exercise);
    setExerciseForm({
      name: exercise.name,
      sets: exercise.sets || '3 Set x 12 Reps',
      notes: exercise.notes || ''
    });
    setIsExerciseModalOpen(true);
  };

  // Save Exercise (Create or Update)
  const handleSaveExercise = (e) => {
    e.preventDefault();
    if (!exerciseForm.name.trim()) return;

    setWorkoutSchedule(prev => {
      const dayData = prev[selectedDay] || activeDayData;
      let newExercises = [];

      if (editingExercise) {
        newExercises = (dayData.exercises || []).map(ex => 
          ex.id === editingExercise.id ? { ...ex, ...exerciseForm } : ex
        );
        playSound('click', soundEnabled);
      } else {
        const newItem = {
          id: `ex-${Date.now()}`,
          name: exerciseForm.name.trim(),
          sets: exerciseForm.sets.trim(),
          notes: exerciseForm.notes.trim(),
          done: false
        };
        newExercises = [...(dayData.exercises || []), newItem];
        playSound('success', soundEnabled);
      }

      return {
        ...prev,
        [selectedDay]: {
          ...dayData,
          exercises: newExercises
        }
      };
    });

    setIsExerciseModalOpen(false);
  };

  // Delete Exercise
  const handleDeleteExercise = async (exerciseId) => {
    if (await confirm('Hapus gerakan latihan ini dari daftar?')) {
      setWorkoutSchedule(prev => {
        const dayData = prev[selectedDay] || activeDayData;
        return {
          ...prev,
          [selectedDay]: {
            ...dayData,
            exercises: (dayData.exercises || []).filter(ex => ex.id !== exerciseId)
          }
        };
      });
      playSound('delete', soundEnabled);
    }
  };

  // Reset Checklist for Selected Day
  const handleResetDayExercises = async () => {
    if (await confirm(`Reset checklist latihan hari ${selectedDay}? Semua tanda selesai akan dikosongkan untuk sesi latihan baru.`, { tone: 'warning', confirmLabel: 'Reset' })) {
      setWorkoutSchedule(prev => {
        const dayData = prev[selectedDay] || activeDayData;
        return {
          ...prev,
          [selectedDay]: {
            ...dayData,
            exercises: (dayData.exercises || []).map(ex => ({ ...ex, done: false })),
            completed: false
          }
        };
      });
      playSound('click', soundEnabled);
    }
  };

  // Open Edit Day Focus
  const handleOpenEditDayFocus = () => {
    setDayFocusForm({
      focus: activeDayData.focus || '',
      subtitle: activeDayData.subtitle || '',
      icon: activeDayData.icon || '🏋️‍♂️'
    });
    setIsDayFocusModalOpen(true);
  };

  // Save Day Focus
  const handleSaveDayFocus = (e) => {
    e.preventDefault();
    if (!dayFocusForm.focus.trim()) return;

    setWorkoutSchedule(prev => {
      const dayData = prev[selectedDay] || activeDayData;
      return {
        ...prev,
        [selectedDay]: {
          ...dayData,
          focus: dayFocusForm.focus.trim(),
          subtitle: dayFocusForm.subtitle.trim(),
          icon: dayFocusForm.icon.trim() || '💪'
        }
      };
    });

    playSound('click', soundEnabled);
    setIsDayFocusModalOpen(false);
  };

  return (
    <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-indigo-500/20 space-y-6 relative overflow-hidden">
      <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
            <Dumbbell className="w-3.5 h-3.5 text-indigo-400" />
            <span>Jadwal Workout Pribadi & Split Mingguan</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white font-display">
            Personal Workout Routine 🏋️‍♂️
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Sistem jadwal latihan terpadu dengan pelacak gerakan harian, target set & reps, serta timer jeda istirahat antar set.
          </p>
        </div>

        {/* Stopwatch / Rest Timer Widget */}
        <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-2xl border border-white/10 shrink-0 shadow-lg">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Timer className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Rest Timer (Jeda Set)
            </div>
            <div className="font-mono text-xl font-black text-white">
              {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-1">
            <button
              onClick={toggleTimerPause}
              className={`p-2 rounded-xl text-xs font-bold transition-all ${
                timerActive 
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' 
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
              }`}
              title={timerActive ? 'Jeda Timer' : 'Mulai Timer'}
            >
              {timerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={resetTimer}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-1 border-l border-white/10 pl-2">
            <button
              onClick={() => startRestTimer(30)}
              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300"
            >
              30s
            </button>
            <button
              onClick={() => startRestTimer(60)}
              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300"
            >
              60s
            </button>
            <button
              onClick={() => startRestTimer(90)}
              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300"
            >
              90s
            </button>
          </div>
        </div>
      </div>

      {/* 7-Days Split Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {DAYS.map(day => {
          const isSelected = selectedDay === day;
          const isToday = currentDayName === day;
          const dayData = workoutSchedule?.[day] || {};
          const exList = dayData.exercises || [];
          const doneCount = exList.filter(e => e.done).length;
          const isAllDone = exList.length > 0 && doneCount === exList.length;

          return (
            <button
              key={day}
              onClick={() => {
                setSelectedDay(day);
                playSound('click', soundEnabled);
              }}
              className={`
                p-3 rounded-2xl text-left border transition-all relative flex flex-col justify-between group
                ${isSelected 
                  ? 'bg-gradient-to-b from-indigo-600/30 to-purple-600/20 border-indigo-400 shadow-xl shadow-indigo-950/40 ring-2 ring-indigo-500/20 scale-[1.02]' 
                  : 'bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-900/90'}
              `}
            >
              {/* Day header & Today badge */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <span>{day}</span>
                  <span className="text-sm">{dayData.icon}</span>
                </span>
                {isToday && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 uppercase animate-pulse">
                    Hari Ini
                  </span>
                )}
              </div>

              {/* Day Focus title */}
              <div className="text-[11px] font-bold text-indigo-300 truncate mb-1">
                {dayData.focus}
              </div>

              {/* Done counter */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span>{doneCount}/{exList.length} Gerakan</span>
                {isAllDone && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Main Card */}
      <div className="bg-slate-900/70 p-5 sm:p-6 rounded-3xl border border-white/10 space-y-5">
        
        {/* Day Banner Details & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{activeDayData.icon}</span>
              <h4 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>{selectedDay}:</span>
                <span className="text-indigo-400">{activeDayData.focus}</span>
              </h4>
              {currentDayName === selectedDay && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  Target Hari Ini ⚡
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              {activeDayData.subtitle || 'Fokus latihan terstruktur untuk hasil maksimal.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenEditDayFocus}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Edit Nama Fokus Hari"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Fokus</span>
            </button>

            <button
              onClick={handleResetDayExercises}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Reset status gerakan hari ini"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Checklist</span>
            </button>

            <button
              onClick={handleOpenAddExercise}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Gerakan</span>
            </button>
          </div>
        </div>

        {/* Day Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Progres Latihan Hari {selectedDay}</span>
            <span className={`font-bold ${progressPercent === 100 ? 'text-emerald-400' : 'text-indigo-400'}`}>
              {completedExercises} dari {totalExercises} Gerakan Selesai ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                progressPercent === 100 
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400' 
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Exercises List */}
        <div className="space-y-2.5">
          {totalExercises === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic space-y-2">
              <Dumbbell className="w-8 h-8 text-slate-600 mx-auto" />
              <div>Belum ada gerakan latihan untuk hari {selectedDay}.</div>
              <button
                onClick={handleOpenAddExercise}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-block"
              >
                + Tambah Gerakan Sekarang
              </button>
            </div>
          ) : (
            activeDayData.exercises.map((exercise, idx) => (
              <div
                key={exercise.id}
                className={`
                  p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-3 group transition-all
                  ${exercise.done ? 'opacity-65 bg-slate-950/40 border-emerald-500/20' : 'hover:border-indigo-500/30'}
                `}
              >
                {/* Left: Checkbox & Name */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggleExercise(exercise.id)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-400 shrink-0"
                    title={exercise.done ? 'Tandai belum' : 'Tandai selesai'}
                  >
                    {exercise.done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 font-mono">
                        #{idx + 1}
                      </span>
                      <h5 className={`text-sm font-bold text-white ${exercise.done ? 'line-through text-slate-400' : ''}`}>
                        {exercise.name}
                      </h5>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[11px] font-semibold border border-indigo-500/30">
                        {exercise.sets}
                      </span>
                    </div>

                    {exercise.notes && (
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        💡 {exercise.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Rest Timer trigger & Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => startRestTimer(60)}
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300"
                    title="Mulai Jeda Istirahat 60 Detik"
                  >
                    <Timer className="w-3 h-3 text-indigo-400" />
                    <span>Jeda 60s</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditExercise(exercise)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                    title="Edit Gerakan"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteExercise(exercise.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                    title="Hapus Gerakan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add / Edit Exercise Modal */}
      <ModalPortal isOpen={isExerciseModalOpen} onClose={() => setIsExerciseModalOpen(false)} maxWidth="max-w-md">
        <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-indigo-400" />
                <span>{editingExercise ? 'Edit Gerakan Latihan' : `Tambah Gerakan: Hari ${selectedDay}`}</span>
              </h3>
              <button onClick={() => setIsExerciseModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExercise} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Gerakan / Latihan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Regular Push Up, Pull Up, Squat..."
                  value={exerciseForm.name}
                  onChange={e => setExerciseForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Set & Repetisi (Reps) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: 4 Set x 15-20 Reps atau 3 Set x 60 Detik"
                  value={exerciseForm.sets}
                  onChange={e => setExerciseForm(p => ({ ...p, sets: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan Form / Tips Gerakan (Opsional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Misal: Kunci siku di 45 derajat, tahan 1 detik di puncak gerakan..."
                  value={exerciseForm.notes}
                  onChange={e => setExerciseForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsExerciseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25"
                >
                  {editingExercise ? 'Simpan Perubahan' : 'Tambahkan Gerakan'}
                </button>
              </div>
            </form>
        </div>
      </ModalPortal>

      {/* Edit Day Focus Modal */}
      <ModalPortal isOpen={isDayFocusModalOpen} onClose={() => setIsDayFocusModalOpen(false)} maxWidth="max-w-md">
        <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>Ubah Fokus Latihan Hari {selectedDay}</span>
              </h3>
              <button onClick={() => setIsDayFocusModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDayFocus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Judul Fokus Latihan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Chest Day, Leg Day..."
                  value={dayFocusForm.focus}
                  onChange={e => setDayFocusForm(p => ({ ...p, focus: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deskripsi / Subtitle Latihan
                </label>
                <input
                  type="text"
                  placeholder="Misal: Fokus otot dada & trisep..."
                  value={dayFocusForm.subtitle}
                  onChange={e => setDayFocusForm(p => ({ ...p, subtitle: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Emoji Ikon
                </label>
                <input
                  type="text"
                  value={dayFocusForm.icon}
                  onChange={e => setDayFocusForm(p => ({ ...p, icon: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl glass-input text-xs text-center"
                  placeholder="🏋️‍♂️, 💪, 🔥, 🦵, ⚡, 🏃‍♂️, 🧘"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsDayFocusModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Simpan Fokus
                </button>
              </div>
            </form>
        </div>
      </ModalPortal>

    </div>
  );
}
