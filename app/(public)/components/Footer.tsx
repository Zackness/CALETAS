export function Footer() {
  return (
    <footer className="relative mt-8 w-full overflow-hidden bg-[linear-gradient(180deg,color-mix(in_srgb,var(--mygreen-dark)_86%,black),color-mix(in_srgb,var(--mygreen-dark)_94%,black))] px-4 pb-12 pt-14 sm:px-6 sm:pt-20 md:px-10">
      <span className="chalk-doodle -left-10 top-6 hidden md:block" aria-hidden="true" />
      <span className="chalk-doodle -right-12 bottom-4 hidden md:block" aria-hidden="true" />
      <span className="chalk-formula left-[12%] bottom-7 hidden lg:block" aria-hidden="true">dx/dt</span>
      <span className="chalk-formula right-[14%] top-9 hidden lg:block" aria-hidden="true">a^2+b^2</span>

      <div className="mx-auto w-full max-w-[1180px] px-5 py-10 text-center sm:px-8 sm:py-12">
        <h3 className="chalk-title font-special text-3xl sm:text-4xl">CALETA</h3>
        <p className="mx-auto max-w-xl py-4 text-sm font-semibold text-white/90 sm:text-base">
          Esta es una iniciativa de Zackness
        </p>
        <div className="mx-auto mt-2 flex w-full max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold sm:text-base md:gap-x-10">
          <a href="https://instagram.com" className="transition-colors hover:text-[var(--accent-hex)]">Instagram</a>
          <a href="https://github.com" className="transition-colors hover:text-[var(--accent-hex)]">GitHub</a>
          <a href="https://tiktok.com" className="transition-colors hover:text-[var(--accent-hex)]">TikTok</a>
          <a href="https://youtube.com" className="transition-colors hover:text-[var(--accent-hex)]">YouTube</a>
        </div>
      </div>
    </footer>
  );
}
