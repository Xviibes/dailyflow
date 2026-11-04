import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { TodoView } from './components/Todo/TodoView';
import { LifePlanningView } from './components/LifePlanning/LifePlanningView';
import { RoutinesView } from './components/Routines/RoutinesView';
import { NotesView } from './components/Notes/NotesView';
import { GoalsView } from './components/Goals/GoalsView';
import { WellnessView } from './components/Wellness/WellnessView';
import { FinanceView } from './components/Finance/FinanceView';
import { ThemeSelectorModal } from './components/Modals/ThemeSelectorModal';
import { DataManagementModal } from './components/Modals/DataManagementModal';
import { NotificationModal } from './components/Modals/NotificationModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { LicenseLockScreen } from './components/Modals/LicenseLockScreen';
import { MobileBottomNav } from './components/Mobile/MobileBottomNav';
import { InstallPromptBanner } from './components/Mobile/InstallPromptBanner';
import { FloatingFlowyWidget } from './components/AI/FloatingFlowyWidget';
import {
  isNativeApp,
  registerServiceWorker,
  requestNotificationPermission,
  syncAllScheduledNotifications,
  buildNotificationSyncSignature
} from './utils/notifications';
import { syncFlowyAppBridge } from './utils/flowyActions';
import { useJakartaTime } from './hooks/useJakartaTime';

import { THEMES } from './constants/themes';
import { MOTIVATIONAL_QUOTES } from './constants/quotes';
import {
  INITIAL_TODOS,
  INITIAL_DAILY_SCHEDULE,
  INITIAL_WEEKLY_PLANNER,
  INITIAL_MONTHLY_PLANNER,
  INITIAL_ROUTINES,
  INITIAL_NOTES,
  INITIAL_GOALS,
  INITIAL_WELLNESS,
  INITIAL_FINANCE,
  INITIAL_WORKOUT_SCHEDULE
} from './constants/defaultData';

