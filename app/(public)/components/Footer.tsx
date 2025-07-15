export function Footer() {
  return (
<footer className="bg-[#1C2D20] pb-8 sm:pb-16 md:pb-60 pt-6 sm:pt-8 md:pt-30 px-4 sm:px-6 md:px-18 text-center">
    <div>
        <h3 className="font-special text-xl sm:text-2xl md:text-4xl">
            CALETA
        </h3>
        <p className="font-semibold py-3 sm:py-4 md:py-8 text-sm sm:text-base">
            Esta es una iniciativa de Zackness
        </p>
        <p className="font-semibold gap-x-4 md:gap-x-10 flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 text-sm sm:text-base">
            <a href="" className="hover:text-[#40C9A9] transition-colors">Instagram</a>
            <a href="" className="hover:text-[#40C9A9] transition-colors">GitHub</a>
            <a href="" className="hover:text-[#40C9A9] transition-colors">TikTok</a>
            <a href="" className="hover:text-[#40C9A9] transition-colors">YouTube</a>
        </p>
    </div>
</footer>
  );
} 