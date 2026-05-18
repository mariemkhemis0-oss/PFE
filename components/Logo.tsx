
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 40, showText = false }) => {
  const gradientId = "cyber-logo-gradient";
  const glowId = "cyber-logo-glow";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Shield Outline */}
        <path 
          d="M50 5L15 20V45C15 68.33 30.15 89.62 50 95C69.85 89.62 85 68.33 85 45V20L50 5Z" 
          stroke={`url(#${gradientId})`} 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
        />
        
        {/* Brain/Circuit Pattern inside */}
        <g stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round" opacity="0.9">
          <path d="M40 35C40 30 45 28 50 28C55 28 60 30 60 35C60 40 55 42 50 42C45 42 40 44 40 49C40 54 45 56 50 56C55 56 60 54 60 49" />
          <circle cx="50" cy="42" r="2" fill={`url(#${gradientId})`} />
          <path d="M50 56V65" />
          <path d="M40 49H30" />
          <path d="M60 49H70" />
          <circle cx="30" cy="49" r="2" fill={`url(#${gradientId})`} />
          <circle cx="70" cy="49" r="2" fill={`url(#${gradientId})`} />
          <circle cx="50" cy="65" r="2" fill={`url(#${gradientId})`} />
        </g>
      </svg>
      {showText && (
        <span className="font-black text-xl tracking-tighter italic uppercase text-white">
          CyberAudit <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">AI</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
