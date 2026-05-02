import Link from "next/link";

export function SiteLogo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 font-semibold tracking-tight text-foreground"
    >
      <span
        aria-hidden="true"
        className="inline-block h-6 w-6 rounded-md bg-primary"
      />
      <span>Doatividade</span>
    </Link>
  );
}
