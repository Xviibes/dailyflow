import React, { useState } from 'react';
import { 
  Droplets, 
  Smile, 
  Moon, 
  Activity, 
  Heart, 
  Sparkles, 
  Plus, 
  Trash2, 
  Star, 
  Flame, 
  RotateCcw,
  Dumbbell 
} from 'lucide-react';
import { playSound } from '../../utils/audio';
import { fireConfetti } from '../../utils/confetti';
import { PersonalWorkoutTracker } from './PersonalWorkoutTracker';
import { INITIAL_WORKOUT_SCHEDULE } from '../../constants/defaultData';
import { AiAssistantCard } from '../AI/AiAssistantCard';

const MOODS = [
  { label: 'Sangat Bahagia', emoji: '🥳', color: 'from-amber-400 to-yellow-500' },
  { label: 'Bahagia', emoji: '😊', color: 'from-emerald-400 to-green-500' },
  { label: 'Tenang & Damai', emoji: '😌', color: 'from-blue-400 to-cyan-500' },
  { label: 'Lelah / Ngantuk', emoji: '🥱', color: 'from-purple-400 to-indigo-500' },
  { label: 'Stres / Cemas', emoji: '😣', color: 'from-orange-400 to-amber-600' },
  { label: 'Sedih / Down', emoji: '😢', color: 'from-slate-400 to-blue-600' },
];

