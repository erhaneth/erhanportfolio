
import React, { useEffect, useState } from 'react';

interface AudioVisualizerProps {
  isSpeaking: boolean;
  volume: number;
  label: string;
  type: 'user' | 'ai';
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isSpeaking, volume, label, type }) => {
  const [bars, setBars] = useState<number[]>(new Array(12).fill(2));

  useEffect(() => {
    if (isSpeaking) {
      // Create jittered bars based on volume
      const interval = setInterval(() => {
        setBars(new Array(12).fill(0).map(() => {
          const base = volume * 100;
          return Math.max(2, Math.random() * base);
        }));
      }, 50);
      return () => clearInterval(interval);
    } else {
      setBars(new Array(12).fill(2));
    }
  }, [isSpeaking, volume]);

  const colorClass = type === 'user' ? 'bg-[#008F11]' : 'bg-[#00FF41]';
  const glowClass = type === 'user' ? 'shadow-[0_0_5px_#008F11]' : 'shadow-[0_0_10px_#00FF41]';

  return (
    <div className="flex flex-col gap-2 p-2 border border-[#003B00] bg-[#020202]/50">
      <div className="flex justify-between items-center px-1">
        <span className={`text-[8px] font-bold tracking-tighter ${type === 'user' ? 'text-[#008F11]' : 'text-[#00FF41] matrix-text-glow'}`}>
          {label}
        </span>
        {isSpeaking && <div className={`w-1 h-1 rounded-full animate-pulse ${colorClass}`} />}
      </div>
      <div className="h-8 flex items-end justify-center gap-[2px]">
        {bars.map((height, i) => (
          <div
            key={i}
            className={`w-1 transition-all duration-75 ${colorClass} ${glowClass}`}
            style={{ height: `${height}%`, opacity: isSpeaking ? 0.8 : 0.2 }}
          />
        ))}
      </div>
    </div>
  );
};

export default AudioVisualizer;
