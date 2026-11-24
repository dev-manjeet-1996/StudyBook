import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Search,
} from 'lucide-react';
import { getSubjectsForContext } from '../data/syllabusData';
import type {
  ChapterProgress,
  ChapterStatus,
  ContentBranch,
  UserProfile,
} from '../types/studybook';

interface SyllabusTabProps {
  profile: UserProfile;
  syllabusProgress: Record<string, ChapterProgress>;
  selectedSubjectId: string | null;
  onSelectSubject: (subjectId: string | null) => void;
  onUpdateChapter: (
    chapterId: string,
    subjectId: string,
    branch: ContentBranch,
    updates: Partial<Pick<ChapterProgress, 'status' | 'remarks'>>,
  ) => void;
  onOpenChapterInNotes: (chapterId: string) => void;
}

type CategoryFilter = 'all' | 'technical' | 'nontech';

const STATUS_OPTIONS: { id: ChapterStatus; label: string }[] = [
  { id: 'not_started', label: 'Not Started' },
  { id: 'revising', label: 'Revising' },
  { id: 'mastered', label: 'Mastered' },
];

export const SyllabusTab: React.FC<SyllabusTabProps> = ({
  profile,
  syllabusProgress,
  selectedSubjectId,
  onSelectSubject,
  onUpdateChapter,
  onOpenChapterInNotes,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const allSubjects = useMemo(
    () => getSubjectsForContext(profile.branch, profile.targetExam),
    [profile.branch, profile.targetExam],
  );

  const filteredSubjects = useMemo(() => {
    return allSubjects.filter((subj) => {
      if (categoryFilter !== 'all' && subj.category !== categoryFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const nameMatch = subj.name.toLowerCase().includes(q) || subj.shortName.toLowerCase().includes(q);
        const chapterMatch = subj.chapters.some((c) => c.title.toLowerCase().includes(q));
        return nameMatch || chapterMatch;
      }
      return true;
    });
  }, [allSubjects, categoryFilter, searchTerm]);

  const activeSubject = useMemo(
    () => allSubjects.find((s) => s.id === selectedSubjectId) || null,
    [allSubjects, selectedSubjectId],
  );

  // Subject Drill-Down Page
  if (activeSubject) {
    const masteredCount = activeSubject.chapters.filter(
      (c) => syllabusProgress[c.id]?.status === 'mastered',
    ).length;
    const revisingCount = activeSubject.chapters.filter(
      (c) => syllabusProgress[c.id]?.status === 'revising',
    ).length;
    const pct = Math.round(
      ((masteredCount + revisingCount * 0.45) / activeSubject.chapters.length) * 100,
    );

    return (
      <div className="space-y-5">
        <div className="sb-surface rounded-3xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onSelectSubject(null)}
              className="min-h-[40px] inline-flex items-center gap-2 rounded-2xl border border-black/10 dark:border-white/15 px-3.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Subjects</span>
            </button>

            <span className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
              {masteredCount} mastered · {revisingCount} revising · {activeSubject.chapters.length} total
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {activeSubject.name}
            </h1>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-black/[0.07] dark:bg-white/[0.09] overflow-hidden">
                <div
                  className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {pct}%
              </span>
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <section className="sb-surface rounded-3xl p-5 sm:p-6 divide-y divide-black/[0.07] dark:divide-white/[0.08]">
          {activeSubject.chapters.map((chapter, idx) => {
            const prog = syllabusProgress[chapter.id];
            const currentStatus: ChapterStatus = prog?.status ?? 'not_started';
            const remarks = prog?.remarks ?? '';

            return (
              <div key={chapter.id} className="py-5 first:pt-1 last:pb-1 space-y-3.5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-sm sm:text-base font-medium text-zinc-950 dark:text-zinc-50 leading-snug">
                      {String(idx + 1).padStart(2, '0')}. {chapter.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                      Weightage: {chapter.weightage}
                      {prog?.nextRevisionDate
                        ? ` · Next 3-7-21 review: ${prog.nextRevisionDate}`
                        : ''}
                    </p>
                  </div>

                  {/* 3-State Status Toggle + Notes button */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/[0.05] dark:bg-white/[0.07]">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            onUpdateChapter(chapter.id, activeSubject.id, activeSubject.branch, {
                              status: opt.id,
                            })
                          }
                          className={`min-h-[34px] px-2.5 sm:px-3 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                            currentStatus === opt.id
                              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenChapterInNotes(chapter.id)}
                      className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 rounded-2xl border border-black/10 dark:border-white/15 text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5 whitespace-nowrap"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Notes</span>
                    </button>
                  </div>
                </div>

                {/* Inline Chapter Remarks */}
                <input
                  type="text"
                  maxLength={480}
                  value={remarks}
                  onChange={(e) =>
                    onUpdateChapter(chapter.id, activeSubject.id, activeSubject.branch, {
                      remarks: e.target.value,
                    })
                  }
                  placeholder="Add chapter remarks, IS code clauses, or weak formulas..."
                  className="w-full min-h-[40px] rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.07] dark:border-white/[0.08] px-3.5 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-zinc-100/15"
                />
              </div>
            );
          })}
        </section>
      </div>
    );
  }

  // Main Syllabus Subject Grid View
  return (
    <div className="space-y-5">
      <section className="sb-surface rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Syllabus Tracker
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {profile.branch === 'civil' ? 'Civil Engineering' : 'Mechanical Engineering'} ·{' '}
              {profile.targetExam === 'combo'
                ? 'Combo: RRB + SSC JE'
                : profile.targetExam === 'ssc_je'
                  ? 'SSC JE 2026'
                  : 'RRB JE 2026'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tech / Non-Tech Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/[0.05] dark:bg-white/[0.07]">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'technical', label: 'Technical' },
                  { id: 'nontech', label: 'Non-Tech' },
                ] as { id: CategoryFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`min-h-[38px] px-3.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    categoryFilter === tab.id
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter subjects or chapters (e.g., IS 456, Mohr Circle, Otto Cycle, Syllogism)..."
            className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] pl-10 pr-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-zinc-100/15"
          />
        </div>
      </section>

      {/* Subject Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((subject) => {
          const total = subject.chapters.length;
          const mastered = subject.chapters.filter(
            (c) => syllabusProgress[c.id]?.status === 'mastered',
          ).length;
          const revising = subject.chapters.filter(
            (c) => syllabusProgress[c.id]?.status === 'revising',
          ).length;
          const pct = total > 0 ? Math.round(((mastered + revising * 0.45) / total) * 100) : 0;

          return (
            <button
              key={subject.id}
              type="button"
              onClick={() => onSelectSubject(subject.id)}
              className="sb-surface rounded-3xl p-5 text-left flex flex-col justify-between gap-4 transition-transform duration-150 hover:-translate-y-0.5 group"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 leading-snug">
                    {subject.name}
                  </h2>
                  <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                  {subject.category === 'technical' ? 'Technical' : 'Non-Tech'} · {total} chapters ·{' '}
                  {mastered} mastered
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                  <span className="text-zinc-500 dark:text-zinc-400">Progress</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-black/[0.07] dark:bg-white/[0.09] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
