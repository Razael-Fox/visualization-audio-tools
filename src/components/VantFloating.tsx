interface VantFloatingProps {
  navMenuVisible?: boolean;
}

export function VantFloating({ navMenuVisible }: VantFloatingProps) {
  return (
    <div className="fixed top-6 left-4 sm:left-6 z-[1100] pointer-events-none max-w-[90vw] transition-all duration-300">
      <div className="bg-[#202d3c]/90 backdrop-blur-md px-6 py-2 shadow-lg border border-white/10 transition-all duration-300 rounded-full text-center">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-bold text-sm md:text-base whitespace-pre-line transition-all duration-300 block">
          VANT
        </span>
      </div>
    </div>
  );
}
