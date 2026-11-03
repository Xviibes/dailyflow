export const INITIAL_TODOS = [
  {
    id: 'td-1',
    title: 'Review pull request & update dokumentasi API',
    category: 'Kerja',
    priority: 'Tinggi',
    completed: true,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '10:00',
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'td-2',
    title: 'Sprint planning meeting dengan tim engineering',
    category: 'Kerja',
    priority: 'Tinggi',
    completed: true,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '13:30',
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'td-3',
    title: 'Belajar arsitektur Cloud & microservices (30 Menit)',
    category: 'Belajar',
    priority: 'Sedang',
    completed: false,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '16:00',
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'td-4',
    title: 'Jogging sore di taman kota & peregangan kaki',
    category: 'Kesehatan',
    priority: 'Sedang',
    completed: false,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '17:15',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'td-5',
    title: 'Beli buah segar, susu almond, & kopi beans',
    category: 'Belanja',
    priority: 'Rendah',
    completed: false,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '19:30',
    createdAt: Date.now(),
  },
];

export const INITIAL_DAILY_SCHEDULE = [
  {
    id: 'ds-1',
    startTime: '06:00',
    endTime: '07:00',
    title: 'Bangun pagi, sholat/ibadah & peregangan ringan',
    category: 'Kesehatan',
    color: 'emerald',
    notes: 'Minum 500ml air hangat dengan perasan lemon',
    status: 'Done'
  },
  {
    id: 'ds-2',
    startTime: '07:30',
    endTime: '08:30',
    title: 'Sarapan sehat, seduh kopi & baca berita teknologi',
    category: 'Pribadi',
    color: 'amber',
    notes: 'Oatmeal buah berry & telur rebus',
    status: 'Done'
  },
  {
    id: 'ds-3',
    startTime: '09:00',
    endTime: '12:00',
    title: 'Deep Work Session: Pengembangan Fitur Utama',
    category: 'Kerja',
    color: 'indigo',
    notes: 'Mode Do Not Disturb aktif. Fokus implementasi sistem dashboard.',
    status: 'Done'
  },
  {
    id: 'ds-4',
    startTime: '12:00',
    endTime: '13:30',
    title: 'Makan siang, istirahat mata & relaksasi',
    category: 'Kesehatan',
    color: 'emerald',
    notes: 'Jalan santai sejenak tanpa melihat layar ponsel',
    status: 'Done'
  },
  {
    id: 'ds-5',
    startTime: '14:00',
    endTime: '16:00',
    title: 'Sinkronisasi proyek, review kode & tugas harian',
    category: 'Kerja',
    color: 'indigo',
    notes: 'Prioritaskan tiket urgent sprint minggu ini',
    status: 'Ongoing'
  },
  {
    id: 'ds-6',
    startTime: '17:00',
    endTime: '18:15',
    title: 'Olahraga sore, cardio & mobilitas tubuh',
    category: 'Kesehatan',
    color: 'rose',
    notes: 'Target 5000 langkah atau lari 3km santai',
    status: 'Pending'
  },
  {
    id: 'ds-7',
    startTime: '19:30',
    endTime: '21:00',
    title: 'Waktu keluarga & membaca buku self-development',
    category: 'Pribadi',
    color: 'purple',
    notes: 'Lanjutkan bab 4 buku Atomic Habits',
    status: 'Pending'
  },
  {
    id: 'ds-8',
    startTime: '21:30',
    endTime: '22:30',
    title: 'Rutinitas malam, journal syukur & tidur berkualitas',
    category: 'Pribadi',
    color: 'cyan',
    notes: 'Matikan lampu kamar & putar suara hujan ambient',
    status: 'Pending'
  }
];

