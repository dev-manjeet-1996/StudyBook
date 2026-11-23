import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  LayoutGrid,
  RotateCcw,
  X,
  XCircle,
} from 'lucide-react';
import type { ExamPattern, QuestionItem } from '../types/studybook';

export interface CBTResultPayload {
  title: string;
  examType: ExamPattern;
  score: number;
  maxScore: number;
  accuracy: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeTakenMinutes: number;
  wrongQuestionUpdates: Array<{ questionId: string; chosenIndex: number }>;
  masteredQuestionIds: string[];
}

interface CBTSimulatorProps {
  title: string;
  examType: ExamPattern;
  aspirantName: string;
  questions: QuestionItem[];
  durationMinutes: number;
  onFinish: (result: CBTResultPayload) => void;
  onExit: () => void;
}

type QuestionStatus =
  | 'not_visited'
  | 'not_answered'
  | 'answered'
  | 'marked'
  | 'answered_marked';

function formatTimer(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const CBTSimulator: React.FC<CBTSimulatorProps> = ({
  title,
  examType,
  aspirantName,
  questions,
  durationMinutes,
  onFinish,
  onExit,
}) => {
  const negativeMark = examType === 'rrb_je' ? 1 / 3 : 0.25;
  const totalSecondsInitial = Math.max(60, durationMinutes * 60);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>(() =>
    questions[0] ? { [questions[0].id]: true } : {},
  );
  const [secondsLeft, setSecondsLeft] = useState(totalSecondsInitial);
  const [showPaletteMobile, setShowPaletteMobile] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [finalResult, setFinalResult] = useState<CBTResultPayload | null>(null);

  const currentQuestion = questions[currentIdx];

  // Countdown timer
  useEffect(() => {
    if (submitted) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [submitted]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (secondsLeft === 0 && !submitted) {
      handleSubmitTest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, submitted]);

  const goToIndex = (nextIdx: number) => {
    const clamped = Math.max(0, Math.min(questions.length - 1, nextIdx));
    setCurrentIdx(clamped);
    const targetQ = questions[clamped];
    if (targetQ) {
      setVisited((prev) => ({ ...prev, [targetQ.id]: true }));
    }
    setShowPaletteMobile(false);
  };

  const getStatus = (qId: string): QuestionStatus => {
    const hasAns = typeof answers[qId] === 'number';
    const isMarked = Boolean(marked[qId]);
    const isVisited = Boolean(visited[qId]);
    if (hasAns && isMarked) return 'answered_marked';
    if (hasAns) return 'answered';
    if (isMarked) return 'marked';
    if (isVisited) return 'not_answered';
    return 'not_visited';
  };

  const paletteCounts = useMemo(() => {
    const counts = {
      answered: 0,
      not_answered: 0,
      marked: 0,
      answered_marked: 0,
      not_visited: 0,
    };
    for (const q of questions) {
      counts[getStatus(q.id)] += 1;
    }
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, answers, marked, visited]);

  const handleSelectOption = (optionIndex: number) => {
    if (!currentQuestion || submitted) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }));
  };

  const handleClearResponse = () => {
    if (!currentQuestion || submitted) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQuestion.id];
      return next;
    });
  };

  const handleSaveAndNext = () => {
    if (!currentQuestion) return;
    setMarked((prev) => {
      const next = { ...prev };
      delete next[currentQuestion.id];
      return next;
    });
    if (currentIdx < questions.length - 1) {
      goToIndex(currentIdx + 1);
    }
  };

  const handleMarkForReviewAndNext = () => {
    if (!currentQuestion) return;
    setMarked((prev) => ({ ...prev, [currentQuestion.id]: true }));
    if (currentIdx < questions.length - 1) {
      goToIndex(currentIdx + 1);
    }
  };

  const handleSubmitTest = () => {
    if (submitted) return;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    const wrongQuestionUpdates: Array<{ questionId: string; chosenIndex: number }> = [];
    const masteredQuestionIds: string[] = [];

    for (const q of questions) {
      const chosen = answers[q.id];
      if (typeof chosen !== 'number') {
        skippedCount += 1;
        // Skipped questions are also added to Mistake Book (-1 signals skipped)
        wrongQuestionUpdates.push({ questionId: q.id, chosenIndex: -1 });
      } else if (chosen === q.correctIndex) {
        correctCount += 1;
        masteredQuestionIds.push(q.id);
      } else {
        wrongCount += 1;
        wrongQuestionUpdates.push({ questionId: q.id, chosenIndex: chosen });
      }
    }

    const rawScore = correctCount - wrongCount * negativeMark;
    const score = Number(rawScore.toFixed(2));
    const attempted = correctCount + wrongCount;
    const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;
    const elapsedSeconds = Math.max(1, totalSecondsInitial - secondsLeft);
    const timeTakenMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    const payload: CBTResultPayload = {
      title,
      examType,
      score,
      maxScore: questions.length,
      accuracy,
      correctCount,
      wrongCount,
      skippedCount,
      timeTakenMinutes,
      wrongQuestionUpdates,
      masteredQuestionIds,
    };

    setFinalResult(payload);
    setSubmitted(true);
    setConfirmSubmit(false);
    onFinish(payload);
  };

  const statusButtonClass = (status: QuestionStatus, isCurrent: boolean) => {
    const ring = isCurrent ? 'ring-2 ring-zinc-950 dark:ring-white ring-offset-2 dark:ring-offset-zinc-950' : '';
    switch (status) {
      case 'answered':
        return `bg-emerald-600 text-white border-emerald-700 ${ring}`;
      case 'not_answered':
        return `bg-rose-600 text-white border-rose-700 ${ring}`;
      case 'marked':
        return `bg-violet-600 text-white border-violet-700 ${ring}`;
      case 'answered_marked':
        return `bg-violet-700 text-white border-emerald-400 border-2 ${ring}`;
      default:
        return `bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 ${ring}`;
    }
  };

  // Post-Submission Detailed Scorecard & Solutions View
  if (submitted && finalResult) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F5F5F7] dark:bg-[#0A0A0C] overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6">
          <div className="sb-surface rounded-3xl p-6 sm:p-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                {examType === 'rrb_je' ? 'RRB JE (−0.33)' : 'SSC JE (−0.25)'} · CBT Scorecard
              </p>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
                {finalResult.title}
              </h1>
            </div>
            <button
              type="button"
              onClick={onExit}
              className="min-h-[44px] px-5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90"
            >
              Return to Mocks
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="sb-surface rounded-3xl p-4 space-y-1">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Net Score</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-zinc-950 dark:text-zinc-50">
                {finalResult.score}/{finalResult.maxScore}
              </p>
            </div>
            <div className="sb-surface rounded-3xl p-4 space-y-1">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Accuracy</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-zinc-950 dark:text-zinc-50">
                {finalResult.accuracy}%
              </p>
            </div>
            <div className="sb-surface rounded-3xl p-4 space-y-1">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Correct</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                +{finalResult.correctCount}
              </p>
            </div>
            <div className="sb-surface rounded-3xl p-4 space-y-1">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Wrong</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                −{finalResult.wrongCount}
              </p>
            </div>
            <div className="sb-surface rounded-3xl p-4 space-y-1 col-span-2 sm:col-span-1">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Skipped</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
                {finalResult.skippedCount}
              </p>
            </div>
          </div>

          <div className="sb-surface rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Question-by-Question Review
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Wrong &amp; skipped questions have been saved to your Mistake Book
              </p>
            </div>

            <div className="divide-y divide-black/[0.07] dark:divide-white/[0.08]">
              {questions.map((q, idx) => {
                const chosen = answers[q.id];
                const isCorrect = chosen === q.correctIndex;
                const isSkipped = typeof chosen !== 'number';
                return (
                  <div key={q.id} className="py-5 first:pt-1 last:pb-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50 leading-relaxed">
                        <span className="font-mono font-semibold mr-2">Q{idx + 1}.</span>
                        {q.questionText}
                      </p>
                      <span
                        className={`text-xs font-semibold shrink-0 flex items-center gap-1 ${
                          isCorrect
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isSkipped
                              ? 'text-zinc-500'
                              : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Correct
                          </>
                        ) : isSkipped ? (
                          'Skipped'
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" /> Wrong
                          </>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => {
                        const isRightOpt = oIdx === q.correctIndex;
                        const isWrongPicked = chosen === oIdx && !isRightOpt;
                        return (
                          <div
                            key={oIdx}
                            className={`rounded-2xl px-3.5 py-2.5 text-xs border ${
                              isRightOpt
                                ? 'bg-emerald-500/10 border-emerald-600/40 text-emerald-900 dark:text-emerald-200 font-medium'
                                : isWrongPicked
                                  ? 'bg-rose-500/10 border-rose-600/40 text-rose-900 dark:text-rose-200'
                                  : 'border-black/[0.08] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            <span className="font-mono font-semibold mr-2">
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            {opt}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl p-3 leading-relaxed">
                        <strong className="text-zinc-900 dark:text-zinc-100">Explanation: </strong>
                        {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const chosenForCurrent = answers[currentQuestion.id];

  const renderPaletteContent = () => (
    <div className="flex flex-col h-full">
      {/* Aspirant Profile Header */}
      <div className="p-4 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-semibold text-sm shrink-0">
          {(aspirantName || 'A').slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 truncate">
            {aspirantName || 'Candidate'}
          </p>
          <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            {examType === 'rrb_je' ? 'RRB JE CBT' : 'SSC JE CBT'}
          </p>
        </div>
      </div>

      {/* TCS iON Color-Coded Legend */}
      <div className="p-4 border-b border-black/[0.08] dark:border-white/[0.08] grid grid-cols-2 gap-2 text-[11px] text-zinc-700 dark:text-zinc-300">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-mono text-[11px] flex items-center justify-center tabular-nums">
            {paletteCounts.answered}
          </span>
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-mono text-[11px] flex items-center justify-center tabular-nums">
            {paletteCounts.not_answered}
          </span>
          <span>Not Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-violet-600 text-white font-mono text-[11px] flex items-center justify-center tabular-nums">
            {paletteCounts.marked}
          </span>
          <span>Marked</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] flex items-center justify-center tabular-nums">
            {paletteCounts.not_visited}
          </span>
          <span>Not Visited</span>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-violet-700 border-2 border-emerald-400 text-white font-mono text-[11px] flex items-center justify-center tabular-nums">
            {paletteCounts.answered_marked}
          </span>
          <span>Answered &amp; Marked for Review</span>
        </div>
      </div>

      {/* Question Number Palette Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-3">
          Question Palette
        </p>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, idx) => {
            const st = getStatus(q.id);
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => goToIndex(idx)}
                className={`h-10 rounded-xl border text-xs font-mono font-semibold tabular-nums transition-all ${statusButtonClass(st, idx === currentIdx)}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-black/[0.08] dark:border-white/[0.08]">
        <button
          type="button"
          onClick={() => setConfirmSubmit(true)}
          className="w-full min-h-[46px] rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90"
        >
          Submit Test
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F5F5F7] dark:bg-[#0A0A0C]">
      {/* Authentic TCS iON Top Exam Header */}
      <header className="h-14 sm:h-16 px-4 sm:px-6 bg-zinc-950 text-zinc-50 flex items-center justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <p className="text-sm sm:text-base font-semibold truncate">{title}</p>
          <p className="text-[11px] text-zinc-400 font-mono">
            {examType === 'rrb_je' ? 'RRB JE (+1 / −0.33)' : 'SSC JE (+1 / −0.25)'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-semibold tabular-nums ${
              secondsLeft < 180
                ? 'bg-rose-600 text-white'
                : 'bg-white/10 text-zinc-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(secondsLeft)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowPaletteMobile((v) => !v)}
            aria-label="Toggle question palette"
            className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/10 text-white"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onExit}
            aria-label="Exit CBT simulator"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Split Exam Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Question Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Question Sub-bar */}
          <div className="px-4 sm:px-8 py-3 border-b border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-zinc-900/80 flex items-center justify-between gap-3 shrink-0">
            <span className="text-sm font-semibold font-mono tabular-nums text-zinc-950 dark:text-zinc-50">
              Question No. {currentIdx + 1} of {questions.length}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {currentQuestion.subject}
              {currentQuestion.topic ? ` · ${currentQuestion.topic}` : ''}
            </span>
          </div>

          {/* Question & Options Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-3xl space-y-6">
              <p className="text-base sm:text-lg font-medium text-zinc-950 dark:text-zinc-50 leading-relaxed">
                {currentQuestion.questionText}
              </p>

              <div className="space-y-3">
                {currentQuestion.options.map((option, optIdx) => {
                  const selected = chosenForCurrent === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full min-h-[54px] text-left rounded-2xl border p-4 flex items-start gap-3.5 transition-all ${
                        selected
                          ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100 shadow-sm'
                          : 'bg-white/80 dark:bg-zinc-900/70 border-black/10 dark:border-white/10 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono font-semibold shrink-0 mt-0.5 ${
                          selected
                            ? 'border-white/50 dark:border-zinc-950/50 bg-white/15 dark:bg-zinc-950/15'
                            : 'border-zinc-400 dark:border-zinc-600'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="text-sm sm:text-base leading-snug">{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Authentic TCS iON Action Footer */}
          <footer className="px-4 sm:px-8 py-3.5 pb-safe border-t border-black/[0.08] dark:border-white/[0.08] bg-white/90 dark:bg-zinc-900/90 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleMarkForReviewAndNext}
                className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 rounded-xl border border-violet-600/35 text-violet-700 dark:text-violet-300 text-xs font-medium hover:bg-violet-500/10 whitespace-nowrap"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Mark for Review &amp; Next</span>
              </button>

              <button
                type="button"
                onClick={handleClearResponse}
                className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 rounded-xl border border-black/12 dark:border-white/15 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Response</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => goToIndex(currentIdx - 1)}
                className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl border border-black/12 dark:border-white/15 text-zinc-700 dark:text-zinc-300 disabled:opacity-35"
                aria-label="Previous question"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  className="min-h-[42px] inline-flex items-center gap-1.5 px-5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 whitespace-nowrap"
                >
                  <span>Save &amp; Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmSubmit(true)}
                  className="min-h-[42px] px-5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 whitespace-nowrap"
                >
                  Submit Exam
                </button>
              )}
            </div>
          </footer>
        </main>

        {/* Right Desktop Question Palette Sidebar */}
        <aside className="hidden lg:block w-80 border-l border-black/[0.08] dark:border-white/[0.08] bg-white/85 dark:bg-zinc-900/85 shrink-0">
          {renderPaletteContent()}
        </aside>
      </div>

      {/* Mobile Palette Drawer */}
      {showPaletteMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-sm">
          <div className="w-80 max-w-[85vw] h-full bg-white dark:bg-zinc-900 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowPaletteMobile(false)}
              aria-label="Close palette"
              className="absolute top-3 right-3 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-zinc-500"
            >
              <X className="w-4 h-4" />
            </button>
            {renderPaletteContent()}
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="sb-surface w-full max-w-md rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Submit CBT Exam?
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs tabular-nums">
              <div className="p-3 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05]">
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {paletteCounts.answered + paletteCounts.answered_marked}
                </p>
                <p className="text-zinc-500">Answered</p>
              </div>
              <div className="p-3 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05]">
                <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                  {paletteCounts.marked + paletteCounts.answered_marked}
                </p>
                <p className="text-zinc-500">Marked</p>
              </div>
              <div className="p-3 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05]">
                <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
                  {paletteCounts.not_answered + paletteCounts.not_visited}
                </p>
                <p className="text-zinc-500">Unanswered</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Negative marking of {examType === 'rrb_je' ? '−0.33' : '−0.25'} per wrong answer will be applied automatically.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSubmit(false)}
                className="min-h-[42px] px-4 rounded-2xl border border-black/10 dark:border-white/15 text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Continue Test
              </button>
              <button
                type="button"
                onClick={handleSubmitTest}
                className="min-h-[42px] px-5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-sm font-semibold"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
