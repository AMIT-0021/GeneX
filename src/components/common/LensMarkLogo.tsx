import React from 'react';

interface LensMarkLogoProps {
  className?: string;
  size?: number;
}

export const LensMarkLogo: React.FC<LensMarkLogoProps> = ({ className = "w-8 h-8", size = 120 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Genex Lens Mark Logo"
    >
      <defs>
        <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D98E3F" />
          <stop offset="100%" stopColor="#5C8A6B" />
        </linearGradient>
      </defs>
      <circle
        cx="60"
        cy="60"
        r="44"
        fill="none"
        stroke="url(#lensGrad)"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <path
        d="M60 16 A44 44 0 0 1 104 60 L 80 60"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <circle cx="60" cy="60" r="13" fill="#0F2340" />
      <circle cx="55" cy="55" r="4" fill="#FFFFFF" opacity="0.55" />
    </svg>
  );
};
