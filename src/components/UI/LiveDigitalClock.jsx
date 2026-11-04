import React, { useState, useEffect, memo } from 'react';
import { Clock } from 'lucide-react';
import { getJakartaTimeData } from '../../hooks/useJakartaTime';

/**
 * Komponen Jam Digital Real-Time Terisolasi (1000ms / 1 detik)
 * State waktu (`new Date()`) sepenuhnya terisolasi di dalam komponen `React.memo` ini
 * sehingga perubahan detik setiap 1 detik TIDAK memicu re-render pada halaman utama atau To-Do.
 */
export const LiveDigitalClock = memo(function LiveDigitalClock({ variant = 'header' }) {
  const [clock, setClock] = useState(() => getJakartaTimeData(new Date()));

  useEffect(() => {
    const tick = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        setClock(getJakartaTimeData(new Date()));
      }
    };

    const timerId = setInterval(tick, 1000);
    return () => clearInterval(timerId);
  }, []);

  if (variant === 'hero') {
    return (
      <div className="bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-indigo-950/90 p-5 sm:p-6 rounded-3xl border border-white/15 shadow-inner shadow-2xl flex flex-col items-center justify-center text-center shrink-0">
        <div className="flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent mb-1.5 tracking-wider uppercase">
          <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Waktu Indonesia Barat (WIB)</span>
        </div>
        <div className="flex items-baseline justify-center gap-1.5 font-mono">
          <span className="text-3xl sm:text-5xl font-black tracking-wider text-white text-glow">
            {clock.hour}:{clock.minute}
          </span>
          <span className="text-xl sm:text-3xl font-extrabold text-cyan-300 tracking-wider">
            :{clock.second}
          </span>
          <span className="ml-1 text-xs sm:text-sm font-extrabold px-2 py-0.5 rounded-lg bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border border-indigo-400/30 text-indigo-200">
            WIB
          </span>
        </div>
        <div className="text-xs font-semibold text-slate-200 mt-2 px-3 py-0.5 rounded-full bg-white/5 border border-white/10">
          {clock.dateString}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-indigo-950/90 border border-white/15 rounded-2xl px-3.5 py-1.5 shadow-inner shadow-lg shadow-black/30 shrink-0">
      <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/25 to-purple-500/25 border border-indigo-400/30 text-indigo-300 shrink-0">
        <Clock className="w-4 h-4" />
      </div>
      <div className="text-center">
        <div className="flex items-baseline gap-1 justify-center font-mono">
          <span className="text-base sm:text-xl font-extrabold tracking-wider text-white drop-shadow-md whitespace-nowrap">
            {clock.hour}:{clock.minute}
          </span>
          <span className="text-xs sm:text-sm font-bold text-cyan-300 tracking-wider whitespace-nowrap">
            :{clock.second}
          </span>
          <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border border-indigo-400/30 text-indigo-200 tracking-wider whitespace-nowrap">
            WIB
          </span>
        </div>
        <div className="text-[11px] text-slate-300 font-medium whitespace-nowrap">
          {clock.dateString}
        </div>
      </div>
    </div>
  );
});
