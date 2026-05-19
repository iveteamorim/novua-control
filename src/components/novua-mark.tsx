import Link from "next/link";

export function NovuaMark({
  href,
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  const content = (
    <div className="inline-flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-2xl border border-black/8 bg-white shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
        <NovuaSymbol />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#8a7d71]">
          Novua
        </p>
        <p
          className={`font-semibold tracking-[-0.04em] text-[#17120f] ${
            compact ? "text-base" : "text-lg"
          }`}
        >
          Control
        </p>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  );
}

function NovuaSymbol() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <path
        d="M5.5 5.5V10.5C5.5 12.1 6.8 13.4 8.4 13.4H12.1C13.2 13.4 14.1 14.3 14.1 15.4V16.6"
        stroke="#17120f"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="5.5" cy="5.5" r="2.7" fill="#17120f" />
      <circle cx="5.5" cy="16.5" r="2.7" fill="#17120f" />
      <circle cx="16.5" cy="16.5" r="2.9" fill="#d89a38" />
      <path
        d="M8.8 11H13.8"
        stroke="#d89a38"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