export const INITIAL_WEEKLY_PLANNER = {
  Senin: [
    { id: 'wp-1', title: 'Weekly Sync & Pembagian Task Tim', category: 'Kerja', priority: 'Tinggi', done: true },
    { id: 'wp-2', title: 'Audit pengeluaran mingguan', category: 'Finansial', priority: 'Sedang', done: true },
  ],
  Selasa: [
    { id: 'wp-3', title: 'Refactoring arsitektur database', category: 'Kerja', priority: 'Tinggi', done: true },
    { id: 'wp-4', title: 'Latihan beban (Upper Body)', category: 'Kesehatan', priority: 'Sedang', done: true },
  ],
  Rabu: [
    { id: 'wp-5', title: 'Sprint Demo & Client Feedback', category: 'Kerja', priority: 'Tinggi', done: false },
    { id: 'wp-6', title: 'Belajar kursus UI/UX micro-interactions', category: 'Belajar', priority: 'Sedang', done: false },
  ],
  Kamis: [
    { id: 'wp-7', title: 'Testing performa & stress test app', category: 'Kerja', priority: 'Sedang', done: false },
    { id: 'wp-8', title: 'Cardio sore & sauna', category: 'Kesehatan', priority: 'Rendah', done: false },
  ],
  Jumat: [
    { id: 'wp-9', title: 'Release build & deployment ke production', category: 'Kerja', priority: 'Tinggi', done: false },
    { id: 'wp-10', title: 'Weekly review & evaluasi pencapaian', category: 'Pribadi', priority: 'Sedang', done: false },
  ],
  Sabtu: [
    { id: 'wp-11', title: 'Bersih-bersih ruang kerja & rumah', category: 'Pribadi', priority: 'Sedang', done: false },
    { id: 'wp-12', title: 'Quality time bersama keluarga / hangout santai', category: 'Sosial', priority: 'Tinggi', done: false },
  ],
  Minggu: [
    { id: 'wp-13', title: 'Meal prep & belanja bahan makanan sehat', category: 'Kesehatan', priority: 'Sedang', done: false },
    { id: 'wp-14', title: 'Perencanaan target minggu depan (Planning Session)', category: 'Pribadi', priority: 'Tinggi', done: false },
  ]
};

export const INITIAL_MONTHLY_PLANNER = {
  focus: 'Membangun konsistensi gaya hidup seimbang, finansial sehat, dan menyelesaikan milestone proyek Q4.',
  topPriorities: [
    { id: 'mp-1', text: 'Meluncurkan platform versi 2.0 tepat waktu', done: false },
    { id: 'mp-2', text: 'Menabung minimal 30% dari pemasukan bulanan', done: true },
    { id: 'mp-3', text: 'Olahraga minimal 4x seminggu secara konsisten', done: false },
  ],
  events: [
    { id: 'me-1', day: 5, title: 'Gajian & Alokasi Anggaran Investasi', category: 'Finansial', color: 'emerald' },
    { id: 'me-2', day: 12, title: 'Workshop AI & Agentic Workflow', category: 'Belajar', color: 'indigo' },
    { id: 'me-3', day: 18, title: 'Medical Check Up Rutin', category: 'Kesehatan', color: 'rose' },
    { id: 'me-4', day: 25, title: 'Evaluasi Proyek Akhir Bulan & Outing', category: 'Kerja', color: 'purple' },
    { id: 'me-5', day: 28, title: 'Pembayaran Tagihan Listrik & Internet', category: 'Finansial', color: 'amber' },
  ]
};

export const INITIAL_ROUTINES = {
  morning: [
    { id: 'mr-1', title: 'Bangun pukul 05:30 tanpa snooze', targetTime: '05:30', icon: '⏰', completed: true },
    { id: 'mr-2', title: 'Minum 500ml air putih hangat', targetTime: '05:35', icon: '💧', completed: true },
    { id: 'mr-3', title: 'Peregangan badan & pernapasan dalam', targetTime: '05:45', icon: '🧘', completed: true },
    { id: 'mr-4', title: 'Mandi pagi segar & skincare rutin', targetTime: '06:15', icon: '🚿', completed: true },
    { id: 'mr-5', title: 'Sarapan bernutrisi & kopi pagi', targetTime: '07:00', icon: '🍳', completed: false },
    { id: 'mr-6', title: 'Tinjau to-do list & tentukan 3 prioritas utama', targetTime: '08:00', icon: '📝', completed: false },
  ],
  night: [
    { id: 'nr-1', title: 'Bereskan meja kerja & bersihkan laptop', targetTime: '20:30', icon: '💻', completed: false },
    { id: 'nr-2', title: 'Tuliskan 3 hal yang disyukuri hari ini', targetTime: '21:00', icon: '✨', completed: false },
    { id: 'nr-3', title: 'Matikan layar gadget (No Screen Time)', targetTime: '21:30', icon: '📵', completed: false },
    { id: 'nr-4', title: 'Membaca buku fisik minimal 15 menit', targetTime: '21:45', icon: '📖', completed: false },
    { id: 'nr-5', title: 'Skincare malam & gosok gigi', targetTime: '22:15', icon: '🌙', completed: false },
    { id: 'nr-6', title: 'Tidur nyenyak tepat waktu', targetTime: '22:30', icon: '😴', completed: false },
  ],
  streaks: {
    morning: 7,
    night: 5
  }
};

