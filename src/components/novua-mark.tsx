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
        <span className="relative block h-5 w-5">
          <span className="absolute inset-y-0 left-0 w-[5px] rounded-full bg-[#17120f]" />
          <span className="absolute inset-y-0 left-[7px] w-[5px] rounded-full bg-[#17120f]" />
          <span className="absolute inset-y-0 right-0 w-[5px] rounded-full bg-amber-500" />
        </span>
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
