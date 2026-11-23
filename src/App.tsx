import React, { useState } from 'react';
import {
  BookOpen,
  ClipboardCheck,
  Home,
  Layers,
  Settings,
} from 'lucide-react';
import { StudyBookLogo } from './components/StudyBookLogo';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';
import { OnboardingModal } from './components/OnboardingModal';
import { SettingsModal } from './components/SettingsModal';
import { HomeTab } from './components/HomeTab';
import { SyllabusTab } from './components/SyllabusTab';
import { MocksTab } from './components/MocksTab';
import { NotesTab } from './components/NotesTab';
import { CBTSimulator, type CBTResultPayload } from './components/CBTSimulator';
import { todayIso, useStudyBookStore } from './hooks/useStudyBookStore';
import type {
  AppTab,
  Branch,
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
  const [activeCBT, setActiveCBT] = useState<ActiveCBTSession | null>(null);

  const needsOnboarding = !store.profile.aspirantName.trim();

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

  return (
    <div className="min-h-screen sb-canvas-bg bg-[#F5F5F7] dark:bg-[#0A0A0C] text-zinc-950 dark:text-zinc-50 flex flex-col">
      <OfflineIndicator />

      {/* Top Command Bar */}
      <header className="sb-glass-bar sticky top-0 z-30 h-14 sm:h-16">
        <div className="max-w-7xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo & Title */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus:outline-none"
          >
            <StudyBookLogo className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
            <span className="text-base sm:text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              StudyBook
            </span>
          </button>

          {/* Controls: Branch Switcher + Target Exam Filter + Install + Settings */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            {/* Branch Switcher (Civil / Mechanical) */}
            <div
              role="group"
              aria-label="Engineering branch"
              className="flex items-center p-0.5 rounded-xl bg-black/[0.06] dark:bg-white/[0.08] shrink-0"
            >
              {(
                [
                  { id: 'civil', label: 'Civil' },
                  { id: 'mechanical', label: 'Mech', full: 'Mechanical' },
                ] as { id: Branch; label: string; full?: string }[]
              ).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    store.updateProfile({ branch: b.id });
                    setSelectedSubjectId(null);
                  }}
                  className={`min-h-[34px] px-2.5 sm:px-3 rounded-[10px] text-xs font-medium transition-all whitespace-nowrap ${
                    store.profile.branch === b.id
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
                  }`}
                >
                  <span className="sm:hidden">{b.label}</span>
                  <span className="hidden sm:inline">{b.full || b.label}</span>
                </button>
              ))}
            </div>

            {/* Target Exam Filter */}
            <select
              aria-label="Target Exam Filter"
              value={store.profile.targetExam}
              onChange={(e) => store.updateProfile({ targetExam: e.target.value as TargetExam })}
              className="min-h-[38px] max-w-[132px] sm:max-w-none rounded-xl bg-black/[0.05] dark:bg-white/[0.07] border border-black/[0.08] dark:border-white/[0.09] px-2.5 sm:px-3 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none truncate"
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

            {/* In-App PWA Install Trigger (hides automatically when standalone) */}
            <div className="hidden md:block">
              <PWAInstallButton variant="compact" />
            </div>

            {/* Settings Gear Button */}
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              aria-label="Open settings"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-black/[0.05] dark:bg-white/[0.07] border border-black/[0.08] dark:border-white/[0.09] text-zinc-800 dark:text-zinc-200 hover:bg-black/10 dark:hover:bg-white/15 transition-colors shrink-0"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-28">
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
                className={`min-h-[46px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-150 ${
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
      {showSettings && (
        <SettingsModal
          profile={store.profile}
          authUser={store.authUser}
          syncStatus={store.syncStatus}
          syncMessage={store.syncMessage}
          onUpdateProfile={store.updateProfile}
          onSignInGoogle={store.signInWithGoogle}
          onSignOut={store.signOutCloud}
          onPushSync={store.pushAllToCloud}
          onExportBackup={store.exportBackupJson}
          onRestoreBackup={store.restoreBackupJson}
          onClose={() => setShowSettings(false)}
        />
      )}

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
    </div>
  );
}