export const INITIAL_NOTES = [
  {
    id: 'note-1',
    title: 'Ide Fitur Inovatif Aplikasi',
    content: '1. Integrasi timer Pomodoro estetik dengan suara lofi ambient.\n2. Widget kutipan harian yang bisa dibagikan ke media sosial.\n3. Mode offline-first dengan sinkronisasi instan.',
    category: 'Ide',
    color: 'amber',
    pinned: true,
    updatedAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'note-2',
    title: 'Resep Smoothie Energi Pagi',
    content: '- 1 buah pisang beku\n- 1 sdm selai kacang murni (peanut butter)\n- 1 cangkir susu almond oat\n- Segenggam bayam segar\n- 1 scoop bubuk protein cokelat\nBlender selama 45 detik sampai creamy!',
    category: 'Resep',
    color: 'emerald',
    pinned: false,
    updatedAt: Date.now() - 3600000 * 12,
  },
  {
    id: 'note-3',
    title: 'Rangkuman Buku "Atomic Habits"',
    content: 'Aturan 4 Langkah Perubahan Perilaku:\n1. Make it obvious (Jadikan terlihat jelas)\n2. Make it attractive (Jadikan menarik)\n3. Make it easy (Jadikan mudah dimulai)\n4. Make it satisfying (Jadikan memuaskan)\nIngat: 1% lebih baik setiap hari = 37x lebih baik dalam setahun!',
    category: 'Buku',
    color: 'indigo',
    pinned: true,
    updatedAt: Date.now() - 3600000 * 24,
  },
  {
    id: 'note-4',
    title: 'Daftar Belanja Kebutuhan Mingguan',
    content: '• Minyak zaitun extra virgin\n• Dada ayam fillet 1kg\n• Telur ayam organik 1 pack\n• Kopi arabika Gayo\n• Sayur brokoli & wortel segar',
    category: 'Pribadi',
    color: 'rose',
    pinned: false,
    updatedAt: Date.now() - 3600000 * 48,
  }
];

export const INITIAL_GOALS = [
  {
    id: 'goal-1',
    title: 'Selesaikan 5 tugas utama hari ini dengan tuntas',
    category: 'today',
    targetDate: new Date().toISOString().split('T')[0],
    progress: 75,
    milestones: [
      { text: 'Meeting sprint', done: true },
      { text: 'Kode fitur dashboard', done: true },
      { text: 'Testing & deployment', done: false },
    ]
  },
  {
    id: 'goal-2',
    title: 'Membaca 50 halaman buku pengembangan diri',
    category: 'week',
    targetDate: 'Akhir Minggu',
    progress: 60,
    milestones: [
      { text: 'Bab 1-2 (20 halaman)', done: true },
      { text: 'Bab 3-4 (20 halaman)', done: true },
      { text: 'Bab 5 (10 halaman)', done: false },
    ]
  },
  {
    id: 'goal-3',
    title: 'Lari total 30 KM dan latihan beban 12 kali',
    category: 'month',
    targetDate: 'Akhir Bulan Ini',
    progress: 50,
    milestones: [
      { text: 'Minggu ke-1: 8 KM', done: true },
      { text: 'Minggu ke-2: 8 KM', done: true },
      { text: 'Minggu ke-3: 7 KM', done: false },
      { text: 'Minggu ke-4: 7 KM', done: false },
    ]
  },
  {
    id: 'goal-4',
    title: 'Menguasai Fullstack Next.js, TypeScript & Cloud Native',
    category: 'year',
    targetDate: 'Desember 2026',
    progress: 70,
    milestones: [
      { text: 'Sertifikasi Cloud Associate', done: true },
      { text: 'Membangun 3 proyek open source skala besar', done: true },
      { text: 'Menulis 10 artikel teknologi mendalam', done: false },
    ]
  },
  {
    id: 'goal-5',
    title: 'Membangun Dana Pensiun & Rumah Impian Ramah Lingkungan',
    category: 'life',
    targetDate: 'Tujuan Masa Depan',
    progress: 35,
    milestones: [
      { text: 'Punya dana darurat aman 12 bulan', done: true },
      { text: 'Portofolio investasi bertumbuh stabil', done: true },
      { text: 'Desain arsitektur rumah tropis modern', done: false },
      { text: 'Kebebasan finansial penuh (Financial Freedom)', done: false },
    ]
  }
];

