// White cat mascot, drawn inline so there are no image assets to host.
export default function Mascot({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="BelugAI the white cat">
      <g stroke="#94a3b8" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        {/* ears */}
        <path d="M18 44 L20 12 L44 30 Z" fill="#ffffff" />
        <path d="M82 44 L80 12 L56 30 Z" fill="#ffffff" />
        <path d="M24 36 L24 21 L37 31 Z" fill="#fbcfe8" stroke="none" />
        <path d="M76 36 L76 21 L63 31 Z" fill="#fbcfe8" stroke="none" />
        {/* head */}
        <ellipse cx="50" cy="58" rx="36" ry="32" fill="#ffffff" />
      </g>
      {/* eyes */}
      <ellipse cx="36" cy="55" rx="4.5" ry="6" fill="#0f172a" />
      <ellipse cx="64" cy="55" rx="4.5" ry="6" fill="#0f172a" />
      <circle cx="37.5" cy="52.5" r="1.6" fill="#ffffff" />
      <circle cx="65.5" cy="52.5" r="1.6" fill="#ffffff" />
      {/* nose + mouth */}
      <path d="M46 66 L54 66 L50 71 Z" fill="#f9a8d4" />
      <path d="M50 71 Q50 77 44 77 M50 71 Q50 77 56 77" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      {/* whiskers */}
      <g stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round">
        <path d="M30 68 L12 64 M30 72 L12 74" />
        <path d="M70 68 L88 64 M70 72 L88 74" />
      </g>
      {/* blush */}
      <ellipse cx="27" cy="67" rx="5" ry="3" fill="#fecdd3" opacity="0.7" />
      <ellipse cx="73" cy="67" rx="5" ry="3" fill="#fecdd3" opacity="0.7" />
    </svg>
  );
}