export default function App() {
  const jakartaTime = useJakartaTime();

  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useLocalStorage('df_desktop_sidebar_open', true);

  // Modals & License State (Auto-bypass jika VITE_ADMIN_PIN kosong untuk mode portofolio)
  const isLicenseEnforced = Boolean(
    import.meta.env.VITE_ADMIN_PIN && String(import.meta.env.VITE_ADMIN_PIN).trim()
  );
  const [isLicenseVerified, setIsLicenseVerified] = useState(() => {
    if (!import.meta.env.VITE_ADMIN_PIN || !String(import.meta.env.VITE_ADMIN_PIN).trim()) {
      return true;
    }
    try {
      return localStorage.getItem('df_license_verified') === 'true';
    } catch {
      return false;
    }
  });
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // User Settings
  const [currentThemeId, setCurrentThemeId] = useLocalStorage('df_theme_id', 'ghibli');
  const [soundEnabled, setSoundEnabled] = useLocalStorage('df_sound_enabled', true);
  const [bgOpacity, setBgOpacity] = useLocalStorage('df_bg_opacity', 0.85);
  const [bgBlur, setBgBlur] = useLocalStorage('df_bg_blur', 0);
  
  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useLocalStorage('df_notification_settings', {
    waterReminder: true,
    workoutReminder: true,
    morningReminder: true,
    nightReminder: true,
  });

  // Daily Quote
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex] || MOTIVATIONAL_QUOTES[0];

  const handleRefreshQuote = useCallback(() => {
    setQuoteIndex(prev => (prev + 1) % MOTIVATIONAL_QUOTES.length);
  }, []);

  // Modules State (with LocalStorage persistence)
  const [todos, setTodos] = useLocalStorage('df_todos', INITIAL_TODOS);
  const [schedule, setSchedule] = useLocalStorage('df_schedule', INITIAL_DAILY_SCHEDULE);
  const [weeklyData, setWeeklyData] = useLocalStorage('df_weekly', INITIAL_WEEKLY_PLANNER);
  const [monthlyData, setMonthlyData] = useLocalStorage('df_monthly', INITIAL_MONTHLY_PLANNER);
  const [routines, setRoutines] = useLocalStorage('df_routines', INITIAL_ROUTINES);
  const [notes, setNotes] = useLocalStorage('df_notes', INITIAL_NOTES);
  const [goals, setGoals] = useLocalStorage('df_goals', INITIAL_GOALS);
  const [wellness, setWellness] = useLocalStorage('df_wellness', INITIAL_WELLNESS);
  const [finance, setFinance] = useLocalStorage('df_finance', INITIAL_FINANCE);

  // Helper terpusat addTodo untuk Flowy & komponen
  const addTodo = useCallback((todoPayload = {}) => {
    const newTodo = {
      id: todoPayload.id || `td-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: String(todoPayload.title || 'Tugas Baru').trim(),
      category: todoPayload.category || 'Pribadi',
      priority: todoPayload.priority || 'Sedang',
      dueDate: todoPayload.dueDate || new Date().toISOString().split('T')[0],
      dueTime: todoPayload.dueTime || '12:00',
      completed: Boolean(todoPayload.completed),
      createdAt: Date.now(),
    };
    setTodos(prev => [newTodo, ...(Array.isArray(prev) ? prev : [])]);
    return newTodo;
  }, [setTodos]);

  // Sinkronkan seluruh state & setter ke Flowy Bridge agar AI selalu membaca state terbaru
  // dan dapat memanggil addTodo / setTodos di semua 8 menu.
  syncFlowyAppBridge({
    data: {
      todos,
      schedule,
      weeklyData,
      monthlyData,
      routines,
      notes,
      goals,
      wellness,
      finance,
    },
    setters: {
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
    },
    soundEnabled,
  });

  // Active Theme object
  const currentTheme = useMemo(() => {
    return THEMES.find(t => t.id === currentThemeId) || THEMES[0];
  }, [currentThemeId]);

  // Data management helpers
  const allUserData = useMemo(() => ({
    todos,
    schedule,
    weeklyData,
    monthlyData,
    routines,
    notes,
    goals,
    wellness,
    finance,
    version: '1.0.0',
    exportDate: new Date().toISOString()
  }), [todos, schedule, weeklyData, monthlyData, routines, notes, goals, wellness, finance]);

  const handleImportData = useCallback((imported) => {
    if (imported.todos) setTodos(imported.todos);
    if (imported.schedule) setSchedule(imported.schedule);
    if (imported.weeklyData) setWeeklyData(imported.weeklyData);
    if (imported.monthlyData) setMonthlyData(imported.monthlyData);
    if (imported.routines) setRoutines(imported.routines);
    if (imported.notes) setNotes(imported.notes);
    if (imported.goals) setGoals(imported.goals);
    if (imported.wellness) setWellness(imported.wellness);
    if (imported.finance) setFinance(imported.finance);
  }, [setTodos, setSchedule, setWeeklyData, setMonthlyData, setRoutines, setNotes, setGoals, setWellness, setFinance]);

  const handleResetData = useCallback(() => {
    setTodos(INITIAL_TODOS);
    setSchedule(INITIAL_DAILY_SCHEDULE);
    setWeeklyData(INITIAL_WEEKLY_PLANNER);
    setMonthlyData(INITIAL_MONTHLY_PLANNER);
    setRoutines(INITIAL_ROUTINES);
    setNotes(INITIAL_NOTES);
    setGoals(INITIAL_GOALS);
    setWellness(INITIAL_WELLNESS);
    setFinance(INITIAL_FINANCE);
  }, [setTodos, setSchedule, setWeeklyData, setMonthlyData, setRoutines, setNotes, setGoals, setWellness, setFinance]);

  // Today's workout calculation for notifications
  const workoutSchedule = wellness.workoutSchedule || INITIAL_WORKOUT_SCHEDULE;
  const todayWorkout = workoutSchedule?.[jakartaTime.dayName] || {
    focus: 'Sesi Latihan',
    icon: '🏋️‍♂️',
    exercises: []
  };

  // Signature khusus data yang memengaruhi jadwal alarm (toggle pengingat & daftar tugas To-Do)
  // sehingga LocalNotifications.schedule() HANYA dipanggil saat inisialisasi awal,
  // saat user mengubah toggle pengingat, atau saat user menambah/mengedit/menghapus tugas.
  const notificationSyncSignature = useMemo(
    () =>
      buildNotificationSyncSignature({
        notificationSettings,
        todayWorkout,
        currentDayName: jakartaTime.dayName,
        todos,
      }),
    [notificationSettings, todayWorkout.focus, jakartaTime.dayName, todos]
  );

  const latestSyncDataRef = useRef({
    notificationSettings,
    todayWorkout,
    currentDayName: jakartaTime.dayName,
    todos,
  });
  latestSyncDataRef.current = {
    notificationSettings,
    todayWorkout,
    currentDayName: jakartaTime.dayName,
    todos,
  };

  // Inisialisasi awal Service Worker / izin LocalNotifications
  useEffect(() => {
    let mounted = true;
    async function initNotifications() {
      await registerServiceWorker();
      if (isNativeApp() && mounted) {
        const perm = await requestNotificationPermission();
        if (perm === 'granted' && mounted) {
          await syncAllScheduledNotifications({
            ...latestSyncDataRef.current,
            force: true,
          });
        }
      }
    }
    initNotifications();
    return () => {
      mounted = false;
    };
  }, []);

  // Sinkronisasi terpusat HANYA ketika signature pengingat atau tugas To-Do benar-benar berubah
  useEffect(() => {
    if (!isNativeApp()) return;
    syncAllScheduledNotifications(latestSyncDataRef.current);
  }, [notificationSyncSignature]);

  // Counts for badge
  const uncompletedTodoCount = useMemo(
    () => todos.filter(t => !t.completed).length,
    [todos]
  );

  const flowContextSnapshot = useMemo(
    () => ({
      dayName: jakartaTime.dayName,
      pendingTodos: uncompletedTodoCount,
      waterMl: wellness?.water?.current || 0,
    }),
    [jakartaTime.dayName, uncompletedTodoCount, wellness?.water?.current]
  );

  if (isLicenseEnforced && !isLicenseVerified) {
    return <LicenseLockScreen onUnlocked={() => setIsLicenseVerified(true)} />;
  }

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* 📱 PWA Install Banner */}
      <InstallPromptBanner soundEnabled={soundEnabled} />

      {/* 🖼️ High-Resolution Aesthetic Wallpaper Background (Tanpa filter blur berat agar Android WebView ringan) */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url(${currentTheme.bgImage})`
        }}
      />

      {/* Dimming & Theme Color Overlay */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundColor: '#070b13',
          opacity: bgOpacity
        }}
      />

      {/* App Layout */}
      <div className="relative z-10 flex min-h-screen">
        
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isDesktopOpen={desktopSidebarOpen}
          onToggleDesktop={() => setDesktopSidebarOpen(v => !v)}
          todoCount={uncompletedTodoCount}
          notesCount={notes.length}
          themeColor={currentTheme.accent}
        />

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            desktopSidebarOpen ? 'lg:pl-72' : 'lg:pl-0'
          }`}
        >
          
          {/* Header */}
          <Header
            currentTheme={currentTheme}
            onOpenThemeModal={() => setIsThemeModalOpen(true)}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(v => !v)}
            onOpenDataModal={() => setIsDataModalOpen(true)}
            onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
            onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(v => !v)}
            desktopSidebarOpen={desktopSidebarOpen}
            onToggleDesktopSidebar={() => setDesktopSidebarOpen(v => !v)}
            currentQuote={currentQuote}
            onRefreshQuote={handleRefreshQuote}
          />

          {/* Dynamic Tab Views */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in pb-28 lg:pb-8">
            {activeTab === 'dashboard' && (
              <DashboardView
                todos={todos}
                setTodos={setTodos}
                schedule={schedule}
                setSchedule={setSchedule}
                weeklyData={weeklyData}
                monthlyData={monthlyData}
                routines={routines}
                setRoutines={setRoutines}
                notes={notes}
                setNotes={setNotes}
                goals={goals}
                wellness={wellness}
                setWellness={setWellness}
                finance={finance}
                setFinance={setFinance}
                onNavigateTab={setActiveTab}
                soundEnabled={soundEnabled}
                currentQuote={currentQuote}
                onRefreshQuote={handleRefreshQuote}
              />
            )}

            {activeTab === 'todo' && (
              <TodoView
                todos={todos}
                setTodos={setTodos}
                soundEnabled={soundEnabled}
              />
            )}

            {activeTab === 'planning' && (
              <LifePlanningView
                schedule={schedule}
                setSchedule={setSchedule}
                weeklyData={weeklyData}
                setWeeklyData={setWeeklyData}
                monthlyData={monthlyData}
                setMonthlyData={setMonthlyData}
                soundEnabled={soundEnabled}
              />
            )}

            {activeTab === 'routines' && (
              <RoutinesView
                routines={routines}
                setRoutines={setRoutines}
                soundEnabled={soundEnabled}
              />
            )}

            {activeTab === 'notes' && (
              <NotesView
                notes={notes}
                setNotes={setNotes}
                setTodos={setTodos}
                setSchedule={setSchedule}
                setFinance={setFinance}
                setWellness={setWellness}
                soundEnabled={soundEnabled}
              />
            )}

            {activeTab === 'goals' && (
              <GoalsView
                goals={goals}
                setGoals={setGoals}
                soundEnabled={soundEnabled}
              />
            )}

            {activeTab === 'wellness' && (
              <WellnessView
                wellness={wellness}
                setWellness={setWellness}
                setTodos={setTodos}
                setSchedule={setSchedule}
                setNotes={setNotes}
                setFinance={setFinance}
                soundEnabled={soundEnabled}
              />
            )}

            {activeTab === 'finance' && (
              <FinanceView
                finance={finance}
                setFinance={setFinance}
                setTodos={setTodos}
                setSchedule={setSchedule}
                setNotes={setNotes}
                setWellness={setWellness}
                soundEnabled={soundEnabled}
              />
            )}
          </main>

          {/* Clean App Footer */}
          <footer className="mt-auto px-6 py-4 text-center text-xs text-slate-400 border-t border-white/5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
              <span>DailyFlow Life Planner & To-Do System • Waktu Real-Time Jakarta (WIB) 🇮🇩</span>
              <span className="text-slate-400">Didesain dengan Tema Estetik, Audio Harmonis & Performa Ringan</span>
            </div>
          </footer>

        </div>
      </div>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentThemeId={currentThemeId}
        onSelectTheme={setCurrentThemeId}
        bgOpacity={bgOpacity}
        setBgOpacity={setBgOpacity}
        bgBlur={bgBlur}
        setBgBlur={setBgBlur}
        soundEnabled={soundEnabled}
      />

      {/* Data Management Modal */}
      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        allData={allUserData}
        onImportData={handleImportData}
        onResetData={handleResetData}
        soundEnabled={soundEnabled}
      />

      {/* Notification Settings Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notificationSettings={notificationSettings}
        setNotificationSettings={setNotificationSettings}
        soundEnabled={soundEnabled}
        todayWorkout={todayWorkout}
        currentDayName={jakartaTime.dayName}
      />

      {/* Settings & Secret Admin Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        soundEnabled={soundEnabled}
      />

      {/* 🔮 Floating Flowy Interactive Orb & Draggable Chat Window */}
      <FloatingFlowyWidget
        setTodos={setTodos}
        setSchedule={setSchedule}
        setNotes={setNotes}
        setFinance={setFinance}
        setWellness={setWellness}
        soundEnabled={soundEnabled}
        contextSnapshot={flowContextSnapshot}
      />

      {/* 📱 Mobile Bottom Floating Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        todoCount={uncompletedTodoCount}
      />

    </div>
  );
}
