import React, { useState } from 'react';
import { Lock, Copy, Check, KeyRound, Sparkles } from 'lucide-react';
import { computeActivationPin } from './SettingsModal';

const EMERGENCY_BYPASS_PIN = import.meta.env.VITE_ADMIN_PIN;

function getOrCreateDeviceId() {
  try {
    const existing = localStorage.getItem('df_device_id');
    if (existing && /^\d{6}$/.test(existing.trim())) {
      return existing.trim();
    }
    const generated = String(Math.floor(100000 + Math.random() * 900000));
    localStorage.setItem('df_device_id', generated);
    return generated;
  } catch {
    return '123456';
  }
}

export function LicenseLockScreen({ onUnlocked }) {
  const [deviceId] = useState(() => getOrCreateDeviceId());
  const [pinInput, setPinInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const formattedId = `DF-${deviceId}`;

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(formattedId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const cleaned = pinInput.trim();
    const expectedPin = computeActivationPin(deviceId);

    if (
      (EMERGENCY_BYPASS_PIN && cleaned === String(EMERGENCY_BYPASS_PIN).trim()) ||
      (expectedPin && cleaned === expectedPin)
    ) {
      try {
        localStorage.setItem('df_license_verified', 'true');
      } catch {
        // Ignore storage error
      }
      setErrorMsg('');
      if (typeof onUnlocked === 'function') onUnlocked();
    } else {
      setErrorMsg('PIN Aktivasi tidak sesuai. Pastikan PIN sudah benar.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-slate-900/95 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Aktivasi Lisensi DailyFlow</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white font-display">
            Aplikasi Terkunci
          </h1>
          <p className="text-xs text-slate-400">
            Salin Device ID di bawah dan masukkan PIN Aktivasi untuk membuka DailyFlow.
          </p>
        </div>

        {/* Device ID Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between gap-3">
          <div className="text-left">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Device ID Anda
            </div>
            <div className="text-xl font-black font-mono tracking-wider text-indigo-300">
              {formattedId}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyId}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin' : 'Salin ID'}</span>
          </button>
        </div>

        {/* Activation PIN Form */}
        <form onSubmit={handleVerify} className="space-y-3 text-left">
          <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            <span>PIN Aktivasi</span>
          </label>
          <input
            type="text"
            required
            placeholder="Masukkan 6 digit PIN Aktivasi..."
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            className="w-full px-4 py-3 rounded-xl glass-input text-center text-base font-mono tracking-widest"
          />

          {errorMsg && (
            <p className="text-xs text-rose-400 font-semibold text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg transition-all active:scale-95"
          >
            Aktifkan Sekarang
          </button>
        </form>
      </div>
    </div>
  );
}
