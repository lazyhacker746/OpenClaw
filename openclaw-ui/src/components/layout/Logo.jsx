import React from 'react';

export default function Logo() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">
      <defs>
        <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" /> 
          <stop offset="100%" stopColor="#3b82f6" /> 
        </linearGradient>
      </defs>
      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="url(#purpleGradient)" stroke="url(#purpleGradient)" strokeWidth="1" strokeLinejoin="round"/>
    </svg>
  );
}