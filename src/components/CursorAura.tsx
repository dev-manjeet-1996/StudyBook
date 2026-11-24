import React, { useEffect, useRef } from 'react';
import type { ThemeMode } from '../types/studybook';

interface CursorAuraProps {
  theme: ThemeMode;
}

/**
 * Smooth, GPU-composited monochrome cursor tracking animation.
 * Renders a soft ambient frosted spotlight + crisp trailing drafting ring on desktop pointers.
 * Automatically disabled on touch devices and when prefers-reduced-motion is active.
 */
export const CursorAura: React.FC<CursorAuraProps> = ({ theme }) => {
  const glowRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let glowX = targetX;
    let glowY = targetY;
    let ringX = targetX;
    let ringY = targetY;
    let visible = false;
    let hoveringInteractive = false;
    let pressed = false;
    let rafId = 0;

    const handleMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) {
        visible = true;
        glowX = targetX;
        glowY = targetY;
        ringX = targetX;
        ringY = targetY;
      }
      const el = e.target as HTMLElement | null;
      hoveringInteractive = Boolean(
        el?.closest('button, a, select, input, textarea, [role="button"], [role="switch"]'),
      );
    };

    const handleLeave = () => {
      visible = false;
    };

    const handleDown = () => {
      pressed = true;
    };

    const handleUp = () => {
      pressed = false;
    };

    const animate = () => {
      // Smooth spring-like lerp for glass spotlight and outer precision ring
      glowX += (targetX - glowX) * 0.11;
      glowY += (targetY - glowY) * 0.11;
      ringX += (targetX - ringX) * 0.24;
      ringY += (targetY - ringY) * 0.24;

      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${glowX - 210}px, ${glowY - 210}px, 0)`;
        glowRef.current.style.opacity = visible ? '1' : '0';
      }

      if (ringRef.current) {
        const scale = pressed ? 0.8 : hoveringInteractive ? 1.45 : 1;
        ringRef.current.style.transform = `translate3d(${ringX - 16}px, ${ringY - 16}px, 0) scale(${scale})`;
        ringRef.current.style.opacity = visible ? (hoveringInteractive ? '0.68' : '0.38') : '0';
      }

      rafId = window.requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);
    window.addEventListener('pointerdown', handleDown, { passive: true });
    window.addEventListener('pointerup', handleUp, { passive: true });
    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      window.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointerup', handleUp);
    };
  }, []);

  const glowGradient =
    theme === 'night'
      ? 'radial-gradient(circle, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.04) 36%, rgba(255,255,255,0) 70%)'
      : 'radial-gradient(circle, rgba(17,17,19,0.075) 0%, rgba(17,17,19,0.025) 36%, rgba(17,17,19,0) 70%)';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[45] hidden md:block overflow-hidden"
    >
      {/* Frosted ambient cursor spotlight */}
      <div
        ref={glowRef}
        className="fixed top-0 left-0 w-[420px] h-[420px] rounded-full will-change-transform transition-opacity duration-300"
        style={{
          opacity: 0,
          background: glowGradient,
        }}
      />
      {/* Crisp trailing monochrome ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-zinc-900/45 dark:border-zinc-100/50 bg-zinc-900/[0.03] dark:bg-white/[0.04] will-change-transform transition-opacity duration-200"
        style={{
          opacity: 0,
        }}
      />
    </div>
  );
};
