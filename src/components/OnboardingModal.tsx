import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { StudyBookLogo } from './StudyBookLogo';
import type { Branch, TargetExam } from '../types/studybook';

interface OnboardingModalProps {
  initialBranch: Branch;
  initialExam: TargetExam;
  onComplete: (name: string, branch: Branch, exam: TargetExam) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialBranch,
  initialExam,
  onComplete,
}) => {
  const [name, setName] = useState('');
  const [branch, setBranch] = useState<Branch>(initialBranch);
  const [exam, setExam] = useState<TargetExam>(initialExam);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = name.trim();
    if (!cleaned) return;
    onComplete(cleaned, branch, exam);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-md p-4">
      <div className="sb-surface w-full max-w-md rounded-3xl p-7 sm:p-8 space-y-6">
        <div className="space-y-3">
          <StudyBookLogo className="w-11 h-11" />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 text-balance">
              Welcome to StudyBook
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Your focused engineering desk for SSC JE &amp; RRB JE preparation across Windows and Android.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="onboarding-name"
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              What should we call you?
            </label>
            <input
              id="onboarding-name"
              type="text"
              required
              autoFocus
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your first name"
              className="w-full min-h-[46px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/25 dark:focus:ring-zinc-100/25"
            />
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Engineering Stream
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]">
              <button
                type="button"
                onClick={() => setBranch('civil')}
                className={`min-h-[42px] rounded-xl text-sm font-medium transition-all ${
                  branch === 'civil'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Civil Engineering
              </button>
              <button
                type="button"
                onClick={() => setBranch('mechanical')}
                className={`min-h-[42px] rounded-xl text-sm font-medium transition-all ${
                  branch === 'mechanical'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Mechanical
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Once selected, your engineering stream is locked and cannot be changed.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Target Examination
            </span>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]">
              {(
                [
                  { id: 'combo', label: 'Combo' },
                  { id: 'ssc_je', label: 'SSC JE 2026' },
                  { id: 'rrb_je', label: 'RRB JE 2026' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setExam(item.id)}
                  className={`min-h-[40px] rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    exam === item.id
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-sm font-semibold px-5 py-3 transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <span>Open StudyBook</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
