import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import {
  ENGINEERING_QUOTES,
  findChapterMeta,
  getSubjectsForContext,
} from '../data/syllabusData';
import { todayIso } from '../hooks/useStudyBookStore';
import type {
  ActivityType,
  ChapterProgress,
  MockScore,
  StudyLog,
  UserProfile,
} from '../types/studybook';

interface HomeTabProps {
  profile: UserProfile;
  syllabusProgress: Record<string, ChapterProgress>;
  studyLogs: StudyLog[];
  mockScores: MockScore[];
  onToggleGoal: (goalId: string) => void;
  onAddGoal: (text: string) => void;
  onRemoveGoal: (goalId: string) => void;
  onAddStudyLog: (entry: Omit<StudyLog, 'id'>) => void;
  onDeleteStudyLog: (logId: string) => void;
  onCompleteRevision: (chapterId: string) => void;
  onOpenSubjectInSyllabus: (subjectId: string) => void;
  onOpenChapterInNotes: (chapterId: string) => void;
}

const ACTIVITIES: ActivityType[] = [
  'Concept Study',
  'PYQ Practice',
  'Revision',
  'Mock Analysis',
  'Formula Drill',
];

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getStageLabel(stage: number): string {
  if (stage === 1) return 'Day 3 Review';
  if (stage === 2) return 'Day 7 Review';
  if (stage === 3) return 'Day 21 Review';
  return 'Retained';
}

