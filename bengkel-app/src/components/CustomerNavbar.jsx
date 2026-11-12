import Link from "next/link";
import { PlusCircle, UserRound, Wrench } from "lucide-react";

export default function CustomerNavbar({ user, activePage }) {
  const buttonClass =
    "flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all sm:px-4";
  const inactiveClass =
    "border-[#E5E5E5] bg-white text-[#4B5563] hover:border-[#9CA3AF] hover:bg-[#F1F1F1] hover:text-[#111111]";
  const activeClass = "border-[#111111] bg-[#111111]/5 text-[#111111]";

  return (
    <header className="sticky top-0 z-20 border-b border-[#E5E5E5] bg-white/80 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 md:py-5">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#111111] to-[#0A0A0A] shadow-lg shadow-black/20 ring-1 ring-black/10">
            <Wrench className="h-5 w-5 text-white" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight text-[#111111] md:text-lg">
              Halo, {user?.name}! 👋
            </p>
            <p className="mt-0.5 truncate font-mono text-xs tracking-wide text-[#6B7280]">
              {user?.whatsapp}
            </p>
          </div>
        </Link>

        <nav aria-label="Navigasi akun" className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            aria-current={activePage === "dashboard" ? "page" : undefined}
            className={`${buttonClass} ${activePage === "dashboard" ? activeClass : inactiveClass}`}
          >
            <Wrench className="h-4 w-4" strokeWidth={2.25} />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/booking"
            aria-current={activePage === "booking" ? "page" : undefined}
            className="flex items-center gap-1.5 rounded-xl bg-[#111111] px-3 py-2.5 text-xs font-semibold text-white shadow-lg shadow-black/20 transition-all hover:bg-[#333333] active:scale-[0.98] sm:px-5"
          >
            <PlusCircle className="h-4 w-4" strokeWidth={2.25} />
            <span>Buat Booking</span>
          </Link>
          <Link
            href="/profile"
            aria-current={activePage === "profile" ? "page" : undefined}
            className={`${buttonClass} ${activePage === "profile" ? activeClass : inactiveClass}`}
          >
            <UserRound className="h-4 w-4" strokeWidth={2.25} />
            <span>Profil</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
