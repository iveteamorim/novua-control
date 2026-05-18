import Link from "next/link";

export function LegalLinks({
  textClassName = "text-[#5f564e]",
  compact = false,
}: {
  textClassName?: string;
  compact?: boolean;
}) {
  return (
    <p className={`${compact ? "text-xs leading-6" : "text-sm leading-7"} ${textClassName}`}>
      By continuing, you agree to the{" "}
      <Link href="/terms" className="font-medium text-[#17120f] underline underline-offset-4">
        Terms of Service
      </Link>
      ,{" "}
      <Link
        href="/privacy"
        className="font-medium text-[#17120f] underline underline-offset-4"
      >
        Privacy Policy
      </Link>
      , and{" "}
      <Link
        href="/data-processing-agreement"
        className="font-medium text-[#17120f] underline underline-offset-4"
      >
        Data Processing Agreement
      </Link>
      .
    </p>
  );
}
