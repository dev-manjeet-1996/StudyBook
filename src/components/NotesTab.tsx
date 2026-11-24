import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  FileText,
  FileUp,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { findChapterMeta, getSubjectsForContext } from '../data/syllabusData';
import { parseUploadedFiles } from '../lib/pdfParser';
import { sanitizeInlineSvg } from '../lib/svgSanitizer';
import { makeSafeId } from '../hooks/useStudyBookStore';
import type {
  ChapterNote,
  ComparisonTable,
  ConceptCard,
  SvgDiagram,
  UserProfile,
} from '../types/studybook';

interface NotesTabProps {
  profile: UserProfile;
  chapterNotes: Record<string, ChapterNote>;
  selectedChapterId: string | null;
  onSelectChapter: (chapterId: string) => void;
  onSaveChapterNote: (note: ChapterNote) => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({
  profile,
  chapterNotes,
  selectedChapterId,
  onSelectChapter,
  onSaveChapterNote,
}) => {
  const subjects = useMemo(
    () => getSubjectsForContext(profile.branch, profile.targetExam),
    [profile.branch, profile.targetExam],
  );

  // Determine default chapter with seeded visual notes for the current branch
  const defaultChapterId = useMemo(() => {
    const preferred = profile.branch === 'mechanical' ? 'mech_td_3' : 'civ_rcc_1';
    if (findChapterMeta(preferred)) return preferred;
    return subjects[0]?.chapters[0]?.id || 'civ_rcc_1';
  }, [profile.branch, subjects]);

  const activeChapterId = selectedChapterId || defaultChapterId;
  const activeMeta = useMemo(() => findChapterMeta(activeChapterId), [activeChapterId]);

  const activeNote: ChapterNote = useMemo(() => {
    const existing = chapterNotes[activeChapterId];
    if (existing) return existing;
    return {
      chapterId: activeChapterId,
      subjectId: activeMeta?.subject.id || subjects[0]?.id || 'civ_rcc',
      chapterTitle: activeMeta?.title || 'Chapter Notes',
      branch: activeMeta?.subject.branch || profile.branch,
      tldr: '',
      plainNotes: '',
      conceptCards: [],
      diagrams: [],
      comparisonTables: [],
      qaHistory: [],
    };
  }, [chapterNotes, activeChapterId, activeMeta, subjects, profile.branch]);

  // PDF / Screenshot Converter State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [rawLectureText, setRawLectureText] = useState('');
  const [converting, setConverting] = useState(false);
  const [convertStatus, setConvertStatus] = useState('');
  const [convertError, setConvertError] = useState('');
  const [showConverterPanel, setShowConverterPanel] = useState(false);

  // Grounded Doubt Q&A State
  const [doubtInput, setDoubtInput] = useState('');
  const [solvingDoubt, setSolvingDoubt] = useState(false);
  const [doubtError, setDoubtError] = useState('');

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setConvertError('');
    const incoming = Array.from(fileList).slice(0, 6);
    setSelectedFiles((prev) => [...prev, ...incoming].slice(0, 6));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConvertLecture = async (directFiles?: File[] | null) => {
    setConvertError('');
    const filesToUse = directFiles && directFiles.length > 0 ? directFiles : selectedFiles;
    const pasted = rawLectureText.trim();

    if (filesToUse.length === 0 && !pasted) {
      setConvertError('Upload a live class PDF, board screenshot, or paste lecture notes first.');
      return;
    }

    setConverting(true);
    setConvertStatus(
      filesToUse.length > 0
        ? 'Reading PDF / board images (supports scanned slides)...'
        : 'Synthesizing structured visual notes...',
    );

    try {
      let textContent = pasted;
      let images: { mimeType: string; data: string }[] = [];

      if (filesToUse.length > 0) {
        const parsed = await parseUploadedFiles(filesToUse);
        textContent = [parsed.textContent, textContent].filter(Boolean).join('\n\n');
        images = parsed.images;
        if (parsed.usedVisionPdf) {
          setConvertStatus('Scanned slide PDF detected — analyzing pages directly with Gemini 4 Flash...');
        } else {
          setConvertStatus('Filtering promo slides & generating concept cards + SVG diagrams...');
        }
      }

      if (!textContent && images.length === 0) {
        setConvertError(
          'Could not read any content from the uploaded file. Please try another PDF, screenshot, or paste text.',
        );
        setConverting(false);
        setConvertStatus('');
        return;
      }

      const res = await fetch('/api/ai/convert-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent,
          images,
          subjectName: activeMeta?.subject.name || 'Engineering',
          chapterTitle: activeNote.chapterTitle,
          branch: activeNote.branch,
        }),
      });