export const INITIAL_WORKOUT_SCHEDULE = {
  Senin: {
    focus: 'Chest Day',
    subtitle: 'Fokus dada & trisep (Push Up & variasi)',
    icon: '🏋️‍♂️',
    color: 'indigo',
    completed: false,
    exercises: [
      { id: 'ex-1-1', name: 'Regular Push Up', sets: '4 Set x 15-20 Reps', notes: 'Fokus kontraksi dada dan siku 45 derajat', done: true },
      { id: 'ex-1-2', name: 'Diamond Push Up', sets: '3 Set x 12 Reps', notes: 'Target inner chest dan triceps', done: true },
      { id: 'ex-1-3', name: 'Wide Grip Push Up', sets: '3 Set x 15 Reps', notes: 'Regangan maksimal dada luar', done: false },
      { id: 'ex-1-4', name: 'Incline / Decline Push Up', sets: '3 Set x 12 Reps', notes: 'Target upper chest & lower chest', done: false },
      { id: 'ex-1-5', name: 'Chest Dips (Parallel Bar / Bench)', sets: '3 Set x 10-12 Reps', notes: 'Condongkan badan ke depan', done: false },
    ]
  },
  Selasa: {
    focus: 'Lengan Tangan & Back Punggung',
    subtitle: 'Otot punggung, bicep, tricep, & pull power',
    icon: '💪',
    color: 'emerald',
    completed: false,
    exercises: [
      { id: 'ex-2-1', name: 'Pull Up / Chin Up', sets: '4 Set x 8-10 Reps', notes: 'Tarik dengan lats punggung, bukan hanya lengan', done: false },
      { id: 'ex-2-2', name: 'Bicep Curls (Dumbbell / Resistance)', sets: '4 Set x 12 Reps', notes: 'Kunci siku di samping pinggang', done: false },
      { id: 'ex-2-3', name: 'Hammer Curls', sets: '3 Set x 12 Reps', notes: 'Menebalkan bicep & otot brachialis', done: false },
      { id: 'ex-2-4', name: 'Bent-Over Rows / Inverted Rows', sets: '4 Set x 12 Reps', notes: 'Rapatkan belikat punggung di puncak tarikan', done: false },
      { id: 'ex-2-5', name: 'Tricep Overhead Extension / Dips', sets: '3 Set x 15 Reps', notes: 'Regangkan tricep secara optimal', done: false },
    ]
  },
  Rabu: {
    focus: 'Perut (Core & Abs Day)',
    subtitle: 'Kekuatan core, six-pack & stabilitas tubuh',
    icon: '🔥',
    color: 'amber',
    completed: false,
    exercises: [
      { id: 'ex-3-1', name: 'Plank Tahan Penuh', sets: '3 Set x 60 Detik', notes: 'Kencangkan perut dan bokong sejajar lantai', done: false },
      { id: 'ex-3-2', name: 'Bicycle Crunches', sets: '3 Set x 20 Reps', notes: 'Sentuhkan siku berlawanan ke lutut bergantian', done: false },
      { id: 'ex-3-3', name: 'Hanging / Lying Leg Raises', sets: '4 Set x 15 Reps', notes: 'Target perut bagian bawah (lower abs)', done: false },
      { id: 'ex-3-4', name: 'Russian Twists', sets: '3 Set x 30 Reps (15/sisi)', notes: 'Putar badan dengan kontrol otot oblique', done: false },
      { id: 'ex-3-5', name: 'Mountain Climbers', sets: '3 Set x 45 Detik', notes: 'Irama stabil membakar kalori core', done: false },
    ]
  },
  Kamis: {
    focus: 'Leg Day (Kaki & Lower Body)',
    subtitle: 'Fondasi kekuatan paha depan, paha belakang & betis',
    icon: '🦵',
    color: 'rose',
    completed: false,
    exercises: [
      { id: 'ex-4-1', name: 'Bodyweight / Goblet Squats', sets: '4 Set x 20 Reps', notes: 'Kedalaman paha minimal sejajar lutut', done: false },
      { id: 'ex-4-2', name: 'Walking Lunges', sets: '3 Set x 15 Reps per kaki', notes: 'Langkah mantap jaga keseimbangan dada tegak', done: false },
      { id: 'ex-4-3', name: 'Bulgarian Split Squats', sets: '3 Set x 10-12 Reps', notes: 'Target glutes dan paha depan secara isolasi', done: false },
      { id: 'ex-4-4', name: 'Standing Calf Raises', sets: '4 Set x 25 Reps', notes: 'Tahan 1 detik di puncak kontraksi betis', done: false },
      { id: 'ex-4-5', name: 'Glute Bridges / Hip Thrust', sets: '3 Set x 15-20 Reps', notes: 'Remas otot glutes di puncak gerakan', done: false },
    ]
  },
  Jumat: {
    focus: 'All Body (Full Body Workout)',
    subtitle: 'Latihan gabungan seluruh tubuh untuk stamina & kekuatan',
    icon: '⚡',
    color: 'purple',
    completed: false,
    exercises: [
      { id: 'ex-5-1', name: 'Burpees Full Body', sets: '3 Set x 12-15 Reps', notes: 'Eksplosif loncat dan push up sempurna', done: false },
      { id: 'ex-5-2', name: 'Push Up to Renegade Row', sets: '3 Set x 10 Reps', notes: 'Kombinasi dada, core, dan punggung', done: false },
      { id: 'ex-5-3', name: 'Jump Squats', sets: '4 Set x 15 Reps', notes: 'Daya ledak kaki & kardio pernapasan', done: false },
      { id: 'ex-5-4', name: 'Pull Ups / Inverted Rows', sets: '3 Set x 8-10 Reps', notes: 'Kekuatan tarikan tubuh bagian atas', done: false },
      { id: 'ex-5-5', name: 'Plank to Push Up', sets: '3 Set x 12 Reps', notes: 'Transisi forearm ke telapak tangan', done: false },
    ]
  },
  Sabtu: {
    focus: 'Rest / Cardio (Lari Santai)',
    subtitle: 'Kesehatan jantung, daya tahan kardio & pembakaran lemak',
    icon: '🏃‍♂️',
    color: 'cyan',
    completed: false,
    exercises: [
      { id: 'ex-6-1', name: 'Lari Pagi / Jogging 5 KM', sets: '1 Sesi x 30-40 Menit', notes: 'Kecepatan santai (Zone 2 Cardio)', done: false },
      { id: 'ex-6-2', name: 'Peregangan Dinamis & Kaki', sets: '1 Sesi x 10 Menit', notes: 'Peregangan hamstring, quadriceps & betis', done: false },
      { id: 'ex-6-3', name: 'Jalan Santai Pendinginan (Cool down)', sets: '1 Sesi x 10 Menit', notes: 'Turunkan detak jantung secara perlahan', done: false },
    ]
  },
  Minggu: {
    focus: 'Rest / Cardio (Active Recovery)',
    subtitle: 'Pemulihan otot, regenerasi energi & jalan santai',
    icon: '🧘',
    color: 'emerald',
    completed: false,
    exercises: [
      { id: 'ex-7-1', name: 'Jalan Kaki Pagi Santai (Light Cardio)', sets: '3 - 5 KM (40 Menit)', notes: 'Menikmati udara pagi & sinar matahari', done: false },
      { id: 'ex-7-2', name: 'Full Body Stretching & Mobilitas Sendi', sets: '1 Sesi x 20 Menit', notes: 'Lepas ketegangan otot leher, bahu, dan pinggang', done: false },
      { id: 'ex-7-3', name: 'Foam Rolling / Pijat Relaksasi Otot', sets: '1 Sesi x 15 Menit', notes: 'Membantu peredaran darah untuk pemulihan optimal', done: false },
    ]
  }
};

