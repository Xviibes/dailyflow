import { playSound } from './audio';
import { fireConfetti } from './confetti';
import { INITIAL_WORKOUT_SCHEDULE } from '../constants/defaultData';

// Menyimpan referensi live state & setter dari App.jsx agar Flowy di menu mana pun & widget mengambang
// memiliki akses penuh ke seluruh 8 modul aplikasi tanpa halusinasi.
let liveAppBridge = {
  data: {},
  setters: {},
  soundEnabled: true,
};

export function syncFlowyAppBridge({ data = {}, setters = {}, soundEnabled = true } = {}) {
  liveAppBridge = {
    data,
    setters,
    soundEnabled,
  };
}

export function getFlowyAppBridge() {
  return liveAppBridge;
}

// Pencocokan teks pintar (fuzzy substring & token matching) untuk mencari tugas/item yang ingin diedit/diceklis
function findBestMatch(items = [], query = '', keyField = 'title') {
  if (!Array.isArray(items) || items.length === 0) return null;
  const rawQ = String(query || '').trim().toLowerCase();
  if (!rawQ) return items[0];

  // Jika user menyebut "terakhir", "barusan", "paling atas", "pertama"
  if (
    rawQ === 'terakhir' ||
    rawQ === 'barusan' ||
    rawQ === 'terbaru' ||
    rawQ === 'pertama' ||
    rawQ === 'paling atas'
  ) {
    return items[0];
  }

  // 1. Exact match pada ID atau Title
  const exact = items.find(
    (it) =>
      String(it.id || '').toLowerCase() === rawQ ||
      String(it[keyField] || '').trim().toLowerCase() === rawQ
  );
  if (exact) return exact;

  // 2. Substring match langsung
  const sub = items.find((it) =>
    String(it[keyField] || '')
      .toLowerCase()
      .includes(rawQ)
  );
  if (sub) return sub;

  // 3. Reverse substring match (query mengandung judul item)
  const rev = items.find((it) => {
    const val = String(it[keyField] || '').trim().toLowerCase();
    return val.length >= 3 && rawQ.includes(val);
  });
  if (rev) return rev;

  // 4. Token overlap score
  const qTokens = rawQ.split(/\s+/).filter((w) => w.length >= 2);
  if (qTokens.length === 0) return null;

  let bestItem = null;
  let bestScore = 0;
  for (const it of items) {
    const targetStr = String(it[keyField] || '').toLowerCase();
    let score = 0;
    for (const tk of qTokens) {
      if (targetStr.includes(tk)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestItem = it;
    }
  }

  return bestScore > 0 ? bestItem : null;
}

function normalizeDayName(inputDay) {
  const s = String(inputDay || '').trim().toLowerCase();
  if (s.includes('sen')) return 'Senin';
  if (s.includes('sel')) return 'Selasa';
  if (s.includes('rab')) return 'Rabu';
  if (s.includes('kam')) return 'Kamis';
  if (s.includes('jum')) return 'Jumat';
  if (s.includes('sab')) return 'Sabtu';
  if (s.includes('min') || s.includes('ahad')) return 'Minggu';
  return 'Senin';
}

function normalizeTodoCategory(cat) {
  const s = String(cat || '').trim().toLowerCase();
  if (s.includes('kerj') || s.includes('kant') || s.includes('proyek')) return 'Kerja';
  if (s.includes('belaj') || s.includes('kuliah') || s.includes('sekolah') || s.includes('kursus'))
    return 'Belajar';
  if (s.includes('sehat') || s.includes('olahraga') || s.includes('dokter') || s.includes('gym'))
    return 'Kesehatan';
  if (s.includes('belanj') || s.includes('beli') || s.includes('market')) return 'Belanja';
  if (s.includes('finan') || s.includes('uang') || s.includes('tagih') || s.includes('bayar'))
    return 'Finansial';
  if (s.includes('prib') || s.includes('rumah')) return 'Pribadi';
  return 'Pribadi';
}

function normalizePriority(prio) {
  const s = String(prio || '').trim().toLowerCase();
  if (s.includes('tinggi') || s.includes('high') || s.includes('penting') || s.includes('urgent'))
    return 'Tinggi';
  if (s.includes('rendah') || s.includes('low') || s.includes('santai')) return 'Rendah';
  return 'Sedang';
}

function normalizeNoteCategory(cat) {
  const s = String(cat || '').trim().toLowerCase();
  if (s.includes('resep') || s.includes('masak') || s.includes('makan')) return 'Resep';
  if (s.includes('buku') || s.includes('baca') || s.includes('rangkum')) return 'Buku';
  if (s.includes('prib') || s.includes('belanj') || s.includes('harian')) return 'Pribadi';
  if (s.includes('kerj') || s.includes('rapat') || s.includes('proyek')) return 'Kerja';
  if (s.includes('kutip') || s.includes('quote') || s.includes('motiv')) return 'Kutipan';
  return 'Ide';
}

function normalizeNoteColor(col) {
  const s = String(col || '').trim().toLowerCase();
  if (s.includes('emerald') || s.includes('mint') || s.includes('hijau')) return 'emerald';
  if (s.includes('indigo') || s.includes('lavender') || s.includes('biru')) return 'indigo';
  if (s.includes('rose') || s.includes('pink') || s.includes('merah')) return 'rose';
  if (s.includes('cyan') || s.includes('sky') || s.includes('langit')) return 'cyan';
  if (s.includes('purple') || s.includes('ungu') || s.includes('violet')) return 'purple';
  return 'amber';
}

function normalizeGoalCategory(cat) {
  const s = String(cat || '').trim().toLowerCase();
  if (s.includes('week') || s.includes('minggu')) return 'week';
  if (s.includes('month') || s.includes('bulan')) return 'month';
  if (s.includes('year') || s.includes('tahun')) return 'year';
  if (s.includes('life') || s.includes('hidup') || s.includes('masa depan')) return 'life';
  return 'today';
}

const GOAL_CATEGORY_LABEL = {
  today: 'Hari Ini',
  week: 'Minggu Ini',
  month: 'Bulan Ini',
  year: 'Tahun Ini',
  life: 'Tujuan Hidup',
};

const MOOD_LOOKUP = [
  { key: 'sangat bahagia', label: 'Sangat Bahagia', emoji: '🥳' },
  { key: 'bahagia', label: 'Bahagia', emoji: '😊' },
  { key: 'senang', label: 'Bahagia', emoji: '😊' },
  { key: 'tenang', label: 'Tenang & Damai', emoji: '😌' },
  { key: 'damai', label: 'Tenang & Damai', emoji: '😌' },
  { key: 'lelah', label: 'Lelah / Ngantuk', emoji: '🥱' },
  { key: 'capek', label: 'Lelah / Ngantuk', emoji: '🥱' },
  { key: 'ngantuk', label: 'Lelah / Ngantuk', emoji: '🥱' },
  { key: 'stres', label: 'Stres / Cemas', emoji: '😣' },
  { key: 'cemas', label: 'Stres / Cemas', emoji: '😣' },
  { key: 'sedih', label: 'Sedih / Down', emoji: '😢' },
  { key: 'down', label: 'Sedih / Down', emoji: '😢' },
];

function calculateSleepHours(bedTime, wakeTime) {
  if (!bedTime || !wakeTime || !bedTime.includes(':') || !wakeTime.includes(':')) return 7.5;
  const [bH, bM] = bedTime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);
  if (Number.isNaN(bH) || Number.isNaN(wH)) return 7.5;
  let bedMins = bH * 60 + (bM || 0);
  let wakeMins = wH * 60 + (wM || 0);
  if (wakeMins <= bedMins) wakeMins += 24 * 60;
  return Math.round(((wakeMins - bedMins) / 60) * 10) / 10;
}

