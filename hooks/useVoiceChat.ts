import { useState, useRef, useCallback, useEffect } from 'react';
import { Project } from '../types';
import { PORTFOLIO_DATA } from '../constants';
import { connectLive, decode, decodeAudioData } from '../services/geminiService';
import { logger } from '../utils/logger';

// Base64 encode helper
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface UseVoiceChatOptions {
  userContext: string;
  onProjectShow?: (project: Project) => void;
  onInputTranscript?: (text: string) => void;
  onOutputTranscript?: (text: string) => void;
  onTurnComplete?: () => void;
  onSystemMessage?: (content: string) => void;
  onResumeRequest?: () => void;
}

interface UseVoiceChatReturn {
  isVoiceEnabled: boolean;
  isAiTalking: boolean;
  userVolume: number;
  aiVolume: number;
  startVoiceChat: () => Promise<void>;
  stopVoiceChat: () => void;
  toggleVoice: () => void;
}

export const useVoiceChat = (options: UseVoiceChatOptions): UseVoiceChatReturn => {
  const {
    userContext,
    onProjectShow,
    onInputTranscript,
    onOutputTranscript,
    onTurnComplete,
    onSystemMessage,
    onResumeRequest
  } = options;

  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [userVolume, setUserVolume] = useState(0);
  const [aiVolume, setAiVolume] = useState(0);

  // Refs for audio handling
  const sessionRef = useRef<any>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Analyser refs
  const userAnalyserRef = useRef<AnalyserNode | null>(null);
  const aiAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stopVoiceChat = useCallback(() => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Clear session
    if (sessionRef.current) {
      sessionRef.current = null;
    }

    // Disconnect worklet
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    // Stop mic stream
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    // Stop all playing audio sources
    for (const source of sourcesRef.current) {
      try {
        source.stop();
      } catch (e) {
        // Source may already be stopped
      }
    }
    sourcesRef.current.clear();

    // Close audio contexts
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }

    // Reset state
    setIsVoiceEnabled(false);
    setIsAiTalking(false);
    setUserVolume(0);
    setAiVolume(0);
  }, []);

  const startVoiceChat = useCallback(async () => {
    logger.debug('startVoiceChat called');
    
    // Defer heavy initialization to next event loop to avoid blocking typewriter animation
    await new Promise(resolve => setTimeout(resolve, 0));
    
    try {
      // Request microphone access
      logger.debug('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      logger.debug('Microphone access granted');
      micStreamRef.current = stream;

      // Create audio contexts (defer to avoid blocking)
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });
      
      // Resume audio contexts if suspended (browser autoplay policy)
      if (inputCtx.state === 'suspended') {
        await inputCtx.resume();
      }
      if (outputCtx.state === 'suspended') {
        await outputCtx.resume();
      }
      
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;

      // Setup user mic analyser
      const userAnalyser = inputCtx.createAnalyser();
      userAnalyser.fftSize = 256;
      userAnalyserRef.current = userAnalyser;

      // Setup AI output analyser
      const aiAnalyser = outputCtx.createAnalyser();
      aiAnalyser.fftSize = 256;
      aiAnalyserRef.current = aiAnalyser;
      aiAnalyser.connect(outputCtx.destination);

      // Volume monitoring animation loop
      const userDataArray = new Uint8Array(userAnalyser.frequencyBinCount);
      const aiDataArray = new Uint8Array(aiAnalyser.frequencyBinCount);

      const updateVolumes = () => {
        if (userAnalyserRef.current) {
          userAnalyserRef.current.getByteFrequencyData(userDataArray);
          const userSum = userDataArray.reduce((a, b) => a + b, 0);
          const userAvg = userSum / userDataArray.length;
          setUserVolume(userAvg / 128);
        }

        if (aiAnalyserRef.current) {
          aiAnalyserRef.current.getByteFrequencyData(aiDataArray);
          const aiSum = aiDataArray.reduce((a, b) => a + b, 0);
          const aiAvg = aiSum / aiDataArray.length;
          setAiVolume(aiAvg / 128);
        }

        animationFrameRef.current = requestAnimationFrame(updateVolumes);
      };
      updateVolumes();

      // Connect to Gemini Live API
      const sessionPromise = connectLive({
        onOpen: async () => {
          const source = inputCtx.createMediaStreamSource(stream);
          source.connect(userAnalyser);

          // Try to use AudioWorklet, fall back to ScriptProcessor
          try {
            await inputCtx.audioWorklet.addModule('/worklets/audioProcessor.js');
            
            const workletNode = new AudioWorkletNode(inputCtx, 'audio-capture-processor');
            workletNodeRef.current = workletNode;

            workletNode.port.onmessage = (event) => {
              if (event.data.type === 'pcm') {
                const pcmData = new Uint8Array(event.data.data);
                const base64Data = encode(pcmData);
                
                sessionPromise.then(session => {
                  if (session) {
                    session.sendRealtimeInput({
                      media: {
                        data: base64Data,
                        mimeType: 'audio/pcm;rate=16000'
                      }
                    });
                  }
                });
              }
            };

            source.connect(workletNode);
            workletNode.connect(inputCtx.destination);
          } catch (workletError) {
            // Fallback to deprecated ScriptProcessor for browsers without AudioWorklet support
            logger.warn('AudioWorklet not supported, falling back to ScriptProcessor:', workletError);
            
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              
              const base64Data = encode(new Uint8Array(int16.buffer));
              
              sessionPromise.then(session => {
                if (session) {
                  session.sendRealtimeInput({
                    media: {
                      data: base64Data,
                      mimeType: 'audio/pcm;rate=16000'
                    }
                  });
                }
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          }

          onSystemMessage?.("[VOICE_LINK_ESTABLISHED]: Listening for audio input...");
        },

        onMessage: async (message: any) => {
          // Handle audio output
          const audioBase64 = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioBase64 && outputAudioCtxRef.current && aiAnalyserRef.current) {
            setIsAiTalking(true);
            
            const buffer = await decodeAudioData(
              decode(audioBase64),
              outputAudioCtxRef.current,
              24000,
              1
            );
            
            const audioSource = outputAudioCtxRef.current.createBufferSource();
            audioSource.buffer = buffer;
            audioSource.connect(aiAnalyserRef.current);

            const now = outputAudioCtxRef.current.currentTime;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
            audioSource.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;

            sourcesRef.current.add(audioSource);
            audioSource.onended = () => {
              sourcesRef.current.delete(audioSource);
              if (sourcesRef.current.size === 0) {
                setIsAiTalking(false);
              }
            };
          }

          // Handle interruption
          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => {
              try { s.stop(); } catch (e) {}
            });
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
            setIsAiTalking(false);
          }

          // Handle transcripts
          const inputTranscript = message.serverContent?.inputTranscription?.text;
          const outputTranscript = message.serverContent?.outputTranscription?.text;

          if (inputTranscript) {
            onInputTranscript?.(inputTranscript);
          }

          if (outputTranscript) {
            onOutputTranscript?.(outputTranscript);
          }

          // Handle turn complete
          if (message.serverContent?.turnComplete) {
            onTurnComplete?.();
          }

          // Handle tool calls
          if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
              if (fc.name === 'showProject') {
                const project = PORTFOLIO_DATA.projects.find(
                  p => p.id === fc.args.projectId
                );
                if (project) {
                  onProjectShow?.(project);
                }
                sessionPromise.then(s =>
                  s.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: "Project displayed successfully." }
                    }
                  })
                );
              } else if (fc.name === 'requestResumeEmail') {
                // Trigger email modal
                if (onResumeRequest) {
                  onResumeRequest();
                }
                sessionPromise.then(s =>
                  s.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: "Email request initiated." }
                    }
                  })
                );
              }
            }
          }
        },

        onClose: () => stopVoiceChat(),
        onError: (e: any) => {
          logger.error('Voice chat error:', e);
          stopVoiceChat();
        }
      }, userContext);

      sessionRef.current = sessionPromise;
      setIsVoiceEnabled(true);
    } catch (err: any) {
      logger.error("Microphone access denied or error:", err);
      setIsVoiceEnabled(false);
      
      // Show user-friendly error message
      const errorMessage = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? "[ERROR]: Microphone access denied. Please allow microphone access and try again."
        : err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError'
        ? "[ERROR]: No microphone found. Please connect a microphone and try again."
        : `[ERROR]: Failed to start voice chat: ${err.message || 'Unknown error'}`;
      
      onSystemMessage?.(errorMessage);
    }
  }, [userContext, onProjectShow, onInputTranscript, onOutputTranscript, onTurnComplete, onSystemMessage, stopVoiceChat]);

  const toggleVoice = useCallback(() => {
    logger.debug('toggleVoice called, isVoiceEnabled:', isVoiceEnabled);
    if (isVoiceEnabled) {
      stopVoiceChat();
    } else {
      logger.debug('Starting voice chat...');
      startVoiceChat().catch((err) => {
        logger.error('Error in startVoiceChat:', err);
      });
    }
  }, [isVoiceEnabled, startVoiceChat, stopVoiceChat]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      stopVoiceChat();
    };
  }, [stopVoiceChat]);

  return {
    isVoiceEnabled,
    isAiTalking,
    userVolume,
    aiVolume,
    startVoiceChat,
    stopVoiceChat,
    toggleVoice
  };
};


