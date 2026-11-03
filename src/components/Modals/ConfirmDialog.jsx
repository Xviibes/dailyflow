import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Trash2, AlertTriangle, Info, X } from 'lucide-react';

const ConfirmContext = createContext(null);

const TONES = {
  danger: {
    icon: Trash2,
    gradient: 'from-rose-500 to-red-600',
    glow: 'shadow-rose-500/40',
    confirmClass: 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 shadow-lg shadow-rose-500/30',
  },
  warning: {
    icon: AlertTriangle,
    gradient: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/40',
    confirmClass: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/30',
  },
  info: {
    icon: Info,
    gradient: 'from-indigo-500 to-purple-600',
    glow: 'shadow-indigo-500/40',
    confirmClass: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-lg shadow-indigo-500/30',
  },
};

/**
 * Provider global untuk konfirmasi (menggantikan window.confirm bawaan browser)
 * agar tampilannya estetik & konsisten dengan tema aplikasi.
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback((message, options = {}) => {
    const tone = options.tone || 'danger';
    return new Promise((resolve) => {
      setState({
        title: options.title || (tone === 'danger' ? 'Konfirmasi Hapus' : 'Konfirmasi'),
        message,
        confirmLabel: options.confirmLabel || (tone === 'danger' ? 'Hapus' : 'Lanjutkan'),
        cancelLabel: options.cancelLabel || 'Batal',
        tone,
        resolve,
      });
    });
  }, []);

  const settle = useCallback((result) => {
    setState((prev) => {
      if (prev?.resolve) prev.resolve(result);
      return null;
    });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && <ConfirmDialog state={state} onSettle={settle} />}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm harus dipakai di dalam <ConfirmProvider>.');
  return ctx;
}

function ConfirmDialog({ state, onSettle }) {
  const tone = TONES[state.tone] || TONES.danger;
  const Icon = tone.icon;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onSettle(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSettle]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/85 animate-fade-in"
      onClick={() => onSettle(false)}
    >
      <div
        className="glass-panel w-full max-w-sm p-6 sm:p-7 rounded-3xl border border-white/15 shadow-2xl text-center animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ikon */}
        <div className={`mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br ${tone.gradient} flex items-center justify-center shadow-xl ${tone.glow} animate-float`}>
          <Icon className="w-8 h-8 text-white" />
        </div>

        {/* Judul */}
        <h3 className="text-lg font-bold text-white font-display mb-1.5">
          {state.title}
        </h3>

        {/* Pesan */}
        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          {state.message}
        </p>

        {/* Tombol */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSettle(false)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-semibold transition-all active:scale-95"
          >
            {state.cancelLabel}
          </button>
          <button
            onClick={() => onSettle(true)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-white text-sm font-bold transition-all active:scale-95 ${tone.confirmClass}`}
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