// Ringkasan data real-time dari semua menu untuk disuntikkan ke System Prompt Gemini
// agar AI mengetahui persis tugas/item apa saja yang sedang ada dan tidak berhalusinasi.
export function buildLiveAppContextSummary() {
  const { data } = liveAppBridge;
  if (!data) return '';

  const lines = [];
  const todayIso = new Date().toISOString().split('T')[0];
  lines.push(`Tanggal Hari Ini: ${todayIso}`);

  // 1. To-Do List
  if (Array.isArray(data.todos)) {
    const todoPreview = data.todos
      .slice(0, 12)
      .map(
        (t) =>
          `"${t.title}" [${t.completed ? 'SELESAI' : 'BELUM'} | Kat:${t.category} | Prio:${t.priority} | Tgl:${t.dueDate} | Jam:${t.dueTime}]`
      )
      .join('; ');
    lines.push(`1. MENU TO-DO HARIAN (${data.todos.length} tugas): ${todoPreview || 'Kosong'}`);
  }

  // 2. Life & Planning (Harian, Mingguan, Bulanan)
  if (Array.isArray(data.schedule)) {
    const schedPreview = data.schedule
      .slice(0, 10)
      .map((s) => `"${s.title}" (${s.startTime}-${s.endTime} | ${s.category} | ${s.status || 'Pending'})`)
      .join('; ');
    lines.push(`2A. MENU LIFE & PLANNING - JADWAL HARIAN: ${schedPreview || 'Kosong'}`);
  }

  if (data.weeklyData && typeof data.weeklyData === 'object') {
    const daysSummary = Object.entries(data.weeklyData)
      .map(([day, list]) => {
        if (!Array.isArray(list) || list.length === 0) return `${day}: -`;
        const items = list.map((i) => `"${i.title}"(${i.done ? '✓' : 'o'})`).join(', ');
        return `${day}: [${items}]`;
      })
      .join(' | ');
    lines.push(`2B. MENU LIFE & PLANNING - MINGGUAN (7 HARI): ${daysSummary}`);
  }

  if (data.monthlyData && typeof data.monthlyData === 'object') {
    const prios = (data.monthlyData.topPriorities || [])
      .map((p) => `"${p.text}"(${p.done ? '✓' : 'o'})`)
      .join(', ');
    const evts = (data.monthlyData.events || [])
      .slice(0, 8)
      .map((e) => `Tgl ${e.day}:"${e.title}"(${e.category})`)
      .join(', ');
    lines.push(
      `2C. MENU LIFE & PLANNING - KALENDER BULANAN: Fokus="${data.monthlyData.focus || ''}" | Prioritas=[${prios}] | Kalender=[${evts}]`
    );
  }

  // 3. Morning & Night Routine
  if (data.routines && typeof data.routines === 'object') {
    const mList = (data.routines.morning || [])
      .map((r) => `"${r.title}"(${r.targetTime},${r.completed ? '✓' : 'o'})`)
      .join(', ');
    const nList = (data.routines.night || [])
      .map((r) => `"${r.title}"(${r.targetTime},${r.completed ? '✓' : 'o'})`)
      .join(', ');
    lines.push(`3. MENU MORNING & NIGHT ROUTINE: Pagi=[${mList}] | Malam=[${nList}]`);
  }

  // 4. Notes & Memo
  if (Array.isArray(data.notes)) {
    const notePreview = data.notes
      .slice(0, 10)
      .map((n) => `"${n.title}" [Kat:${n.category} | Pin:${n.pinned ? 'YA' : 'TIDAK'} | Warna:${n.color}]`)
      .join('; ');
    lines.push(`4. MENU NOTES & MEMO (${data.notes.length} catatan): ${notePreview || 'Kosong'}`);
  }

  // 5. Quick Goals
  if (Array.isArray(data.goals)) {
    const goalPreview = data.goals
      .slice(0, 10)
      .map((g) => {
        const ms = (g.milestones || []).map((m) => `"${m.text}"(${m.done ? '✓' : 'o'})`).join(',');
        return `"${g.title}" [Tab:${g.category} | Progres:${g.progress}% | Target:${g.targetDate} | Sub:[${ms}]]`;
      })
      .join('; ');
    lines.push(`5. MENU QUICK GOALS: ${goalPreview || 'Kosong'}`);
  }

  // 6. Wellness & Health
  if (data.wellness && typeof data.wellness === 'object') {
    const w = data.wellness;
    lines.push(
      `6. MENU WELLNESS & HEALTH: Air=${w.water?.current || 0}/${w.water?.target || 2500}ml | Mood=${w.mood?.selected || 'Bahagia'} | Tidur=${w.sleep?.bedTime || '23:00'}-${w.sleep?.wakeTime || '06:00'}(${w.sleep?.hours || 7}jam, Kualitas:${w.sleep?.quality || 4}/5, Catatan:"${w.sleep?.notes || ''}") | Aktivitas=${w.activity?.steps || 0}/${w.activity?.stepsTarget || 8000} langkah, Workout:${w.activity?.workoutMinutes || 0}mnt (${w.activity?.workoutType || '-'}), Kalori:${w.activity?.caloriesBurned || 0}kkal`
    );
  }

  // 7. Finance
  if (data.finance && Array.isArray(data.finance.transactions)) {
    const txPreview = data.finance.transactions
      .slice(0, 10)
      .map(
        (tx) =>
          `"${tx.title}" [${tx.type === 'income' ? 'PEMASUKAN' : 'PENGELUARAN'} Rp${tx.amount} | Kat:${tx.category} | Wallet:${tx.wallet} | Tgl:${tx.date}]`
      )
      .join('; ');
    lines.push(`7. MENU FINANCE & TRACKER: ${txPreview || 'Kosong'}`);
  }

  return lines.join('\n');
}

