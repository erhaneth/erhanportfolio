import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface TypewriterMarkdownProps {
  text: string;
  speed?: number; // ms per character
  onComplete?: () => void;
  playSound?: () => void;
  className?: string;
}

const TypewriterMarkdown: React.FC<TypewriterMarkdownProps> = ({
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
    <div className={className}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-[#00FF41]">{children}</strong>,
          em: ({ children }) => <em className="italic text-[#008F11]">{children}</em>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 ml-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 ml-4">{children}</ol>,
          li: ({ children }) => <li className="ml-2">{children}</li>,
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-[#003B00]/50 px-1.5 py-0.5 rounded text-[#008F11] font-mono text-xs">
                {children}
              </code>
            ) : (
              <code className="block bg-[#003B00]/50 p-3 rounded text-[#008F11] font-mono text-xs overflow-x-auto mb-3">
                {children}
              </code>
            );
          },
          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-4 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#00FF41]/40 pl-4 my-3 italic text-[#008F11]">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-[#003B00]" />,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#008F11] hover:text-[#00FF41] underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {displayedText}
      </ReactMarkdown>
      {!isComplete && <span className="animate-pulse">▊</span>}
    </div>
  );
};

export default TypewriterMarkdown;

