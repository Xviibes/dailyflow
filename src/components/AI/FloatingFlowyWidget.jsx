import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Send,
  WifiOff,
  X,
  Minus,
  Move,
  CheckCircle2,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { FlowOrbAvatar } from './FlowOrbAvatar';
import {
  applyFlowyLocalActions,
  verifyAndFormatFlowyReply,
} from '../../utils/flowyActions';
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
import { playSound } from '../../utils/audio';
import { ModalPortal } from '../UI/ModalPortal';

const ACTIVE_WELCOME_TEXT =
  'Yo bro/sis! Gw Flowy ✨\nGw bisa tambah, edit (tanggal, jam, kategori, prioritas, nominal), ceklis/uncheck semua tugas, reset rutinitas/air putih, atur jam tidur, pin memo, sampai update Quick Goals di semua 8 menu. Sikat aja di sini!';

const QUICK_CHIPS = [
  'Ceklis semua tugas todo hari ini',
  'Reset checklist rutinitas pagi dan malam',
  'Ubah jam tidur 22:30 bangun 06:00 kualitas 5',
  'Tambah goal di Minggu Ini: Baca 2 buku produktivitas',
  'Pin catatan Resep Smoothie Energi Pagi',
  'Edit pengeluaran makan malam hangout jadi 200.000',
];

/**
 * Komponen Input Chat Mengambang Terisolasi:
 * Saat user mengetik huruf demi huruf, HANYA komponen input ini yang re-render.
 */
