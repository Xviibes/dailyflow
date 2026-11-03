import React, { useState, useEffect } from 'react';
import { Settings, KeyRound, Eye, EyeOff, Copy, Check, ShieldAlert, X } from 'lucide-react';
import { ModalPortal } from '../UI/ModalPortal';
import { getStoredGeminiApiKey, setStoredGeminiApiKey } from '../../utils/geminiAi';
import { playSound } from '../../utils/audio';

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN;

export function computeActivationPin(rawDeviceId) {
  const cleanDigits = String(rawDeviceId || '').replace(/\D/g, '');
  if (!cleanDigits) return '';
  const mult = Number(import.meta.env.VITE_LICENSE_MULT);
  const add = Number(import.meta.env.VITE_LICENSE_ADD);
  return String(Number(cleanDigits) * mult + add)
    .split('')
    .reverse()
    .join('')
    .slice(0, 6);
}

export function SettingsModal({ isOpen, onClose, soundEnabled = true }) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Secret Admin State
  const [tapCount, setTapCount] = useState(0);
  const [showAdminPinInput, setShowAdminPinInput] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [buyerDeviceId, setBuyerDeviceId] = useState('');
  const [copiedPin, setCopiedPin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredGeminiApiKey());
      setSavedNotice(false);
      setTapCount(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTitleTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 5) {
      setShowAdminPinInput(true);
      playSound('click', soundEnabled);
    }
  };

  const handleVerifyAdminPin = (e) => {
    e.preventDefault();
    if (ADMIN_PIN && adminPin.trim() === String(ADMIN_PIN).trim()) {
      setIsAdminUnlocked(true);
      playSound('success', soundEnabled);
    } else {
      alert('PIN Admin tidak valid.');
    }
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    setStoredGeminiApiKey(apiKey);
    setSavedNotice(true);
    playSound('success', soundEnabled);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const generatedPin = computeActivationPin(buyerDeviceId);

  const handleCopyPin = async () => {
    if (!generatedPin) return;
    try {
      await navigator.clipboard.writeText(generatedPin);
      setCopiedPin(true);
      playSound('click', soundEnabled);
      setTimeout(() => setCopiedPin(false), 2000);
    } catch {
      // Fallback ignore
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5 select-none" onClick={handleTitleTap}>
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display cursor-pointer">
                Pengaturan
              </h3>
              <p className="text-xs text-slate-400">Konfigurasi AI & Sistem DailyFlow</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Gemini API Key */}
        <form onSubmit={handleSaveApiKey} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            <span>Gemini API Key (df_gemini_api_key)</span>
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="Masukkan AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl glass-input text-xs font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all"
          >
            {savedNotice ? '✓ API Key Tersimpan!' : 'Simpan API Key'}
          </button>
        </form>

        {/* Fitur Admin Rahasia (5x Tap pada judul "Pengaturan") */}
        {showAdminPinInput && !isAdminUnlocked && (
          <form
            onSubmit={handleVerifyAdminPin}
            className="p-3.5 rounded-2xl bg-slate-900/95 border border-amber-500/30 space-y-2.5"
          >
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Verifikasi PIN Admin</span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Masukkan PIN Admin..."
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Buka
              </button>
            </div>
          </form>
        )}

        {isAdminUnlocked && (
          <div className="p-4 rounded-2xl bg-slate-900/95 border border-emerald-500/40 space-y-3">
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Generator PIN Aktivasi Pembeli (Admin)</span>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Masukkan Device ID Pembeli (contoh: DF-123456 atau 123456)
              </label>
              <input
                type="text"
                placeholder="DF-XXXXXX"
                value={buyerDeviceId}
                onChange={(e) => setBuyerDeviceId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>

            {generatedPin && (
              <div className="p-3 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] text-slate-400">PIN Aktivasi (6 Digit):</div>
                  <div className="text-lg font-black font-mono tracking-widest text-emerald-400">
                    {generatedPin}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  {copiedPin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPin ? 'Tersalin' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </ModalPortal>
  );
}