export const HomeTab: React.FC<HomeTabProps> = ({
  profile,
  syllabusProgress,
  studyLogs,
  mockScores,
  onToggleGoal,
  onAddGoal,
  onRemoveGoal,
  onAddStudyLog,
  onDeleteStudyLog,
  onCompleteRevision,
  onOpenSubjectInSyllabus,
  onOpenChapterInNotes,
}) => {
  const [quoteIdx, setQuoteIdx] = useState<number>(
    () => new Date().getDate() % ENGINEERING_QUOTES.length,
  );
  const [newGoalText, setNewGoalText] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);

  const activeSubjects = useMemo(
    () => getSubjectsForContext(profile.branch, profile.targetExam),
    [profile.branch, profile.targetExam],
  );

  // Log session form state
  const [logSubjectId, setLogSubjectId] = useState<string>(activeSubjects[0]?.id || '');
  const [logChapterId, setLogChapterId] = useState<string>('');
  const [logTopic, setLogTopic] = useState('');
  const [logActivity, setLogActivity] = useState<ActivityType>('Concept Study');
  const [logDuration, setLogDuration] = useState('60');
  const [logPyqs, setLogPyqs] = useState('25');
  const [logConfidence, setLogConfidence] = useState(4);
  const [logTakeaways, setLogTakeaways] = useState('');

  // KPI calculations
  const { totalChapters, masteredCount, masteryPercent, subjectStats } = useMemo(() => {
    let total = 0;
    let mastered = 0;
    const stats = activeSubjects.map((subj) => {
      const chCount = subj.chapters.length;
      let mCount = 0;
      let rCount = 0;
      for (const ch of subj.chapters) {
        const st = syllabusProgress[ch.id]?.status;
        if (st === 'mastered') mCount += 1;
        else if (st === 'revising') rCount += 1;
      }
      total += chCount;
      mastered += mCount;
      const pct = chCount > 0 ? Math.round(((mCount + rCount * 0.45) / chCount) * 100) : 0;
      return {
        subject: subj,
        total: chCount,
        mastered: mCount,
        revising: rCount,
        pct,
      };
    });
    return {
      totalChapters: total,
      masteredCount: mastered,
      masteryPercent: total > 0 ? Math.round((mastered / total) * 100) : 0,
      subjectStats: stats,
    };
  }, [activeSubjects, syllabusProgress]);

  const branchLogs = useMemo(
    () => studyLogs.filter((l) => l.branch === profile.branch),
    [studyLogs, profile.branch],
  );

  const totalStudyHours = useMemo(() => {
    const mins = branchLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
    return (mins / 60).toFixed(1);
  }, [branchLogs]);

  const branchMocks = useMemo(
    () => mockScores.filter((m) => m.branch === profile.branch),
    [mockScores, profile.branch],
  );

  const avgAccuracy = useMemo(() => {
    if (branchMocks.length === 0) return 0;
    const sum = branchMocks.reduce((acc, m) => acc + (m.accuracy || 0), 0);
    return Math.round(sum / branchMocks.length);
  }, [branchMocks]);

  // Spaced Repetition Revision Queue (3-7-21 day rule)
  const revisionQueue = useMemo(() => {
    const today = todayIso();
    const list: Array<{
      chapterId: string;
      title: string;
      subjectName: string;
      stage: number;
      nextDate: string;
      isDue: boolean;
      daysDiff: number;
    }> = [];

    for (const prog of Object.values(syllabusProgress)) {
      if (prog.revisionStage >= 1 && prog.revisionStage <= 3 && prog.nextRevisionDate) {
        const meta = findChapterMeta(prog.chapterId);
        if (!meta) continue;
        if (meta.subject.branch !== profile.branch && meta.subject.branch !== 'nontech') continue;

        const diffMs =
          new Date(prog.nextRevisionDate + 'T00:00:00').getTime() -
          new Date(today + 'T00:00:00').getTime();
        const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));
        list.push({
          chapterId: prog.chapterId,
          title: meta.title,
          subjectName: meta.subject.shortName,
          stage: prog.revisionStage,
          nextDate: prog.nextRevisionDate,
          isDue: daysDiff <= 0,
          daysDiff,
        });
      }
    }

    return list.sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  }, [syllabusProgress, profile.branch]);

  const activeQuote = ENGINEERING_QUOTES[quoteIdx % ENGINEERING_QUOTES.length];

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    onAddGoal(newGoalText);
    setNewGoalText('');
  };

  const openLogModal = () => {
    const defaultSubj = activeSubjects[0];
    setLogSubjectId(defaultSubj?.id || '');
    setLogChapterId('');
    setLogTopic('');
    setLogActivity('Concept Study');
    setLogDuration('60');
    setLogPyqs('25');
    setLogConfidence(4);
    setLogTakeaways('');
    setShowLogModal(true);
  };

  const selectedLogSubject = activeSubjects.find((s) => s.id === logSubjectId) || activeSubjects[0];

  const handleSaveStudyLog = (e: React.FormEvent) => {
    e.preventDefault();
    const subj = selectedLogSubject;
    if (!subj) return;
    const chapterTitle = subj.chapters.find((c) => c.id === logChapterId)?.title;
    const finalTopic = logTopic.trim() || chapterTitle || subj.name;
    onAddStudyLog({
      subjectId: subj.id,
      subjectName: subj.shortName,
      topic: finalTopic,
      chapterId: logChapterId || undefined,
      activityType: logActivity,
      durationMinutes: Math.max(5, Number(logDuration) || 30),
      pyqsSolved: Math.max(0, Number(logPyqs) || 0),
      confidence: logConfidence,
      takeaways: logTakeaways.trim(),
      branch: profile.branch,
      loggedDate: todayIso(),
    });
    setShowLogModal(false);
  };

  const completedGoalsCount = profile.dailyGoals.filter((g) => g.done).length;

  return (
    <div className="space-y-6">
      {/* Greeting & Motivational Engineering Quote */}
      <section className="sb-surface rounded-3xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 text-balance">
            {getTimeGreeting()}, {profile.aspirantName || 'Engineer'}
          </h1>
          <div className="flex items-start gap-2.5 pt-1">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              &ldquo;{activeQuote.text}&rdquo;{' '}
              <span className="text-zinc-400 dark:text-zinc-500">· {activeQuote.attribution}</span>
            </p>
            <button
              type="button"
              onClick={() => setQuoteIdx((i) => (i + 1) % ENGINEERING_QUOTES.length)}
              aria-label="Next motivational quote"
              className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={openLogModal}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Log Session</span>
        </button>
      </section>

      {/* 4 KPI Summary Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="sb-surface rounded-3xl p-5 space-y-1.5">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Syllabus Mastery</p>
          <p className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums tracking-tight text-zinc-950 dark:text-zinc-50">
            {masteryPercent}%
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {masteredCount} / {totalChapters} chapters
          </p>
        </div>

        <div className="sb-surface rounded-3xl p-5 space-y-1.5">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Study Hours</p>
          <p className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums tracking-tight text-zinc-950 dark:text-zinc-50">
            {totalStudyHours}h
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {branchLogs.length} logged {branchLogs.length === 1 ? 'session' : 'sessions'}
          </p>
        </div>

        <div className="sb-surface rounded-3xl p-5 space-y-1.5">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Avg Mock Accuracy</p>
          <p className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums tracking-tight text-zinc-950 dark:text-zinc-50">
            {avgAccuracy}%
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {branchMocks.length > 0 ? 'Across logged tests' : 'Take your first CBT mock'}
          </p>
        </div>

        <div className="sb-surface rounded-3xl p-5 space-y-1.5">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Mock Tests Taken</p>
          <p className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums tracking-tight text-zinc-950 dark:text-zinc-50">
            {branchMocks.length}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {revisionQueue.filter((r) => r.isDue).length} revisions due today
          </p>
        </div>
      </section>

      {/* Daily Target Checklist */}
      <section className="sb-surface rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Daily Target Checklist
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
              {completedGoalsCount} of {profile.dailyGoals.length} targets completed today
            </p>
          </div>
          <form onSubmit={handleGoalSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              maxLength={80}
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              placeholder="+ Add daily goal"
              className="flex-1 sm:w-52 min-h-[40px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-100/20"
            />
            <button
              type="submit"
              disabled={!newGoalText.trim()}
              className="min-h-[40px] px-3.5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-medium whitespace-nowrap shrink-0 disabled:opacity-40"
            >
              + Goal
            </button>
          </form>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {profile.dailyGoals.map((goal) => (
            <div
              key={goal.id}
              className={`group flex items-center gap-2 rounded-2xl border transition-all pl-3 pr-2 py-1.5 ${
                goal.done
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100'
                  : 'bg-black/[0.03] dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-zinc-800 dark:text-zinc-200 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleGoal(goal.id)}
                className="flex items-center gap-2 min-h-[32px] text-xs font-medium text-left"
              >
                <span
                  className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                    goal.done
                      ? 'border-white/40 dark:border-zinc-900/40 bg-white/15 dark:bg-zinc-900/15'
                      : 'border-zinc-400 dark:border-zinc-600'
                  }`}
                >
                  {goal.done && <Check className="w-3 h-3" />}
                </span>
                <span className={goal.done ? 'line-through opacity-80' : ''}>{goal.text}</span>
              </button>
              <button
                type="button"
                onClick={() => onRemoveGoal(goal.id)}
                aria-label={`Remove ${goal.text}`}
                className="min-h-[28px] min-w-[28px] flex items-center justify-center rounded-lg opacity-50 hover:opacity-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Main 2-Column Workspace Grid: Subject Mastery + Spaced Repetition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Subject-Wise Mastery Bars */}
        <section className="lg:col-span-7 sb-surface rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Subject-Wise Mastery
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Select any subject to update chapters and remarks
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
              {subjectStats.length} subjects
            </span>
          </div>

          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
            {subjectStats.map(({ subject, total, mastered, revising, pct }) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => onOpenSubjectInSyllabus(subject.id)}
                className="w-full py-3.5 first:pt-1 last:pb-1 text-left group transition-opacity hover:opacity-85"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate block">
                      {subject.name}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                      {subject.category === 'technical' ? 'Technical' : 'Non-Tech'} · {mastered}/{total} mastered
                      {revising > 0 ? ` · ${revising} revising` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
                      {pct}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-black/[0.07] dark:bg-white/[0.09] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Right Column: Spaced Repetition Queue + Daily Study Logs */}
        <div className="lg:col-span-5 space-y-5">
          {/* Spaced Repetition Queue (3-7-21 Rule) */}
          <section className="sb-surface rounded-3xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Spaced Repetition Queue
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Automatic 3–7–21 day reviews from mastered chapters &amp; study sessions
              </p>
            </div>

            {revisionQueue.length === 0 ? (
              <div className="py-6 text-center space-y-1.5 border-t border-black/[0.06] dark:border-white/[0.07]">
                <RotateCcw className="w-5 h-5 mx-auto text-zinc-400" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  No revisions queued yet
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Mark a chapter as Mastered in Syllabus or log a study session to trigger 3–7–21 day reminders.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                {revisionQueue.slice(0, 8).map((item) => (
                  <div key={item.chapterId} className="py-3 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                          {item.title}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums mt-0.5">
                          {item.subjectName} · {getStageLabel(item.stage)} ·{' '}
                          <span
                            className={
                              item.isDue
                                ? 'font-semibold text-zinc-950 dark:text-zinc-50'
                                : 'text-zinc-500 dark:text-zinc-400'
                            }
                          >
                            {item.daysDiff < 0
                              ? `${Math.abs(item.daysDiff)}d overdue`
                              : item.daysDiff === 0
                                ? 'Due today'
                                : `In ${item.daysDiff}d (${item.nextDate})`}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onCompleteRevision(item.chapterId)}
                        className="min-h-[36px] px-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-medium hover:opacity-90 whitespace-nowrap"
                      >
                        Mark Revised
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenChapterInNotes(item.chapterId)}
                        className="min-h-[36px] px-3 rounded-xl border border-black/10 dark:border-white/15 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 whitespace-nowrap"
                      >
                        Open Notes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Daily Study Logs */}
          <section className="sb-surface rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  Daily Study Logs
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Track hours, PYQs solved, and key takeaways
                </p>
              </div>
              <button
                type="button"
                onClick={openLogModal}
                className="min-h-[36px] px-3 rounded-xl border border-black/10 dark:border-white/15 text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5 whitespace-nowrap shrink-0"
              >
                + Log Session
              </button>
            </div>

            {branchLogs.length === 0 ? (
              <div className="py-6 text-center space-y-1.5 border-t border-black/[0.06] dark:border-white/[0.07]">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  No study sessions logged yet
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Record your first study block to build your hours and PYQ count.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07] max-h-[380px] overflow-y-auto pr-1">
                {branchLogs.slice(0, 15).map((log) => (
                  <div key={log.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                          {log.topic}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                          {log.subjectName} · {log.activityType} · {log.durationMinutes}m · {log.pyqsSolved} PYQs · Confidence {log.confidence}/5
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteStudyLog(log.id)}
                        aria-label="Delete study log"
                        className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {log.takeaways && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        {log.takeaways}
                      </p>
                    )}
                    <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 tabular-nums">
                      {log.loggedDate}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Log Study Session Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-sm p-0 sm:p-4">
          <div className="sb-surface w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.07] dark:border-white/[0.08]">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Log Study Session
              </h2>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                aria-label="Close modal"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudyLog} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Subject
                  </label>
                  <select
                    value={logSubjectId}
                    onChange={(e) => {
                      setLogSubjectId(e.target.value);
                      setLogChapterId('');
                    }}
                    className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    {activeSubjects.map((s) => (
                      <option key={s.id} value={s.id} className="bg-white dark:bg-zinc-900">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Activity Type
                  </label>
                  <select
                    value={logActivity}
                    onChange={(e) => setLogActivity(e.target.value as ActivityType)}
                    className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    {ACTIVITIES.map((act) => (
                      <option key={act} value={act} className="bg-white dark:bg-zinc-900">
                        {act}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedLogSubject && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Link Syllabus Chapter (auto-schedules 3-7-21 day revision)
                  </label>
                  <select
                    value={logChapterId}
                    onChange={(e) => {
                      setLogChapterId(e.target.value);
                      const ch = selectedLogSubject.chapters.find((c) => c.id === e.target.value);
                      if (ch && !logTopic.trim()) setLogTopic(ch.title);
                    }}
                    className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="" className="bg-white dark:bg-zinc-900">
                      — Optional: select chapter —
                    </option>
                    {selectedLogSubject.chapters.map((ch) => (
                      <option key={ch.id} value={ch.id} className="bg-white dark:bg-zinc-900">
                        {ch.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Topic Studied
                </label>
                <input
                  type="text"
                  required
                  maxLength={180}
                  value={logTopic}
                  onChange={(e) => setLogTopic(e.target.value)}
                  placeholder="e.g., Mohr Circle & Principal Stresses numericals"
                  className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={720}
                    required
                    value={logDuration}
                    onChange={(e) => setLogDuration(e.target.value)}
                    className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    PYQs Solved
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={logPyqs}
                    onChange={(e) => setLogPyqs(e.target.value)}
                    className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Confidence (1–5)
                  </label>
                  <div className="flex items-center gap-1 min-h-[44px]">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setLogConfidence(rating)}
                        className={`flex-1 h-9 rounded-xl text-xs font-mono font-semibold transition-all ${
                          logConfidence === rating
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                            : 'bg-black/[0.05] dark:bg-white/[0.07] text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Key Takeaways &amp; Formulas Revised
                </label>
                <textarea
                  rows={3}
                  maxLength={900}
                  value={logTakeaways}
                  onChange={(e) => setLogTakeaways(e.target.value)}
                  placeholder="Note any IS code clause, tricky exception, or error you caught..."
                  className="w-full rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 p-3.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="min-h-[44px] px-4 rounded-2xl border border-black/10 dark:border-white/15 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