const FloatingFlowyInputForm = memo(function FloatingFlowyInputForm({
  isOnline,
  isLoading,
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
    <form
      onSubmit={handleSubmit}
      className="p-2.5 bg-slate-900 border-t border-white/10 flex items-center gap-1.5"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isLoading}
        placeholder={
          !isOnline
            ? 'Flowy sedang offline...'
            : isLoading
            ? 'Flowy sedang menjawab...'
            : 'Tambah, edit, ceklis, reset di semua menu...'
        }
        className="flex-1 px-3 py-2 rounded-xl glass-input text-xs disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={isLoading}
        className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1 transition-all shrink-0 ${
          !isOnline || isLoading
            ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-md hover:opacity-95 active:scale-95'
        }`}
      >
        {isOnline ? <Send className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
      </button>
    </form>
  );
});

export const FloatingFlowyWidget = memo(function FloatingFlowyWidget({
  setTodos,
  setSchedule,
  setNotes,
  setFinance,
  setWellness,
  contextSnapshot = {},
  soundEnabled = true,
}) {
  const { isOnline, checkOnlineNow } = useNetworkStatus();

  const [isDismissed, setIsDismissed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showBubbleHint, setShowBubbleHint] = useState(true);

  const [position, setPosition] = useState(() => {
    if (typeof window === 'undefined') return { x: 24, y: 120 };
    return {
      x: Math.max(16, window.innerWidth - 92),
      y: Math.max(80, window.innerHeight - 175),
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });

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

  const welcomeMessage = {
    id: 'flowy-welcome',
    role: 'assistant',
    text: hasCustomKey ? ACTIVE_WELCOME_TEXT : MISSING_API_KEY_MESSAGE,
    badges: [],
  };

  const displayedMessages = [welcomeMessage, ...(sharedFlowy.messages || [])];

  const chatEndRef = useRef(null);

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
    const timer = setTimeout(() => setShowBubbleHint(false), 7500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOnline && offlineAlert) {
      setSharedFlowyOfflineAlert('');
    }
  }, [isOnline, offlineAlert]);

  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [sharedFlowy.messages, isLoading, isOpen]);

  useEffect(() => {
    const clampToViewport = () => {
      setPosition((prev) => {
        const maxX = Math.max(12, window.innerWidth - 84);
        const maxY = Math.max(64, window.innerHeight - 96);
        return {
          x: Math.min(Math.max(12, prev.x), maxX),
          y: Math.min(Math.max(64, prev.y), maxY),
        };
      });
    };
    window.addEventListener('resize', clampToViewport);
    return () => window.removeEventListener('resize', clampToViewport);
  }, []);

  const handlePointerDown = (e) => {
    if (e.target.closest('[data-no-drag="true"]')) return;

    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!dragStateRef.current.active) return;

      const dx = e.clientX - dragStateRef.current.startX;
      const dy = e.clientY - dragStateRef.current.startY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        dragStateRef.current.moved = true;
        setIsDragging(true);
        setShowBubbleHint(false);
      }

      if (dragStateRef.current.moved) {
        const maxX = Math.max(10, window.innerWidth - 80);
        const maxY = Math.max(16, window.innerHeight - 86);
        const nextX = Math.min(Math.max(10, dragStateRef.current.originX + dx), maxX);
        const nextY = Math.min(Math.max(16, dragStateRef.current.originY + dy), maxY);
        setPosition({ x: nextX, y: nextY });
      }
    };

    const handlePointerUp = () => {
      if (!dragStateRef.current.active) return;
      dragStateRef.current.active = false;
      setTimeout(() => {
        setIsDragging(false);
      }, 60);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  const handleOrbClick = () => {
    if (dragStateRef.current.moved) return;
    setIsOpen((prev) => !prev);
    setShowBubbleHint(false);
    playSound('click', soundEnabled);
  };

  const handleClearHistory = useCallback(() => {
    clearSharedFlowyMessages();
    playSound('delete', soundEnabled);
  }, [soundEnabled]);

  const handleSend = useCallback(
    async (rawPromptText) => {
      const promptText = String(rawPromptText || '').trim();
      if (!promptText || isLoading) return;

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
      updateSharedFlowyMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', text: promptText },
      ]);

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
          mode: 'dashboard',
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

        const appliedBadges = applyFlowyLocalActions(combinedActions, {
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
            text: 'Waduh bro/sis, sinyal ke Flowy lagi agak padat nih. Tenang aja, semua tugas & catatan manual lu tetap aman 100% di HP!',
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

  if (typeof document === 'undefined') return null;

  const windowWidth = Math.min(368, (typeof window !== 'undefined' ? window.innerWidth : 400) - 24);
  const windowLeft =
    typeof window !== 'undefined'
      ? Math.min(Math.max(12, position.x - windowWidth + 68), window.innerWidth - windowWidth - 12)
      : 16;
  const windowTop =
    typeof window !== 'undefined'
      ? position.y > window.innerHeight * 0.55
        ? Math.max(16, position.y - 430)
        : Math.min(window.innerHeight - 450, position.y + 76)
      : 100;

  return createPortal(
    <>
      {isDismissed ? (
        <button
          type="button"
          onClick={() => {
            setIsDismissed(false);
            playSound('click', soundEnabled);
          }}
          className="fixed bottom-20 lg:bottom-5 right-4 z-[85] px-3 py-1.5 rounded-full bg-slate-900/95 hover:bg-slate-800 border border-purple-500/40 text-[11px] font-bold text-purple-200 shadow-lg flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
          title="Tampilkan kembali Flowy"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Panggil Flowy ✨</span>
        </button>
      ) : (
        <>
          {/* JENDELA CHAT MENGAMBANG FLOWY (Fake Glassmorphism mewah tanpa backdrop-blur) */}
          {isOpen && (
            <div
              style={{
                left: `${windowLeft}px`,
                top: `${Math.max(12, windowTop)}px`,
                width: `${windowWidth}px`,
              }}
              className="fixed z-[88] rounded-3xl bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-indigo-950/95 border border-white/15 shadow-inner shadow-2xl overflow-hidden flex flex-col animate-fade-in"
            >
              {/* Header Jendela Mengambang */}
              <div
                onPointerDown={handlePointerDown}
                style={{ touchAction: 'none' }}
                className="px-4 py-3 bg-gradient-to-r from-indigo-950/95 via-purple-950/95 to-slate-900/95 border-b border-white/15 shadow-inner flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FlowOrbAvatar
                    size="sm"
                    isOnline={isOnline}
                    isLoading={isLoading}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                        Flowy
                      </h4>
                      {isOnline ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{isLoading ? 'Lagi Mikir...' : 'AI Online'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          <WifiOff className="w-2.5 h-2.5" />
                          <span>AI Offline</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-purple-200/75 truncate flex items-center gap-1">
                      <Move className="w-2.5 h-2.5 inline text-cyan-400" />
                      <span>Sinkron Semua Menu • Geser bebas</span>
                    </p>
                  </div>
                </div>

                {/* Tombol Aksi Header Jendela */}
                <div className="flex items-center gap-1 shrink-0" data-no-drag="true">
                  {sharedFlowy.messages.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/25 text-rose-300 hover:text-white transition-colors"
                      title="Hapus Riwayat Chat (Clear Chat)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsKeyModalOpen(true)}
                    className={`p-1.5 rounded-lg border text-[10px] transition-colors ${
                      hasCustomKey
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                    title="Atur Gemini API Key"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                    title="Sembunyikan ke Bola Flowy"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsDismissed(true);
                    }}
                    className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 hover:text-white transition-colors"
                    title="Tutup Widget Flowy"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Banner Peringatan Ramah Saat Offline */}
              {(!isOnline || offlineAlert) && (
                <div className="mx-3 mt-2.5 p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center gap-2 text-[11px] text-amber-200">
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{offlineAlert || OFFLINE_FRIENDLY_MESSAGE}</span>
                </div>
              )}

              {/* Isi Chat Mengambang */}
              <div className="p-3 space-y-2.5 max-h-64 overflow-y-auto bg-slate-950/95">
                {displayedMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[88%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-sm font-medium'
                          : msg.isOfflineNotice
                          ? 'bg-amber-950/70 border border-amber-500/30 text-amber-200 rounded-bl-sm'
                          : 'bg-slate-900 border border-white/10 text-slate-200 rounded-bl-sm'
                      }`}
                    >
                      {stripMarkdownAsterisks(msg.text)}
                    </div>

                    {Array.isArray(msg.badges) && msg.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {msg.badges.map((b, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
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
                    className="p-2.5 rounded-2xl bg-slate-900/95 border border-purple-500/40 space-y-2 mt-1"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] font-bold text-purple-200 flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-cyan-400" />
                        <span>Masukkan Gemini API Key</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="AIzaSy..."
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          className="w-full pl-2.5 pr-8 py-1.5 rounded-xl glass-input text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                          title={showPassword ? 'Sembunyikan API Key' : 'Tampilkan API Key'}
                        >
                          {showPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white text-[11px] font-bold shadow-md shrink-0"
                      >
                        Simpan
                      </button>
                    </div>

                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-cyan-300 hover:text-cyan-200 underline inline-flex items-center gap-1"
                    >
                      <span>Dapatkan API Key gratis di aistudio.google.com</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </form>
                )}

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-cyan-300 px-2 py-1">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Flowy lagi memproses...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chip Obrolan Cepat */}
              <div className="px-3 py-1.5 bg-slate-900/95 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {QUICK_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSend(chip)}
                    className={`px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap border transition-all shrink-0 ${
                      isOnline && !isLoading
                        ? 'bg-white/5 hover:bg-purple-500/20 border-white/10 text-slate-300 hover:text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Komponen Input Pesan Terisolasi */}
              <FloatingFlowyInputForm
                isOnline={isOnline}
                isLoading={isLoading}
                onSubmitPrompt={handleSend}
              />
            </div>
          )}

          {/* BOLA MENGAMBANG "THE FLOW ORB" */}
          <div
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              touchAction: 'none',
            }}
            onPointerDown={handlePointerDown}
            className="fixed z-[89] select-none group"
          >
            {isLoading && !isOpen ? (
              <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 w-44 px-3 py-2 rounded-2xl bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-indigo-950/95 border border-cyan-400/50 text-[11px] text-cyan-200 shadow-inner shadow-xl pointer-events-none animate-pulse">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 animate-spin text-cyan-300" />
                  <span>Flowy lagi mikir...</span>
                </p>
              </div>
            ) : (
              showBubbleHint &&
              !isOpen && (
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 w-48 px-3 py-2 rounded-2xl bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-indigo-950/95 border border-white/15 text-[11px] text-slate-100 shadow-inner shadow-xl pointer-events-none animate-fade-in">
                  <p className="font-bold text-cyan-300">Hai! Gw Flowy ✨</p>
                  <p className="text-[10px] text-slate-300 leading-snug mt-0.5">
                    Klik buat ngobrol atau tahan & geser gw ke mana aja!
                  </p>
                </div>
              )
            )}

            <button
              type="button"
              data-no-drag="true"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                setIsDismissed(true);
              }}
              className="absolute -top-1.5 -right-1.5 z-20 w-5 h-5 rounded-full bg-slate-900/95 hover:bg-rose-600 text-slate-300 hover:text-white border border-white/20 flex items-center justify-center shadow-md transition-all opacity-90 group-hover:opacity-100"
              title="Tutup Flowy"
            >
              <X className="w-3 h-3" />
            </button>

            <div onClick={handleOrbClick} className="relative cursor-pointer">
              <FlowOrbAvatar
                size="lg"
                isOnline={isOnline}
                isLoading={isLoading}
                isDragging={isDragging}
              />
              <div className="mt-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-slate-900/95 via-indigo-950/95 to-purple-950/95 border border-white/15 text-[10px] font-extrabold text-center text-cyan-200 shadow-inner shadow-md flex items-center justify-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isLoading
                      ? 'bg-cyan-400 animate-ping'
                      : isOnline
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-slate-500'
                  }`}
                />
                <span>{isLoading ? 'Mikir...' : 'Flowy'}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Konfigurasi Gemini API Key (BYOK) */}
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
              Masukkan <strong>Google Gemini API Key</strong> supaya Flowy makin pintar ngobrol dan kasih solusi. Kunci disimpan 100% lokal di perangkat lu (<code className="font-mono text-indigo-300">dailyflow_gemini_api_key</code>).
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
    </>,
    document.body
  );
});
