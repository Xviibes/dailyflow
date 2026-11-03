import React, { useState } from 'react';
import { Clock, CalendarDays, CalendarRange, Sparkles } from 'lucide-react';
import { DailySchedule } from './DailySchedule';
import { WeeklyPlanner } from './WeeklyPlanner';
import { MonthlyPlanner } from './MonthlyPlanner';
import { useJakartaTime } from '../../hooks/useJakartaTime';

export function LifePlanningView({
  schedule,
  setSchedule,
  weeklyData,
  setWeeklyData,
  monthlyData,
  setMonthlyData,
  soundEnabled
}) {
  const [activeSubTab, setActiveSubTab] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const jakartaTime = useJakartaTime();

  return (
    <div className="space-y-6">
      {/* Top Planner Navigation */}
      <div className="glass-panel p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistem Perencanaan Hidup Terpadu</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display">
            Life & Planning Hub
          </h2>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/80 rounded-2xl border border-white/10 shrink-0">
          <button
            onClick={() => setActiveSubTab('daily')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'daily'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Jadwal Harian</span>
          </button>

          <button
            onClick={() => setActiveSubTab('weekly')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'weekly'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Mingguan (7 Hari)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('monthly')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'monthly'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Kalender Bulanan</span>
          </button>
        </div>
      </div>

      {/* Sub-tab content */}
      <div className="animate-fade-in">
        {activeSubTab === 'daily' && (
          <DailySchedule
            schedule={schedule}
            setSchedule={setSchedule}
            soundEnabled={soundEnabled}
            currentHourWib={`${jakartaTime.hour}:${jakartaTime.minute}`}
          />
        )}

        {activeSubTab === 'weekly' && (
          <WeeklyPlanner
            weeklyData={weeklyData}
            setWeeklyData={setWeeklyData}
            soundEnabled={soundEnabled}
          />
        )}

        {activeSubTab === 'monthly' && (
          <MonthlyPlanner
            monthlyData={monthlyData}
            setMonthlyData={setMonthlyData}
            soundEnabled={soundEnabled}
          />
        )}
      </div>
    </div>
  );
}
