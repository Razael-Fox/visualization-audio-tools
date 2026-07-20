import { useState, useEffect } from "react";

interface VantFloatingProps {
  navMenuVisible: boolean;
}

export function VantFloating({ navMenuVisible }: VantFloatingProps) {
  const [text, setText] = useState<string>("VANT");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (navMenuVisible) {
      let isMounted = true;
      const fetchQuote = async () => {
        setLoading(true);
        try {
          const res = await fetch("https://dummyjson.com/quotes/random");
          if (!res.ok) throw new Error(`API Error: ${res.status}`);
          const data = await res.json();
          if (isMounted) {
            setText(`"${data.quote}" - ${data.author}`);
          }
        } catch (err) {
          console.error("Failed to fetch quote from dummyjson:", err);
          if (isMounted) {
            setText("VANT");
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      fetchQuote();
      return () => {
        isMounted = false;
      };
    } else {
      setText("VANT");
    }
  }, [navMenuVisible]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1100] pointer-events-none max-w-[90vw] transition-all duration-300">
      <div className="bg-[#202d3c]/90 backdrop-blur-md px-6 py-2 rounded-full shadow-lg border border-white/10 text-center">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-bold text-sm md:text-base transition-all duration-300">
          {loading ? "Loading..." : text}
        </span>
      </div>
    </div>
  );
}
