export function VantFloating() {
  return (
    <div
      style={{
        position: "fixed",
        top: "max(1rem, env(safe-area-inset-top))",
        left: "max(1rem, env(safe-area-inset-left))",
        zIndex: 1000,
      }}
      className="pointer-events-none transition-all duration-300"
    >
      <div className="bg-[#202d3c]/90 backdrop-blur-md px-4 h-[38px] flex items-center justify-center shadow-lg border border-white/10 transition-all duration-300 rounded-full text-center">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-bold text-sm whitespace-pre-line transition-all duration-300 block">
          VANT
        </span>
      </div>
    </div>
  );
}
