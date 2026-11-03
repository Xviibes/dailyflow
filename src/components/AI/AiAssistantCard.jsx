import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  Sparkles,
  Send,
  Wifi,
  WifiOff,
  KeyRound,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import {
  askGeminiAssistant,
  OFFLINE_FRIENDLY_MESSAGE,
  MISSING_API_KEY_MESSAGE,
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  stripMarkdownAsterisks,
  parseFlowyActionsFromText,
  getSharedFlowyState,
  subscribeFlowyState,
  updateSharedFlowyMessages,
  clearSharedFlowyMessages,
  setSharedFlowyLoading,
  setSharedFlowyOfflineAlert,
} from '../../utils/geminiAi';
import {
  applyFlowyLocalActions as runFlowyActions,
  verifyAndFormatFlowyReply,
} from '../../utils/flowyActions';
import { playSound } from '../../utils/audio';
import { ModalPortal } from '../UI/ModalPortal';
import { FlowOrbAvatar } from './FlowOrbAvatar';

export { runFlowyActions as applyFlowyLocalActions };

const MODE_CONFIG = {
  dashboard: {
    title: 'Flowy • Sahabat Produktivitasmu',
    subtitle:
      'Tambah, edit, ceklis/uncheck, pin & reset tugas di To-Do, Planning, Rutinitas, Goals, Wellness, Notes & Finance',
    welcome:
      'Halo bro/sis! Gw Flowy ✨ Sekarang gw udah tersambung penuh ke semua 8 menu lu! Gw bisa tambah, edit (tanggal, jam, kategori, prioritas, nominal), ceklis/uncheck semua tugas, reset rutinitas/air putih, atur jam tidur, pin memo, sampai update Quick Goals. Ketik aja perintah lu!',
    accentGradient: 'from-indigo-500 via-purple-500 to-cyan-500',
    borderGlow: 'border-indigo-500/30',
    placeholder:
      'Ketik perintah: "Edit todo jogging jadi jam 18:00 prioritas tinggi" atau "Ceklis semua todo"...',
    quickPrompts: [
      'Tambah tugas selesaikan laporan jam 15:00 prioritas tinggi',
      'Ceklis semua tugas todo hari ini',
      'Reset checklist rutinitas pagi dan malam',
      'Tambah goal di Minggu Ini: Baca 2 buku produktivitas',
      'Ubah jam tidur 22:30 bangun 06:00 kualitas 5',
    ],
  },
  finance: {
    title: 'Flowy • Teman Kas & Finansial',
    subtitle: 'Tambah atau edit pemasukan & pengeluaran kilat ke E-Wallet/Bank',
    welcome:
      'Yo bro/sis! Gw Flowy siap bantu tambah atau edit pemasukan & pengeluaran lu di menu Finance & Tracker. Mau catat transaksi baru atau ubah nominal transaksi yang udah ada? Sikat aja di bawah! 💸',
    accentGradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    borderGlow: 'border-emerald-500/30',
    placeholder:
      'Ketik: "Catat beli kopi 25rb pakai QRIS" atau "Edit pengeluaran makan malam jadi 220rb"...',
    quickPrompts: [
      'Catat beli kopi 25.000 pakai QRIS',
      'Edit pengeluaran makan malam hangout jadi 200.000 pakai BCA',
      'Catat pemasukan freelance 750.000 ke BCA',
    ],
  },
  wellness: {
    title: 'Flowy • Partner Wellness & Health',
    subtitle: 'Tambah/reset air putih, edit jam & kualitas tidur, langkah fisik & jadwal workout',
    welcome:
      'Semangat sehat bro/sis! Gw Flowy siap bantu tambah/reset air putih, edit jam tidur & bangun beserta kualitasnya, update langkah kaki/aktivitas fisik, sampai ceklis gerakan workout lu! 💪',
    accentGradient: 'from-rose-500 via-amber-500 to-emerald-500',
    borderGlow: 'border-emerald-500/30',
    placeholder:
      'Ketik: "Ubah jam tidur 22:30 bangun 06:00 kualitas 5" atau "Reset air putih"...',
    quickPrompts: [
      'Tambah minum air 500 ml',
      'Reset air putih hari ini jadi 0',
      'Ubah jam tidur 22:30 dan bangun 06:00 kualitas bintang 5',
      'Tambah 1500 langkah kaki dan workout 40 menit',
    ],
  },
  notes: {
    title: 'Flowy • Teman Catatan & Ide',
    subtitle: 'Buat, edit isi, ubah kategori & pin/unpin sticky note otomatis',
    welcome:
      'Ada ide seru atau mau pin/ubah kategori catatan yang udah ada? Bisikin aja ke Flowy, langsung gw eksekusi di menu Notes & Memo lu! 📝',
    accentGradient: 'from-amber-500 via-orange-500 to-pink-500',
    borderGlow: 'border-amber-500/30',
    placeholder:
      'Ketik: "Pin catatan resep smoothie dan ubah kategori jadi Pribadi"...',
    quickPrompts: [
      'Buat catatan daftar belanja mingguan warna mint dan pin',
      'Pin catatan Resep Smoothie Energi Pagi',
      'Ubah kategori catatan Daftar Belanja jadi Kerja',
    ],
  },
};