export function WellnessView({
  wellness,
  setWellness,
  setTodos,
  setSchedule,
  setNotes,
  setFinance,
  soundEnabled,
}) {
  const [gratitudeInput, setGratitudeInput] = useState('');

  // Fallback to INITIAL_WORKOUT_SCHEDULE if not present in stored wellness
  const workoutSchedule = wellness.workoutSchedule || INITIAL_WORKOUT_SCHEDULE;

  const setWorkoutSchedule = (updater) => {
    setWellness(prev => {
      const current = prev.workoutSchedule || INITIAL_WORKOUT_SCHEDULE;
      const next = typeof updater === 'function' ? updater(current) : updater;
      return {
        ...prev,
        workoutSchedule: next
      };
    });
  };

  // Water handlers
  const handleAddWater = (amount) => {
    setWellness(prev => {
      const nextCurrent = prev.water.current + amount;
      if (nextCurrent >= prev.water.target && prev.water.current < prev.water.target) {
        playSound('fanfare', soundEnabled);
        fireConfetti('#06b6d4');
      } else {
        playSound('click', soundEnabled);
      }
      return {
        ...prev,
        water: { ...prev.water, current: nextCurrent }
      };
    });
  };

  const handleResetWater = () => {
    setWellness(prev => ({
      ...prev,
      water: { ...prev.water, current: 0 }
    }));
    playSound('delete', soundEnabled);
  };

  // Mood handlers
  const handleSelectMood = (moodObj) => {
    setWellness(prev => ({
      ...prev,
      mood: {
        ...prev.mood,
        selected: moodObj.label,
        emoji: moodObj.emoji
      }
    }));
    playSound('check', soundEnabled);
  };

  // Sleep handlers
  const handleSleepChange = (field, value) => {
    setWellness(prev => {
      const updated = { ...prev.sleep, [field]: value };
      // Recalculate hours if bedTime and wakeTime are provided
      if (field === 'bedTime' || field === 'wakeTime') {
        const bed = updated.bedTime;
        const wake = updated.wakeTime;
        if (bed && wake) {
          const [bH, bM] = bed.split(':').map(Number);
          const [wH, wM] = wake.split(':').map(Number);
          let bedMins = bH * 60 + bM;
          let wakeMins = wH * 60 + wM;
          if (wakeMins < bedMins) wakeMins += 24 * 60; // crossed midnight
          const totalHours = Math.round(((wakeMins - bedMins) / 60) * 10) / 10;
          updated.hours = totalHours > 0 ? totalHours : 0;
        }
      }
      return { ...prev, sleep: updated };
    });
  };

  // Activity handlers
  const handleAddSteps = (count) => {
    setWellness(prev => ({
      ...prev,
      activity: {
        ...prev.activity,
        steps: Math.max(0, prev.activity.steps + count)
      }
    }));
    playSound('click', soundEnabled);
  };

  const handleResetSteps = () => {
    setWellness(prev => ({
      ...prev,
      activity: { ...prev.activity, steps: 0 }
    }));
    playSound('delete', soundEnabled);
  };

  // Gratitude handlers
  const handleAddGratitude = (e) => {
    e.preventDefault();
    if (!gratitudeInput.trim()) return;
    const newG = {
      id: `gr-${Date.now()}`,
      text: gratitudeInput.trim()
    };
    setWellness(prev => ({
      ...prev,
      gratitude: [...prev.gratitude, newG]
    }));
    setGratitudeInput('');
    playSound('success', soundEnabled);
  };

  const handleDeleteGratitude = (id) => {
    setWellness(prev => ({
      ...prev,
      gratitude: prev.gratitude.filter(g => g.id !== id)
    }));
    playSound('delete', soundEnabled);
  };

  const waterPercent = Math.min(100, Math.round((wellness.water.current / wellness.water.target) * 100));
  const stepsPercent = Math.min(100, Math.round((wellness.activity.steps / wellness.activity.stepsTarget) * 100));

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold mb-2">
            <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
            <span>Kesehatan Raga & Ketenangan Jiwa</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Wellness & Health Tracker
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pantau asupan hidrasi, kualitas tidur, suasana hati, dan langkah aktif harianmu.
          </p>
        </div>
      </div>

      {/* 🤖 ASISTEN AI KHUSUS WELLNESS & WORKOUT */}
      <AiAssistantCard
        mode="wellness"
        setWellness={setWellness}
        setTodos={setTodos}
        setSchedule={setSchedule}
        setNotes={setNotes}
        setFinance={setFinance}
        soundEnabled={soundEnabled}
        contextSnapshot={{
          waterCurrent: wellness.water.current,
          waterTarget: wellness.water.target,
          mood: wellness.mood.selected,
          sleepHours: wellness.sleep.hours,
        }}
      />

      {/* 🏋️‍♂️ PERSONAL WORKOUT ROUTINE & CRUD TRACKER */}
      <PersonalWorkoutTracker
        workoutSchedule={workoutSchedule}
        setWorkoutSchedule={setWorkoutSchedule}
        soundEnabled={soundEnabled}
      />

      {/* Grid: Water & Mood */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 💧 WATER INTAKE TRACKER */}
        <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Asupan Hidrasi & Air Putih
                  </h3>
                  <div className="text-xs text-cyan-400 font-medium">
                    Target: {wellness.water.target} ml / Hari
                  </div>
                </div>
              </div>

              <button
                onClick={handleResetWater}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Reset counter hari ini"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Water Wave Visual Container */}
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-white/5 mb-5 text-center relative overflow-hidden">
              <div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-600/30 to-cyan-500/10 transition-all duration-700 ease-out"
                style={{ height: `${waterPercent}%` }}
              />
              <div className="relative z-10 space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-cyan-300 font-mono tracking-wider">
                  {wellness.water.current} <span className="text-lg font-normal text-slate-300">/ {wellness.water.target} ml</span>
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {waterPercent}% dari target harian tercapai
                </div>
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => handleAddWater(250)}
                className="py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-200 text-xs font-bold transition-all active:scale-95"
              >
                +250 ml (Gelas)
              </button>
              <button
                onClick={() => handleAddWater(500)}
                className="py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-200 text-xs font-bold transition-all active:scale-95"
              >
                +500 ml (Botol)
              </button>
              <button
                onClick={() => handleAddWater(1000)}
                className="py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-200 text-xs font-bold transition-all active:scale-95"
              >
                +1 Liter (Besar)
              </button>
            </div>
          </div>
        </div>

        {/* 😊 MOOD TRACKER */}
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
                  <Smile className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Mood & Suasana Hati Hari Ini
                  </h3>
                  <div className="text-xs text-amber-400 font-medium">
                    Status: {wellness.mood.emoji} {wellness.mood.selected}
                  </div>
                </div>
              </div>
            </div>

            {/* Mood selector buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
              {MOODS.map(m => {
                const isSelected = wellness.mood.selected === m.label;
                return (
                  <button
                    key={m.label}
                    onClick={() => handleSelectMood(m)}
                    className={`
                      p-3 rounded-2xl text-center border transition-all flex flex-col items-center gap-1
                      ${isSelected 
                        ? 'bg-amber-500/20 border-amber-500 text-white scale-105 shadow-lg shadow-amber-500/20' 
                        : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900'}
                    `}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-[10px] font-semibold truncate w-full">{m.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Reflection Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Catatan Singkat Refleksi Hari Ini
              </label>
              <input
                type="text"
                placeholder="Bagikan apa yang kamu rasakan atau hal yang berkesan..."
                value={wellness.mood.note || ''}
                onChange={e => setWellness(p => ({
                  ...p,
                  mood: { ...p.mood, note: e.target.value }
                }))}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Sleep & Gratitude */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 💤 SLEEP TRACKER */}
        <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Pelacak Tidur & Istirahat (Sleep Tracker)
              </h3>
              <div className="text-xs text-indigo-300 font-medium">
                Total Tidur: {wellness.sleep.hours} Jam Semalam
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Jam Tidur</label>
              <input
                type="time"
                value={wellness.sleep.bedTime}
                onChange={e => handleSleepChange('bedTime', e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Jam Bangun</label>
              <input
                type="time"
                value={wellness.sleep.wakeTime}
                onChange={e => handleSleepChange('wakeTime', e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-white/5">
            <span className="text-xs text-slate-300 font-medium">Kualitas Tidur:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleSleepChange('quality', star)}
                  className="p-1 text-amber-400 hover:scale-125 transition-transform"
                >
                  <Star className={`w-4 h-4 ${star <= wellness.sleep.quality ? 'fill-amber-400' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            placeholder="Catatan kondisi saat bangun..."
            value={wellness.sleep.notes || ''}
            onChange={e => handleSleepChange('notes', e.target.value)}
            className="w-full px-3 py-2 rounded-xl glass-input text-xs"
          />
        </div>

        {/* 🧘 GRATITUDE JOURNAL (3 Hal yang Disyukuri Hari Ini) */}
        <div className="glass-panel p-6 rounded-3xl border border-purple-500/20 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Gratitude Journal: 3 Hal yang Disyukuri Hari Ini ✨
                </h3>
                <p className="text-xs text-slate-400">
                  Mengingat hal-hal baik menumbuhkan kedamaian dan rasa cukup di dalam hati.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddGratitude} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Tuliskan hal kecil atau besar yang membuatmu bersyukur hari ini..."
              value={gratitudeInput}
              onChange={e => setGratitudeInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </form>

          <div className="space-y-2">
            {wellness.gratitude.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-slate-200 font-medium">{item.text}</span>
                </div>
                <button
                  onClick={() => handleDeleteGratitude(item.id)}
                  className="text-slate-400 hover:text-rose-400 p-1 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
