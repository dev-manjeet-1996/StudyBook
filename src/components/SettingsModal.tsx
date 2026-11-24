import React, { useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { motion } from 'motion/react';
import {
  Check,
  Cloud,
  CloudOff,
  Download,
  Info,
  LogOut,
  Moon,
  RefreshCw,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { StudyBookLogo } from './StudyBookLogo';
import { WALLPAPER_OPTIONS } from './WallpaperBackdrop';
import type { FontFamily, UserProfile } from '../types/studybook';

interface SettingsModalProps {
  profile: UserProfile;
  authUser: User | null;
  syncStatus: 'local' | 'syncing' | 'synced' | 'error';
  syncMessage: string;
  lastSyncedAt: string;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  onSignInGoogle: () => Promise<boolean>;
  onSignOut: () => Promise<void>;
  onPushSync: () => Promise<void>;
  onExportBackup: () => string;
  onRestoreBackup: (json: string) => { ok: boolean; message: string };
  onClose: () => void;
}

const FONT_OPTIONS: { id: FontFamily; label: string }[] = [
  { id: 'google_sans', label: 'Google Sans' },
  { id: 'play', label: 'Play' },
  { id: 'jakarta', label: 'Jakarta' },
  { id: 'manrope', label: 'Manrope' },
  { id: 'dm', label: 'DM Sans' },
];

const APP_VERSION = 'v2.1.0';

const CHANGELOG_ENTRIES = [
  {
    version: 'v2.1.0',
    date: 'Current Release',
    highlights: [
      'Added 4 monochrome blurred frosted wallpapers & Day/Night glassmorphic top bar.',
      'Added Google Sans & Play typography plus smooth desktop cursor tracking aura.',
      'Added automatic cloud sync toggle on every entry/change and full scanned PDF vision conversion via Gemini 4 Flash.',
      'Redesigned geometric monochrome StudyBook prism logo and streamlined Syllabus Tracker.',
    ],
  },
  {
    version: 'v2.0.0',
    date: 'Major Milestone',
    highlights: [
      'Added Multi-Turn Gemini AI Mentor drawer with Mentor, Quick Formula, and Mock Coach modes.',
      'Locked Civil / Mechanical branch selection after onboarding to keep syllabus analytics focused.',
      'Launched real-time Firebase Firestore cross-device sync for Windows & Android PWA.',
    ],
  },
  {
    version: 'v1.0.0',
    date: 'Initial Launch',
    highlights: [
      'SSC JE & RRB JE Syllabus Tracker with 3-7-21 spaced repetition scheduler.',
      'TCS iON CBT Mock Simulator, Mistake Book, Answer Key Extractor, and SVG Visual Notes Studio.',
    ],
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  profile,
  authUser,
  syncStatus,
  syncMessage,
  lastSyncedAt,
  onUpdateProfile,
  onSignInGoogle,
  onSignOut,
  onPushSync,
  onExportBackup,
  onRestoreBackup,
  onClose,
}) => {
  const [nameInput, setNameInput] = useState(profile.aspirantName);
  const [backupFeedback, setBackupFeedback] = useState<string>('');
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      onUpdateProfile({ aspirantName: trimmed });
      setBackupFeedback('Aspirant name updated.');
    }
  };

  const handleExport = () => {
    const json = onExportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studybook-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setBackupFeedback('Full JSON backup downloaded.');
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const result = onRestoreBackup(text);
    setBackupFeedback(result.message);
    if (restoreInputRef.current) restoreInputRef.current.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-md p-0 sm:p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className="sb-surface w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 space-y-6"
      >
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.07] dark:border-white/[0.08]">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Settings &amp; Sync
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Personalize your monochrome workspace and sync across Windows &amp; Android
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Sync Section */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Cross-Device Cloud Sync
            </h3>
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
              {authUser
                ? syncStatus === 'syncing'
                  ? 'Syncing...'
                  : syncStatus === 'error'
                    ? 'Sync warning'
                    : lastSyncedAt
                      ? `Synced ${lastSyncedAt}`
                      : 'Live Firestore Sync'
                : 'Local Only'}
            </span>
          </div>

          {authUser ? (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-3 py-2.5 px-3.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Cloud className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {authUser.displayName || 'Connected Account'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {authUser.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={onPushSync}
                    title="Sync all entries now"
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border border-black/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={onSignOut}
                    title="Sign out"
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border border-black/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {syncMessage && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{syncMessage}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Sign in with the same Google account on your Windows desktop and Android phone to keep syllabus mastery, study logs, mock scores, mistake book, and notes synced in real time.
              </p>
              <button
                type="button"
                onClick={onSignInGoogle}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-sm font-medium px-4 py-2.5 transition-opacity hover:opacity-90"
              >
                <CloudOff className="w-4 h-4" />
                <span>Sign in with Google to Sync</span>
              </button>
              {syncMessage && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{syncMessage}</p>
              )}
            </div>
          )}

          {/* Auto-Sync on Every Change Toggle */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <div>
              <span className="text-sm text-zinc-800 dark:text-zinc-200 block">
                Auto-Sync on Every Change
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Automatically push every study log, chapter status, mock score &amp; note change instantly
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={profile.autoSync}
              onClick={() => onUpdateProfile({ autoSync: !profile.autoSync })}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                profile.autoSync
                  ? 'bg-zinc-900 dark:bg-zinc-100'
                  : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-zinc-950 transition-transform ${
                  profile.autoSync ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

        <hr className="border-black/[0.07] dark:border-white/[0.08]" />

        {/* Aspirant Name */}
        <section className="space-y-2">
          <label
            htmlFor="settings-aspirant-name"
            className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Aspirant Name
          </label>
          <div className="flex items-center gap-2">
            <input
              id="settings-aspirant-name"
              type="text"
              maxLength={60}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="flex-1 min-h-[44px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-100/20"
            />
            <button
              type="button"
              onClick={handleSaveName}
              className="min-h-[44px] px-4 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold whitespace-nowrap shrink-0 hover:opacity-90"
            >
              Save
            </button>
          </div>
        </section>

        <hr className="border-black/[0.07] dark:border-white/[0.08]" />

        {/* Appearance: Theme, Font, Blurred Wallpapers, Glass Blur */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Appearance &amp; Monochrome Glass
          </h3>

          {/* Day / Night Mode */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Monochrome Theme</span>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/[0.05] dark:bg-white/[0.07]">
              <button
                type="button"
                onClick={() => onUpdateProfile({ theme: 'day' })}
                className={`min-h-[36px] flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                  profile.theme === 'day'
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Day</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateProfile({ theme: 'night' })}
                className={`min-h-[36px] flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                  profile.theme === 'night'
                    ? 'bg-zinc-800 text-zinc-50 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Night</span>
              </button>
            </div>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <span className="text-sm text-zinc-700 dark:text-zinc-300 block">Typeface</span>
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-black/[0.05] dark:bg-white/[0.07]">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onUpdateProfile({ font: f.id })}
                  className={`min-h-[36px] flex-1 min-w-[92px] px-3 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    profile.font === f.id
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Default Blurred Background Wallpapers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Blurred Background Wallpaper
              </span>
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                4 Monochrome Presets
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {WALLPAPER_OPTIONS.map((wp) => {
                const selected = profile.wallpaper === wp.id;
                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => onUpdateProfile({ wallpaper: wp.id })}
                    className={`group relative overflow-hidden rounded-2xl border text-left transition-all ${
                      selected
                        ? 'border-zinc-950 dark:border-zinc-100 ring-2 ring-zinc-950/20 dark:ring-zinc-100/25'
                        : 'border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25'
                    }`}
                  >
                    <div className="h-14 w-full relative overflow-hidden bg-zinc-200 dark:bg-zinc-900">
                      {wp.src ? (
                        <img
                          src={wp.src}
                          alt={wp.label}
                          className="w-full h-full object-cover blur-[1.5px] scale-110 grayscale group-hover:scale-115 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-950" />
                      )}
                      {selected && (
                        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center shadow">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="px-2 py-1.5 bg-white/80 dark:bg-zinc-950/80">
                      <p className="text-[11px] font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {wp.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Glass Blur Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-sm text-zinc-700 dark:text-zinc-300 block">Frosted Glass Blur</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Disable for higher battery life on older phones
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={profile.glassBlur}
              onClick={() => onUpdateProfile({ glassBlur: !profile.glassBlur })}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                profile.glassBlur
                  ? 'bg-zinc-900 dark:bg-zinc-100'
                  : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-zinc-950 transition-transform ${
                  profile.glassBlur ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

        <hr className="border-black/[0.07] dark:border-white/[0.08]" />

        {/* Install PWA + JSON Backup & Restore */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            App Installation &amp; Local Backup
          </h3>
          <PWAInstallButton variant="full" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleExport}
              className="min-h-[44px] flex items-center justify-center gap-2 rounded-2xl border border-black/10 dark:border-white/15 px-4 py-2.5 text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5 whitespace-nowrap"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Export Full Backup (.json)</span>
            </button>

            <button
              type="button"
              onClick={() => restoreInputRef.current?.click()}
              className="min-h-[44px] flex items-center justify-center gap-2 rounded-2xl border border-black/10 dark:border-white/15 px-4 py-2.5 text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5 whitespace-nowrap"
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span>Restore Backup</span>
            </button>
            <input
              ref={restoreInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleRestoreFile}
              className="hidden"
            />
          </div>

          {backupFeedback && (
            <p className="text-xs text-zinc-600 dark:text-zinc-300">{backupFeedback}</p>
          )}
        </section>

        <hr className="border-black/[0.07] dark:border-white/[0.08]" />

        {/* About This App — Developer, Version & Changelogs */}
        <section className="space-y-3.5">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              About This App
            </h3>
          </div>

          <div className="rounded-2xl bg-black/[0.035] dark:bg-white/[0.045] border border-black/[0.07] dark:border-white/[0.08] p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <StudyBookLogo className="w-10 h-10 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    StudyBook — SSC JE &amp; RRB JE Studio
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Developed by{' '}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Manjeet Chichkhede
                    </span>
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shrink-0">
                {APP_VERSION}
              </span>
            </div>

            <div className="pt-2 border-t border-black/[0.07] dark:border-white/[0.08] space-y-3">
              <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Changelogs
              </p>
              <div className="space-y-3">
                {CHANGELOG_ENTRIES.map((release) => (
                  <div key={release.version} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                        {release.version}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {release.date}
                      </span>
                    </div>
                    <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-3 list-disc marker:text-zinc-400 dark:marker:text-zinc-600">
                      {release.highlights.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    </motion.div>
  );
};
