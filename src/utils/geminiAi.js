// Integrasi Flowy — Sahabat Produktivitas & Asisten AI di DailyFlow
// Dilengkapi Persistensi Riwayat (dailyflow_flowy_history), Sliding Window 6-8 Pesan,
// Direct Action Execution [[ACTION:...]] untuk SELURUH 8 Modul (Tambah, Edit, Ceklis/Uncheck, Pin, Reset),
// Konteks Data Real-Time Anti-Halusinasi, Network Guard ketat & State Terpadu (Satu Kesatuan).

import {
  buildLiveAppContextSummary,
  inferFallbackActionsFromPrompt,
} from './flowyActions';

export const GEMINI_MODEL_DISPLAY = 'gemini-3.5-flash-lite';
const MODEL_CANDIDATES = [
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
];

// Simpan model yang berhasil merespons agar chat berikutnya langsung instan (tanpa retry 404)
let cachedWorkingModel = null;

export const OFFLINE_FRIENDLY_MESSAGE =
  'Fitur AI butuh internet nih, tapi tenang aja semua catatan dan to-do list offline kamu tetap aman!';

export const MISSING_API_KEY_MESSAGE =
  'Halo! Sebelum kita ngobrol atau bantu atur tugasmu, masukin Gemini API Key kamu dulu di menu ini ya.';

export const DEFAULT_WELCOME_MESSAGE =
  'Halo bro/sis! Gw Flowy ✨ Mau tambah/edit/ceklis To-Do, Planning Harian-Tahunan, Rutinitas Pagi/Malam, Quick Goals, Pin Memo, atur Jam Tidur/Air/Langkah, atau edit Kas Finance? Ketik aja, langsung gw eksekusi ke menu yang tepat!';

export const API_KEY_STORAGE_KEY = 'df_gemini_api_key';

export const FLOWY_HISTORY_STORAGE_KEY = 'dailyflow_flowy_history';
export const MAX_HISTORY_MESSAGES = 80; // Batasi maksimal 80 pesan terakhir di localStorage

export function getStoredGeminiApiKey() {
  try {
    const stored = localStorage.getItem('df_gemini_api_key');
    return stored ? stored.trim() : '';
  } catch {
    return '';
  }
}

export function setStoredGeminiApiKey(key) {
  try {
    const trimmed = (key || '').trim();
    if (!trimmed) {
      localStorage.removeItem('df_gemini_api_key');
    } else {
      localStorage.setItem('df_gemini_api_key', trimmed);
    }
    cachedWorkingModel = null;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dailyflow-apikey-updated', { detail: trimmed }));
    }
  } catch {
    // Ignore storage write errors
  }
}

/**
 * 1. SIMPAN & BACA RIWAYAT CHAT PERMANEN (dailyflow_flowy_history)
 * Selalu dibungkus try...catch dengan fallback array kosong [] agar anti-crash,
 * dan otomatis dipotong maksimal 80 pesan terakhir.
 */
export function getStoredFlowyHistory() {
  try {
    const raw = localStorage.getItem(FLOWY_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.text === 'string' &&
          (item.role === 'user' || item.role === 'assistant')
      )
      .slice(-MAX_HISTORY_MESSAGES);
  } catch {
    return [];
  }
}

