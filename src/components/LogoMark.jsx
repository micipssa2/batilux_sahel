// Placeholder rendering of the client's existing circular mark (sage "B" roofline
// on a wood-textured anthracite disc). Swap for the real vector file in /public
// as soon as it's available — see README "Assets to replace".

export default function LogoMark({ size = 56, className = '' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Batilux Sahel"
    >
      <defs>
        <clipPath id="disc">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
        <radialGradient id="discBg" cx="35%" cy="25%" r="80%">
          <stop offset="0%" stopColor="#2b2620" />
          <stop offset="100%" stopColor="#17140f" />
        </radialGradient>
      </defs>

      <circle cx="50" cy="50" r="49" fill="none" stroke="#3e6b4e" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="48" fill="url(#discBg)" />

      {/* wood grain */}
      <g clipPath="url(#disc)" opacity="0.35" stroke="#0f0d09" strokeWidth="1" fill="none">
        <path d="M-10 18 Q 30 24 50 18 T 110 20" />
        <path d="M-10 30 Q 30 36 50 30 T 110 32" />
        <path d="M-10 66 Q 30 60 50 66 T 110 64" />
        <path d="M-10 80 Q 30 74 50 80 T 110 78" />
        <path d="M-10 92 Q 30 86 50 92 T 110 90" />
      </g>

      {/* roofline */}
      <path
        d="M32 40 L50 24 L68 40"
        fill="none"
        stroke="#7ea78c"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* B glyph */}
      <text
        x="50"
        y="76"
        textAnchor="middle"
        fontFamily="'Bricolage Grotesque', sans-serif"
        fontWeight="700"
        fontSize="38"
        fill="#3e6b4e"
      >
        B
      </text>
    </svg>
  )
}