// Eksekutor Aksi Terpadu untuk Seluruh 8 Modul DailyFlow
export function applyFlowyLocalActions(actions = [], overrideSetters = {}) {
  if (!Array.isArray(actions) || actions.length === 0) return [];

  const bridge = getFlowyAppBridge();
  const data = bridge.data || {};
  const setters = { ...(bridge.setters || {}), ...(overrideSetters || {}) };
  const soundEnabled =
    overrideSetters.soundEnabled !== undefined ? overrideSetters.soundEnabled : bridge.soundEnabled;

  const {
    addTodo,
    setTodos,
    setSchedule,
    setWeeklyData,
    setMonthlyData,
    setRoutines,
    setNotes,
    setGoals,
    setWellness,
    setFinance,
  } = setters;

  const appliedLabels = [];

  actions.forEach((act) => {
    if (!act || !act.type) return;
    const type = String(act.type).trim().toUpperCase();

    try {
      // =========================================================================
      // 1. MENU TO-DO HARIAN (ADD, EDIT, TOGGLE, CHECK_ALL, DELETE)
      // =========================================================================
      if (type === 'ADD_TODO' && (typeof addTodo === 'function' || typeof setTodos === 'function')) {
        const newTodo = {
          id: `td-ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: String(act.title || 'Tugas Baru').trim(),
          category: act.category ? normalizeTodoCategory(act.category) : 'Pribadi',
          priority: act.priority ? normalizePriority(act.priority) : 'Sedang',
          dueDate: act.dueDate || new Date().toISOString().split('T')[0],
          dueTime: act.dueTime || '12:00',
          completed: Boolean(act.completed),
          createdAt: Date.now(),
        };
        if (typeof addTodo === 'function') {
          addTodo(newTodo);
        } else {
          setTodos((prev) => [newTodo, ...(Array.isArray(prev) ? prev : [])]);
        }
        if (Array.isArray(data.todos)) {
          data.todos = [newTodo, ...data.todos];
        }
        appliedLabels.push(
          `📍 Menu To-Do Harian: Tugas "${newTodo.title}" ditambahkan (${newTodo.dueDate} • ${newTodo.dueTime} • ${newTodo.priority})`
        );
      } else if (type === 'EDIT_TODO' && typeof setTodos === 'function') {
        const currentTodos = Array.isArray(data.todos) ? data.todos : [];
        const target = findBestMatch(currentTodos, act.matchTitle || act.oldTitle || act.title);
        if (target) {
          const updatedTitle = act.newTitle || act.title || target.title;
          const updatedCat = act.category ? normalizeTodoCategory(act.category) : target.category;
          const updatedPrio = act.priority ? normalizePriority(act.priority) : target.priority;
          const updatedDate = act.dueDate || target.dueDate;
          const updatedTime = act.dueTime || target.dueTime;
          const updatedDone =
            typeof act.completed === 'boolean' ? act.completed : target.completed;

          setTodos((prev) =>
            (Array.isArray(prev) ? prev : []).map((t) =>
              t.id === target.id
                ? {
                    ...t,
                    title: updatedTitle,
                    category: updatedCat,
                    priority: updatedPrio,
                    dueDate: updatedDate,
                    dueTime: updatedTime,
                    completed: updatedDone,
                  }
                : t
            )
          );
          appliedLabels.push(
            `📍 Menu To-Do Harian: "${updatedTitle}" diedit (${updatedCat} • ${updatedPrio} • ${updatedDate} ${updatedTime})`
          );
        }
      } else if (type === 'TOGGLE_TODO' && typeof setTodos === 'function') {
        const currentTodos = Array.isArray(data.todos) ? data.todos : [];
        if (act.all) {
          const nextState = typeof act.completed === 'boolean' ? act.completed : true;
          setTodos((prev) =>
            (Array.isArray(prev) ? prev : []).map((t) => ({ ...t, completed: nextState }))
          );
          appliedLabels.push(
            `📍 Menu To-Do Harian: Semua tugas ${nextState ? 'dicentang selesai ✅' : 'di-uncheck ⭕'}`
          );
        } else {
          const target = findBestMatch(currentTodos, act.matchTitle || act.title);
          if (target) {
            const nextState =
              typeof act.completed === 'boolean' ? act.completed : !target.completed;
            setTodos((prev) =>
              (Array.isArray(prev) ? prev : []).map((t) =>
                t.id === target.id ? { ...t, completed: nextState } : t
              )
            );
            appliedLabels.push(
              `📍 Menu To-Do Harian: "${target.title}" ${nextState ? 'dicentang selesai ✅' : 'di-uncheck ⭕'}`
            );
          }
        }
      } else if (type === 'CHECK_ALL_TODOS' && typeof setTodos === 'function') {
        const nextState = typeof act.completed === 'boolean' ? act.completed : true;
        const catFilter = act.category ? normalizeTodoCategory(act.category) : null;
        setTodos((prev) =>
          (Array.isArray(prev) ? prev : []).map((t) =>
            !catFilter || t.category === catFilter ? { ...t, completed: nextState } : t
          )
        );
        appliedLabels.push(
          `📍 Menu To-Do Harian: Semua tugas ${catFilter ? `kategori ${catFilter} ` : ''}${nextState ? 'dicentang selesai ✅' : 'dibuka kembali ⭕'}`
        );
      } else if (type === 'DELETE_TODO' && typeof setTodos === 'function') {
        const currentTodos = Array.isArray(data.todos) ? data.todos : [];
        const target = findBestMatch(currentTodos, act.matchTitle || act.title);
        if (target) {
          setTodos((prev) => (Array.isArray(prev) ? prev : []).filter((t) => t.id !== target.id));
          appliedLabels.push(`📍 Menu To-Do Harian: Tugas "${target.title}" dihapus`);
        }
      }

      // =========================================================================
      // 2A. MENU LIFE & PLANNING — JADWAL HARIAN (ADD, EDIT, TOGGLE, DELETE)
      // =========================================================================
      else if (type === 'ADD_SCHEDULE' && typeof setSchedule === 'function') {
        const newSched = {
          id: `ds-ai-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          title: String(act.title || 'Agenda Baru').trim(),
          startTime: act.startTime || '09:00',
          endTime: act.endTime || '10:00',
          category: act.category ? normalizeTodoCategory(act.category) : 'Kerja',
          color: act.color || 'indigo',
          notes: act.notes || 'Dijadwalkan bareng Flowy',
          status: act.status === 'Done' || act.done ? 'Done' : 'Pending',
        };
        setSchedule((prev) =>
          [...(Array.isArray(prev) ? prev : []), newSched].sort((a, b) =>
            (a.startTime || '').localeCompare(b.startTime || '')
          )
        );
        appliedLabels.push(
          `📍 Menu Life & Planning (Jadwal Harian): "${newSched.title}" (${newSched.startTime}-${newSched.endTime}) ditambahkan`
        );
      } else if (type === 'EDIT_SCHEDULE' && typeof setSchedule === 'function') {
        const currentSched = Array.isArray(data.schedule) ? data.schedule : [];
        const target = findBestMatch(currentSched, act.matchTitle || act.oldTitle || act.title);
        if (target) {
          const nextTitle = act.newTitle || act.title || target.title;
          const nextStart = act.startTime || target.startTime;
          const nextEnd = act.endTime || target.endTime;
          const nextCat = act.category ? normalizeTodoCategory(act.category) : target.category;
          const nextStatus =
            act.status ||
            (typeof act.done === 'boolean' ? (act.done ? 'Done' : 'Pending') : target.status);
          setSchedule((prev) =>
            (Array.isArray(prev) ? prev : [])
              .map((s) =>
                s.id === target.id
                  ? {
                      ...s,
                      title: nextTitle,
                      startTime: nextStart,
                      endTime: nextEnd,
                      category: nextCat,
                      notes: act.notes !== undefined ? act.notes : s.notes,
                      status: nextStatus,
                    }
                  : s
              )
              .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
          );
          appliedLabels.push(
            `📍 Menu Life & Planning (Jadwal Harian): "${nextTitle}" (${nextStart}-${nextEnd}) diupdate`
          );
        }
      } else if (type === 'TOGGLE_SCHEDULE' && typeof setSchedule === 'function') {
        const currentSched = Array.isArray(data.schedule) ? data.schedule : [];
        if (act.all) {
          const nextStatus = act.done === false || act.status === 'Pending' ? 'Pending' : 'Done';
          setSchedule((prev) =>
            (Array.isArray(prev) ? prev : []).map((s) => ({ ...s, status: nextStatus }))
          );
          appliedLabels.push(
            `📍 Menu Life & Planning (Jadwal Harian): Semua agenda diubah ke ${nextStatus}`
          );
        } else {
          const target = findBestMatch(currentSched, act.matchTitle || act.title);
          if (target) {
            const isCurrentlyDone = target.status === 'Done';
            const nextStatus =
              typeof act.done === 'boolean'
                ? act.done
                  ? 'Done'
                  : 'Pending'
                : isCurrentlyDone
                ? 'Pending'
                : 'Done';
            setSchedule((prev) =>
              (Array.isArray(prev) ? prev : []).map((s) =>
                s.id === target.id ? { ...s, status: nextStatus } : s
              )
            );
            appliedLabels.push(
              `📍 Menu Life & Planning (Jadwal Harian): "${target.title}" ${nextStatus === 'Done' ? 'dicentang selesai ✅' : 'diubah ke Pending ⭕'}`
            );
          }
        }
      } else if (type === 'DELETE_SCHEDULE' && typeof setSchedule === 'function') {
        const currentSched = Array.isArray(data.schedule) ? data.schedule : [];
        const target = findBestMatch(currentSched, act.matchTitle || act.title);
        if (target) {
          setSchedule((prev) => (Array.isArray(prev) ? prev : []).filter((s) => s.id !== target.id));
          appliedLabels.push(
            `📍 Menu Life & Planning (Jadwal Harian): "${target.title}" dihapus`
          );
        }
      }

      // =========================================================================
      // 2B. MENU LIFE & PLANNING — WEEKLY PLANNER 7 HARI
      // =========================================================================
      else if (type === 'ADD_WEEKLY_PLAN' && typeof setWeeklyData === 'function') {
        const day = normalizeDayName(act.day || 'Senin');
        const newTask = {
          id: `wp-ai-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          title: String(act.title || 'Target Mingguan').trim(),
          category: act.category ? normalizeTodoCategory(act.category) : 'Kerja',
          priority: act.priority ? normalizePriority(act.priority) : 'Sedang',
          done: Boolean(act.done),
        };
        setWeeklyData((prev) => ({
          ...(prev || {}),
          [day]: [...(prev?.[day] || []), newTask],
        }));
        appliedLabels.push(
          `📍 Menu Life & Planning (Mingguan - ${day}): "${newTask.title}" ditambahkan`
        );
      } else if (
        (type === 'EDIT_WEEKLY_PLAN' || type === 'TOGGLE_WEEKLY_PLAN') &&
        typeof setWeeklyData === 'function'
      ) {
        const currentWeekly = data.weeklyData || {};
        if (act.all) {
          const nextDone = typeof act.done === 'boolean' ? act.done : true;
          const targetDay = act.day ? normalizeDayName(act.day) : null;
          setWeeklyData((prev) => {
            const next = { ...(prev || {}) };
            Object.keys(next).forEach((d) => {
              if (!targetDay || d === targetDay) {
                next[d] = (next[d] || []).map((t) => ({ ...t, done: nextDone }));
              }
            });
            return next;
          });
          appliedLabels.push(
            `📍 Menu Life & Planning (Mingguan): Semua tugas ${targetDay ? `hari ${targetDay} ` : ''}${nextDone ? 'dicentang selesai ✅' : 'di-uncheck ⭕'}`
          );
        } else {
          // Cari task di seluruh hari
          let foundDay = null;
          let foundTask = null;
          const searchDays = act.day
            ? [normalizeDayName(act.day), ...Object.keys(currentWeekly)]
            : Object.keys(currentWeekly);
          for (const d of searchDays) {
            const match = findBestMatch(currentWeekly[d] || [], act.matchTitle || act.title);
            if (match) {
              foundDay = d;
              foundTask = match;
              break;
            }
          }
          if (foundDay && foundTask) {
            const nextDone =
              typeof act.done === 'boolean'
                ? act.done
                : type === 'TOGGLE_WEEKLY_PLAN'
                ? !foundTask.done
                : foundTask.done;
            const nextTitle = act.newTitle || (type === 'EDIT_WEEKLY_PLAN' && act.title ? act.title : foundTask.title);
            const nextCat = act.category ? normalizeTodoCategory(act.category) : foundTask.category;
            const nextPrio = act.priority ? normalizePriority(act.priority) : foundTask.priority;

            setWeeklyData((prev) => ({
              ...(prev || {}),
              [foundDay]: (prev?.[foundDay] || []).map((t) =>
                t.id === foundTask.id
                  ? { ...t, title: nextTitle, category: nextCat, priority: nextPrio, done: nextDone }
                  : t
              ),
            }));
            appliedLabels.push(
              `📍 Menu Life & Planning (Mingguan - ${foundDay}): "${nextTitle}" ${nextDone ? 'dicentang selesai ✅' : 'diupdate'}`
            );
          }
        }
      }

      // =========================================================================
      // 2C. MENU LIFE & PLANNING — KALENDER BULANAN & PRIORITAS BULANAN
      // =========================================================================
      else if (type === 'ADD_MONTHLY_EVENT' && typeof setMonthlyData === 'function') {
        const dayNum = Math.min(31, Math.max(1, Number(act.day) || new Date().getDate()));
        const newEvt = {
          id: `me-ai-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          day: dayNum,
          title: String(act.title || 'Agenda Bulanan').trim(),
          category: act.category ? normalizeTodoCategory(act.category) : 'Kerja',
          color: act.color || 'indigo',
        };
        setMonthlyData((prev) => ({
          ...(prev || {}),
          events: [...(prev?.events || []), newEvt],
        }));
        appliedLabels.push(
          `📍 Menu Life & Planning (Kalender Bulanan Tgl ${dayNum}): "${newEvt.title}" ditambahkan`
        );
      } else if (type === 'EDIT_MONTHLY_EVENT' && typeof setMonthlyData === 'function') {
        const evts = data.monthlyData?.events || [];
        const target = findBestMatch(evts, act.matchTitle || act.title);
        if (target) {
          const nextDay = act.day ? Math.min(31, Math.max(1, Number(act.day))) : target.day;
          const nextTitle = act.newTitle || act.title || target.title;
          const nextCat = act.category ? normalizeTodoCategory(act.category) : target.category;
          setMonthlyData((prev) => ({
            ...(prev || {}),
            events: (prev?.events || []).map((e) =>
              e.id === target.id
                ? { ...e, day: nextDay, title: nextTitle, category: nextCat }
                : e
            ),
          }));
          appliedLabels.push(
            `📍 Menu Life & Planning (Kalender Bulanan): "${nextTitle}" (Tgl ${nextDay}) diupdate`
          );
        }
      } else if (type === 'ADD_MONTHLY_PRIORITY' && typeof setMonthlyData === 'function') {
        const text = String(act.text || act.title || 'Prioritas Bulanan').trim();
        const newP = {
          id: `mp-ai-${Date.now()}`,
          text,
          done: Boolean(act.done),
        };
        setMonthlyData((prev) => ({
          ...(prev || {}),
          topPriorities: [...(prev?.topPriorities || []), newP],
        }));
        appliedLabels.push(
          `📍 Menu Life & Planning (Prioritas Bulanan): "${text}" ditambahkan`
        );
      } else if (type === 'TOGGLE_MONTHLY_PRIORITY' && typeof setMonthlyData === 'function') {
        const prios = data.monthlyData?.topPriorities || [];
        if (act.all) {
          const nextDone = typeof act.done === 'boolean' ? act.done : true;
          setMonthlyData((prev) => ({
            ...(prev || {}),
            topPriorities: (prev?.topPriorities || []).map((p) => ({ ...p, done: nextDone })),
          }));
          appliedLabels.push(
            `📍 Menu Life & Planning (Prioritas Bulanan): Semua prioritas ${nextDone ? 'dicentang ✅' : 'di-uncheck ⭕'}`
          );
        } else {
          const target = findBestMatch(prios, act.matchTitle || act.text || act.title, 'text');
          if (target) {
            const nextDone = typeof act.done === 'boolean' ? act.done : !target.done;
            setMonthlyData((prev) => ({
              ...(prev || {}),
              topPriorities: (prev?.topPriorities || []).map((p) =>
                p.id === target.id ? { ...p, done: nextDone } : p
              ),
            }));
            appliedLabels.push(
              `📍 Menu Life & Planning (Prioritas Bulanan): "${target.text}" ${nextDone ? 'dicentang ✅' : 'di-uncheck ⭕'}`
            );
          }
        }
      } else if (type === 'SET_MONTHLY_FOCUS' && typeof setMonthlyData === 'function') {
        const focusText = String(act.focus || act.text || act.title || '').trim();
        if (focusText) {
          setMonthlyData((prev) => ({ ...(prev || {}), focus: focusText }));
          appliedLabels.push(`📍 Menu Life & Planning (Kalender Bulanan): Fokus bulanan diupdate`);
        }
      }

      // =========================================================================
      // 3. MENU MORNING & NIGHT ROUTINE (ADD, EDIT, TOGGLE, RESET)
      // =========================================================================
      else if (type === 'ADD_ROUTINE' && typeof setRoutines === 'function') {
        const rType = String(act.routineType || 'morning').toLowerCase().includes('night') ||
          String(act.routineType || '').toLowerCase().includes('malam')
          ? 'night'
          : 'morning';
        const newR = {
          id: `${rType === 'morning' ? 'mr' : 'nr'}-ai-${Date.now()}`,
          title: String(act.title || 'Rutinitas Baru').trim(),
          targetTime: act.targetTime || (rType === 'morning' ? '06:30' : '21:30'),
          icon: act.icon || (rType === 'morning' ? '☀️' : '🌙'),
          completed: Boolean(act.completed),
        };
        setRoutines((prev) => ({
          ...(prev || {}),
          [rType]: [...(prev?.[rType] || []), newR],
        }));
        appliedLabels.push(
          `📍 Menu Morning & Night Routine (${rType === 'morning' ? 'Pagi' : 'Malam'}): "${newR.title}" (${newR.targetTime}) ditambahkan`
        );
      } else if (
        (type === 'EDIT_ROUTINE' || type === 'TOGGLE_ROUTINE') &&
        typeof setRoutines === 'function'
      ) {
        const currentRoutines = data.routines || { morning: [], night: [] };
        if (act.all) {
          const nextDone = typeof act.completed === 'boolean' ? act.completed : true;
          const rawScope = String(act.routineType || 'all').toLowerCase();
          const doMorning = rawScope.includes('all') || rawScope.includes('semua') || rawScope.includes('morning') || rawScope.includes('pagi');
          const doNight = rawScope.includes('all') || rawScope.includes('semua') || rawScope.includes('night') || rawScope.includes('malam');

          setRoutines((prev) => ({
            ...(prev || {}),
            morning: doMorning
              ? (prev?.morning || []).map((i) => ({ ...i, completed: nextDone }))
              : prev?.morning || [],
            night: doNight
              ? (prev?.night || []).map((i) => ({ ...i, completed: nextDone }))
              : prev?.night || [],
          }));
          appliedLabels.push(
            `📍 Menu Morning & Night Routine: Checklist ${doMorning && doNight ? 'Pagi & Malam' : doMorning ? 'Pagi' : 'Malam'} ${nextDone ? 'dicentang semua ✅' : 'di-uncheck ⭕'}`
          );
        } else {
          let targetGroup = 'morning';
          let target = findBestMatch(currentRoutines.morning || [], act.matchTitle || act.title);
          if (!target) {
            targetGroup = 'night';
            target = findBestMatch(currentRoutines.night || [], act.matchTitle || act.title);
          }
          if (target) {
            const nextTitle = act.newTitle || (type === 'EDIT_ROUTINE' && act.title ? act.title : target.title);
            const nextTime = act.targetTime || target.targetTime;
            const nextDone =
              typeof act.completed === 'boolean'
                ? act.completed
                : type === 'TOGGLE_ROUTINE'
                ? !target.completed
                : target.completed;

            setRoutines((prev) => ({
              ...(prev || {}),
              [targetGroup]: (prev?.[targetGroup] || []).map((i) =>
                i.id === target.id
                  ? { ...i, title: nextTitle, targetTime: nextTime, completed: nextDone }
                  : i
              ),
            }));
            appliedLabels.push(
              `📍 Menu Morning & Night Routine (${targetGroup === 'morning' ? 'Pagi' : 'Malam'}): "${nextTitle}" ${nextDone ? 'dicentang selesai ✅' : 'diupdate'}`
            );
          }
        }
      } else if (type === 'RESET_ROUTINE' && typeof setRoutines === 'function') {
        const rawScope = String(act.routineType || 'all').toLowerCase();
        const resetMorning =
          rawScope === 'all' ||
          rawScope.includes('semua') ||
          rawScope.includes('morning') ||
          rawScope.includes('pagi');
        const resetNight =
          rawScope === 'all' ||
          rawScope.includes('semua') ||
          rawScope.includes('night') ||
          rawScope.includes('malam');

        setRoutines((prev) => ({
          ...(prev || {}),
          morning: resetMorning
            ? (prev?.morning || []).map((i) => ({ ...i, completed: false }))
            : prev?.morning || [],
          night: resetNight
            ? (prev?.night || []).map((i) => ({ ...i, completed: false }))
            : prev?.night || [],
        }));
        appliedLabels.push(
          `📍 Menu Morning & Night Routine: Checklist ${
            resetMorning && resetNight ? 'Pagi & Malam' : resetMorning ? 'Pagi' : 'Malam'
          } berhasil di-reset ⭕`
        );
      }

      // =========================================================================
      // 4. MENU NOTES & MEMO (ADD, EDIT, PIN/UNPIN, DELETE)
      // =========================================================================
      else if (type === 'ADD_NOTE' && typeof setNotes === 'function') {
        const newNote = {
          id: `nt-ai-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          title: String(act.title || 'Catatan Flowy').trim(),
          content: String(act.content || act.title || '').trim(),
          category: act.category ? normalizeNoteCategory(act.category) : 'Ide',
          color: act.color ? normalizeNoteColor(act.color) : 'amber',
          pinned: Boolean(act.pinned),
          updatedAt: Date.now(),
        };
        setNotes((prev) => [newNote, ...(Array.isArray(prev) ? prev : [])]);
        appliedLabels.push(
          `📍 Menu Notes & Memo: "${newNote.title}" (${newNote.category}${newNote.pinned ? ' • 📌 Pin' : ''}) ditambahkan`
        );
      } else if ((type === 'EDIT_NOTE' || type === 'PIN_NOTE') && typeof setNotes === 'function') {
        const currentNotes = Array.isArray(data.notes) ? data.notes : [];
        const target = findBestMatch(currentNotes, act.matchTitle || act.oldTitle || act.title);
        if (target) {
          const nextTitle = act.newTitle || (type === 'EDIT_NOTE' && act.title ? act.title : target.title);
          const nextContent = act.content !== undefined ? act.content : target.content;
          const nextCat = act.category ? normalizeNoteCategory(act.category) : target.category;
          const nextColor = act.color ? normalizeNoteColor(act.color) : target.color;
          const nextPinned =
            typeof act.pinned === 'boolean'
              ? act.pinned
              : type === 'PIN_NOTE'
              ? !target.pinned
              : target.pinned;

          setNotes((prev) =>
            (Array.isArray(prev) ? prev : []).map((n) =>
              n.id === target.id
                ? {
                    ...n,
                    title: nextTitle,
                    content: nextContent,
                    category: nextCat,
                    color: nextColor,
                    pinned: nextPinned,
                    updatedAt: Date.now(),
                  }
                : n
            )
          );
          appliedLabels.push(
            `📍 Menu Notes & Memo: "${nextTitle}" diupdate (Kategori: ${nextCat}${nextPinned ? ' • 📌 Disematkan' : ' • Pin dilepas'})`
          );
        }
      } else if (type === 'DELETE_NOTE' && typeof setNotes === 'function') {
        const currentNotes = Array.isArray(data.notes) ? data.notes : [];
        const target = findBestMatch(currentNotes, act.matchTitle || act.title);
        if (target) {
          setNotes((prev) => (Array.isArray(prev) ? prev : []).filter((n) => n.id !== target.id));
          appliedLabels.push(`📍 Menu Notes & Memo: Catatan "${target.title}" dihapus`);
        }
      }

      // =========================================================================
      // 5. MENU QUICK GOALS (ADD_GOAL, EDIT_GOAL, ADD_MILESTONE, TOGGLE_MILESTONE, DELETE)
      // =========================================================================
      else if (type === 'ADD_GOAL' && typeof setGoals === 'function') {
        const cat = normalizeGoalCategory(act.category);
        const rawMilestones = Array.isArray(act.milestones) ? act.milestones : [];
        const formattedMilestones = rawMilestones.map((m) =>
          typeof m === 'string' ? { text: m, done: false } : { text: m.text || 'Target', done: Boolean(m.done) }
        );
        const newGoal = {
          id: `goal-ai-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          title: String(act.title || 'Sasaran Baru').trim(),
          category: cat,
          targetDate: act.targetDate || GOAL_CATEGORY_LABEL[cat] || 'Target Aktif',
          progress: Number(act.progress) || 0,
          milestones: formattedMilestones,
        };
        setGoals((prev) => [newGoal, ...(Array.isArray(prev) ? prev : [])]);
        appliedLabels.push(
          `📍 Menu Quick Goals (${GOAL_CATEGORY_LABEL[cat]}): "${newGoal.title}" ditambahkan`
        );
      } else if (type === 'EDIT_GOAL' && typeof setGoals === 'function') {
        const currentGoals = Array.isArray(data.goals) ? data.goals : [];
        const target = findBestMatch(currentGoals, act.matchTitle || act.oldTitle || act.title);
        if (target) {
          const nextTitle = act.newTitle || act.title || target.title;
          const nextCat = act.category ? normalizeGoalCategory(act.category) : target.category;
          const nextDate = act.targetDate || target.targetDate;
          const nextProg =
            act.progress !== undefined
              ? Math.min(100, Math.max(0, Number(act.progress)))
              : target.progress;
          setGoals((prev) =>
            (Array.isArray(prev) ? prev : []).map((g) =>
              g.id === target.id
                ? {
                    ...g,
                    title: nextTitle,
                    category: nextCat,
                    targetDate: nextDate,
                    progress: nextProg,
                  }
                : g
            )
          );
          appliedLabels.push(
            `📍 Menu Quick Goals (${GOAL_CATEGORY_LABEL[nextCat]}): "${nextTitle}" (${nextProg}%) diupdate`
          );
        }
      } else if (type === 'ADD_GOAL_MILESTONE' && typeof setGoals === 'function') {
        const currentGoals = Array.isArray(data.goals) ? data.goals : [];
        const target = findBestMatch(currentGoals, act.matchGoal || act.matchTitle || act.goalTitle);
        const mText = String(act.text || act.title || 'Langkah Baru').trim();
        if (target && mText) {
          setGoals((prev) =>
            (Array.isArray(prev) ? prev : []).map((g) => {
              if (g.id !== target.id) return g;
              const nextMs = [...(g.milestones || []), { text: mText, done: Boolean(act.done) }];
              const doneCount = nextMs.filter((m) => m.done).length;
              const nextProg = Math.round((doneCount / nextMs.length) * 100);
              return { ...g, milestones: nextMs, progress: nextProg };
            })
          );
          appliedLabels.push(
            `📍 Menu Quick Goals: Tugas "${mText}" ditambahkan ke sasaran "${target.title}"`
          );
        }
      } else if (type === 'TOGGLE_GOAL_MILESTONE' && typeof setGoals === 'function') {
        const currentGoals = Array.isArray(data.goals) ? data.goals : [];
        const target = findBestMatch(
          currentGoals,
          act.matchGoal || act.matchTitle || act.title || act.matchMilestone
        );
        if (target) {
          setGoals((prev) =>
            (Array.isArray(prev) ? prev : []).map((g) => {
              if (g.id !== target.id) return g;
              const msList = Array.isArray(g.milestones) ? g.milestones : [];
              if (act.all || !act.matchMilestone) {
                const nextDone = typeof act.done === 'boolean' ? act.done : true;
                const updatedMs = msList.map((m) => ({ ...m, done: nextDone }));
                return {
                  ...g,
                  milestones: updatedMs,
                  progress: nextDone ? 100 : 0,
                };
              }
              const matchedM = findBestMatch(msList, act.matchMilestone, 'text');
              const updatedMs = msList.map((m) =>
                matchedM && m.text === matchedM.text
                  ? { ...m, done: typeof act.done === 'boolean' ? act.done : !m.done }
                  : m
              );
              const doneCount = updatedMs.filter((m) => m.done).length;
              const nextProg =
                updatedMs.length > 0 ? Math.round((doneCount / updatedMs.length) * 100) : g.progress;
              return { ...g, milestones: updatedMs, progress: nextProg };
            })
          );
          appliedLabels.push(`📍 Menu Quick Goals: Progres "${target.title}" diperbarui ✅`);
        }
      } else if (type === 'DELETE_GOAL' && typeof setGoals === 'function') {
        const currentGoals = Array.isArray(data.goals) ? data.goals : [];
        const target = findBestMatch(currentGoals, act.matchTitle || act.title);
        if (target) {
          setGoals((prev) => (Array.isArray(prev) ? prev : []).filter((g) => g.id !== target.id));
          appliedLabels.push(`📍 Menu Quick Goals: Sasaran "${target.title}" dihapus`);
        }
      }

      // =========================================================================
      // 6. MENU WELLNESS & HEALTH (WATER, SLEEP, ACTIVITY, MOOD, WORKOUT, GRATITUDE)
      // =========================================================================
      else if (type === 'ADD_WATER' && typeof setWellness === 'function') {
        const addMl = Number(act.amountMl) || 250;
        setWellness((prev) => ({
          ...prev,
          water: {
            ...prev.water,
            current: Math.max(0, Math.min((prev?.water?.current || 0) + addMl, 10000)),
            target: act.targetMl ? Number(act.targetMl) : prev?.water?.target || 2500,
          },
        }));
        appliedLabels.push(`📍 Menu Wellness & Health (Hidrasi): +${addMl} ml air putih ditambahkan`);
      } else if (type === 'RESET_WATER' && typeof setWellness === 'function') {
        const nextVal = act.currentMl !== undefined ? Math.max(0, Number(act.currentMl)) : 0;
        setWellness((prev) => ({
          ...prev,
          water: {
            ...prev.water,
            current: nextVal,
            target: act.targetMl ? Number(act.targetMl) : prev?.water?.target || 2500,
          },
        }));
        appliedLabels.push(
          `📍 Menu Wellness & Health (Hidrasi): Asupan air putih di-reset ke ${nextVal} ml`
        );
      } else if (type === 'UPDATE_SLEEP' && typeof setWellness === 'function') {
        const currentSleep = data.wellness?.sleep || {
          bedTime: '23:00',
          wakeTime: '06:15',
          hours: 7.25,
          quality: 4,
          notes: '',
        };
        const nextBed = act.bedTime || currentSleep.bedTime;
        const nextWake = act.wakeTime || currentSleep.wakeTime;
        const nextQuality = act.quality
          ? Math.min(5, Math.max(1, Number(act.quality)))
          : currentSleep.quality;
        const nextNotes = act.notes !== undefined ? act.notes : currentSleep.notes;
        const calcHours =
          act.hours !== undefined ? Number(act.hours) : calculateSleepHours(nextBed, nextWake);

        setWellness((prev) => ({
          ...prev,
          sleep: {
            ...(prev?.sleep || {}),
            bedTime: nextBed,
            wakeTime: nextWake,
            hours: calcHours,
            quality: nextQuality,
            notes: nextNotes,
          },
        }));
        appliedLabels.push(
          `📍 Menu Wellness & Health (Pelacak Tidur): Tidur ${nextBed} - ${nextWake} (${calcHours} jam • Kualitas ⭐${nextQuality}/5)`
        );
      } else if (type === 'UPDATE_ACTIVITY' && typeof setWellness === 'function') {
        setWellness((prev) => {
          const curAct = prev?.activity || {
            steps: 0,
            stepsTarget: 8000,
            workoutMinutes: 0,
            workoutType: '',
            caloriesBurned: 0,
          };
          let nextSteps = curAct.steps;
          if (act.resetSteps) nextSteps = 0;
          else if (act.steps !== undefined) nextSteps = Math.max(0, Number(act.steps));
          else if (act.addSteps !== undefined)
            nextSteps = Math.max(0, curAct.steps + Number(act.addSteps));

          return {
            ...prev,
            activity: {
              ...curAct,
              steps: nextSteps,
              stepsTarget:
                act.stepsTarget !== undefined ? Number(act.stepsTarget) : curAct.stepsTarget,
              workoutMinutes:
                act.workoutMinutes !== undefined
                  ? Number(act.workoutMinutes)
                  : curAct.workoutMinutes,
              workoutType:
                act.workoutType !== undefined ? String(act.workoutType) : curAct.workoutType,
              caloriesBurned:
                act.caloriesBurned !== undefined
                  ? Number(act.caloriesBurned)
                  : curAct.caloriesBurned,
            },
          };
        });
        appliedLabels.push(
          `📍 Menu Wellness & Health (Aktivitas Fisik): Data langkah kaki/olahraga diperbarui`
        );
      } else if (type === 'UPDATE_MOOD' && typeof setWellness === 'function') {
        const rawMood = String(act.selected || act.mood || 'Bahagia').toLowerCase();
        const foundMood =
          MOOD_LOOKUP.find((m) => rawMood.includes(m.key)) || {
            label: act.selected || 'Bahagia',
            emoji: act.emoji || '😊',
          };
        setWellness((prev) => ({
          ...prev,
          mood: {
            ...(prev?.mood || {}),
            selected: foundMood.label,
            emoji: foundMood.emoji,
            note: act.note !== undefined ? act.note : prev?.mood?.note || '',
          },
        }));
        appliedLabels.push(
          `📍 Menu Wellness & Health (Mood): Suasana hati diset ke ${foundMood.emoji} ${foundMood.label}`
        );
      } else if (type === 'ADD_WORKOUT_EXERCISE' && typeof setWellness === 'function') {
        const day = normalizeDayName(act.day || 'Senin');
        const newEx = {
          id: `ex-ai-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          name: String(act.name || act.title || 'Latihan Baru').trim(),
          sets: act.sets || '3 Set x 12 Reps',
          notes: act.notes || 'Ditambahkan bareng Flowy',
          done: Boolean(act.done),
        };
        setWellness((prev) => {
          const currentSched = prev?.workoutSchedule || INITIAL_WORKOUT_SCHEDULE;
          const dayObj = currentSched[day] || {
            focus: `Sesi Hari ${day}`,
            subtitle: 'Latihan kebugaran tubuh',
            icon: '💪',
            color: 'indigo',
            completed: false,
            exercises: [],
          };
          return {
            ...prev,
            workoutSchedule: {
              ...currentSched,
              [day]: {
                ...dayObj,
                exercises: [...(dayObj.exercises || []), newEx],
              },
            },
          };
        });
        appliedLabels.push(
          `📍 Menu Wellness & Health (Workout ${day}): "${newEx.name}" (${newEx.sets}) ditambahkan`
        );
      } else if (
        (type === 'EDIT_WORKOUT_EXERCISE' || type === 'TOGGLE_WORKOUT_EXERCISE') &&
        typeof setWellness === 'function'
      ) {
        const currentSched = data.wellness?.workoutSchedule || INITIAL_WORKOUT_SCHEDULE;
        const targetDay = act.day ? normalizeDayName(act.day) : null;
        if (act.all && targetDay) {
          const nextDone = typeof act.done === 'boolean' ? act.done : true;
          setWellness((prev) => {
            const sched = prev?.workoutSchedule || INITIAL_WORKOUT_SCHEDULE;
            const dObj = sched[targetDay];
            if (!dObj) return prev;
            const updatedEx = (dObj.exercises || []).map((e) => ({ ...e, done: nextDone }));
            return {
              ...prev,
              workoutSchedule: {
                ...sched,
                [targetDay]: { ...dObj, exercises: updatedEx, completed: nextDone },
              },
            };
          });
          appliedLabels.push(
            `📍 Menu Wellness & Health (Workout ${targetDay}): Semua latihan ${nextDone ? 'dicentang selesai ✅' : 'di-reset ⭕'}`
          );
        } else {
          let foundDay = null;
          let foundEx = null;
          const daysList = targetDay
            ? [targetDay, ...Object.keys(currentSched)]
            : Object.keys(currentSched);
          for (const d of daysList) {
            const match = findBestMatch(
              currentSched[d]?.exercises || [],
              act.matchName || act.matchTitle || act.name || act.title,
              'name'
            );
            if (match) {
              foundDay = d;
              foundEx = match;
              break;
            }
          }
          if (foundDay && foundEx) {
            const nextName =
              act.newName || (type === 'EDIT_WORKOUT_EXERCISE' && act.name ? act.name : foundEx.name);
            const nextSets = act.sets || foundEx.sets;
            const nextDone =
              typeof act.done === 'boolean'
                ? act.done
                : type === 'TOGGLE_WORKOUT_EXERCISE'
                ? !foundEx.done
                : foundEx.done;

            setWellness((prev) => {
              const sched = prev?.workoutSchedule || INITIAL_WORKOUT_SCHEDULE;
              const dObj = sched[foundDay];
              const updatedEx = (dObj?.exercises || []).map((e) =>
                e.id === foundEx.id ? { ...e, name: nextName, sets: nextSets, done: nextDone } : e
              );
              return {
                ...prev,
                workoutSchedule: {
                  ...sched,
                  [foundDay]: {
                    ...dObj,
                    exercises: updatedEx,
                    completed: updatedEx.length > 0 && updatedEx.every((x) => x.done),
                  },
                },
              };
            });
            appliedLabels.push(
              `📍 Menu Wellness & Health (Workout ${foundDay}): "${nextName}" ${nextDone ? 'dicentang selesai ✅' : 'diupdate'}`
            );
          }
        }
      } else if (type === 'ADD_GRATITUDE' && typeof setWellness === 'function') {
        const text = String(act.text || act.title || '').trim();
        if (text) {
          setWellness((prev) => ({
            ...prev,
            gratitude: [
              ...(prev?.gratitude || []),
              { id: `gr-ai-${Date.now()}`, text },
            ],
          }));
          appliedLabels.push(`📍 Menu Wellness & Health (Gratitude): "${text}" ditambahkan`);
        }
      }

      // =========================================================================
      // 7. MENU FINANCE & TRACKER (ADD, EDIT, DELETE PEMASUKAN & PENGELUARAN)
      // =========================================================================
      else if (type === 'ADD_FINANCE' && typeof setFinance === 'function') {
        const rawAmount = Number(String(act.amount ?? 0).replace(/[^0-9.-]/g, '')) || 0;
        const txType =
          String(act.txType || act.type || 'expense').toLowerCase().includes('inc') ||
          String(act.txType || '').toLowerCase().includes('masuk')
            ? 'income'
            : 'expense';
        const newTx = {
          id: `tx-ai-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          title: String(act.title || 'Transaksi Flowy').trim(),
          type: txType,
          amount: rawAmount,
          category: act.category || (txType === 'income' ? 'Gaji' : 'Makanan & Belanja'),
          wallet: String(act.wallet || 'shopeepay').toLowerCase(),
          date: act.date || new Date().toISOString().split('T')[0],
          notes: act.notes || 'Dicatat bareng Flowy',
        };
        if (newTx.amount > 0) {
          setFinance((prev) => ({
            ...prev,
            transactions: [newTx, ...(prev?.transactions || [])],
          }));
          appliedLabels.push(
            `📍 Menu Finance & Tracker: ${newTx.type === 'income' ? 'Pemasukan +' : 'Pengeluaran -'}Rp ${newTx.amount.toLocaleString('id-ID')} ("${newTx.title}" • ${newTx.wallet.toUpperCase()}) ditambahkan`
          );
        }
      } else if (type === 'EDIT_FINANCE' && typeof setFinance === 'function') {
        const txList = data.finance?.transactions || [];
        const target = findBestMatch(txList, act.matchTitle || act.oldTitle || act.title);
        if (target) {
          const nextTitle = act.newTitle || act.title || target.title;
          const nextAmount =
            act.amount !== undefined
              ? Number(String(act.amount).replace(/[^0-9.-]/g, '')) || target.amount
              : target.amount;
          const nextType = act.txType
            ? String(act.txType).toLowerCase().includes('inc') ||
              String(act.txType).toLowerCase().includes('masuk')
              ? 'income'
              : 'expense'
            : target.type;
          const nextWallet = act.wallet ? String(act.wallet).toLowerCase() : target.wallet;
          const nextCat = act.category || target.category;
          const nextDate = act.date || target.date;

          setFinance((prev) => ({
            ...prev,
            transactions: (prev?.transactions || []).map((tx) =>
              tx.id === target.id
                ? {
                    ...tx,
                    title: nextTitle,
                    amount: nextAmount,
                    type: nextType,
                    wallet: nextWallet,
                    category: nextCat,
                    date: nextDate,
                    notes: act.notes !== undefined ? act.notes : tx.notes,
                  }
                : tx
            ),
          }));
          appliedLabels.push(
            `📍 Menu Finance & Tracker: "${nextTitle}" diedit menjadi ${nextType === 'income' ? '+' : '-'}Rp ${nextAmount.toLocaleString('id-ID')} (${nextWallet.toUpperCase()})`
          );
        }
      } else if (type === 'DELETE_FINANCE' && typeof setFinance === 'function') {
        const txList = data.finance?.transactions || [];
        const target = findBestMatch(txList, act.matchTitle || act.title);
        if (target) {
          setFinance((prev) => ({
            ...prev,
            transactions: (prev?.transactions || []).filter((tx) => tx.id !== target.id),
          }));
          appliedLabels.push(`📍 Menu Finance & Tracker: Transaksi "${target.title}" dihapus`);
        }
      }
    } catch (err) {
      console.warn('Gagal menerapkan aksi lokal Flowy:', err);
    }
  });

  if (appliedLabels.length > 0) {
    playSound('success', soundEnabled);
    fireConfetti('#6366f1');
  }
  return appliedLabels;
}