export const INITIAL_WELLNESS = {
  water: {
    current: 1500,
    target: 2500,
    unit: 'ml'
  },
  mood: {
    selected: 'Bahagia',
    emoji: '😊',
    note: 'Hari ini produktif dan pikiran sangat segar!',
    history: [
      { date: '21/10', mood: 'Senang', emoji: '😄' },
      { date: '22/10', mood: 'Tenang', emoji: '😌' },
      { date: '23/10', mood: 'Lelah', emoji: '🥱' },
      { date: '24/10', mood: 'Sangat Bahagia', emoji: '🥳' },
      { date: '25/10', mood: 'Bahagia', emoji: '😊' },
    ]
  },
  sleep: {
    bedTime: '23:00',
    wakeTime: '06:15',
    hours: 7.25,
    quality: 4, // 1 to 5
    notes: 'Tidur nyenyak, bangun tanpa rasa pusing.'
  },
  activity: {
    steps: 6420,
    stepsTarget: 8000,
    workoutMinutes: 35,
    workoutType: 'Jogging & Bodyweight HIIT',
    caloriesBurned: 320
  },
  workoutSchedule: INITIAL_WORKOUT_SCHEDULE,
  gratitude: [
    { id: 'gr-1', text: 'Udara pagi yang sejuk dan kopi hangat yang nikmat.' },
    { id: 'gr-2', text: 'Keluarga dan sahabat yang selalu mendukung impian.' },
    { id: 'gr-3', text: 'Kesehatan tubuh dan kesempatan belajar hal baru hari ini.' }
  ]
};

