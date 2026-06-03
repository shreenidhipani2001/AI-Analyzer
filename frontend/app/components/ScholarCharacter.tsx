"use client";

interface ScholarCharacterProps {
  side: "left" | "right";
  loading: boolean;
}

export default function ScholarCharacter({ side, loading }: ScholarCharacterProps) {
  const mirror = side === "right" ? "scale(-1 1)" : "scale(1 1)";

  return (
    <div className="flex flex-col items-center select-none">
      <svg
        viewBox="0 0 140 240"
        width="140"
        height="240"
        xmlns="http://www.w3.org/2000/svg"
        className={loading ? "analyst-active" : "analyst-idle"}
        style={{ overflow: "visible" }}
      >
        {/* ── Floating coins (idle only) ── */}
        {!loading && (
          <g transform={mirror} style={{ transformOrigin: "70px 120px" }}>
            <circle cx="18" cy="50" r="10" fill="#ffcd3c" stroke="#e6a800" strokeWidth="1.5" className="coin-1" />
            <text x="14" y="55" fontSize="10" fill="#c87800" fontWeight="bold" className="coin-1">$</text>
            <circle cx="115" cy="35" r="8"  fill="#ffcd3c" stroke="#e6a800" strokeWidth="1.5" className="coin-2" />
            <text x="112" y="40" fontSize="8"  fill="#c87800" fontWeight="bold" className="coin-2">₹</text>
            <circle cx="122" cy="72" r="7"  fill="#ffaa70" stroke="#e6a800" strokeWidth="1.5" className="coin-3" />
            <text x="119" y="77" fontSize="7"  fill="#c87800" fontWeight="bold" className="coin-3">$</text>
          </g>
        )}

        {/* ── Suit jacket ── */}
        <path d="M35,145 Q28,175 22,215 L118,215 Q112,175 105,145 Z" fill="#ff7a2f" />
        {/* Jacket lapels */}
        <path d="M70,145 L55,165 L70,160 Z" fill="#e85e10" />
        <path d="M70,145 L85,165 L70,160 Z" fill="#e85e10" />
        {/* White shirt */}
        <rect x="62" y="145" width="16" height="30" fill="#fff8f0" />
        {/* Tie */}
        <path d="M67,148 L70,165 L73,148 Z" fill="#ffcd3c" />
        <path d="M68,165 L70,175 L72,165 Z" fill="#e6a800" />
        {/* Jacket buttons */}
        <circle cx="70" cy="182" r="2.5" fill="#e85e10" />
        <circle cx="70" cy="193" r="2.5" fill="#e85e10" />

        {/* ── Neck ── */}
        <rect x="63" y="130" width="14" height="18" rx="5" fill="#fdbcb4" />

        {/* ── Head ── */}
        <circle cx="70" cy="103" r="30" fill="#fdbcb4" />

        {/* ── Hair ── */}
        <path d="M40,103 Q40,76 58,70 L82,70 Q100,76 100,103" fill="#3d2000" />
        <path d="M40,100 Q38,85 43,78" fill="#3d2000" />
        <path d="M100,100 Q102,85 97,78" fill="#3d2000" />
        {/* Side part */}
        <path d="M58,70 Q65,67 70,70" fill="none" stroke="#5a3200" strokeWidth="1.5" />

        {/* ── Ears ── */}
        <ellipse cx="40" cy="103" rx="5" ry="7" fill="#f5a090" />
        <ellipse cx="100" cy="103" rx="5" ry="7" fill="#f5a090" />

        {/* ── Eyes ── */}
        {loading ? (
          /* Active — focused eyes looking at chart */
          <g>
            <ellipse cx="60" cy="102" rx="5" ry="5.5" fill="white" />
            <ellipse cx="80" cy="102" rx="5" ry="5.5" fill="white" />
            <circle cx="61"  cy="103" r="3" fill="#3d2000" />
            <circle cx="81"  cy="103" r="3" fill="#3d2000" />
            <circle cx="62"  cy="102" r="1" fill="white" />
            <circle cx="82"  cy="102" r="1" fill="white" />
            {/* Focused eyebrows */}
            <path d="M54,94 Q60,91 66,93" fill="none" stroke="#3d2000" strokeWidth="2" strokeLinecap="round" />
            <path d="M74,93 Q80,91 86,94" fill="none" stroke="#3d2000" strokeWidth="2" strokeLinecap="round" />
          </g>
        ) : (
          /* Idle — big happy eyes */
          <g>
            <ellipse cx="60" cy="103" rx="6" ry="6.5" fill="white" />
            <ellipse cx="80" cy="103" rx="6" ry="6.5" fill="white" />
            <circle cx="61"  cy="104" r="3.5" fill="#3d2000" />
            <circle cx="81"  cy="104" r="3.5" fill="#3d2000" />
            <circle cx="62"  cy="103" r="1.2" fill="white" />
            <circle cx="82"  cy="103" r="1.2" fill="white" />
            {/* Happy eyebrows */}
            <path d="M53,93 Q60,89 67,92" fill="none" stroke="#3d2000" strokeWidth="2" strokeLinecap="round" />
            <path d="M73,92 Q80,89 87,93" fill="none" stroke="#3d2000" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* ── Big smile ── */}
        <path
          d={loading
            ? "M60,116 Q70,122 80,116"
            : "M58,116 Q70,125 82,116"}
          fill="none" stroke="#c0636a" strokeWidth="2.5" strokeLinecap="round"
        />
        {/* Teeth */}
        {!loading && (
          <path d="M62,118 Q70,124 78,118 Q70,123 62,118 Z" fill="white" opacity="0.7" />
        )}

        {/* ── Cheek blush ── */}
        <ellipse cx="50" cy="112" rx="7" ry="5" fill="#ffaa90" opacity="0.4" />
        <ellipse cx="90" cy="112" rx="7" ry="5" fill="#ffaa90" opacity="0.4" />

        {/* ── Arms ── */}
        {loading ? (
          /* Holding chart tablet */
          <g>
            <path d="M40,152 Q24,172 26,192" stroke="#ff7a2f" strokeWidth="10" strokeLinecap="round" fill="none" />
            <path d="M100,152 Q116,172 114,192" stroke="#ff7a2f" strokeWidth="10" strokeLinecap="round" fill="none" />
            {/* Hands */}
            <circle cx="26" cy="194" r="7" fill="#fdbcb4" />
            <circle cx="114" cy="194" r="7" fill="#fdbcb4" />
          </g>
        ) : (
          /* Idle meditation arms */
          <g>
            <path d="M40,152 Q22,168 28,185" stroke="#ff7a2f" strokeWidth="10" strokeLinecap="round" fill="none" />
            <path d="M100,152 Q118,168 112,185" stroke="#ff7a2f" strokeWidth="10" strokeLinecap="round" fill="none" />
            <circle cx="28" cy="187" r="7" fill="#fdbcb4" />
            <circle cx="112" cy="187" r="7" fill="#fdbcb4" />
          </g>
        )}

        {/* ── Bar chart (active only) ── */}
        {loading && (
          <g>
            {/* Chart background */}
            <rect x="22" y="196" width="96" height="34" rx="6" fill="white" stroke="#ffcd3c" strokeWidth="1.5" />
            {/* Chart bars */}
            <rect x="32" y="208" width="12" height="16" rx="2" fill="#ff7a2f" className="chart-bar-1"
              style={{ transformOrigin: "38px 224px" }} />
            <rect x="50" y="204" width="12" height="20" rx="2" fill="#ffcd3c" className="chart-bar-2"
              style={{ transformOrigin: "56px 224px" }} />
            <rect x="68" y="211" width="12" height="13" rx="2" fill="#ff7a2f" className="chart-bar-3"
              style={{ transformOrigin: "74px 224px" }} />
            <rect x="86" y="200" width="12" height="24" rx="2" fill="#ffaa70" className="chart-bar-4"
              style={{ transformOrigin: "92px 224px" }} />
            {/* Chart baseline */}
            <line x1="28" y1="225" x2="112" y2="225" stroke="#ffcd3c" strokeWidth="1" />
          </g>
        )}

        {/* ── Meditation hands (idle) ── */}
        {!loading && (
          <g>
            {/* Cupped hands in lap */}
            <ellipse cx="70" cy="205" rx="28" ry="10" fill="#fdbcb4" opacity="0.7" />
            {/* Meditation ring glow */}
            <ellipse cx="70" cy="205" rx="32" ry="12" fill="none" stroke="#ffcd3c" strokeWidth="1.5" opacity="0.5" />
          </g>
        )}
      </svg>

      <p className="text-xs text-coral-dark/60 mt-1 font-body font-semibold tracking-wider uppercase">
        {loading ? "Researching…" : "Meditating"}
      </p>
    </div>
  );
}
