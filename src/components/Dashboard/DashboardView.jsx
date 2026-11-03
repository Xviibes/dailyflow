import React from 'react';
import {
  CheckSquare,
  Clock,
  Sun,
  Wallet,
  Sparkles,
  Quote,
  RefreshCw,
  StickyNote,
  LayoutGrid,
  Flower2,
  ArrowUpRight,
} from 'lucide-react';
import { useJakartaTime } from '../../hooks/useJakartaTime';
import { playSound } from '../../utils/audio';
import { INITIAL_WORKOUT_SCHEDULE } from '../../constants/defaultData';
import { AiAssistantCard } from '../AI/AiAssistantCard';

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DashboardView({
  todos,
  setTodos,
  schedule,
  setSchedule,
  routines,
  notes,
  setNotes,
  goals,
  wellness,
  setWellness,
  finance,
  setFinance,
  onNavigateTab,
  soundEnabled,
  currentQuote,
  onRefreshQuote,
}) {
  const jakartaTime = useJakartaTime();

  // Calculations
  const todoTotal = todos.length;
  const todoDone = todos.filter((t) => t.completed).length;
  const todoPercent = todoTotal > 0 ? Math.round((todoDone / todoTotal) * 100) : 0;

  const morningDone = routines.morning.filter((r) => r.completed).length;
  const morningTotal = routines.morning.length;
  const nightDone = routines.night.filter((r) => r.completed).length;
  const nightTotal = routines.night.length;

  const totalIncome = finance.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = finance.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;

  // Personal Workout Split for Today (used for Systems card meta)
  const workoutSchedule = wellness?.workoutSchedule || INITIAL_WORKOUT_SCHEDULE;
  const todayWorkout = workoutSchedule?.[jakartaTime.dayName] || {
    focus: 'Sesi Latihan',
    subtitle: '',
    icon: '🏋️‍♂️',
    exercises: [],
  };
  const todayWorkoutTotal = todayWorkout.exercises?.length || 0;
  const todayWorkoutDone = todayWorkout.exercises?.filter((e) => e.done)?.length || 0;
  const todayWorkoutPercent =
    todayWorkoutTotal > 0 ? Math.round((todayWorkoutDone / todayWorkoutTotal) * 100) : 0;

  const pinnedNotesCount = notes.filter((n) => n.pinned).length;
  const latestNoteTitle = notes[0]?.title || 'Belum ada memo tersimpan';

  return (
    <div className="space-y-6">
      {/* 🌟 HERO BANNER WITH REAL-TIME JAKARTA CLOCK & GREETING */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Real-Time Productivity Hub</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white font-display tracking-tight">
              {jakartaTime.greetingIcon} {jakartaTime.greeting},{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                Semangat Berkarya!
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl">
              {jakartaTime.greetingSubtitle}
            </p>

            {/* Daily Quote Card */}
            {currentQuote && (
              <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 flex items-start gap-3 max-w-xl">
                <Quote className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-200 italic leading-relaxed">
                    "{currentQuote.quote}"
                  </p>
                  <div className="text-[10px] text-slate-400 font-semibold mt-1">
                    — {currentQuote.author}
                  </div>
                </div>
                <button
                  onClick={onRefreshQuote}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Ganti kutipan acak"
                >
                  <RefreshCw className="w-3 h-3 hover:rotate-180 transition-transform" />
                </button>
              </div>
            )}
          </div>

          {/* Big Live Digital Clock Badge */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-5 sm:p-6 rounded-3xl border border-white/15 shadow-2xl flex flex-col items-center justify-center text-center shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-1 tracking-wider uppercase">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>Waktu Indonesia Barat (WIB)</span>
            </div>
            <div className="font-mono text-3xl sm:text-5xl font-black tracking-wider text-white text-glow">
              {jakartaTime.timeString}
            </div>
            <div className="text-xs font-semibold text-slate-300 mt-1.5">
              {jakartaTime.dateString}
            </div>
          </div>
        </div>
      </div>

      {/* 🤖 AI ASSISTANT UTAMA (FLOWY) */}
      <AiAssistantCard
        mode="dashboard"
        setTodos={setTodos}
        setSchedule={setSchedule}
        setNotes={setNotes}
        setFinance={setFinance}
        setWellness={setWellness}
        soundEnabled={soundEnabled}
        contextSnapshot={{
          dayName: jakartaTime.dayName,
          todoPending: todoTotal - todoDone,
          waterMl: wellness?.water?.current || 0,
          netBalance,
        }}
      />

      {/* 🖼️ SYSTEMS DASHBOARD (Gaya Visual Estetik — Klik Langsung Menuju Menu) */}
      <div className="glass-panel p-5 sm:p-7 rounded-3xl border border-white/10 space-y-5">
        <div className="space-y-3">
          <h3 className="text-2xl sm:text-3xl font-bold text-white font-serif tracking-tight">
            Systems
          </h3>
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-white/15 text-xs sm:text-sm font-serif text-slate-200 shadow-inner">
              <LayoutGrid className="w-3.5 h-3.5 text-slate-300" />
              <span>dashboard</span>
            </div>
            <Flower2 className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[
            {
              id: 'planning',
              title: 'Life and Planning',
              meta: `${schedule.length} Agenda Harian • 3-in-1`,
              image:
                'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=900&q=80',
              fallbackGradient: 'from-amber-950 via-stone-900 to-slate-950',
            },
            {
              id: 'todo',
              title: 'School and Work • To-Do',
              meta: `${todoDone}/${todoTotal} Tugas Selesai`,
              image:
                'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=900&q=80',
              fallbackGradient: 'from-orange-950 via-amber-950 to-slate-950',
            },
            {
              id: 'wellness',
              title: 'Wellness/Health',
              meta: `${wellness.water.current} ml Air • Workout ${todayWorkoutPercent}%`,
              image:
                'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
              fallbackGradient: 'from-slate-800 via-zinc-900 to-black',
            },
            {
              id: 'notes',
              title: 'Journal & Notes',
              meta: `${notes.length} Catatan & Memo`,
              image:
                'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80',
              fallbackGradient: 'from-stone-800 via-amber-950 to-slate-950',
            },
            {
              id: 'routines',
              title: 'Mindset & Routines',
              meta: `☀️ ${morningDone}/${morningTotal} Pagi • 🌙 ${nightDone}/${nightTotal} Malam`,
              image:
                'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=900&q=80',
              fallbackGradient: 'from-indigo-950 via-blue-950 to-slate-950',
            },
            {
              id: 'finance',
              title: 'Finance',
              meta: formatRupiah(netBalance),
              image:
                'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=900&q=80',
              fallbackGradient: 'from-zinc-900 via-emerald-950 to-black',
            },
            {
              id: 'goals',
              title: 'Goals',
              meta: `${goals.length} Target Impian`,
              image:
                'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80',
              fallbackGradient: 'from-slate-800 via-indigo-950 to-slate-950',
            },
          ].map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                onNavigateTab(card.id);
              }}
              className="group relative rounded-2xl overflow-hidden bg-[#18181c]/95 border border-white/10 hover:border-indigo-400/50 shadow-xl hover:shadow-2xl transition-all duration-300 text-left flex flex-col hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              {/* Area Gambar Estetik */}
              <div
                className={`relative h-36 sm:h-40 w-full overflow-hidden bg-gradient-to-br ${card.fallbackGradient}`}
              >
                <img
                  src={card.image}
                  alt={card.title}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out brightness-90 group-hover:brightness-105"
                />
                {/* Vignette Halus */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#18181c] via-black/20 to-transparent opacity-70 pointer-events-none" />

                {/* Badge Status Kecil di Pojok Kanan Atas Gambar */}
                <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-900/95 border border-white/15 text-[10px] font-medium text-slate-200">
                  {card.meta}
                </span>
              </div>

              {/* Baris Judul di Bawah Gambar */}
              <div className="px-4 py-3.5 bg-[#202026]/95 border-t border-white/[0.06] flex items-center justify-between gap-2">
                <span className="font-serif text-[15px] sm:text-base font-semibold text-slate-100 group-hover:text-white tracking-wide truncate">
                  {card.title}
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 📊 4 RINGKASAN UTAMA: TO-DO HARIAN, RUTINITAS HARIAN, SALDO KAS BERSIH & MEMO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: To-Do Harian */}
        <div
          onClick={() => {
            playSound('click', soundEnabled);
            onNavigateTab('todo');
          }}
          className="glass-card p-4 rounded-2xl cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">To-Do Harian</span>
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">
            {todoDone} / {todoTotal}{' '}
            <span className="text-xs font-normal text-slate-400">Tugas</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${todoPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Rutinitas Harian */}
        <div
          onClick={() => {
            playSound('click', soundEnabled);
            onNavigateTab('routines');
          }}
          className="glass-card p-4 rounded-2xl cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Rutinitas Harian</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Sun className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-amber-300 font-semibold">
              ☀️ {morningDone}/{morningTotal}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-indigo-300 font-semibold">
              🌙 {nightDone}/{nightTotal}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            🔥 {routines.streaks.morning} Hari Beruntun
          </div>
        </div>

        {/* Metric 3: Saldo Kas Bersih */}
        <div
          onClick={() => {
            playSound('click', soundEnabled);
            onNavigateTab('finance');
          }}
          className="glass-card p-4 rounded-2xl cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Saldo Kas Bersih</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 truncate">
            {formatRupiah(netBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Pemasukan vs Pengeluaran</div>
        </div>

        {/* Metric 4: Memo & Catatan */}
        <div
          onClick={() => {
            playSound('click', soundEnabled);
            onNavigateTab('notes');
          }}
          className="glass-card p-4 rounded-2xl cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Memo & Catatan</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <StickyNote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-amber-300">
            {notes.length}{' '}
            <span className="text-xs font-normal text-slate-400">
              Memo {pinnedNotesCount > 0 ? `• 📌 ${pinnedNotesCount} Disematkan` : ''}
            </span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1 truncate">
            Terbaru: {latestNoteTitle}
          </div>
        </div>
      </div>
    </div>
  );
}