/**
 * Komponen Input Chat Terisolasi:
 * Saat user mengetik huruf demi huruf, HANYA komponen kecil ini yang melakukan re-render
 * tanpa me-render ulang daftar pesan, kartu asisten, ataupun halaman utama DailyFlow.
 */
const FlowyCardInputForm = memo(function FlowyCardInputForm({
  isOnline,
  isLoading,
  placeholder,
  accentGradient,
  onSubmitPrompt,
}) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    onSubmitPrompt(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isLoading}
        placeholder={
          !isOnline
            ? 'Mode Offline — Flowy lagi istirahat, silakan tambah tugas manual...'
            : isLoading
            ? 'Flowy sedang menjawab...'
            : placeholder
        }
        className="flex-1 px-3.5 py-2.5 rounded-xl glass-input text-xs sm:text-sm disabled:opacity-60"
      />

      <button
        type="submit"
        disabled={isLoading}
        className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
          !isOnline || isLoading
            ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
            : `bg-gradient-to-r ${accentGradient} text-white shadow-lg hover:opacity-95 active:scale-95`
        }`}
        title={
          !isOnline
            ? 'AI Offline — Butuh koneksi internet'
            : isLoading
            ? 'Flowy sedang memproses pesan'
            : 'Kirim ke Flowy'
        }
      >
        {isOnline ? <Send className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
        <span>{!isOnline ? 'AI Offline' : isLoading ? 'Mikir...' : 'Tanya Flowy'}</span>
      </button>
    </form>
  );
});

export const AiAssistantCard = memo(function AiAssistantCard({
  mode = 'dashboard',
  setTodos,
  setSchedule,
  setNotes,
  setFinance,
  setWellness,
  contextSnapshot = {},
  soundEnabled = true,
}) {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.dashboard;
  const { isOnline, checkOnlineNow } = useNetworkStatus();

  const [isExpanded, setIsExpanded] = useState(false);

  // Gunakan state terpadu (Shared Store) agar Dashboard, Menu lain, dan Widget Mengambang menjadi 1 kesatuan
  const [sharedFlowy, setSharedFlowy] = useState(() => getSharedFlowyState());

  useEffect(() => {
    return subscribeFlowyState((nextState) => {
      setSharedFlowy(nextState);
    });
  }, []);

  const isLoading = sharedFlowy.isLoading;
  const offlineAlert = sharedFlowy.offlineAlert;

  // Modal & Inline BYOK API Key
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [showInlineKeyBox, setShowInlineKeyBox] = useState(() => !getStoredGeminiApiKey());
  const [showPassword, setShowPassword] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => getStoredGeminiApiKey());
  const [hasCustomKey, setHasCustomKey] = useState(() => Boolean(getStoredGeminiApiKey()));

  // Pesan sapaan awal digabung dengan riwayat permanen dari localStorage (dailyflow_flowy_history)
  const welcomeMessage = {
    id: 'welcome',
    role: 'assistant',
    text: hasCustomKey ? cfg.welcome : MISSING_API_KEY_MESSAGE,
    badges: [],
  };

  const displayedMessages = [welcomeMessage, ...(sharedFlowy.messages || [])];

  const chatEndRef = useRef(null);

  // Sinkronisasi API Key antar kartu Flowy & widget mengambang
  useEffect(() => {
    const onKeyUpdate = () => {
      const latest = getStoredGeminiApiKey();
      const active = Boolean(latest);
      setApiKeyInput(latest);
      setHasCustomKey(active);
      setShowInlineKeyBox(!active);
    };
    window.addEventListener('dailyflow-apikey-updated', onKeyUpdate);
    return () => window.removeEventListener('dailyflow-apikey-updated', onKeyUpdate);
  }, []);

  useEffect(() => {
    if (isOnline && offlineAlert) {
      setSharedFlowyOfflineAlert('');
    }
  }, [isOnline, offlineAlert]);

  useEffect(() => {
    if (isExpanded && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [sharedFlowy.messages, isLoading, isExpanded]);

  const handleClearHistory = useCallback(() => {
    clearSharedFlowyMessages();
    playSound('delete', soundEnabled);
  }, [soundEnabled]);

  const handleSend = useCallback(
    async (rawPromptText) => {
      const promptText = String(rawPromptText || '').trim();
      if (!promptText || isLoading) return;

      setIsExpanded(true);

      // PENGECEKAN KONEKSI (NETWORK GUARD) SEBELUM MENGIRIM KE API AI
      const currentlyOnline = checkOnlineNow();
      if (!currentlyOnline) {
        setSharedFlowyOfflineAlert(OFFLINE_FRIENDLY_MESSAGE);
        updateSharedFlowyMessages((prev) => [
          ...prev,
          { id: `u-${Date.now()}`, role: 'user', text: promptText },
          {
            id: `a-off-${Date.now()}`,
            role: 'assistant',
            text: OFFLINE_FRIENDLY_MESSAGE,
            isOfflineNotice: true,
          },
        ]);
        return;
      }

      setSharedFlowyOfflineAlert('');

      const historySnapshot = getSharedFlowyState().messages || [];
      const userMsg = { id: `u-${Date.now()}`, role: 'user', text: promptText };
      updateSharedFlowyMessages((prev) => [...prev, userMsg]);

      // Cek BYOK API Key di localStorage sebelum memanggil endpoint
      if (!getStoredGeminiApiKey()) {
        setShowInlineKeyBox(true);
        updateSharedFlowyMessages((prev) => [
          ...prev,
          {
            id: `a-nokey-${Date.now()}`,
            role: 'assistant',
            text: MISSING_API_KEY_MESSAGE,
          },
        ]);
        return;
      }

      setSharedFlowyLoading(true);

      try {
        const result = await askGeminiAssistant({
          prompt: promptText,
          mode,
          contextSnapshot,
          chatHistory: historySnapshot,
          checkOnlineNow,
        });

        if (result.offline) {
          setSharedFlowyOfflineAlert(OFFLINE_FRIENDLY_MESSAGE);
          updateSharedFlowyMessages((prev) => [
            ...prev,
            {
              id: `a-off-${Date.now()}`,
              role: 'assistant',
              text: result.reply || OFFLINE_FRIENDLY_MESSAGE,
              isOfflineNotice: true,
            },
          ]);
          return;
        }

        if (result.missingKey) {
          setShowInlineKeyBox(true);
          updateSharedFlowyMessages((prev) => [
            ...prev,
            {
              id: `a-nokey-${Date.now()}`,
              role: 'assistant',
              text: result.reply || MISSING_API_KEY_MESSAGE,
            },
          ]);
          return;
        }

        const parsedFromReply = parseFlowyActionsFromText(result.reply || '');
        const combinedActions =
          Array.isArray(result.actions) && result.actions.length > 0
            ? result.actions
            : parsedFromReply.actions;
        const cleanDisplayReply =
          parsedFromReply.cleanText || stripMarkdownAsterisks(result.reply || '');

        const appliedBadges = runFlowyActions(combinedActions, {
          setTodos,
          setSchedule,
          setNotes,
          setFinance,
          setWellness,
          soundEnabled,
        });

        const verifiedReply = verifyAndFormatFlowyReply(
          cleanDisplayReply,
          appliedBadges,
          promptText
        );

        updateSharedFlowyMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: verifiedReply,
            badges: appliedBadges,
          },
        ]);
      } catch {
        updateSharedFlowyMessages((prev) => [
          ...prev,
          {
            id: `a-err-${Date.now()}`,
            role: 'assistant',
            text: 'Maaf, koneksi ke asisten AI sedang sibuk. Jangan khawatir, seluruh fitur dan penyimpanan tugas manual kamu tetap berjalan normal.',
            isOfflineNotice: true,
          },
        ]);
      } finally {
        setSharedFlowyLoading(false);
      }
    },
    [
      isLoading,
      checkOnlineNow,
      mode,
      contextSnapshot,
      setTodos,
      setSchedule,
      setNotes,
      setFinance,
      setWellness,
      soundEnabled,
    ]
  );

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    const trimmed = apiKeyInput.trim();
    setStoredGeminiApiKey(trimmed);
    setHasCustomKey(Boolean(trimmed));
    setShowInlineKeyBox(!trimmed);
    setIsKeyModalOpen(false);
    playSound('click', soundEnabled);
  };

  return (
    <div
      className={`glass-panel rounded-3xl border ${cfg.borderGlow} p-4 sm:p-5 relative overflow-hidden transition-all`}
    >
      {/* Baris Header Flowy AI Assistant */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <FlowOrbAvatar
            size={mode === 'dashboard' ? 'lg' : 'md'}
            isOnline={isOnline}
            isLoading={isLoading}
            onClick={() => setIsExpanded((v) => !v)}
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white font-display truncate">
                {cfg.title}
              </h3>

              {isOnline ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <Wifi className="w-3 h-3" />
                  <span>AI Online</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800/90 text-slate-400 border border-slate-600/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <WifiOff className="w-3 h-3 text-slate-400" />
                  <span>AI Offline</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{cfg.subtitle}</p>
          </div>
        </div>

        {/* Tombol Header Kanan */}
        <div className="flex items-center gap-1.5 shrink-0">
          {sharedFlowy.messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 hover:text-rose-200 text-[11px] font-semibold flex items-center gap-1 transition-all"
              title="Hapus Riwayat Chat (Clear Chat)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Chat</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsKeyModalOpen(true)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border flex items-center gap-1 transition-all ${
              hasCustomKey
                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
            title="Atur Gemini API Key"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{hasCustomKey ? 'Key Aktif' : 'API Key'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-all"
          >
            <span>
              {isExpanded
                ? 'Ringkas'
                : sharedFlowy.messages.length > 0
                ? `Buka Chat (${sharedFlowy.messages.length})`
                : 'Buka Chat'}
            </span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Peringatan Ramah saat Perangkat Offline */}
      {(!isOnline || offlineAlert) && (
        <div className="mt-3 p-3 rounded-2xl bg-slate-900/95 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-200">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{offlineAlert || OFFLINE_FRIENDLY_MESSAGE}</span>
        </div>
      )}

      {/* Area Riwayat Percakapan (Saat Dibuka) */}
      {isExpanded && (
        <div className="mt-3.5 space-y-2.5 max-h-72 overflow-y-auto p-3 rounded-2xl bg-slate-950/90 border border-white/10">
          {displayedMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm font-medium'
                    : msg.isOfflineNotice
                    ? 'bg-amber-950/70 border border-amber-500/30 text-amber-200 rounded-bl-sm'
                    : 'bg-slate-900/95 border border-white/10 text-slate-200 rounded-bl-sm'
                }`}
              >
                {stripMarkdownAsterisks(msg.text)}
              </div>

              {Array.isArray(msg.badges) && msg.badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {msg.badges.map((b, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold"
                    >
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>{b}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {(!hasCustomKey || showInlineKeyBox) && (
            <form
              onSubmit={handleSaveApiKey}
              className="p-3 rounded-2xl bg-slate-900/95 border border-indigo-500/35 space-y-2.5 mt-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Masukkan Gemini API Key</span>
                </span>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-semibold text-cyan-300 hover:text-cyan-200 underline inline-flex items-center gap-1"
                >
                  <span>Dapatkan API Key gratis di aistudio.google.com</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 rounded-xl glass-input text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    title={showPassword ? 'Sembunyikan API Key' : 'Tampilkan API Key'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shrink-0 transition-all active:scale-95"
                >
                  Simpan
                </button>
              </div>
            </form>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-indigo-300 px-2 py-1">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Flowy lagi memproses...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Komponen Input Terisolasi (Mengetik tidak me-render ulang halaman utama) */}
      <FlowyCardInputForm
        isOnline={isOnline}
        isLoading={isLoading}
        placeholder={cfg.placeholder}
        accentGradient={cfg.accentGradient}
        onSubmitPrompt={handleSend}
      />

      {/* Chip Perintah Cepat */}
      <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[10px] font-semibold text-slate-400 shrink-0 flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Cepat:</span>
        </span>
        {cfg.quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => handleSend(qp)}
            className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap border transition-all shrink-0 ${
              isOnline && !isLoading
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white active:scale-95'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Modal Pengaturan Gemini API Key (BYOK) */}
      <ModalPortal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>Konfigurasi Gemini API Key (Flowy)</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsKeyModalOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveApiKey} className="space-y-3.5">
            <p className="text-xs text-slate-300 leading-relaxed">
              Masukkan <strong>Google Gemini API Key</strong> kamu untuk mengaktifkan Flowy. Kunci disimpan 100% lokal di perangkatmu (<code className="font-mono text-indigo-300">dailyflow_gemini_api_key</code>).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl glass-input text-xs font-mono"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  title={showPassword ? 'Sembunyikan API Key' : 'Tampilkan API Key'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-300 bg-slate-900/95 p-3 rounded-xl border border-white/10 flex items-center justify-between gap-2">
              <span>Dapatkan API Key gratis di aistudio.google.com</span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 font-bold inline-flex items-center gap-1 shrink-0 transition-colors"
              >
                <span>Buka AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg"
              >
                Simpan API Key
              </button>
            </div>
          </form>
        </div>
      </ModalPortal>
    </div>
  );
});
