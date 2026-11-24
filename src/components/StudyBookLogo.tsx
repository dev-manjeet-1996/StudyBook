import React from 'react';

interface StudyBookLogoProps {
  className?: string;
}

/**
 * Architectural Monochrome StudyBook Emblem (v2.1)
 * Precision drafting prism + folded blueprint folio monogram.
 */
export const StudyBookLogo: React.FC<StudyBookLogoProps> = ({ className = 'w-7 h-7' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="16"
        className="fill-zinc-950 dark:fill-zinc-100"
      />
      <rect
        x="5.5"
        y="5.5"
        width="53"
        height="53"
        rx="13"
        className="stroke-white/15 dark:stroke-zinc-950/15"
        strokeWidth="1.25"
      />
      {/* Architectural compass apex & blueprint folio prism */}
      <path
        d="M32 13L49 23.5V41.5L32 51L15 41.5V23.5L32 13Z"
        className="stroke-zinc-100 dark:stroke-zinc-950"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {/* Inner split book pages + drafting centerline */}
      <path
        d="M32 13V51"
        className="stroke-zinc-100 dark:stroke-zinc-950"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M15 23.5L32 33L49 23.5"
        className="stroke-zinc-100 dark:stroke-zinc-950"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Engineering precision ticks on left & right wings */}
      <path
        d="M21 33.5L27 37M21 39L27 42.5"
        className="stroke-zinc-100/65 dark:stroke-zinc-950/65"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M43 33.5L37 37M43 39L37 42.5"
        className="stroke-zinc-100/65 dark:stroke-zinc-950/65"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Top focal node */}
      <circle cx="32" cy="22.5" r="2.3" className="fill-zinc-100 dark:fill-zinc-950" />
    </svg>
  );
};
