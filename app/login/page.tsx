"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* ── Background image — shifted right to crop the left-edge watermark ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/ot-bg.jpg"
          alt="Operating Theatre"
          fill
          priority
          className="object-cover"
          style={{ objectPosition: "18% center", transform: "scale(1.06)", transformOrigin: "center" }}
        />

        {/* Base dark layer */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Cyan atmosphere — matches the neon tones in the image */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/60 via-transparent to-slate-900/40" />

        {/* Bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        {/* Left edge blackout — extra insurance over watermark strip */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/90 to-transparent" />
      </div>

      {/* ── Floating card ── */}
      <div className="relative z-10 w-full max-w-[22rem] mx-4">

        {/* Outer glow ring */}
        <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-b from-cyan-400/20 to-transparent blur-xl pointer-events-none" />

        <div className="relative bg-white/8 backdrop-blur-2xl border border-white/15 rounded-[1.75rem] shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden">

          {/* Top inner highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />

          {/* ── Header ── */}
          <div className="relative px-8 pt-10 pb-7 text-center">

            {/* Logo with cyan halo */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-cyan-400/25 blur-2xl scale-[2]" />
                <div className="relative p-1 rounded-2xl bg-gradient-to-b from-white/20 to-white/5 border border-white/20 shadow-xl">
                  <Image
                    src="/optiqueue-logo.png"
                    alt="OptiQueue"
                    width={64}
                    height={64}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            <h1 className="text-[2rem] font-bold text-white tracking-tight leading-none mb-2">
              OptiQueue
            </h1>
            <p className="text-cyan-300/80 text-[0.8rem] font-medium tracking-[0.12em] uppercase">
              Efficiency that Saves Lives
            </p>

            {/* Cyan divider */}
            <div className="mt-7 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
          </div>

          {/* ── Portal buttons ── */}
          <div className="px-8 pb-9 space-y-3">
            <p className="text-white/35 text-[0.68rem] text-center mb-5 tracking-[0.18em] uppercase">
              Choose your portal
            </p>

            {/* Admin Portal */}
            <button
              onClick={() => router.push("/admin-login")}
              className="group w-full relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.025] active:scale-[0.975] hover:shadow-[0_8px_30px_rgba(59,130,246,0.4)]"
            >
              {/* gradient border trick */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl" />
              <div className="relative m-[1px] flex items-center justify-between bg-gradient-to-r from-blue-600/95 to-indigo-600/95 group-hover:from-blue-500/95 group-hover:to-indigo-500/95 rounded-[11px] px-4 py-3.5 transition-all duration-300">
                <div className="flex items-center gap-3.5">
                  <div className="bg-white/15 group-hover:bg-white/25 rounded-lg p-2 transition-colors duration-300 backdrop-blur-sm border border-white/10">
                    <svg className="w-[18px] h-[18px] text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold text-[0.875rem] leading-tight">Admin Portal</div>
                    <div className="text-blue-200/70 text-[0.72rem] mt-0.5">System Administration</div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Doctor Portal */}
            <button
              onClick={() => router.push("/doctor-login")}
              className="group w-full relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.025] active:scale-[0.975] hover:shadow-[0_8px_30px_rgba(244,63,94,0.4)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl" />
              <div className="relative m-[1px] flex items-center justify-between bg-gradient-to-r from-rose-500/95 to-pink-600/95 group-hover:from-rose-400/95 group-hover:to-pink-500/95 rounded-[11px] px-4 py-3.5 transition-all duration-300">
                <div className="flex items-center gap-3.5">
                  <div className="bg-white/15 group-hover:bg-white/25 rounded-lg p-2 transition-colors duration-300 backdrop-blur-sm border border-white/10">
                    <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold text-[0.875rem] leading-tight">Doctor Portal</div>
                    <div className="text-rose-200/70 text-[0.72rem] mt-0.5">Patient Management</div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Footer */}
            <div className="pt-5 flex items-center justify-center gap-3 text-[0.68rem] text-white/25">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                <span>System Online</span>
              </div>
              <span className="w-px h-3 bg-white/15 block" />
              <span>© {new Date().getFullYear()} OptiQueue</span>
            </div>
          </div>

          {/* Bottom inner highlight */}
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>
    </div>
  )
}