export function setStoredFlowyHistory(messages) {
  try {
    if (!Array.isArray(messages)) return [];
    const trimmed = messages
      .filter((item) => item && typeof item.text === 'string')
      .slice(-MAX_HISTORY_MESSAGES);
    localStorage.setItem(FLOWY_HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch {
    return [];
  }
}

export function clearStoredFlowyHistory() {
  try {
    localStorage.removeItem(FLOWY_HISTORY_STORAGE_KEY);
  } catch {
    // Ignore storage remove errors
  }
}

/**
 * STATE TERPADU (SATU KESATUAN) ANTAR SEMUA KOMPONEN FLOWY (DASHBOARD, MENU & FLOATING WIDGET)
 */
const flowySubscribers = new Set();
let sharedFlowyState = {
  messages: getStoredFlowyHistory(),
  isLoading: false,
  offlineAlert: '',
};

function notifyFlowySubscribers() {
  flowySubscribers.forEach((listener) => {
    try {
      listener(sharedFlowyState);
    } catch {
      // Ignore subscriber errors
    }
  });
}

export function getSharedFlowyState() {
  return sharedFlowyState;
}

export function subscribeFlowyState(listener) {
  flowySubscribers.add(listener);
  return () => flowySubscribers.delete(listener);
}

export function updateSharedFlowyMessages(updater) {
  const nextMessages =
    typeof updater === 'function' ? updater(sharedFlowyState.messages) : updater;
  const persisted = setStoredFlowyHistory(Array.isArray(nextMessages) ? nextMessages : []);
  sharedFlowyState = {
    ...sharedFlowyState,
    messages: persisted,
  };
  notifyFlowySubscribers();
  return persisted;
}

export function clearSharedFlowyMessages() {
  clearStoredFlowyHistory();
  sharedFlowyState = {
    ...sharedFlowyState,
    messages: [],
    offlineAlert: '',
  };
  notifyFlowySubscribers();
}

export function setSharedFlowyLoading(isLoading) {
  sharedFlowyState = {
    ...sharedFlowyState,
    isLoading: Boolean(isLoading),
  };
  notifyFlowySubscribers();
}

export function setSharedFlowyOfflineAlert(offlineAlert) {
  sharedFlowyState = {
    ...sharedFlowyState,
    offlineAlert: offlineAlert || '',
  };
  notifyFlowySubscribers();
}

/**
 * Bersihkan tanda bintang markdown (* atau **) DAN selalu hapus tag [[ACTION:...]]
 * meskipun parsing JSON gagal, agar pengguna tidak pernah melihat kode internal di bubble chat.
 */
export function stripMarkdownAsterisks(str = '') {
  if (typeof str !== 'string') return '';
  return str
    .replace(/\[\[?\s*ACTION\s*:[\s\S]*?\]\]?/gi, '')
    .replace(/\[\[?\s*ACTION[\s\S]*$/gi, '')
    .replace(/\*\*/g, '')
    .replace(/(^|\s)\*+(\S)/g, '$1$2')
    .replace(/(\S)\*+(\s|$|[.,!?])/g, '$1$2')
    .replace(/\*/g, '')
    .trim();
}

/**
 * Regex Fleksibel: Ekstrak semua tag [[ACTION:TIPE:{...}]] atau [ACTION:TIPE:{...}]
 * Toleran terhadap spasi/baris baru tak terduga, dan selalu menghapus tag dari teks balasan.
 */
export function parseFlowyActionsFromText(rawText = '') {
  if (typeof rawText !== 'string' || !rawText) {
    return { cleanReply: '', cleanText: '', actions: [] };
  }

  const actions = [];
  const actionRegex = /\[\[?\s*ACTION\s*:\s*([A-Z_]+)\s*:\s*(\{[\s\S]*?\})\s*\]\]?/gi;

  let match;
  while ((match = actionRegex.exec(rawText)) !== null) {
    const actionType = (match[1] || '').trim().toUpperCase();
    const jsonPayloadStr = (match[2] || '').trim();
    try {
      const payload = JSON.parse(jsonPayloadStr);
      if (payload && typeof payload === 'object') {
        actions.push({
          type: actionType,
          ...payload,
        });
      }
    } catch {
      // Fallback: jika kutip JSON kurang rapi, ekstrak pasangan key-value string sederhana
      const extracted = { type: actionType };
      const titleMatch = jsonPayloadStr.match(/"title"\s*:\s*"([^"]+)"/i);
      const matchTitleMatch = jsonPayloadStr.match(/"matchTitle"\s*:\s*"([^"]+)"/i);
      const textMatch = jsonPayloadStr.match(/"text"\s*:\s*"([^"]+)"/i);
      if (titleMatch?.[1]) extracted.title = titleMatch[1].trim();
      if (matchTitleMatch?.[1]) extracted.matchTitle = matchTitleMatch[1].trim();
      if (textMatch?.[1]) extracted.text = textMatch[1].trim();
      if (Object.keys(extracted).length > 1 || actionType.startsWith('RESET_') || actionType === 'CHECK_ALL_TODOS') {
        actions.push(extracted);
      }
    }
  }

  const cleaned = stripMarkdownAsterisks(
    rawText
      .replace(/\[\[?\s*ACTION\s*:[\s\S]*?\]\]?/gi, '')
      .replace(/\[\[?\s*ACTION[\s\S]*$/gi, '')
      .trim()
  );

  const finalClean = cleaned || 'Sip bro/sis, langsung gw eksekusi sekarang!';
  return {
    cleanReply: finalClean,
    cleanText: finalClean,
    actions,
  };
}

/**
 * Deteksi dompet digital / bank dari teks bahasa alami
 */
function detectWalletFromText(text) {
  const lower = text.toLowerCase();
  if (lower.includes('shopeepay') || lower.includes('spay') || lower.includes('shopee'))
    return 'shopeepay';
  if (lower.includes('gopay') || lower.includes('gojek')) return 'gopay';
  if (lower.includes('dana')) return 'dana';
  if (lower.includes('ovo')) return 'ovo';
  if (lower.includes('qris')) return 'qris';
  if (lower.includes('bca')) return 'bca';
  if (lower.includes('livin') || lower.includes('mandiri')) return 'livin';
  if (lower.includes('brimo') || lower.includes('bri')) return 'brimo';
  if (lower.includes('jago')) return 'jago';
  if (lower.includes('seabank')) return 'seabank';
  if (lower.includes('tunai') || lower.includes('cash')) return 'tunai';
  return 'shopeepay';
}

/**
 * Ekstrak nominal Rupiah dari teks bahasa Indonesia (misal: "25rb", "150.000", "2,5 juta", "50k")
 */
function parseRupiahFromText(text) {
  const lower = text.toLowerCase();
  const jutaMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:juta|jt)\b/);
  if (jutaMatch) {
    const val = parseFloat(jutaMatch[1].replace(',', '.'));
    return Math.round(val * 1_000_000);
  }

  const ribuMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:ribu|rb|k)\b/);
  if (ribuMatch) {
    const val = parseFloat(ribuMatch[1].replace(',', '.'));
    return Math.round(val * 1_000);
  }

  const rawNumberMatch = lower.match(/(?:rp\.?\s*)?(\d{1,3}(?:\.\d{3})+|\d{4,})\b/);
  if (rawNumberMatch) {
    return parseInt(rawNumberMatch[1].replace(/\D/g, ''), 10);
  }
  return null;
}

/**
 * Sistem Flowy Pintar (Juga bertindak sebagai Jaring Pengaman Direct Action jika AI lupa menulis tag)
 */
