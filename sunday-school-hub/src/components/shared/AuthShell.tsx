import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { OrnateFlourish } from "@/components/shared/OrnateFlourish";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex min-h-screen bg-twilight-950 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/auth-bg.jpg')" }}
    >
      {/* Mutes the background so it reads as ambiance rather than competing
          with the foreground content. */}
      <div className="pointer-events-none absolute inset-0 bg-twilight-950/55" />

      {/* Constrains the two panels to a shared centered width — without
          this, each panel centers independently within its own half of a
          wide viewport, leaving a large empty gap between them. The
          background image itself still spans the full width behind this. */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl">
        {/* Brand panel — hidden below lg, where a split screen has no room to breathe */}
        <div className="relative hidden lg:flex lg:w-[46%]">
          <div className="flex w-full flex-col items-center justify-center px-8 py-16 text-center xl:px-10">
            <Link to="/">
              <img
                src="/logo.png"
                alt="El Hedaya Islamic School"
                className="h-28 w-28 rounded-full object-contain drop-shadow-[0_0_40px_rgba(245,208,128,0.35)] xl:h-32 xl:w-32"
              />
            </Link>

            <p className="mt-7 font-serif-display text-xl italic text-amber-400 xl:text-2xl">Welcome to</p>
            <h1 className="mt-1 font-serif-display text-4xl font-bold leading-tight text-amber-400 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] xl:text-5xl">
              El Hedaya
            </h1>
            <h2 className="mt-1 font-serif-display text-4xl font-bold leading-tight text-[#F5F9F6] drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] xl:text-5xl">
              Islamic School
            </h2>

            <OrnateFlourish className="mt-6" variant="dark" />

            <p className="mt-6 max-w-md font-serif-body text-[15px] leading-relaxed text-[#E9F0EA] drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">
              Islamic education gives children the opportunity to learn the fundamental beliefs, values,
              and ethics of Islam, providing a strong foundation for their spiritual, academic, and
              personal growth.
            </p>
            <p className="mt-4 max-w-md font-serif-body text-[15px] leading-relaxed text-[#E9F0EA] drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">
              At El Hedaya Islamic School, our goal is to nurture students into exemplary members of
              society and responsible citizens of the Muslim community. We strive to inspire a lifelong
              love of learning, strengthen Islamic character, and encourage our students to practice
              Islam with knowledge, confidence, and compassion.
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Compact logo shown only when the brand panel is hidden (mobile/tablet) */}
            <Link to="/" className="mb-8 flex items-center justify-center gap-2 lg:hidden">
              <img src="/logo.png" alt="El Hedaya Islamic School" className="h-10 w-10 rounded-full object-contain" />
              <span className="font-serif-display text-lg font-semibold text-[#F5F9F6]">El Hedaya Islamic School</span>
            </Link>
            <div className="relative overflow-hidden rounded-xl2 border border-amber-500/25 bg-gradient-to-b from-[#0e1f16]/90 to-[#0a1a12]/95 p-8 shadow-card-gold backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-hairline" />
              <div className="relative z-10">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
