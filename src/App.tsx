import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  ClipboardCheck,
  Home,
  Layers,
  MessageSquare,
  Moon,
  Settings,
  Sun,
} from 'lucide-react';
import { StudyBookLogo } from './components/StudyBookLogo';
import { CursorAura } from './components/CursorAura';
import { WallpaperBackdrop } from './components/WallpaperBackdrop';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';
import { OnboardingModal } from './components/OnboardingModal';
import { SettingsModal } from './components/SettingsModal';
import { HomeTab } from './components/HomeTab';
import { SyllabusTab } from './components/SyllabusTab';
import { MocksTab } from './components/MocksTab';
import { NotesTab } from './components/NotesTab';
import { CBTSimulator, type CBTResultPayload } from './components/CBTSimulator';
import { GeminiChatDrawer } from './components/GeminiChatDrawer';
import { getSubjectsForContext } from './data/syllabusData';
import { todayIso, useStudyBookStore } from './hooks/useStudyBookStore';
import type {
  AppTab,
  ExamPattern,
  QuestionItem,
  TargetExam,
} from './types/studybook';

interface ActiveCBTSession {
  title: string;
  examType: ExamPattern;
  questions: QuestionItem[];
  durationMinutes: number;
}

const DOCK_TABS: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'syllabus', label: 'Syllabus', icon: Layers },
  { id: 'mocks', label: 'Mocks', icon: ClipboardCheck },
  { id: 'notes', label: 'Notes', icon: BookOpen },
];