// Fallback Deterministik Lokal:
// Jika pengguna meminta aksi secara eksplisit namun model AI lupa menulis tag [[ACTION:...]],
// fungsi ini mendeteksi niat pengguna dan menghasilkan action yang sesuai terhadap data lokal.
export function inferFallbackActionsFromPrompt(promptText = '') {
  const p = String(promptText || '').trim();
  const low = p.toLowerCase();
  if (!p) return [];

  const actions = [];

  // 1. Reset / Tambah Air Putih
  if (/(reset|nolkan|kosongkan)\s+(air|minum|hidrasi)/i.test(low)) {
    actions.push({ type: 'RESET_WATER', currentMl: 0 });
  } else if (/(tambah|minum)\s+(air\s*)?(\d+)\s*(ml|liter|l\b)/i.test(low)) {
    const m = low.match(/(\d+)\s*(ml|liter|l\b)/i);
    if (m) {
      const val = Number(m[1]) * (m[2].startsWith('l') ? 1000 : 1);
      actions.push({ type: 'ADD_WATER', amountMl: val });
    }
  }

  // 2. Reset Rutinitas Pagi / Malam
  if (/reset.*(rutinitas|routine|checklist)/i.test(low)) {
    const isMorning = low.includes('pagi') || low.includes('morning');
    const isNight = low.includes('malam') || low.includes('night');
    actions.push({
      type: 'RESET_ROUTINE',
      routineType: isMorning && !isNight ? 'morning' : !isMorning && isNight ? 'night' : 'all',
    });
  }

  // 3. Centang / Uncheck Semua Todo
  if (/(centang|ceklis|check|selesaikan)\s+semua\s+(tugas|todo)/i.test(low)) {
    actions.push({ type: 'CHECK_ALL_TODOS', completed: !low.includes(' jangan ') && !low.includes('uncheck') && !low.includes('batal') });
  } else if (/(uncheck|batalkan\s+centang|hapus\s+centang)\s+semua\s+(tugas|todo)/i.test(low)) {
    actions.push({ type: 'CHECK_ALL_TODOS', completed: false });
  }

  // 4. Update Jam Tidur / Bangun / Kualitas
  if (/(tidur|sleep|bangun)/i.test(low) && /(\d{1,2}[:.]\d{2})/.test(low)) {
    const times = [...low.matchAll(/(\d{1,2})[:.](\d{2})/g)].map(
      (m) => `${m[1].padStart(2, '0')}:${m[2]}`
    );
    const qMatch = low.match(/(?:kualitas|bintang|rating)\s*(\d)/i);
    const payload = {};
    if (times[0]) payload.bedTime = times[0];
    if (times[1]) payload.wakeTime = times[1];
    if (qMatch) payload.quality = Number(qMatch[1]);
    if (Object.keys(payload).length > 0) {
      actions.push({ type: 'UPDATE_SLEEP', ...payload });
    }
  }

  // 5. Reset / Tambah Langkah Kaki
  if (/(reset|nolkan)\s+langkah/i.test(low)) {
    actions.push({ type: 'UPDATE_ACTIVITY', resetSteps: true });
  } else if (/(\d[\d.,]*)\s*langkah/i.test(low) && /(tambah|jalan|lari|set|ubah)/i.test(low)) {
    const m = low.match(/(\d[\d.,]*)\s*langkah/i);
    if (m) {
      const num = Number(m[1].replace(/[.,]/g, ''));
      if (num > 0) {
        actions.push(
          low.includes('tambah')
            ? { type: 'UPDATE_ACTIVITY', addSteps: num }
            : { type: 'UPDATE_ACTIVITY', steps: num }
        );
      }
    }
  }

  return actions;
}

