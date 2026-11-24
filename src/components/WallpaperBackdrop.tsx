import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ThemeMode, WallpaperId } from '../types/studybook';

export interface WallpaperOption {
  id: WallpaperId;
  label: string;
  subtitle: string;
  src: string | null;
}

export const WALLPAPER_OPTIONS: WallpaperOption[] = [
  {
    id: 'waves',
    label: 'Silk Waves',
    subtitle: 'Monochrome fluid flow',
    src: '/src/assets/images/wallpaper_mono_waves_1795478847330.jpg',
  },
  {
    id: 'concrete',
    label: 'Architectural',
    subtitle: 'Brutalist light & shadow',
    src: '/src/assets/images/wallpaper_mono_concrete_1795478841014.jpg',
  },
  {
    id: 'peaks',
    label: 'Misty Ridges',
    subtitle: 'Minimalist mountain fog',
    src: '/src/assets/images/wallpaper_mono_peaks_1795478849176.jpg',
  },
  {
    id: 'prism',
    label: 'Obsidian Prism',
    subtitle: 'Refracted frosted glass',
    src: '/src/assets/images/wallpaper_mono_prism_1795478870602.jpg',
  },
  {
    id: 'none',
    label: 'Pure Canvas',
    subtitle: 'Minimal solid matte',
    src: null,
  },
];

interface WallpaperBackdropProps {
  wallpaper: WallpaperId;
  theme: ThemeMode;
  glassBlur: boolean;
}

export const WallpaperBackdrop: React.FC<WallpaperBackdropProps> = ({
  wallpaper,
  theme,
  glassBlur,
}) => {
  const active = WALLPAPER_OPTIONS.find((w) => w.id === wallpaper) || WALLPAPER_OPTIONS[0];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#F4F4F6] dark:bg-[#09090B] transition-colors duration-300"
    >
      <AnimatePresence mode="wait">
        {active.src ? (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1.06 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <img
              src={active.src}
              alt=""
              className={`w-full h-full object-cover select-none transition-all duration-500 ${
                glassBlur ? 'blur-2xl scale-110' : 'blur-md scale-105'
              } ${
                theme === 'night'
                  ? 'opacity-45 brightness-[0.55] contrast-110'
                  : 'opacity-42 brightness-[1.18] contrast-[0.92] grayscale'
              }`}
            />
            {/* Day/Night calibrated frosted veil for guaranteed WCAG AA text contrast */}
            <div
              className={`absolute inset-0 transition-colors duration-300 ${
                theme === 'night'
                  ? 'bg-gradient-to-b from-[#09090B]/68 via-[#0A0A0D]/62 to-[#09090B]/78'
                  : 'bg-gradient-to-b from-[#F5F5F7]/70 via-[#F4F4F6]/62 to-[#ECECEF]/76'
              }`}
            />
          </motion.div>
        ) : (
          <motion.div
            key="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 sb-canvas-bg"
          />
        )}
      </AnimatePresence>
    </div>
  );
};
