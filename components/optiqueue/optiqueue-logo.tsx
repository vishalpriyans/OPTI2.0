import { cn } from "@/lib/utils"

interface OptiQueueLogoProps {
  className?: string
}

export function OptiQueueLogo({ className }: OptiQueueLogoProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={cn("w-8 h-8", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="60" cy="60" r="55" fill="#f0f9ff" stroke="#e0f2fe" strokeWidth="2" />
      
      {/* Medical crosses - various sizes and positions */}
      <g>
        {/* Large central cross */}
        <path d="M50 35h20v10h-20z M55 30h10v20h-10z" fill="#22c55e" />
        
        {/* Medium crosses */}
        <path d="M25 25h12v6h-12z M28 22h6v12h-6z" fill="#1e40af" />
        <path d="M83 25h12v6h-12z M86 22h6v12h-6z" fill="#1e40af" />
        <path d="M25 75h12v6h-12z M28 72h6v12h-6z" fill="#22c55e" />
        <path d="M83 75h12v6h-12z M86 72h6v12h-6z" fill="#22c55e" />
        
        {/* Small crosses */}
        <path d="M15 50h8v4h-8z M17 48h4v8h-4z" fill="#1e40af" />
        <path d="M97 50h8v4h-8z M99 48h4v8h-4z" fill="#1e40af" />
        <path d="M40 15h8v4h-8z M42 13h4v8h-4z" fill="#22c55e" />
        <path d="M72 15h8v4h-8z M74 13h4v8h-4z" fill="#22c55e" />
        <path d="M40 95h8v4h-8z M42 93h4v8h-4z" fill="#1e40af" />
        <path d="M72 95h8v4h-8z M74 93h4v8h-4z" fill="#22c55e" />
      </g>
      
      {/* Clock hands */}
      <g transform="translate(60,60)">
        <circle r="2" fill="#1e40af" />
        <line x1="0" y1="0" x2="0" y2="-15" stroke="#1e40af" strokeWidth="2" strokeLinecap="round" />
        <line x1="0" y1="0" x2="10" y2="-8" stroke="#1e40af" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      
      {/* Curved arrow/growth line */}
      <path 
        d="M25 85 Q45 70 70 65 Q85 62 95 45" 
        stroke="#22c55e" 
        strokeWidth="3" 
        fill="none" 
        strokeLinecap="round"
      />
      
      {/* Arrow head */}
      <path d="M90 50 L95 45 L100 50 L95 40 Z" fill="#22c55e" />
      
      {/* Heartbeat line on arrow */}
      <path 
        d="M40 75 L45 75 L48 65 L52 85 L55 75 L60 75" 
        stroke="#f59e0b" 
        strokeWidth="2" 
        fill="none" 
        strokeLinecap="round"
      />
      
      {/* Small medical symbols */}
      <circle cx="30" cy="40" r="2" fill="#22c55e" opacity="0.6" />
      <circle cx="90" cy="35" r="2" fill="#1e40af" opacity="0.6" />
      <circle cx="20" cy="70" r="2" fill="#22c55e" opacity="0.6" />
      <circle cx="100" cy="75" r="2" fill="#1e40af" opacity="0.6" />
      
      {/* Magnifying glass */}
      <g transform="translate(75,85)">
        <circle cx="0" cy="0" r="8" fill="none" stroke="#1e40af" strokeWidth="2" />
        <line x1="6" y1="6" x2="12" y2="12" stroke="#1e40af" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  )
}