export default function App() {
  const store = useStudyBookStore();

  // Always default to Home tab on every app launch
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedNoteChapterId, setSelectedNoteChapterId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeCBT, setActiveCBT] = useState<ActiveCBTSession | null>(null);

  const needsOnboarding = !store.profile.aspirantName.trim();

  const { masteryPercent, mistakeCount } = useMemo(() => {
    const subjects = getSubjectsForContext(store.profile.branch, store.profile.targetExam);
    let total = 0;
    let mastered = 0;
    for (const s of subjects) {
      total += s.chapters.length;
      for (const ch of s.chapters) {
        if (store.syllabusProgress[ch.id]?.status === 'mastered') mastered += 1;
      }
    }
    const mistakes = store.questionBank.filter(
      (q) => (q.branch === store.profile.branch || q.branch === 'nontech') && q.isMistake,
    ).length;
    return {
      masteryPercent: total > 0 ? Math.round((mastered / total) * 100) : 0,
      mistakeCount: mistakes,
    };
  }, [store.profile.branch, store.profile.targetExam, store.syllabusProgress, store.questionBank]);

  const handleOpenSubjectInSyllabus = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setActiveTab('syllabus');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenChapterInNotes = (chapterId: string) => {
    setSelectedNoteChapterId(chapterId);
    setActiveTab('notes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishCBT = (result: CBTResultPayload) => {
    store.addMockScore({
      title: result.title,
      examType: result.examType,
      branch: store.profile.branch,
      score: result.score,
      maxScore: result.maxScore,
      accuracy: result.accuracy,
      correctCount: result.correctCount,
      wrongCount: result.wrongCount,
      skippedCount: result.skippedCount,
      timeTakenMinutes: result.timeTakenMinutes,
      date: todayIso(),
    });

    for (const item of result.wrongQuestionUpdates) {
      store.updateQuestionMistakeState(item.questionId, true, item.chosenIndex);
    }
    for (const qId of result.masteredQuestionIds) {
      const existing = store.questionBank.find((q) => q.id === qId);
      if (existing?.isMistake) {
        store.updateQuestionMistakeState(qId, false);
      }
    }
  };

  const toggleTheme = () => {
    store.updateProfile({ theme: store.profile.theme === 'night' ? 'day' : 'night' });
  };

  return (
    <div className="relative min-h-screen text-zinc-950 dark:text-zinc-50 flex flex-col">
      {/* Blurred Monochrome Wallpaper Backdrop */}
      <WallpaperBackdrop
        wallpaper={store.profile.wallpaper}
        theme={store.profile.theme}
        glassBlur={store.profile.glassBlur}
      />

      {/* Smooth Desktop Mouse Cursor Tracking Animation */}
      <CursorAura theme={store.profile.theme} />

      <div className="relative z-10 flex flex-col min-h-screen">
        <OfflineIndicator />

        {/* Frosted Glassmorphic Top Command Bar */}
        <header className="sticky top-0 z-30 px-2.5 sm:px-5 pt-2.5 sm:pt-3">
          <div className="max-w-7xl mx-auto sb-glass-bar rounded-2xl sm:rounded-3xl border border-black/[0.08] dark:border-white/[0.11] h-14 sm:h-16 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4">
            {/* Brand Logo & Title */}
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus:outline-none group"
            >
              <StudyBookLogo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 transition-transform duration-200 group-hover:scale-105" />
              <span className="text-base sm:text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                StudyBook
              </span>
            </button>

            {/* Controls: Target Exam Filter + Day/Night + Install + Mentor + Settings */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              {/* Target Exam Filter */}
              <select
                aria-label="Target Exam Filter"
                value={store.profile.targetExam}
                onChange={(e) => store.updateProfile({ targetExam: e.target.value as TargetExam })}
                className="min-h-[38px] max-w-[128px] sm:max-w-none rounded-xl bg-black/[0.05] dark:bg-white/[0.07] border border-black/[0.08] dark:border-white/[0.1] px-2.5 sm:px-3 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none truncate"
              >
                <option value="combo" className="bg-white dark:bg-zinc-900">
                  Combo: RRB + SSC JE
                </option>
                <option value="ssc_je" className="bg-white dark:bg-zinc-900">
                  SSC JE 2026
                </option>
                <option value="rrb_je" className="bg-white dark:bg-zinc-900">
                  RRB JE 2026
                </option>
              </select>

              {/* Quick Monochrome Day / Night Glass Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={store.profile.theme === 'night' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
                title={store.profile.theme === 'night' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
                className="min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center rounded-xl bg-black/[0.05] dark:bg-white/[0.07] border border-black/[0.08] dark:border-white/[0.1] text-zinc-800 dark:text-zinc-200 hover:bg-black/10 dark:hover:bg-white/15 transition-all shrink-0"
              >
                <motion.span
                  key={store.profile.theme}
                  initial={{ rotate: -25, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  {store.profile.theme === 'night' ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </motion.span>
              </button>

              {/* In-App PWA Install Trigger (hides automatically when standalone) */}
              <div className="hidden md:block">
                <PWAInstallButton variant="compact" />
              </div>

              {/* Multi-Turn AI Mentor Chat Button */}
              <button
                type="button"
                onClick={() => setShowChat(true)}
                aria-label="Open StudyBook Mentor Chat"
                title="StudyBook Mentor Chat"
                className="min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:px-3 flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:opacity-90 transition-opacity shrink-0 whitespace-nowrap shadow-sm"
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline text-xs font-medium">Mentor</span>
              </button>

              {/* Settings Gear Button */}
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                aria-label="Open settings"
                className="min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center rounded-xl bg-black/[0.05] dark:bg-white/[0.07] border border-black/[0.08] dark:border-white/[0.1] text-zinc-800 dark:text-zinc-200 hover:bg-black/10 dark:hover:bg-white/15 transition-colors shrink-0"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Workspace with Smooth Glass Entrance Animation */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-28">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {activeTab === 'home' && (
                <HomeTab
                  profile={store.profile}
                  syllabusProgress={store.syllabusProgress}
                  studyLogs={store.studyLogs}
                  mockScores={store.mockScores}
                  onToggleGoal={store.toggleDailyGoal}
                  onAddGoal={store.addDailyGoal}
                  onRemoveGoal={store.removeDailyGoal}
                  onAddStudyLog={store.addStudyLog}
                  onDeleteStudyLog={store.deleteStudyLog}
                  onCompleteRevision={store.completeRevisionCheckpoint}
                  onOpenSubjectInSyllabus={handleOpenSubjectInSyllabus}
                  onOpenChapterInNotes={handleOpenChapterInNotes}
                />
              )}

              {activeTab === 'syllabus' && (
                <SyllabusTab
                  profile={store.profile}
                  syllabusProgress={store.syllabusProgress}
                  selectedSubjectId={selectedSubjectId}
                  onSelectSubject={setSelectedSubjectId}
                  onUpdateChapter={store.upsertChapterProgress}
                  onOpenChapterInNotes={handleOpenChapterInNotes}
                />
              )}

              {activeTab === 'mocks' && (
                <MocksTab
                  profile={store.profile}
                  mockScores={store.mockScores}
                  questionBank={store.questionBank}
                  onAddMockScore={store.addMockScore}
                  onDeleteMockScore={store.deleteMockScore}
                  onAddQuestions={store.addQuestionsToBank}
                  onUpdateMistake={(qId, isMistake) => store.updateQuestionMistakeState(qId, isMistake)}
                  onDeleteQuestion={store.deleteQuestion}
                  onLaunchCBT={(cfg) => setActiveCBT(cfg)}
                />
              )}

              {activeTab === 'notes' && (
                <NotesTab
                  profile={store.profile}
                  chapterNotes={store.chapterNotes}
                  selectedChapterId={selectedNoteChapterId}
                  onSelectChapter={setSelectedNoteChapterId}
                  onSaveChapterNote={store.saveChapterNote}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Floating Glass Pill Dock (4 Tabs Only) */}
        <nav
          aria-label="Primary navigation"
          className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 pb-safe px-3 w-full max-w-[360px] sm:max-w-[400px]"
        >
          <div className="sb-dock rounded-full p-1.5 grid grid-cols-4 gap-1">
            {DOCK_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`relative min-h-[46px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
                    isActive
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span className="text-[10px] font-medium tracking-tight leading-none">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* First-Launch Onboarding Modal */}
        {needsOnboarding && (
          <OnboardingModal
            initialBranch={store.profile.branch}
            initialExam={store.profile.targetExam}
            onComplete={(aspirantName, branch, targetExam) =>
              store.updateProfile({ aspirantName, branch, targetExam })
            }
          />
        )}

        {/* Settings & Cloud Sync Modal */}
        <AnimatePresence>
          {showSettings && (
            <SettingsModal
              profile={store.profile}
              authUser={store.authUser}
              syncStatus={store.syncStatus}
              syncMessage={store.syncMessage}
              lastSyncedAt={store.lastSyncedAt}
              onUpdateProfile={store.updateProfile}
              onSignInGoogle={store.signInWithGoogle}
              onSignOut={store.signOutCloud}
              onPushSync={store.pushAllToCloud}
              onExportBackup={store.exportBackupJson}
              onRestoreBackup={store.restoreBackupJson}
              onClose={() => setShowSettings(false)}
            />
          )}
        </AnimatePresence>

        {/* Full-Screen TCS iON CBT Simulator Overlay */}
        {activeCBT && (
          <CBTSimulator
            title={activeCBT.title}
            examType={activeCBT.examType}
            aspirantName={store.profile.aspirantName}
            questions={activeCBT.questions}
            durationMinutes={activeCBT.durationMinutes}
            onFinish={handleFinishCBT}
            onExit={() => setActiveCBT(null)}
          />
        )}

        {/* Multi-Turn Gemini Mentor Chat Drawer */}
        <GeminiChatDrawer
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          profile={store.profile}
          masteryPercent={masteryPercent}
          mistakeCount={mistakeCount}
        />
      </div>
    </div>
  );
}
