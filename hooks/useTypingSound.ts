import { useCallback, useRef } from 'react';

/**
 * Hook to play Matrix-style typing sounds
 * Uses Web Audio API to generate synthetic digital tick sounds
 */
export const useTypingSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayTimeRef = useRef<number>(0);

  // Initialize and resume audio context
  const getAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Resume if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    return audioContextRef.current;
  }, []);

  // Play a single Matrix-style tick sound
  const playTick = useCallback(async () => {
    try {
      const ctx = await getAudioContext();
      const now = ctx.currentTime;
      
      // Throttle to prevent too many sounds at once (min 20ms between ticks)
      if (now - lastPlayTimeRef.current < 0.02) return;
      lastPlayTimeRef.current = now;

      // Create oscillator for the "tick" - high frequency short burst
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      // Digital tick sound - square wave with high frequency
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(1200 + Math.random() * 600, now); // Randomize pitch
      
      // Quick attack and decay for that digital click - LOUDER
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 0.001); // Quick attack, higher volume
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.025); // Decay
      
      // Add a subtle filter for that CRT/digital feel
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1500, now);
      filter.Q.setValueAtTime(1, now);
      
      // Connect: oscillator -> filter -> gain -> output
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Play the sound
      oscillator.start(now);
      oscillator.stop(now + 0.03);
      
      // Cleanup
      oscillator.onended = () => {
        oscillator.disconnect();
        filter.disconnect();
        gainNode.disconnect();
      };
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }, [getAudioContext]);

  // Play typing sounds for a string (useful for animated text)
  const playForText = useCallback((text: string, intervalMs: number = 30) => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        if (text[index] !== ' ' && text[index] !== '\n') {
          playTick();
        }
        index++;
      } else {
        clearInterval(interval);
      }
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [playTick]);

  // Initialize audio on first user interaction
  const initAudio = useCallback(async () => {
    await getAudioContext();
  }, [getAudioContext]);

  return { playTick, playForText, initAudio };
};
