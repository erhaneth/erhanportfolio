import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number; // ms per character
  onComplete?: () => void;
  playSound?: () => void;
  className?: string;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 20,
  onComplete,
  playSound,
  className = '',
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const previousTextRef = useRef('');

  // Reset when text changes completely (new message)
  useEffect(() => {
    // If text is completely different (new message), reset
    if (!text.startsWith(previousTextRef.current) || previousTextRef.current === '') {
      indexRef.current = 0;
      setDisplayedText('');
      setIsComplete(false);
    }
    previousTextRef.current = text;
  }, [text]);

  useEffect(() => {
    if (isComplete || indexRef.current >= text.length) {
      if (!isComplete && indexRef.current >= text.length) {
        setIsComplete(true);
        onComplete?.();
      }
      return;
    }

    // Use requestAnimationFrame for better performance and to avoid blocking
    // This ensures smooth animation even when heavy operations (like voice chat) are running
    let lastTime = performance.now();
    let frameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - lastTime;
      
      if (elapsed >= speed) {
        const nextChar = text[indexRef.current];
        
        // Play sound for non-whitespace characters
        if (nextChar && nextChar !== ' ' && nextChar !== '\n' && playSound) {
          playSound?.();
        }
        
        indexRef.current++;
        setDisplayedText(text.slice(0, indexRef.current));
        lastTime = currentTime;
        
        if (indexRef.current >= text.length) {
          setIsComplete(true);
          onComplete?.();
          return;
        }
      }
      
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [text, speed, onComplete, playSound, isComplete]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && <span className="animate-pulse">▊</span>}
    </span>
  );
};

export default TypewriterText;

