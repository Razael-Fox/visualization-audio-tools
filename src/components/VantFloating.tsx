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

  let displayText = text;
  let wordCount = 0;
  if (!loading && text !== "VANT") {
    const words = text.split(" ");
    wordCount = words.length;
    if (wordCount > 4) {
      const lines = [];
      for (let i = 0; i < words.length; i += 4) {
        lines.push(words.slice(i, i + 4).join(" "));
      }
      displayText = lines.join("\n");
    }
  }

  const isBox = wordCount > 4 && !loading;

  return (
    <div className="fixed top-6 left-4 sm:left-6 z-[1100] pointer-events-none max-w-[90vw] transition-all duration-300">
      <div
        className={`bg-[#202d3c]/90 backdrop-blur-md px-6 py-2 shadow-lg border border-white/10 transition-all duration-300 ${
          isBox ? "rounded-xl text-left" : "rounded-full text-center"
        }`}
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-bold text-sm md:text-base whitespace-pre-line transition-all duration-300 block">
          {loading ? "Loading..." : displayText}
        </span>
      </div>
    </div>
  );
}