export function runSmartAssistantParser(prompt, mode, contextSnapshot = {}) {
  const text = prompt.trim();
  const lower = text.toLowerCase();
  const todayIso = new Date().toISOString().split('T')[0];

  // Cek terlebih dahulu fallback aksi edit/reset/ceklis/sleep/activity
  const directInferred = inferFallbackActionsFromPrompt(text);
  if (directInferred.length > 0) {
    return {
      reply: 'Siap bro/sis! Perubahan langsung gw terapkan ke menu terkait.',
      actions: directInferred,
    };
  }

  // 0. Deteksi Curhat / Lelah / Burnout / Butuh Semangat
  if (
    lower.includes('capek') ||
    lower.includes('lelah') ||
    lower.includes('burnout') ||
    lower.includes('stres') ||
    lower.includes('pusing') ||
    lower.includes('males') ||
    lower.includes('malas') ||
    lower.includes('curhat') ||
    lower.includes('berat banget') ||
    lower.includes('overwhelmed')
  ) {
    return {
      reply:
        'Wajar banget kalau lu ngerasa capek, bro/sis. Ambil napas dalam, minum air putih segelas, terus istirahat 15 menit dulu ya — tugas yang belum kelar cicil 1 aja yang paling ringan! 🙌✨',
      actions: [],
    };
  }

  // 1. Deteksi perintah di modul Finance (Tambah / Edit Pemasukan & Pengeluaran)
  const amount = parseRupiahFromText(text);
  const isEditFinance =
    (lower.includes('edit') || lower.includes('ubah') || lower.includes('ganti')) &&
    (mode === 'finance' ||
      lower.includes('transaksi') ||
      lower.includes('pengeluaran') ||
      lower.includes('pemasukan') ||
      lower.includes('gaji'));

  if (isEditFinance && amount && amount > 0) {
    const cleanedMatch = text
      .replace(/^(tolong\s+|flowy\s+)?(edit|ubah|ganti)\s+(transaksi|pengeluaran|pemasukan)?\s*/i, '')
      .replace(/\b(jadi|menjadi)\b[\s\S]*$/i, '')
      .trim();
    return {
      reply: `Siap bro/sis, transaksi "${cleanedMatch || 'terakhir'}" di menu Finance & Tracker udah gw update jadi Rp ${amount.toLocaleString('id-ID')}! 💸`,
      actions: [
        {
          type: 'EDIT_FINANCE',
          matchTitle: cleanedMatch || 'terakhir',
          amount,
          ...(lower.includes('pemasukan') ? { txType: 'income' } : {}),
          ...(lower.includes('pengeluaran') ? { txType: 'expense' } : {}),
        },
      ],
    };
  }

  const isFinanceIntent =
    mode === 'finance' ||
    Boolean(
      amount &&
        (lower.includes('beli') ||
          lower.includes('bayar') ||
          lower.includes('catat') ||
          lower.includes('pengeluaran') ||
          lower.includes('pemasukan') ||
          lower.includes('gaji') ||
          lower.includes('masuk') ||
          lower.includes('jajan') ||
          lower.includes('topup') ||
          lower.includes('transfer'))
    );

  if (isFinanceIntent && amount && amount > 0) {
    const isIncome =
      lower.includes('pemasukan') ||
      lower.includes('gaji') ||
      lower.includes('bonus') ||
      lower.includes('freelance') ||
      lower.includes('masuk') ||
      lower.includes('terima');
    const wallet = detectWalletFromText(text);
    const cleanedTitle =
      text
        .replace(
          /^(tolong\s+|flowy\s+)?(catat|catetin|tambah|tambahkan|masukkan)\s+(transaksi|pengeluaran|pemasukan)?\s*/i,
          ''
        )
        .replace(
          /\b(pakai|pake|via|lewat|di|ke)\s+(shopeepay|spay|gopay|dana|ovo|qris|bca|livin|mandiri|brimo|bri|jago|seabank|tunai|cash)\b/gi,
          ''
        )
        .replace(/\b(?:rp\.?\s*)?\d+(?:[.,]\d+)?\s*(?:juta|jt|ribu|rb|k)?\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim() || (isIncome ? 'Pemasukan Kas' : 'Pengeluaran Harian');

    const titleFormatted = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
    let category = isIncome ? 'Gaji' : 'Makanan & Belanja';
    if (isIncome && lower.includes('freelance')) category = 'Freelance';
    else if (isIncome && lower.includes('investasi')) category = 'Investasi';
    else if (isIncome && lower.includes('hadiah')) category = 'Hadiah';
    else if (
      !isIncome &&
      (lower.includes('bensin') ||
        lower.includes('gojek') ||
        lower.includes('grab') ||
        lower.includes('parkir') ||
        lower.includes('tol'))
    )
      category = 'Transportasi';
    else if (
      !isIncome &&
      (lower.includes('listrik') ||
        lower.includes('wifi') ||
        lower.includes('internet') ||
        lower.includes('tagihan') ||
        lower.includes('pulsa') ||
        lower.includes('kuota') ||
        lower.includes('langganan'))
    )
      category = 'Tagihan & Utilitas';
    else if (
      !isIncome &&
      (lower.includes('kopi') ||
        lower.includes('nonton') ||
        lower.includes('kafe') ||
        lower.includes('game') ||
        lower.includes('hiburan'))
    )
      category = 'Hiburan & Kuliner';

    return {
      reply: `Sip bro/sis, ${isIncome ? 'pemasukan' : 'pengeluaran'} "${titleFormatted}" Rp ${amount.toLocaleString('id-ID')} via ${wallet.toUpperCase()} udah langsung gw catat di menu Finance & Tracker! 💸`,
      actions: [
        {
          type: 'ADD_FINANCE',
          title: titleFormatted,
          txType: isIncome ? 'income' : 'expense',
          amount,
          category,
          wallet,
          date: todayIso,
          notes: 'Dicatat sama Flowy',
        },
      ],
    };
  }

  // 2. Deteksi tambah minum air (Wellness)
  const waterMatch = lower.match(/(?:minum|air|hidrasi).*?(\d{2,4})\s*(?:ml)?|(\d{2,4})\s*ml/);
  if (waterMatch && (mode === 'wellness' || lower.includes('minum') || lower.includes('air'))) {
    const ml = parseInt(waterMatch[1] || waterMatch[2], 10);
    if (ml > 0 && ml <= 5000) {
      return {
        reply: `Mantap, +${ml} ml air udah langsung gw tambahin ke menu Wellness & Health (Hidrasi)! 💧`,
        actions: [{ type: 'ADD_WATER', amountMl: ml }],
      };
    }
  }

  // 3. Deteksi Quick Goals
  if (lower.includes('goal') || lower.includes('sasaran') || lower.includes('target impian')) {
    let cat = 'today';
    if (lower.includes('minggu') || lower.includes('week')) cat = 'week';
    else if (lower.includes('bulan') || lower.includes('month')) cat = 'month';
    else if (lower.includes('tahun') || lower.includes('year')) cat = 'year';
    else if (lower.includes('hidup') || lower.includes('life')) cat = 'life';

    const gTitle =
      text
        .replace(
          /^(tolong\s+|flowy\s+)?(tambah|tambahkan|buat|buatkan)\s+(quick\s+goals?|goals?|sasaran|target)\s*(hari\s+ini|minggu\s+ini|bulan\s+ini|tahun\s+ini|tujuan\s+hidup)?\s*/i,
          ''
        )
        .trim() || 'Target Baru';

    return {
      reply: `Siap bro/sis, sasaran "${gTitle}" udah langsung gw tambahkan di menu Quick Goals! 🎯`,
      actions: [
        {
          type: 'ADD_GOAL',
          title: gTitle,
          category: cat,
          progress: 0,
        },
      ],
    };
  }

  // 4. Deteksi tambah gerakan workout (Wellness)
  const dayMatch = text.match(/\b(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu)\b/i);
  if (
    (mode === 'wellness' ||
      lower.includes('workout') ||
      lower.includes('gerakan') ||
      lower.includes('latihan')) &&
    (lower.includes('tambah') || lower.includes('masukkan') || lower.includes('jadwal'))
  ) {
    const targetDay = dayMatch
      ? dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase()
      : contextSnapshot.dayName || 'Senin';
    const setsMatch = text.match(/(\d+\s*set\s*x\s*[\w\s-]+)/i);
    const sets = setsMatch ? setsMatch[1].trim() : '3 Set x 12 Reps';
    const exerciseName =
      text
        .replace(
          /^(tolong\s+|flowy\s+)?(tambah|tambahkan|masukkan)\s+(gerakan|latihan|workout)?\s*/i,
          ''
        )
        .replace(/\b(di\s+hari|hari)\s+(senin|selasa|rabu|kamis|jumat|sabtu|minggu)\b/gi, '')
        .replace(/(\d+\s*set\s*x\s*[\w\s-]+)/i, '')
        .trim() || 'Push Up Variasi';

    return {
      reply: `Gaskeun! Gerakan "${exerciseName}" (${sets}) udah langsung masuk ke menu Wellness & Health (Workout hari ${targetDay})! 💪`,
      actions: [
        {
          type: 'ADD_WORKOUT_EXERCISE',
          day: targetDay,
          name: exerciseName,
          sets,
          notes: 'Ditambahin sama Flowy',
        },
      ],
    };
  }

  // 5. Deteksi pembuatan / pin Catatan / Memo (Notes)
  if (
    (mode === 'notes' || lower.includes('catatan') || lower.includes('memo') || lower.includes('note')) &&
    (lower.includes('pin') || lower.includes('sematkan')) &&
    !lower.includes('buat')
  ) {
    const noteMatch = text
      .replace(/^(tolong\s+|flowy\s+)?(pin|unpin|sematkan|lepas\s+pin)\s+(catatan|memo|note)?\s*/i, '')
      .trim();
    return {
      reply: `Sip, catatan "${noteMatch || 'terakhir'}" di menu Notes & Memo udah gw update status Pin-nya! 📌`,
      actions: [
        {
          type: 'PIN_NOTE',
          matchTitle: noteMatch || 'terakhir',
          pinned: !lower.includes('unpin') && !lower.includes('lepas'),
        },
      ],
    };
  }

  if (
    (mode === 'notes' || lower.includes('catatan') || lower.includes('memo')) &&
    (lower.includes('buat') ||
      lower.includes('catat') ||
      lower.includes('tambah') ||
      lower.includes('simpan') ||
      lower.includes('ide') ||
      lower.includes('resep') ||
      lower.includes('daftar'))
  ) {
    let color = 'amber';
    if (lower.includes('mint') || lower.includes('hijau') || lower.includes('emerald'))
      color = 'emerald';
    else if (lower.includes('lavender') || lower.includes('indigo') || lower.includes('biru'))
      color = 'indigo';
    else if (lower.includes('rose') || lower.includes('pink') || lower.includes('merah'))
      color = 'rose';
    else if (lower.includes('sky') || lower.includes('cyan')) color = 'cyan';
    else if (lower.includes('violet') || lower.includes('ungu') || lower.includes('purple'))
      color = 'purple';

    let category = 'Ide';
    if (lower.includes('resep') || lower.includes('masak') || lower.includes('makan'))
      category = 'Resep';
    else if (lower.includes('buku') || lower.includes('baca') || lower.includes('rangkuman'))
      category = 'Buku';
    else if (lower.includes('kerja') || lower.includes('rapat') || lower.includes('proyek'))
      category = 'Kerja';
    else if (lower.includes('kutipan') || lower.includes('quote')) category = 'Kutipan';
    else if (lower.includes('belanja') || lower.includes('pribadi')) category = 'Pribadi';

    const rawTopic = text
      .replace(
        /^(tolong\s+|flowy\s+)?(buat|buatkan|catat|catetin|tambah|tambahkan|simpan)\s+(catatan|memo|notes)?\s*/i,
        ''
      )
      .replace(
        /\bwarna\s+(kuning|mint|hijau|lavender|rose|pink|sky|violet|ungu|amber|emerald|indigo|cyan|purple)\b/gi,
        ''
      )
      .trim();

    const noteTitle = rawTopic
      ? rawTopic.charAt(0).toUpperCase() + rawTopic.slice(1, 55)
      : 'Catatan Flowy';

    let generatedContent = `• Fokus utama: ${rawTopic || text}\n• Disusun rapi sama Flowy di menu Notes & Memo.`;
    if (lower.includes('belanja')) {
      generatedContent = `- Beras / Oat / Karbo sehat\n- Dada ayam / Telur (sumber protein)\n- Sayur hijau & buah segar\n- Susu almond / kopi\n- Kebutuhan harian kos/rumah`;
    } else if (lower.includes('pomodoro')) {
      generatedContent = `1. Pilih 1 kerjaan paling penting\n2. Fokus gas 25 menit (HP silent dulu)\n3. Break 5 menit buat minum/stretching\n4. Ulang 4 sesi, baru istirahat panjang 20 menit.`;
    }

    return {
      reply: `Beres bro/sis, catatan "${noteTitle}" udah langsung gw simpen di menu Notes & Memo lu! 📝`,
      actions: [
        {
          type: 'ADD_NOTE',
          title: noteTitle,
          content: generatedContent,
          category,
          color,
          pinned: lower.includes('pin') || lower.includes('penting'),
        },
      ],
    };
  }

  // 6. Deteksi Jadwal Harian (Schedule)
  const timeRangeMatch = text.match(/(\d{1,2}[:.]\d{2})\s*(?:-|sampai|s\/d)\s*(\d{1,2}[:.]\d{2})/i);
  if (
    timeRangeMatch &&
    (lower.includes('jadwal') || lower.includes('agenda') || lower.includes('schedule') || lower.includes('planning'))
  ) {
    const startTime = timeRangeMatch[1].replace('.', ':').padStart(5, '0');
    const endTime = timeRangeMatch[2].replace('.', ':').padStart(5, '0');
    const schedTitle =
      text
        .replace(
          /^(tolong\s+|flowy\s+)?(jadwalkan|jadwalin|tambah\s+jadwal|tambah\s+agenda)\s*/i,
          ''
        )
        .replace(timeRangeMatch[0], '')
        .trim() || 'Sesi Fokus Produktif';

    return {
      reply: `Oke siap, agenda "${schedTitle}" jam ${startTime} - ${endTime} WIB udah langsung masuk ke menu Life & Planning (Jadwal Harian)! ⏰`,
      actions: [
        {
          type: 'ADD_SCHEDULE',
          title: schedTitle,
          startTime,
          endTime,
          category: 'Kerja',
          color: 'indigo',
          notes: 'Dijadwalin sama Flowy',
        },
      ],
    };
  }

  // 7. Deteksi Tambah To-Do / Tugas Masa Depan
  if (
    lower.includes('tambah tugas') ||
    lower.includes('tambahkan tugas') ||
    lower.includes('tambah todo') ||
    lower.includes('tambahkan todo') ||
    lower.includes('ingatkan') ||
    lower.includes('ingetin') ||
    lower.includes('besok mau') ||
    lower.includes('nanti mau') ||
    lower.includes('harus ') ||
    lower.includes('todo') ||
    lower.includes('to-do') ||
    (mode === 'dashboard' &&
      (lower.includes('tambah ') || lower.includes('buat tugas') || lower.includes('catat tugas')))
  ) {
    const timeSingle = text.match(/(?:jam|pukul)\s*(\d{1,2}(?:[:.]\d{2})?)/i);
    let dueTime = '12:00';
    if (timeSingle) {
      const rawT = timeSingle[1].replace('.', ':');
      dueTime = rawT.includes(':') ? rawT.padStart(5, '0') : `${rawT.padStart(2, '0')}:00`;
    }
    let priority = 'Sedang';
    if (lower.includes('prioritas tinggi') || lower.includes('penting') || lower.includes('urgent'))
      priority = 'Tinggi';
    else if (lower.includes('prioritas rendah') || lower.includes('santai')) priority = 'Rendah';

    let category = 'Pribadi';
    if (
      lower.includes('kerja') ||
      lower.includes('kantor') ||
      lower.includes('meeting') ||
      lower.includes('rapat') ||
      lower.includes('laporan')
    )
      category = 'Kerja';
    else if (
      lower.includes('belajar') ||
      lower.includes('kuliah') ||
      lower.includes('tugas') ||
      lower.includes('baca')
    )
      category = 'Belajar';
    else if (
      lower.includes('olahraga') ||
      lower.includes('gym') ||
      lower.includes('workout') ||
      lower.includes('sehat')
    )
      category = 'Kesehatan';
    else if (lower.includes('belanja') || lower.includes('beli')) category = 'Belanja';
    else if (lower.includes('bayar') || lower.includes('tagihan')) category = 'Finansial';

    const cleanTodo =
      text
        .replace(
          /^(tolong\s+|flowy\s+)?(tambahkan|tambah|tambahin|buat|catat|ingatkan\s+saya|ingatkan\s+gw|ingatkan|ingetin\s+gw|ingetin|besok\s+mau|nanti\s+mau)\s+(tugas|todo|to-do|ingatan|untuk)?\s*/i,
          ''
        )
        .replace(/(?:jam|pukul)\s*\d{1,2}(?:[:.]\d{2})?/i, '')
        .replace(/prioritas\s+(tinggi|sedang|rendah)/i, '')
        .trim() || 'Tugas Baru Hari Ini';

    const todoTitle = cleanTodo.charAt(0).toUpperCase() + cleanTodo.slice(1);

    return {
      reply: `Siap bro/sis, tugas "${todoTitle}" udah langsung gw catat di menu To-Do Harian! ✅`,
      actions: [
        {
          type: 'ADD_TODO',
          title: todoTitle,
          category,
          priority,
          dueDate: todayIso,
          dueTime,
        },
      ],
    };
  }

  return {
    reply:
      'Halo bro/sis! Gw Flowy ✨ Gw bisa tambah, edit, centang/uncheck, pin, atau reset data di seluruh menu: To-Do Harian, Life & Planning (Harian/Mingguan/Bulanan), Morning & Night Routine, Notes & Memo, Quick Goals, Wellness & Health (Air, Tidur, Langkah, Workout), dan Finance. Kasih tau aja mau ngapain!',
    actions: [],
  };
}

/**
 * Bangun System Instruction Lengkap + Ringkasan Data Lokal Real-Time
 * agar Flowy tidak pernah berhalusinasi dan mampu mengedit/menceklis semua jenis tugas.
 */
function buildFullSystemInstruction(mode, contextSnapshot = {}) {
  const todayIso = new Date().toISOString().split('T')[0];
  const liveSummary = buildLiveAppContextSummary();

  return `Kamu adalah Flowy, asisten produktivitas cerdas di aplikasi DailyFlow. Sifatmu to-the-point, gaul santai (boleh pakai gw/lu, bro/sis), suportif, dan langsung mengeksekusi perintah.

ATURAN UTAMA & ANTI-HALUSINASI (WAJIB DITAATI):
1. EKSEKUSI LANGSUNG TANPA BASA-BASI: Jika pengguna meminta menambah, mengedit (tanggal, kategori, kalender, prioritas, jam, judul, nominal), mencentang/uncheck, mem-pin, atau mereset tugas di menu mana pun, JANGAN bertanya balik. Langsung lakukan dengan mengeluarkan tag [[ACTION:TIPE:{...}]] di akhir pesanmu.
2. JANGAN PERNAH BERHALUSINASI:
   - DILARANG KERAS mengatakan tugas/data "sudah ditambahkan", "sudah diedit", "sudah dicentang", atau "sudah direset" TANPA menyertakan tag [[ACTION:TIPE:{...}]] yang valid di akhir responsmu.
   - Sebutkan secara jelas di menu mana aksi tersebut dilakukan (contoh: "Udah gw tambahkan di menu To-Do Harian", "Udah gw centang di menu Life & Planning Mingguan", "Udah gw update di menu Quick Goals", "Udah gw edit di menu Wellness & Health - Pelacak Tidur").
3. HANYA EKSEKUSI INSTRUKSI AKSI: Hanya buat/edit/centang tugas jika pengguna memberikan instruksi rencana, pencatatan, perubahan, atau checklist — bukan saat sekadar curhat atau mengobrol biasa.
4. JANGAN gunakan tanda bintang (* atau **) di dalam teks balasan. Cukup jawab 1-2 kalimat santai + tag [[ACTION:...]] di paling akhir.

DAFTAR LENGKAP TAG AKSI YANG TERSEDIA (Bisa keluarkan lebih dari 1 tag jika pengguna meminta beberapa hal sekaligus):

A. MENU TO-DO HARIAN (Kategori: Kerja, Belajar, Pribadi, Kesehatan, Belanja, Finansial | Prioritas: Tinggi, Sedang, Rendah):
- Tambah To-Do: [[ACTION:ADD_TODO:{"title":"isi tugas","category":"Kerja","priority":"Tinggi","dueDate":"${todayIso}","dueTime":"14:00"}]]
- Edit To-Do (judul/tanggal/kategori/prioritas/jam/status): [[ACTION:EDIT_TODO:{"matchTitle":"kata kunci judul lama","title":"judul baru","dueDate":"2026-10-31","dueTime":"16:00","category":"Belajar","priority":"Tinggi","completed":false}]]
- Centang / Uncheck 1 To-Do: [[ACTION:TOGGLE_TODO:{"matchTitle":"kata kunci judul","completed":true}]]
- Centang / Uncheck SEMUA To-Do: [[ACTION:CHECK_ALL_TODOS:{"completed":true}]] (atau {"completed":false} untuk uncheck semua)
- Hapus To-Do: [[ACTION:DELETE_TODO:{"matchTitle":"kata kunci judul"}]]

B. MENU LIFE & PLANNING (Jadwal Harian, Mingguan 7 Hari, Kalender Bulanan/Tahunan):
- Tambah Jadwal Harian: [[ACTION:ADD_SCHEDULE:{"title":"nama agenda","startTime":"09:00","endTime":"11:00","category":"Kerja","status":"Pending"}]]
- Edit Jadwal Harian: [[ACTION:EDIT_SCHEDULE:{"matchTitle":"kata kunci agenda","title":"judul baru","startTime":"10:00","endTime":"12:00","category":"Kerja","status":"Done"}]]
- Ceklis / Uncheck Jadwal Harian: [[ACTION:TOGGLE_SCHEDULE:{"matchTitle":"kata kunci agenda","done":true}]] (atau {"all":true,"done":true} untuk ceklis semua jadwal harian)
- Tambah Rencana Mingguan (Hari: Senin..Minggu): [[ACTION:ADD_WEEKLY_PLAN:{"day":"Senin","title":"isi rencana","category":"Kerja","priority":"Tinggi"}]]
- Edit / Ceklis Rencana Mingguan: [[ACTION:EDIT_WEEKLY_PLAN:{"day":"Senin","matchTitle":"kata kunci","title":"judul baru","priority":"Tinggi","done":true}]]
- Ceklis Semua Rencana Mingguan: [[ACTION:TOGGLE_WEEKLY_PLAN:{"all":true,"day":"Senin","done":true}]] (hilangkan "day" jika ingin semua hari)
- Tambah Kalender Bulanan (day: 1..31): [[ACTION:ADD_MONTHLY_EVENT:{"day":15,"title":"nama acara","category":"Finansial"}]]
- Edit Kalender Bulanan: [[ACTION:EDIT_MONTHLY_EVENT:{"matchTitle":"kata kunci acara","day":20,"title":"judul baru","category":"Kerja"}]]
- Tambah Prioritas Bulanan: [[ACTION:ADD_MONTHLY_PRIORITY:{"text":"isi prioritas bulanan"}]]
- Ceklis / Uncheck Prioritas Bulanan: [[ACTION:TOGGLE_MONTHLY_PRIORITY:{"matchTitle":"kata kunci prioritas","done":true}]]
- Ubah Fokus Bulanan/Tahunan: [[ACTION:SET_MONTHLY_FOCUS:{"focus":"teks fokus baru"}]]

C. MENU MORNING & NIGHT ROUTINE (routineType: "morning" untuk Pagi, "night" untuk Malam, "all" untuk keduanya):
- Tambah Rutinitas: [[ACTION:ADD_ROUTINE:{"routineType":"morning","title":"nama rutinitas","targetTime":"06:00","icon":"☀️"}]]
- Edit Rutinitas: [[ACTION:EDIT_ROUTINE:{"matchTitle":"kata kunci rutinitas","title":"judul baru","targetTime":"06:30","completed":true}]]
- Ceklis / Uncheck Rutinitas: [[ACTION:TOGGLE_ROUTINE:{"matchTitle":"kata kunci rutinitas","completed":true}]] (atau {"all":true,"routineType":"morning","completed":true})
- Reset Checklist Rutinitas Pagi/Malam: [[ACTION:RESET_ROUTINE:{"routineType":"all"}]] (isi "morning", "night", atau "all")

D. MENU NOTES & MEMO (Kategori: Ide, Resep, Buku, Pribadi, Kerja, Kutipan | Warna: amber, emerald, indigo, rose, cyan, purple):
- Buat Catatan: [[ACTION:ADD_NOTE:{"title":"judul","content":"isi catatan","category":"Ide","color":"amber","pinned":false}]]
- Edit Catatan (judul/isi/kategori/warna/pin): [[ACTION:EDIT_NOTE:{"matchTitle":"kata kunci judul","title":"judul baru","category":"Kerja","color":"emerald","pinned":true}]]
- Pin / Unpin Catatan: [[ACTION:PIN_NOTE:{"matchTitle":"kata kunci judul","pinned":true}]]

E. MENU QUICK GOALS (category: "today"=Hari Ini, "week"=Minggu Ini, "month"=Bulan Ini, "year"=Tahun Ini, "life"=Tujuan Hidup):
- Tambah Sasaran / Goal Baru: [[ACTION:ADD_GOAL:{"title":"judul goal","category":"week","targetDate":"Akhir Minggu","progress":0,"milestones":["Langkah 1","Langkah 2"]}]]
- Edit Goal (judul/kategori/targetDate/progress): [[ACTION:EDIT_GOAL:{"matchTitle":"kata kunci goal","title":"judul baru","category":"month","targetDate":"Akhir Bulan","progress":80}]]
- Tambah Tugas/Milestone ke dalam Goal: [[ACTION:ADD_GOAL_MILESTONE:{"matchGoal":"kata kunci goal","text":"nama sub-tugas baru","done":false}]]
- Ceklis / Uncheck Tugas/Milestone di Goal: [[ACTION:TOGGLE_GOAL_MILESTONE:{"matchGoal":"kata kunci goal","matchMilestone":"kata kunci sub-tugas","done":true}]]

F. MENU WELLNESS & HEALTH (Hidrasi Air, Pelacak Tidur, Aktivitas Fisik & Langkah, Mood, Workout):
- Tambah Air Putih: [[ACTION:ADD_WATER:{"amountMl":500}]]
- Reset / Set Air Putih: [[ACTION:RESET_WATER:{"currentMl":0}]]
- Edit Pelacak Tidur (Jam Tidur, Jam Bangun, Kualitas 1-5, Catatan): [[ACTION:UPDATE_SLEEP:{"bedTime":"22:30","wakeTime":"06:00","quality":5,"notes":"Tidur sangat pulas"}]]
- Edit Aktivitas Fisik / Langkah Kaki: [[ACTION:UPDATE_ACTIVITY:{"addSteps":1000,"workoutMinutes":45,"workoutType":"Lari Pagi","caloriesBurned":350}]] (gunakan {"resetSteps":true} untuk reset langkah ke 0, atau {"steps":5000} untuk set angka pasti)
- Edit Mood Harian: [[ACTION:UPDATE_MOOD:{"selected":"Sangat Bahagia","note":"Hari yang produktif"}]]
- Tambah Gerakan Workout: [[ACTION:ADD_WORKOUT_EXERCISE:{"day":"${contextSnapshot.dayName || 'Senin'}","name":"Push Up","sets":"4 Set x 15 Reps"}]]
- Edit / Ceklis Gerakan Workout: [[ACTION:EDIT_WORKOUT_EXERCISE:{"day":"Senin","matchName":"Push Up","sets":"4 Set x 20 Reps","done":true}]]

G. MENU FINANCE & TRACKER (txType: "income"=Pemasukan, "expense"=Pengeluaran | wallet: bca, mandiri, livin, brimo, jago, seabank, gopay, ovo, dana, shopeepay, qris, tunai):
- Tambah Transaksi: [[ACTION:ADD_FINANCE:{"title":"nama transaksi","txType":"expense","amount":25000,"category":"Makanan & Belanja","wallet":"qris","date":"${todayIso}"}]]
- Edit Pemasukan / Pengeluaran: [[ACTION:EDIT_FINANCE:{"matchTitle":"kata kunci transaksi lama","title":"judul baru","txType":"expense","amount":50000,"category":"Transportasi","wallet":"gopay","date":"${todayIso}"}]]
- Hapus Transaksi: [[ACTION:DELETE_FINANCE:{"matchTitle":"kata kunci transaksi"}]]

DATA LOKAL PENGGUNA SAAT INI (Gunakan untuk mencocokkan matchTitle saat mengedit/menceklis):
${liveSummary}`;
}

/**
 * Fungsi Utama Pemanggil Gemini API dengan:
 * - Sliding Window 6-8 pesan terakhir
 * - generationConfig: { temperature: 0.25, maxOutputTokens: 600 } (akurat, anti-halusinasi & cepat 1-2 detik)
 * - Direct Action Execution via [[ACTION:...]] untuk seluruh 8 menu
 */
export async function askGeminiAssistant({
  prompt,
  mode = 'dashboard',
  contextSnapshot = {},
  chatHistory = [],
  checkOnlineNow,
}) {
  // 1. NETWORK GUARD: Cek koneksi sebelum menyentuh jaringan sama sekali
  const isOnline =
    typeof checkOnlineNow === 'function'
      ? checkOnlineNow()
      : typeof navigator !== 'undefined'
      ? Boolean(navigator.onLine)
      : true;

  if (!isOnline) {
    return {
      ok: false,
      offline: true,
      reply: OFFLINE_FRIENDLY_MESSAGE,
      actions: [],
    };
  }

  // Ambil API key dari localStorage ('dailyflow_gemini_api_key')
  const apiKey = getStoredGeminiApiKey();

  if (!apiKey) {
    return {
      ok: false,
      missingKey: true,
      offline: false,
      reply: MISSING_API_KEY_MESSAGE,
      actions: [],
    };
  }

  // 2. Bangun System Instruction Lengkap beserta Data Real-Time
  const systemInstruction = buildFullSystemInstruction(mode, contextSnapshot);

  // 3. SLIDING WINDOW: Ambil maksimal 6 pesan percakapan terakhir
  const recentMessages = Array.isArray(chatHistory)
    ? chatHistory
        .filter(
          (m) =>
            m &&
            typeof m.text === 'string' &&
            m.id !== 'welcome' &&
            m.id !== 'flowy-welcome' &&
            !m.isOfflineNotice
        )
        .slice(-6)
    : [];

  const contents = [
    ...recentMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    })),
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ];

  // Siapkan urutan model (prioritaskan model yang sudah terbukti aktif agar 0 delay)
  const orderedModels = cachedWorkingModel
    ? [cachedWorkingModel, ...MODEL_CANDIDATES.filter((m) => m !== cachedWorkingModel)]
    : MODEL_CANDIDATES;

  const primaryEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

  for (const candidateModel of orderedModels) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        clearTimeout(timeoutId);
        return {
          ok: false,
          offline: true,
          reply: OFFLINE_FRIENDLY_MESSAGE,
          actions: [],
        };
      }

      const endpoint =
        candidateModel === 'gemini-3.5-flash-lite'
          ? primaryEndpoint
          : `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:generateContent?key=${encodeURIComponent(
              apiKey
            )}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents,
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 300,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404 || response.status === 400) {
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawText) throw new Error('Empty response');

      cachedWorkingModel = candidateModel;

      // 4. Ekstrak tag [[ACTION:...]] dengan Regex fleksibel & bersihkan dari teks bubble chat
      const { cleanReply, actions } = parseFlowyActionsFromText(rawText);

      // Jaring pengaman Anti-Halusinasi: jika user jelas memberi perintah tapi LLM lupa menulis tag [[ACTION:...]]
      let finalActions = actions;
      if (finalActions.length === 0) {
        const smartFallback = runSmartAssistantParser(prompt, mode, contextSnapshot);
        if (Array.isArray(smartFallback.actions) && smartFallback.actions.length > 0) {
          finalActions = smartFallback.actions;
        }
      }

      return {
        ok: true,
        offline: false,
        reply: cleanReply,
        actions: finalActions,
      };
    } catch {
      clearTimeout(timeoutId);
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return {
          ok: false,
          offline: true,
          reply: OFFLINE_FRIENDLY_MESSAGE,
          actions: [],
        };
      }
    }
  }

  // Fallback cerdas jika seluruh kandidat sedang limit namun user tetap online
  const fallback = runSmartAssistantParser(prompt, mode, contextSnapshot);
  return {
    ok: true,
    offline: false,
    ...fallback,
  };
}