// Guard Anti-Halusinasi:
// Memastikan AI tidak pernah mengklaim sudah menambahkan/mengedit tugas jika appliedBadges kosong,
// serta menambahkan ringkasan lokasi menu yang jelas jika aksi berhasil dieksekusi.
export function verifyAndFormatFlowyReply(replyText = '', appliedBadges = [], userPrompt = '') {
  const cleanReply = String(replyText || '').trim();

  // Jika ada aksi nyata yang tereksekusi di LocalStorage, tampilkan pesan + daftar lokasi menu yang diupdate
  if (Array.isArray(appliedBadges) && appliedBadges.length > 0) {
    return cleanReply || `Siap bro/sis! Perubahan langsung gw eksekusi ke memori lokal lu.`;
  }

  // Cek apakah user tampak meminta aksi CRUD namun tidak ada satu pun badge yang tereksekusi,
  // sedangkan AI berhalusinasi bilang "sudah ditambahkan/diedit/dicentang"
  const promptLooksLikeAction =
    /(tambah|buatkan|catat|jadwalkan|edit|ubah|ganti|ceklis|centang|uncheck|reset|pin|sematkan|hapus)/i.test(
      userPrompt
    );
  const replyClaimsSuccess =
    /(sudah\s+(gw|aku|saya)?\s*(catat|tambah|masukin|buat|edit|ubah|ganti|centang|ceklis|reset|pin|simpan)|berhasil\s+di(catat|tambah|edit|ubah|centang|reset|simpan)|udah\s+(gw|aku)?\s*(catat|tambah|edit|ubah|centang|ceklis|reset|pin|simpan))/i.test(
      cleanReply
    );

  if (promptLooksLikeAction && replyClaimsSuccess) {
    return `${cleanReply}\n\n⚠️ Info Sistem: Belum ada item yang berubah di database lokal karena nama tugas/menu belum cocok persis. Coba sebutkan nama tugas beserta menunya (contoh: "Edit todo [nama tugas] jam 15:00" atau "Tambah goal [judul] di Minggu Ini") biar langsung gw eksekusi!`;
  }

  return cleanReply;
}
