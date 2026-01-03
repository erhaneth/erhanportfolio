import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface VoiceButtonProps {
  isActive: boolean;
  onClick: () => void;
  userVolume?: number;  // 0-1
  aiVolume?: number;    // 0-1
  isAiTalking?: boolean;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ 
  isActive, 
  onClick, 
  userVolume = 0, 
  aiVolume = 0,
  isAiTalking = false 
}) => {
  const { translate } = useLanguage();
  const [bars, setBars] = useState([4, 8, 12, 8, 4]);

  // Determine current state
  const isUserSpeaking = isActive && userVolume > 0.05 && !isAiTalking;
  const isAiSpeaking = isActive && isAiTalking && aiVolume > 0.02;
  const currentVolume = isAiSpeaking ? aiVolume : userVolume;

  // Update bars based on audio
  useEffect(() => {
    if (!isActive) {
      setBars([4, 8, 12, 8, 4]); // Static waveform icon
      return;
    }

    const interval = setInterval(() => {
      if (isAiSpeaking) {
        // AI speaking - more dramatic, centered peaks
        const intensity = Math.max(0.3, aiVolume * 1.5);
        setBars([
          4 + Math.random() * 12 * intensity,
          8 + Math.random() * 16 * intensity,
          12 + Math.random() * 20 * intensity,
          8 + Math.random() * 16 * intensity,
          4 + Math.random() * 12 * intensity,
        ]);
      } else if (isUserSpeaking) {
        // User speaking - responsive to their volume
        const intensity = Math.max(0.2, userVolume);
        setBars([
          4 + Math.random() * 14 * intensity,
          6 + Math.random() * 18 * intensity,
          8 + Math.random() * 22 * intensity,
          6 + Math.random() * 18 * intensity,
          4 + Math.random() * 14 * intensity,
        ]);
      } else {
        // Idle listening - subtle pulse
        setBars([
          3 + Math.random() * 3,
          5 + Math.random() * 4,
          7 + Math.random() * 5,
          5 + Math.random() * 4,
          3 + Math.random() * 3,
        ]);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isActive, isUserSpeaking, isAiSpeaking, userVolume, aiVolume]);

  // Determine button state for styling
  const getStateStyles = () => {
    if (!isActive) {
      return {
        bg: 'bg-transparent',
        text: 'text-[#00FF41]',
        border: 'border-[#003B00] hover:border-[#00FF41]',
        barColor: 'bg-[#00FF41]',
        glow: 'hover:shadow-[0_0_15px_rgba(0,255,65,0.3)]'
      };
    }
    if (isAiSpeaking) {
      return {
        bg: 'bg-[#00FF41]',
        text: 'text-[#0d0208]',
        border: 'border-[#00FF41]',
        barColor: 'bg-[#0d0208]',
        glow: 'shadow-[0_0_30px_rgba(0,255,65,0.7)]'
      };
    }
    if (isUserSpeaking) {
      return {
        bg: 'bg-[#003B00]',
        text: 'text-[#00FF41]',
        border: 'border-[#00FF41]',
        barColor: 'bg-[#00FF41]',
        glow: 'shadow-[0_0_20px_rgba(0,255,65,0.5)]'
      };
    }
    // Active but idle
    return {
      bg: 'bg-[#0d0208]',
      text: 'text-[#00FF41]',
      border: 'border-[#00FF41]',
      barColor: 'bg-[#00FF41]',
      glow: 'shadow-[0_0_15px_rgba(0,255,65,0.4)]'
    };
  };

  const styles = getStateStyles();

  // Get label based on state
  const getLabel = () => {
    if (!isActive) return translate('voice.speak');
    if (isAiSpeaking) return translate('voice.processing');
    if (isUserSpeaking) return translate('voice.listening');
    return translate('voice.speak');
  };

  return (
    <button
      onClick={(e) => {
        // Ensure click event is properly handled for mobile
        e.preventDefault();
        e.stopPropagation();
        // Call onClick immediately to provide visual feedback
        onClick();
      }}
      onTouchEnd={(e) => {
        // Handle touch events for mobile - use onTouchEnd to ensure click fires
        e.preventDefault();
        onClick();
      }}
      className={`
        relative w-full py-3 sm:py-4 px-3 sm:px-4 border-2 font-bold transition-all duration-200
        flex items-center justify-center gap-2 sm:gap-4 group overflow-hidden
        touch-manipulation active:scale-95
        ${styles.bg} ${styles.text} ${styles.border} ${styles.glow}
      `}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      type="button"
    >
      {/* Scanning line effect when inactive */}
      {!isActive && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-[#00FF41]/50 to-transparent animate-scan" />
        </div>
      )}

      {/* Pulse effect when AI is speaking */}
      {isAiSpeaking && (
        <div className="absolute inset-0 bg-[#00FF41] animate-pulse opacity-20" />
      )}

      {/* Waveform Visualizer */}
      <div className="relative flex items-center gap-[3px] h-6">
        {bars.map((height, i) => (
          <div
            key={i}
            className={`w-[4px] rounded-full transition-all duration-75 ${styles.barColor}`}
            style={{ 
              height: `${Math.min(height, 28)}px`,
              opacity: isActive ? 1 : 0.7
            }}
          />
        ))}
      </div>

      {/* Label */}
      <span className="relative text-sm tracking-widest uppercase font-bold min-w-[100px]">
        {getLabel()}
      </span>

      {/* Status indicator dot */}
      {isActive && (
        <div className={`
          absolute top-2 right-2 w-2 h-2 rounded-full
          ${isAiSpeaking ? 'bg-[#0d0208]' : 'bg-[#00FF41]'}
          ${(isUserSpeaking || isAiSpeaking) ? 'animate-pulse' : ''}
        `} />
      )}

      {/* Corner accents */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 transition-colors ${isActive ? 'border-[#00FF41]' : 'border-[#00FF41]/50'}`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 transition-colors ${isActive ? 'border-[#00FF41]' : 'border-[#00FF41]/50'}`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 transition-colors ${isActive ? 'border-[#00FF41]' : 'border-[#00FF41]/50'}`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 transition-colors ${isActive ? 'border-[#00FF41]' : 'border-[#00FF41]/50'}`} />
    </button>
  );
};

export default VoiceButton;