export const INITIAL_FINANCE = {
  transactions: [
    {
      id: 'tx-1',
      title: 'Gaji Pokok Bulanan',
      type: 'income',
      amount: 14500000,
      category: 'Gaji',
      wallet: 'bca',
      date: new Date().toISOString().split('T')[0],
      notes: 'Penerimaan gaji bulanan PT Digital Solusi'
    },
    {
      id: 'tx-2',
      title: 'Proyek Freelance UI/UX Dashboard',
      type: 'income',
      amount: 4200000,
      category: 'Freelance',
      wallet: 'jago',
      date: new Date().toISOString().split('T')[0],
      notes: 'Pembayaran milestone 2 design system'
    },
    {
      id: 'tx-3',
      title: 'Belanja Bahan Makanan & Supermarket',
      type: 'expense',
      amount: 685000,
      category: 'Makanan & Belanja',
      wallet: 'shopeepay',
      date: new Date().toISOString().split('T')[0],
      notes: 'Bahan masakan segar untuk seminggu'
    },
    {
      id: 'tx-4',
      title: 'Langganan Internet Fiber Optic 100Mbps',
      type: 'expense',
      amount: 375000,
      category: 'Tagihan & Utilitas',
      wallet: 'livin',
      date: new Date().toISOString().split('T')[0],
      notes: 'Biaya langganan bulanan'
    },
    {
      id: 'tx-5',
      title: 'Bensin & Saldo Kartu Tol Elektronik',
      type: 'expense',
      amount: 250000,
      category: 'Transportasi',
      wallet: 'gopay',
      date: new Date().toISOString().split('T')[0],
      notes: 'Isi e-toll dan bensin mobil'
    },
    {
      id: 'tx-6',
      title: 'Makan Malam Hangout di Kafe',
      type: 'expense',
      amount: 180000,
      category: 'Hiburan & Kuliner',
      wallet: 'qris',
      date: new Date().toISOString().split('T')[0],
      notes: 'Kopi dan pasta bareng teman'
    }
  ],
  categories: {
    income: ['Gaji', 'Freelance', 'Investasi', 'Bisnis', 'Hadiah', 'Lainnya'],
    expense: ['Makanan & Belanja', 'Transportasi', 'Tagihan & Utilitas', 'Hiburan & Kuliner', 'Kesehatan', 'Pendidikan', 'Donasi', 'Lainnya']
  }
};
