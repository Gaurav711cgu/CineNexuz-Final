import * as React from "react"
import { cn } from "../../lib/utils"

export function Logo({ className, size = 24, glow = true, variant = "default", ...props }) {
  const gradientId = React.useId();
  const glowId = React.useId();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn("select-none transition-all duration-300", className)}
      style={{
        filter: glow ? `url(#${glowId})` : "none",
      }}
      {...props}
    >
      <defs>
        {/* Main Brand Gradient: Electric Cyan to Violet to Deep Blue */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E4FF" />
          <stop offset="45%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        {/* Premium Soft Glow Filter */}
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Orbit Ring */}
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke={variant === "white" ? "#FFFFFF" : variant === "dark" ? "#0F172A" : `url(#${gradientId})`}
        strokeWidth="3"
        strokeDasharray="6 3 15 3"
        className="animate-[spin_40s_linear_infinite]"
        style={{ transformOrigin: "center" }}
      />
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="none"
        stroke={variant === "white" ? "rgba(255,255,255,0.15)" : variant === "dark" ? "rgba(15,23,42,0.15)" : "rgba(0,228,255,0.12)"}
        strokeWidth="1.5"
      />

      {/* Stylized Globe Latitude / Grid (Inner Ring / Orbit) */}
      <ellipse
        cx="50"
        cy="50"
        rx="38"
        ry="13"
        fill="none"
        stroke={variant === "white" ? "rgba(255,255,255,0.2)" : variant === "dark" ? "rgba(15,23,42,0.2)" : "rgba(0,228,255,0.2)"}
        strokeWidth="1.2"
        transform="rotate(-25 50 50)"
      />
      <ellipse
        cx="50"
        cy="50"
        rx="13"
        ry="38"
        fill="none"
        stroke={variant === "white" ? "rgba(255,255,255,0.2)" : variant === "dark" ? "rgba(15,23,42,0.2)" : "rgba(0,228,255,0.2)"}
        strokeWidth="1.2"
        transform="rotate(-25 50 50)"
      />

      {/* Main Stylized Globe / C-shaped landmass pattern */}
      <path
        d="M 50 16 
           C 68.78 16, 84 31.22, 84 50 
           C 84 68.78, 68.78 84, 50 84 
           C 31.22 84, 16 68.78, 16 50 
           C 16 41.5, 19.1 33.7, 24.3 27.8 
           L 32.5 35 
           C 29.7 39, 28 44.3, 28 50 
           C 28 62.15, 37.85 72, 50 72 
           C 62.15 72, 72 62.15, 72 50 
           C 72 37.85, 62.15 28, 50 28 
           C 47 28, 44 28.6, 41.5 29.8 
           L 36.5 21.8 
           C 40.6 18.1, 45 16, 50 16 Z"
        fill={variant === "white" ? "#FFFFFF" : variant === "dark" ? "#0F172A" : `url(#${gradientId})`}
        fillRule="evenodd"
      />

      {/* Inside Core Globe / Hub */}
      <circle
        cx="50"
        cy="50"
        r="14"
        fill={variant === "white" ? "rgba(255,255,255,0.1)" : variant === "dark" ? "rgba(15,23,42,0.1)" : "rgba(0,228,255,0.08)"}
        stroke={variant === "white" ? "#FFFFFF" : variant === "dark" ? "#0F172A" : `url(#${gradientId})`}
        strokeWidth="1.8"
      />

      {/* Central network node */}
      <circle cx="50" cy="50" r="3.5" fill={variant === "white" ? "#FFFFFF" : variant === "dark" ? "#0F172A" : "#00E4FF"} />
      
      {/* Micro pulsing network rings for ambient depth */}
      <circle cx="72" cy="50" r="2" fill={variant === "white" ? "#FFFFFF" : variant === "dark" ? "#0F172A" : "#00E4FF"} className="animate-ping" style={{ transformOrigin: "72px 50px", animationDuration: "3s" }} />
      <circle cx="28" cy="50" r="2" fill={variant === "white" ? "#FFFFFF" : variant === "dark" ? "#0F172A" : "#3B82F6"} className="animate-ping" style={{ transformOrigin: "28px 50px", animationDuration: "4s" }} />
    </svg>
  )
}