      const data = (await res.json()) as {
        tldr?: string;
        conceptCards?: ConceptCard[];
        diagrams?: SvgDiagram[];
        comparisonTables?: ComparisonTable[];
        plainNotes?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || 'Could not convert lecture notes.');
      }

      onSaveChapterNote({
        ...activeNote,
        tldr: data.tldr || activeNote.tldr,
        conceptCards:
          data.conceptCards && data.conceptCards.length > 0
            ? data.conceptCards
            : activeNote.conceptCards,
        diagrams:
          data.diagrams && data.diagrams.length > 0 ? data.diagrams : activeNote.diagrams,
        comparisonTables:
          data.comparisonTables && data.comparisonTables.length > 0
            ? data.comparisonTables
            : activeNote.comparisonTables,
        plainNotes: data.plainNotes
          ? [activeNote.plainNotes, data.plainNotes].filter(Boolean).join('\n\n')
          : activeNote.plainNotes,
      });

      setSelectedFiles([]);
      setRawLectureText('');
      setShowConverterPanel(false);
    } catch (err) {
      setConvertError(err instanceof Error ? err.message : 'Lecture conversion failed.');
    } finally {
      setConverting(false);
      setConvertStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAskDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = doubtInput.trim();
    if (!q || solvingDoubt) return;
    setDoubtError('');
    setSolvingDoubt(true);
    try {
      const res = await fetch('/api/ai/solve-doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          chapterTitle: activeNote.chapterTitle,
          subjectName: activeMeta?.subject.name || 'Engineering',
          branch: activeNote.branch,
          tldr: activeNote.tldr,
          plainNotes: activeNote.plainNotes,
          conceptCards: activeNote.conceptCards,
          recentHistory: activeNote.qaHistory.slice(-5),
        }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Failed to answer doubt.');
      }
      const nextQa = [
        ...activeNote.qaHistory,
        {
          id: makeSafeId('qa'),
          question: q,
          answer: data.answer || '',
          askedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];
      onSaveChapterNote({ ...activeNote, qaHistory: nextQa });
      setDoubtInput('');
    } catch (err) {
      setDoubtError(err instanceof Error ? err.message : 'Could not resolve doubt.');
    } finally {
      setSolvingDoubt(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Studio Header & Chapter Selector */}
      <section className="sb-surface rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Visual Notes &amp; SVG Studio
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Convert live-class PDFs or board screenshots into crisp cards, monochrome SVG schematics, tables &amp; grounded Q&amp;A
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowConverterPanel((v) => !v)}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 whitespace-nowrap shrink-0"
          >
            <FileUp className="w-4 h-4" />
            <span>{showConverterPanel ? 'Hide PDF Converter' : 'Convert Live Class PDF'}</span>
          </button>
        </div>

        {/* Chapter Picker */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <select
              aria-label="Select subject"
              value={activeMeta?.subject.id || subjects[0]?.id || ''}
              onChange={(e) => {
                const subj = subjects.find((s) => s.id === e.target.value);
                if (subj?.chapters[0]) onSelectChapter(subj.chapters[0].id);
              }}
              className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3.5 text-sm text-zinc-900 dark:text-zinc-100"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id} className="bg-white dark:bg-zinc-900">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-7">
            <select
              aria-label="Select chapter"
              value={activeChapterId}
              onChange={(e) => onSelectChapter(e.target.value)}
              className="w-full min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3.5 text-sm text-zinc-900 dark:text-zinc-100"
            >
              {(activeMeta?.subject.chapters || subjects[0]?.chapters || []).map((ch) => {
                const hasVisual = Boolean(chapterNotes[ch.id]?.conceptCards?.length);
                return (
                  <option key={ch.id} value={ch.id} className="bg-white dark:bg-zinc-900">
                    {ch.title} {hasVisual ? '✓' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </section>

      {/* Collapsible Live Class PDF / Board Screenshot Converter */}
      {showConverterPanel && (
        <section className="sb-surface rounded-3xl p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
              Live Class PDF &amp; Board Screenshot Converter
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Automatically removes faculty intro, batch promo, Telegram links, and thank-you slides—keeping only concepts, formulas, IS codes, and monochrome SVG engineering diagrams.
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 p-5 text-center space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,application/pdf,image/*,.txt"
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                disabled={converting}
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[44px] inline-flex items-center gap-2 px-5 rounded-2xl border border-black/15 dark:border-white/20 bg-black/[0.04] dark:bg-white/[0.06] text-zinc-900 dark:text-zinc-100 text-xs font-semibold hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-50"
              >
                <FileUp className="w-4 h-4" />
                <span>{selectedFiles.length > 0 ? 'Add More Files' : 'Choose Class PDF or Board Photo'}</span>
              </button>

              <button
                type="button"
                disabled={converting || (selectedFiles.length === 0 && !rawLectureText.trim())}
                onClick={() => void handleConvertLecture(null)}
                className="min-h-[44px] inline-flex items-center gap-2 px-5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-40"
              >
                {converting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Visual Notes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Visual Notes &amp; SVGs</span>
                  </>
                )}
              </button>
            </div>

            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] border border-black/10 dark:border-white/10 px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="max-w-[180px] truncate font-medium">{file.name}</span>
                    <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                      {(file.size / (1024 * 1024) >= 1
                        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                        : `${Math.max(1, Math.round(file.size / 1024))} KB`)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      aria-label={`Remove ${file.name}`}
                      className="text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {convertStatus ||
                `Powered by Gemini 4 Flash (supports scanned smartboard PDFs & photos) · Target: ${activeNote.chapterTitle}`}
            </p>
          </div>

          <div className="space-y-2">
            <textarea
              rows={3}
              value={rawLectureText}
              onChange={(e) => setRawLectureText(e.target.value)}
              placeholder="Optional: paste raw lecture notes or extra instructions alongside your PDF/screenshot..."
              className="w-full rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 p-3.5 text-sm text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {convertError && (
            <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{convertError}</span>
            </div>
          )}
        </section>
      )}

      {/* Main Notes Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 8 Columns: Structured Visual Notes */}
        <div className="lg:col-span-8 space-y-5">
          {/* TL;DR Executive Summary */}
          {activeNote.tldr ? (
            <section className="sb-surface rounded-3xl p-6 space-y-2">
              <p className="text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400">
                TL;DR Summary · {activeMeta?.subject.shortName}
              </p>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {activeNote.chapterTitle}
              </h2>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {activeNote.tldr}
              </p>
            </section>
          ) : (
            <section className="sb-surface rounded-3xl p-7 text-center space-y-3">
              <BookOpen className="w-6 h-6 mx-auto text-zinc-400" />
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {activeNote.chapterTitle}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                  No visual lecture cards yet for this chapter. Upload your teacher&apos;s live-class PDF or board photo above, or write plain revision notes below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConverterPanel(true)}
                className="min-h-[40px] px-4 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold"
              >
                Upload Class PDF
              </button>
            </section>
          )}

          {/* Monochrome Inline SVG Engineering Diagrams */}
          {activeNote.diagrams.length > 0 && (
            <section className="sb-surface rounded-3xl p-6 space-y-5">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  Engineering Diagrams
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Monochrome vector schematics adapted to Day &amp; Night mode
                </p>
              </div>

              <div className="space-y-5">
                {activeNote.diagrams.map((diag, idx) => {
                  const cleanSvg = sanitizeInlineSvg(diag.svg);
                  return (
                    <figure
                      key={idx}
                      className="rounded-2xl border border-black/[0.08] dark:border-white/[0.09] p-4 space-y-3 bg-black/[0.015] dark:bg-white/[0.02]"
                    >
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {diag.title}
                      </p>
                      <div
                        className="w-full overflow-x-auto text-zinc-900 dark:text-zinc-100 [&>svg]:w-full [&>svg]:max-w-[560px] [&>svg]:h-auto [&>svg]:mx-auto"
                        dangerouslySetInnerHTML={{ __html: cleanSvg }}
                      />
                      {diag.caption && (
                        <figcaption className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          {diag.caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            </section>
          )}

          {/* Numbered Concept Cards */}
          {activeNote.conceptCards.length > 0 && (
            <section className="sb-surface rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Core Concept Cards
              </h3>
              <div className="divide-y divide-black/[0.07] dark:divide-white/[0.08]">
                {activeNote.conceptCards.map((card, idx) => (
                  <article key={idx} className="py-5 first:pt-1 last:pb-1 space-y-3">
                    <h4 className="text-sm sm:text-base font-semibold text-zinc-950 dark:text-zinc-50">
                      {card.title}
                    </h4>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {card.summary}
                    </p>

                    {card.formulas.length > 0 && (
                      <div className="rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] p-3.5 space-y-1.5">
                        {card.formulas.map((f, fIdx) => (
                          <p
                            key={fIdx}
                            className="text-xs font-mono text-zinc-900 dark:text-zinc-100 tabular-nums"
                          >
                            {f}
                          </p>
                        ))}
                      </div>
                    )}

                    {card.memoryTrick && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        <strong className="text-zinc-900 dark:text-zinc-100">Memory Cue: </strong>
                        {card.memoryTrick}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Structured Comparison Tables */}
          {activeNote.comparisonTables.length > 0 && (
            <section className="sb-surface rounded-3xl p-6 space-y-5">
              <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Comparison Tables
              </h3>
              {activeNote.comparisonTables.map((tbl, tIdx) => (
                <div key={tIdx} className="space-y-2.5">
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {tbl.title}
                  </p>
                  <div className="overflow-x-auto rounded-2xl border border-black/[0.08] dark:border-white/[0.09]">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-black/[0.04] dark:bg-white/[0.05] border-b border-black/[0.08] dark:border-white/[0.08]">
                          {tbl.headers.map((h, hIdx) => (
                            <th
                              key={hIdx}
                              className="py-2.5 px-3.5 font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                        {tbl.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className="py-2.5 px-3.5 text-zinc-700 dark:text-zinc-300 align-top"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Editable Plain-Text Revision Notes */}
          <section className="sb-surface rounded-3xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Editable Plain-Text Revision Notes
              </h3>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Auto-saved</span>
            </div>
            <textarea
              rows={7}
              value={activeNote.plainNotes}
              onChange={(e) =>
                onSaveChapterNote({
                  ...activeNote,
                  plainNotes: e.target.value,
                })
              }
              placeholder="Write or refine crisp bullet points, formula exceptions, and IS code clauses for rapid pre-exam revision..."
              className="w-full rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.09] p-4 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-zinc-100/15"
            />
          </section>
        </div>

        {/* Right 4 Columns: Grounded Doubt Q&A Solver */}
        <aside className="lg:col-span-4 sb-surface rounded-3xl p-6 space-y-4 lg:sticky lg:top-20">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <div>
              <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Grounded Doubt Solver
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Answers grounded in this chapter&apos;s notes &amp; IS codes
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {activeNote.qaHistory.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 border-y border-black/[0.06] dark:border-white/[0.07] leading-relaxed">
                Ask any concept doubt, formula derivation, or IS code question about{' '}
                <strong className="text-zinc-800 dark:text-zinc-200">{activeNote.chapterTitle}</strong>.
              </p>
            ) : (
              activeNote.qaHistory.map((qa) => (
                <div
                  key={qa.id}
                  className="space-y-2 pb-3 border-b border-black/[0.06] dark:border-white/[0.07] last:border-b-0"
                >
                  <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-50">
                    Q: {qa.question}
                  </p>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                    {qa.answer}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-400">{qa.askedAt}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAskDoubt} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={400}
                value={doubtInput}
                onChange={(e) => setDoubtInput(e.target.value)}
                placeholder="Ask a doubt on this chapter..."
                className="flex-1 min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={solvingDoubt || !doubtInput.trim()}
                aria-label="Send doubt"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 disabled:opacity-40 shrink-0"
              >
                {solvingDoubt ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            {doubtError && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{doubtError}</p>
            )}
          </form>
        </aside>
      </div>
    </div>
  );
};
