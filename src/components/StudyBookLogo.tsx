import React from 'react';

interface StudyBookLogoProps {
  className?: string;
}

export const StudyBookLogo: React.FC<StudyBookLogoProps> = ({ className = 'w-7 h-7' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" className="fill-zinc-900 dark:fill-zinc-100" />
      <g
        className="stroke-zinc-50 dark:stroke-zinc-950"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M32 20C27.8 17.5 21 16.8 14.5 18C13.2 18.2 12.5 19.2 12.5 20.5V43.5C12.5 44.8 13.5 45.8 14.8 45.5C21.2 44.3 27.8 45 32 47.5" />
        <path d="M32 20C36.2 17.5 43 16.8 49.5 18C50.8 18.2 51.5 19.2 51.5 20.5V43.5C51.5 44.8 50.5 45.8 49.2 45.5C42.8 44.3 36.2 45 32 47.5" />
        <path d="M32 20V47.5" />
        <path d="M18 26H26.5" strokeWidth="2" strokeOpacity="0.6" />
        <path d="M18 32H26.5" strokeWidth="2" strokeOpacity="0.6" />
        <path d="M18 38H24" strokeWidth="2" strokeOpacity="0.6" />
        <path
          d="M44.5 23.5L38 30L36 38.2L44.2 36.2L50.7 29.7L44.5 23.5Z"
          className="fill-zinc-900 dark:fill-zinc-100"
        />
        <path d="M36 38.2L41.5 32.7" />
        <circle cx="42.5" cy="31.7" r="1.2" className="fill-zinc-50 dark:fill-zinc-950" stroke="none" />
      </g>
    </svg>
  );
};
