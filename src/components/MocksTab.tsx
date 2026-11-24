import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  FileUp,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Shuffle,
  Trash2,
  X,
} from 'lucide-react';
import { parseUploadedFiles } from '../lib/pdfParser';
import { todayIso } from '../hooks/useStudyBookStore';
import type {
  ContentBranch,
  ExamPattern,
  MockScore,
  QuestionItem,
  UserProfile,
} from '../types/studybook';

interface MocksTabProps {
  profile: UserProfile;
  mockScores: MockScore[];
  questionBank: QuestionItem[];
  onAddMockScore: (entry: Omit<MockScore, 'id'>) => void;
  onDeleteMockScore: (scoreId: string) => void;
  onAddQuestions: (items: Array<Omit<QuestionItem, 'id' | 'isMistake' | 'wrongCount'>>) => number;
  onUpdateMistake: (questionId: string, isMistake: boolean) => void;
  onDeleteQuestion: (questionId: string) => void;
  onLaunchCBT: (config: {
    title: string;
    examType: ExamPattern;
    questions: QuestionItem[];
    durationMinutes: number;
  }) => void;
}

type MockSubView = 'arena' | 'extractor' | 'mistakes';

interface DraftExtractedQuestion {
  questionText: string;
  options: [string, string, string, string];
  correctIndex: number;
  subject: string;
  topic: string;
  branch: ContentBranch;
  examType: ExamPattern;
  explanation: string;
  sourceName: string;
}

function fisherYatesShuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const MocksTab: React.FC<MocksTabProps> = ({
  profile,
  mockScores,
  questionBank,
  onAddMockScore,
  onDeleteMockScore,
  onAddQuestions,
  onUpdateMistake,
  onDeleteQuestion,
  onLaunchCBT,
}) => {
  const [subView, setSubView] = useState<MockSubView>('arena');

  // CBT Launcher Config
  const [examPattern, setExamPattern] = useState<ExamPattern>(
    profile.targetExam === 'rrb_je' ? 'rrb_je' : 'ssc_je',
  );
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [customOrderIds, setCustomOrderIds] = useState<string[] | null>(null);
  const [showRearrange, setShowRearrange] = useState(false);
  const [durationMins, setDurationMins] = useState('15');

  // Manual Mock Score Logger Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualExam, setManualExam] = useState<ExamPattern>('ssc_je');
  const [manualScore, setManualScore] = useState('');
  const [manualMax, setManualMax] = useState('200');
  const [manualAccuracy, setManualAccuracy] = useState('82');
  const [manualCorrect, setManualCorrect] = useState('140');
  const [manualWrong, setManualWrong] = useState('30');
  const [manualSkipped, setManualSkipped] = useState('30');
  const [manualTime, setManualTime] = useState('120');

  // Answer Key Extractor State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [extractExam, setExtractExam] = useState<ExamPattern>('ssc_je');
  const [extractSourceName, setExtractSourceName] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [draftQuestions, setDraftQuestions] = useState<DraftExtractedQuestion[] | null>(null);
  const [extractBanner, setExtractBanner] = useState('');

  const branchScores = useMemo(
    () => mockScores.filter((m) => m.branch === profile.branch),
    [mockScores, profile.branch],
  );

  const relevantBank = useMemo(
    () => questionBank.filter((q) => q.branch === profile.branch || q.branch === 'nontech'),
    [questionBank, profile.branch],
  );

  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    for (const q of relevantBank) set.add(q.subject);
    return Array.from(set).sort();
  }, [relevantBank]);

  const filteredQuestionsForTest = useMemo(() => {
    const base =
      subjectFilter === 'all'
        ? relevantBank
        : relevantBank.filter((q) => q.subject === subjectFilter);
    if (customOrderIds && customOrderIds.length > 0) {
      const map = new Map(base.map((q) => [q.id, q]));
      const ordered: QuestionItem[] = [];
      for (const id of customOrderIds) {
        const found = map.get(id);
        if (found) {
          ordered.push(found);
          map.delete(id);
        }
      }
      for (const rem of map.values()) ordered.push(rem);
      return ordered;
    }
    return base;
  }, [relevantBank, subjectFilter, customOrderIds]);

  const mistakeQuestions = useMemo(
    () => relevantBank.filter((q) => q.isMistake),
    [relevantBank],
  );

  const handleMoveQuestion = (idx: number, direction: -1 | 1) => {
    const list = filteredQuestionsForTest.map((q) => q.id);
    const target = idx + direction;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    setCustomOrderIds(list);
    setShuffleQuestions(false);
  };

  const handleStartMock = () => {
    if (filteredQuestionsForTest.length === 0) return;
    const finalList = shuffleQuestions
      ? fisherYatesShuffle(filteredQuestionsForTest)
      : filteredQuestionsForTest;
    onLaunchCBT({
      title:
        subjectFilter === 'all'
          ? `${examPattern === 'rrb_je' ? 'RRB JE' : 'SSC JE'} Full CBT Mock`
          : `${subjectFilter} Practice CBT`,
      examType: examPattern,
      questions: finalList,
      durationMinutes: Math.max(2, Number(durationMins) || 15),
    });
  };

  const handleRetestMistakes = () => {
    if (mistakeQuestions.length === 0) return;
    onLaunchCBT({
      title: `Mistake Book Re-Test (${mistakeQuestions.length} Qs)`,
      examType: examPattern,
      questions: fisherYatesShuffle(mistakeQuestions),
      durationMinutes: Math.max(5, Math.ceil(mistakeQuestions.length * 1.2)),
    });
  };

  const handleSaveManualMock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    onAddMockScore({
      title: manualTitle.trim(),
      examType: manualExam,
      branch: profile.branch,
      score: Number(manualScore) || 0,
      maxScore: Math.max(1, Number(manualMax) || 100),
      accuracy: Math.max(0, Math.min(100, Number(manualAccuracy) || 0)),
      correctCount: Math.max(0, Number(manualCorrect) || 0),
      wrongCount: Math.max(0, Number(manualWrong) || 0),
      skippedCount: Math.max(0, Number(manualSkipped) || 0),
      timeTakenMinutes: Math.max(1, Number(manualTime) || 60),
      date: todayIso(),
    });
    setShowManualModal(false);
    setManualTitle('');
  };

  const runExtraction = async (files?: FileList | null) => {
    setExtractError('');
    setExtractBanner('');
    setExtracting(true);
    try {
      let textContent = pastedText.trim();
      let images: { mimeType: string; data: string }[] = [];
      let label = extractSourceName.trim() || 'Official Answer Key';

      if (files && files.length > 0) {
        const parsed = await parseUploadedFiles(files);
        textContent = [parsed.textContent, textContent].filter(Boolean).join('\n\n');
        images = parsed.images;
        if (!extractSourceName.trim()) {
          label = files[0].name.replace(/\.[^.]+$/, '');
        }
      }

      if (!textContent && images.length === 0) {
        setExtractError('Upload a PDF, HTML response sheet, image, or paste questions first.');
        setExtracting(false);
        return;
      }

      const res = await fetch('/api/ai/extract-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent,
          images,
          examType: extractExam,
          branch: profile.branch,
          sourceName: label,
        }),
      });

      const data = (await res.json()) as {
        questions?: DraftExtractedQuestion[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Extraction request failed.');
      }
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No valid MCQs were detected in that document. Try a clearer file or paste the question text.');
      }

      setDraftQuestions(data.questions);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Could not extract answer key.');
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmSaveExtracted = () => {
    if (!draftQuestions || draftQuestions.length === 0) return;
    const count = onAddQuestions(draftQuestions);
    setDraftQuestions(null);
    setPastedText('');
    setExtractBanner(`Saved ${count} verified ${count === 1 ? 'question' : 'questions'} to your Question Bank.`);
    setSubView('arena');
  };

  return (
    <div className="space-y-5">
      {/* Header & Sub-View Switcher */}
      <section className="sb-surface rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            CBT Mock Arena
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {relevantBank.length} questions in bank · {mistakeQuestions.length} in Mistake Book ·{' '}
            {branchScores.length} mocks logged
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/[0.05] dark:bg-white/[0.07] self-start md:self-auto">
          {(
            [
              { id: 'arena', label: 'CBT & Analytics' },
              { id: 'extractor', label: 'Answer Key Extractor' },
              { id: 'mistakes', label: `Mistake Book (${mistakeQuestions.length})` },
            ] as { id: MockSubView; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubView(tab.id)}
              className={`min-h-[38px] px-3 sm:px-4 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                subView === tab.id
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {extractBanner && (
        <div className="sb-surface rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-zinc-800 dark:text-zinc-200">
          <span>{extractBanner}</span>
          <button
            type="button"
            onClick={() => setExtractBanner('')}
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SUBVIEW 1: CBT LAUNCHER + SCORE VS ACCURACY ANALYTICS */}
      {subView === 'arena' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CBT Test Launcher */}
          <section className="lg:col-span-6 sb-surface rounded-3xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  Launch TCS iON CBT Simulator
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Full-screen exam interface with negative marking &amp; status palette
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Exam Negative Marking Pattern */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Exam Pattern &amp; Negative Marking
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-black/[0.05] dark:bg-white/[0.07]">
                  <button
                    type="button"
                    onClick={() => setExamPattern('ssc_je')}
                    className={`min-h-[40px] rounded-xl text-xs font-medium transition-all ${
                      examPattern === 'ssc_je'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    SSC JE (+1 / −0.25)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExamPattern('rrb_je')}
                    className={`min-h-[40px] rounded-xl text-xs font-medium transition-all ${
                      examPattern === 'rrb_je'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    RRB JE (+1 / −0.33)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Subject Scope
                  </label>
                  <select
                    value={subjectFilter}
                    onChange={(e) => {
                      setSubjectFilter(e.target.value);
                      setCustomOrderIds(null);
                    }}
                    className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3 text-sm text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="all" className="bg-white dark:bg-zinc-900">
                      All Subjects ({relevantBank.length} Qs)
                    </option>
                    {availableSubjects.map((subj) => (
                      <option key={subj} value={subj} className="bg-white dark:bg-zinc-900">
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Timer Duration (mins)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={180}
                    value={durationMins}
                    onChange={(e) => setDurationMins(e.target.value)}
                    className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3.5 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Shuffle & Rearrange Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-y border-black/[0.06] dark:border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => {
                    setShuffleQuestions((v) => !v);
                    if (!shuffleQuestions) setCustomOrderIds(null);
                  }}
                  className="min-h-[38px] inline-flex items-center gap-2 text-xs font-medium text-zinc-800 dark:text-zinc-200"
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      shuffleQuestions
                        ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-950'
                        : 'border-zinc-400'
                    }`}
                  >
                    {shuffleQuestions && <Check className="w-3 h-3" />}
                  </span>
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Shuffle Question Order</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowRearrange((v) => !v)}
                  className="min-h-[36px] px-3 rounded-xl border border-black/10 dark:border-white/15 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {showRearrange ? 'Hide Queue' : `Rearrange (${filteredQuestionsForTest.length})`}
                </button>
              </div>

              {showRearrange && (
                <div className="max-h-56 overflow-y-auto divide-y divide-black/[0.06] dark:divide-white/[0.07] pr-1">
                  {filteredQuestionsForTest.map((q, idx) => (
                    <div key={q.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-zinc-700 dark:text-zinc-300">
                        <span className="font-mono text-zinc-400 mr-1.5">{idx + 1}.</span>
                        {q.questionText}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, -1)}
                          disabled={idx === 0}
                          aria-label="Move up"
                          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 1)}
                          disabled={idx === filteredQuestionsForTest.length - 1}
                          aria-label="Move down"
                          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteQuestion(q.id)}
                          aria-label="Delete question"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                disabled={filteredQuestionsForTest.length === 0}
                onClick={handleStartMock}
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
              >
                <Play className="w-4 h-4" />
                <span>Start CBT Mock ({filteredQuestionsForTest.length} Questions)</span>
              </button>
            </div>
          </section>

          {/* Score vs Accuracy Analytics */}
          <section className="lg:col-span-6 sb-surface rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  Score vs. Accuracy Analytics
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Track both percentage score and attempt precision
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(true)}
                className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 rounded-xl border border-black/10 dark:border-white/15 text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Mock Score</span>
              </button>
            </div>

            {branchScores.length === 0 ? (
              <div className="py-10 text-center space-y-2 border-t border-black/[0.06] dark:border-white/[0.07]">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  No mock analytics recorded yet
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Complete a CBT test or log a Testbook / official mock score to visualize your progress.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07] max-h-[400px] overflow-y-auto pr-1">
                {branchScores.map((m) => {
                  const scorePct = Math.max(
                    0,
                    Math.min(100, Math.round((m.score / Math.max(1, m.maxScore)) * 100)),
                  );
                  return (
                    <div key={m.id} className="py-4 first:pt-1 last:pb-1 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {m.title}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                            {m.examType === 'rrb_je' ? 'RRB JE' : 'SSC JE'} · {m.date} · +{m.correctCount} / −{m.wrongCount} / {m.skippedCount} skip
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteMockScore(m.id)}
                          aria-label="Delete mock record"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Dual Comparison Bars */}
                      <div className="space-y-1.5 text-xs font-mono tabular-nums">
                        <div className="flex items-center gap-3">
                          <span className="w-16 text-zinc-500 dark:text-zinc-400">Score</span>
                          <div className="flex-1 h-2 rounded-full bg-black/[0.07] dark:bg-white/[0.09] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                              style={{ width: `${scorePct}%` }}
                            />
                          </div>
                          <span className="w-20 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                            {m.score}/{m.maxScore}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-16 text-zinc-500 dark:text-zinc-400">Accuracy</span>
                          <div className="flex-1 h-2 rounded-full bg-black/[0.07] dark:bg-white/[0.09] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-zinc-500 dark:bg-zinc-400"
                              style={{ width: `${m.accuracy}%` }}
                            />
                          </div>
                          <span className="w-20 text-right font-semibold text-zinc-700 dark:text-zinc-300">
                            {m.accuracy}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* SUBVIEW 2: MULTI-FORMAT ANSWER KEY EXTRACTOR */}
      {subView === 'extractor' && (
        <section className="sb-surface rounded-3xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Multi-Format Answer Key Extractor
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Upload official SSC JE / RRB JE answer key PDFs, HTML response sheets, or screenshots to extract verified MCQs directly into your Question Bank.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Exam Pattern
              </label>
              <select
                value={extractExam}
                onChange={(e) => setExtractExam(e.target.value as ExamPattern)}
                className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3 text-sm text-zinc-900 dark:text-zinc-100"
              >
                <option value="ssc_je" className="bg-white dark:bg-zinc-900">
                  SSC JE (−0.25)
                </option>
                <option value="rrb_je" className="bg-white dark:bg-zinc-900">
                  RRB JE (−0.33)
                </option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Paper / Source Label
              </label>
              <input
                type="text"
                maxLength={120}
                value={extractSourceName}
                onChange={(e) => setExtractSourceName(e.target.value)}
                placeholder="e.g., SSC JE 2024 Shift 1 Response Sheet"
                className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3.5 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Drop / Upload Trigger */}
          <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 p-6 text-center space-y-3">
            <FileUp className="w-6 h-6 mx-auto text-zinc-500" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Upload PDF, HTML Response Sheet, or Question Screenshots
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Supports .pdf (parsed via PDF.js), .html/.htm, .png, .jpg, .webp
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,application/pdf,.html,.htm,image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  void runExtraction(e.target.files);
                }
              }}
              className="hidden"
            />
            <button
              type="button"
              disabled={extracting}
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {extracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting with Gemini 4 Flash...</span>
                </>
              ) : (
                <span>Select File &amp; Extract</span>
              )}
            </button>
          </div>

          {/* Or Paste Raw Text */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Or paste raw answer key text directly
            </label>
            <textarea
              rows={4}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste questions, options, and correct answers from any response sheet..."
              className="w-full rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 p-3.5 text-sm text-zinc-900 dark:text-zinc-100"
            />
            <div className="flex justify-end">
              <button
                type="button"
                disabled={extracting || !pastedText.trim()}
                onClick={() => void runExtraction(null)}
                className="min-h-[42px] px-5 rounded-2xl border border-black/15 dark:border-white/20 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40"
              >
                Parse Pasted Text
              </button>
            </div>
          </div>

          {extractError && (
            <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{extractError}</span>
            </div>
          )}
        </section>
      )}

      {/* SUBVIEW 3: MISTAKE BOOK */}
      {subView === 'mistakes' && (
        <section className="sb-surface rounded-3xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Personal Mistake Book
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Wrong &amp; skipped CBT questions saved automatically for targeted drilling
              </p>
            </div>
            <button
              type="button"
              disabled={mistakeQuestions.length === 0}
              onClick={handleRetestMistakes}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-40 whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Re-Test Wrong Questions ({mistakeQuestions.length})</span>
            </button>
          </div>

          {mistakeQuestions.length === 0 ? (
            <div className="py-10 text-center space-y-1.5 border-t border-black/[0.06] dark:border-white/[0.07]">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Your Mistake Book is clear
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Any wrong or skipped question from the CBT simulator will appear here for 1-tap re-testing.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.07] dark:divide-white/[0.08]">
              {mistakeQuestions.map((q) => (
                <div key={q.id} className="py-5 first:pt-1 last:pb-1 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                        {q.subject} · Missed {q.wrongCount}×
                      </p>
                      <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50 leading-relaxed">
                        {q.questionText}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdateMistake(q.id, false)}
                      className="min-h-[36px] px-3 rounded-xl border border-black/10 dark:border-white/15 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 whitespace-nowrap shrink-0"
                    >
                      Mark Mastered
                    </button>
                  </div>

                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    Correct Answer ({String.fromCharCode(65 + q.correctIndex)}): {q.options[q.correctIndex]}
                  </p>
                  {q.explanation && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Manual Mock Score Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-sm p-0 sm:p-4">
          <div className="sb-surface w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.07] dark:border-white/[0.08]">
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                Log External Mock Score
              </h2>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-zinc-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveManualMock} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Mock Test Title
                  </label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g., SSC JE Full Test #4"
                    className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3.5 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Exam Type
                  </label>
                  <select
                    value={manualExam}
                    onChange={(e) => setManualExam(e.target.value as ExamPattern)}
                    className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3 text-sm text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="ssc_je" className="bg-white dark:bg-zinc-900">
                      SSC JE
                    </option>
                    <option value="rrb_je" className="bg-white dark:bg-zinc-900">
                      RRB JE
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Score
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={manualScore}
                    onChange={(e) => setManualScore(e.target.value)}
                    className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    required
                    value={manualMax}
                    onChange={(e) => setManualMax(e.target.value)}
                    className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Accuracy %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={manualAccuracy}
                    onChange={(e) => setManualAccuracy(e.target.value)}
                    className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <label className="block text-[11px] text-zinc-500">Correct</label>
                  <input
                    type="number"
                    min={0}
                    value={manualCorrect}
                    onChange={(e) => setManualCorrect(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-2.5 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-zinc-500">Wrong</label>
                  <input
                    type="number"
                    min={0}
                    value={manualWrong}
                    onChange={(e) => setManualWrong(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-2.5 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-zinc-500">Skipped</label>
                  <input
                    type="number"
                    min={0}
                    value={manualSkipped}
                    onChange={(e) => setManualSkipped(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-2.5 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-zinc-500">Mins</label>
                  <input
                    type="number"
                    min={1}
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="min-h-[42px] px-4 rounded-2xl border border-black/10 dark:border-white/15 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-sm font-semibold"
                >
                  Save Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification Modal for Extracted Questions */}
      {draftQuestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-5">
          <div className="sb-surface w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  Verify Extracted MCQs ({draftQuestions.length})
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Review correct options and explanations before saving to Question Bank
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDraftQuestions(null)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-zinc-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 divide-y divide-black/[0.08] dark:divide-white/[0.08]">
              {draftQuestions.map((item, idx) => (
                <div key={idx} className="py-5 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-semibold text-zinc-500">
                      Q{idx + 1} · {item.subject}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftQuestions((prev) =>
                          prev ? prev.filter((_, i) => i !== idx) : null,
                        )
                      }
                      className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={item.questionText}
                    onChange={(e) =>
                      setDraftQuestions((prev) =>
                        prev
                          ? prev.map((q, i) =>
                              i === idx ? { ...q, questionText: e.target.value } : q,
                            )
                          : null,
                      )
                    }
                    className="w-full rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 p-3 text-sm text-zinc-900 dark:text-zinc-100"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setDraftQuestions((prev) =>
                              prev
                                ? prev.map((q, i) =>
                                    i === idx ? { ...q, correctIndex: oIdx } : q,
                                  )
                                : null,
                            )
                          }
                          className={`min-h-[36px] min-w-[36px] rounded-xl text-xs font-mono font-semibold border shrink-0 ${
                            item.correctIndex === oIdx
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'border-black/15 dark:border-white/15 text-zinc-600 dark:text-zinc-400'
                          }`}
                          title="Mark as correct answer"
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) =>
                            setDraftQuestions((prev) =>
                              prev
                                ? prev.map((q, i) => {
                                    if (i !== idx) return q;
                                    const nextOpts = [...q.options] as [
                                      string,
                                      string,
                                      string,
                                      string,
                                    ];
                                    nextOpts[oIdx] = e.target.value;
                                    return { ...q, options: nextOpts };
                                  })
                                : null,
                            )
                          }
                          className="flex-1 min-h-[36px] rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3 text-xs text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={item.explanation}
                    onChange={(e) =>
                      setDraftQuestions((prev) =>
                        prev
                          ? prev.map((q, i) =>
                              i === idx ? { ...q, explanation: e.target.value } : q,
                            )
                          : null,
                      )
                    }
                    placeholder="Explanation..."
                    className="w-full min-h-[38px] rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] px-3 text-xs text-zinc-700 dark:text-zinc-300"
                  />
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-black/[0.08] dark:border-white/[0.08] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDraftQuestions(null)}
                className="min-h-[42px] px-4 rounded-2xl border border-black/10 dark:border-white/15 text-sm font-medium"
              >
                Discard
              </button>
              <button
                type="button"
                disabled={draftQuestions.length === 0}
                onClick={handleConfirmSaveExtracted}
                className="min-h-[42px] px-5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-sm font-semibold disabled:opacity-40"
              >
                Save {draftQuestions.length} to Question Bank
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
