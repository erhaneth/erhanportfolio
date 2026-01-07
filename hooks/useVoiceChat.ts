import { useState, useRef, useCallback, useEffect } from "react";
import { Project } from "../types";
import { PORTFOLIO_DATA } from "../constants";
import {
  connectLive,
  decode,
  decodeAudioData,
} from "../services/geminiService";

// Base64 encode helper
function encode(bytes: Uint8Array): string {
  let binary = "";
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
  onShowGitHeatmap?: () => void;
  onCloseDisplay?: (target: "project" | "heatmap" | "all") => void;
}

interface UseVoiceChatReturn {
  isVoiceEnabled: boolean;
  isConnecting: boolean;
  isAiTalking: boolean;
  userVolume: number;
  aiVolume: number;
  startVoiceChat: () => Promise<void>;
  stopVoiceChat: () => void;
  toggleVoice: () => void;
}

export const useVoiceChat = (
  options: UseVoiceChatOptions
): UseVoiceChatReturn => {
  const {
    userContext,
    onProjectShow,
    onInputTranscript,
    onOutputTranscript,
    onTurnComplete,
    onSystemMessage,
    onResumeRequest,
    onShowGitHeatmap,
    onCloseDisplay,
  } = options;

  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
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
      micStreamRef.current.getTracks().forEach((track) => track.stop());
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
    if (
      inputAudioCtxRef.current &&
      inputAudioCtxRef.current.state !== "closed"
    ) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (
      outputAudioCtxRef.current &&
      outputAudioCtxRef.current.state !== "closed"
    ) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }

    // Reset state
    setIsVoiceEnabled(false);
    setIsConnecting(false);
    setIsAiTalking(false);
    setUserVolume(0);
    setAiVolume(0);
  }, []);

  const startVoiceChat = useCallback(async () => {
    console.log("startVoiceChat called");
    setIsConnecting(true);

    // Defer heavy initialization to next event loop to avoid blocking typewriter animation
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia is not supported in this browser");
      }

      // Request microphone access with better error handling for mobile
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });
      console.log("Microphone access granted");
      micStreamRef.current = stream;

      // Create audio contexts (defer to avoid blocking)
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Check if AudioContext is available
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("AudioContext is not supported in this browser");
      }

      const inputCtx = new AudioContextClass({
        sampleRate: 16000,
      });
      const outputCtx = new AudioContextClass({
        sampleRate: 24000,
      });

      // Resume audio contexts if suspended (browser autoplay policy)
      // This is critical on mobile - must be called after user interaction
      if (inputCtx.state === "suspended") {
        console.log("Resuming input audio context...");
        await inputCtx.resume();
      }
      if (outputCtx.state === "suspended") {
        console.log("Resuming output audio context...");
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
      const sessionPromise = connectLive(
        {
          onOpen: async () => {
            const source = inputCtx.createMediaStreamSource(stream);
            source.connect(userAnalyser);

            // Try to use AudioWorklet, fall back to ScriptProcessor
            try {
              // Determine the correct path for the worklet
              // Use base URL to handle different deployment scenarios
              const baseUrl = window.location.origin;
              const workletPath = `${baseUrl}/worklets/audioProcessor.js`;

              console.log("Loading AudioWorklet from:", workletPath);

              // On mobile, AudioWorklet may need additional time to load
              try {
                await Promise.race([
                  inputCtx.audioWorklet.addModule(workletPath),
                  new Promise<never>((_, reject) =>
                    setTimeout(
                      () => reject(new Error("AudioWorklet load timeout")),
                      5000
                    )
                  ),
                ]);
              } catch (loadError) {
                // If absolute path fails, try relative path
                console.warn(
                  "Failed to load with absolute path, trying relative:",
                  loadError
                );
                await inputCtx.audioWorklet.addModule(
                  "/worklets/audioProcessor.js"
                );
              }

              const workletNode = new AudioWorkletNode(
                inputCtx,
                "audio-capture-processor"
              );
              workletNodeRef.current = workletNode;

              workletNode.port.onmessage = (event) => {
                if (event.data.type === "pcm") {
                  const pcmData = new Uint8Array(event.data.data);
                  const base64Data = encode(pcmData);

                  sessionPromise.then((session) => {
                    if (session) {
                      session.sendRealtimeInput({
                        media: {
                          data: base64Data,
                          mimeType: "audio/pcm;rate=16000",
                        },
                      });
                    }
                  });
                }
              };

              source.connect(workletNode);
              workletNode.connect(inputCtx.destination);
            } catch (workletError) {
              // Fallback to deprecated ScriptProcessor for browsers without AudioWorklet support
              console.warn(
                "AudioWorklet not supported, falling back to ScriptProcessor:",
                workletError
              );

              const processor = inputCtx.createScriptProcessor(4096, 1, 1);

              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);

                for (let i = 0; i < inputData.length; i++) {
                  const s = Math.max(-1, Math.min(1, inputData[i]));
                  int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
                }

                const base64Data = encode(new Uint8Array(int16.buffer));

                sessionPromise.then((session) => {
                  if (session) {
                    session.sendRealtimeInput({
                      media: {
                        data: base64Data,
                        mimeType: "audio/pcm;rate=16000",
                      },
                    });
                  }
                });
              };

              source.connect(processor);
              processor.connect(inputCtx.destination);
            }

            onSystemMessage?.(
              "[VOICE_LINK_ESTABLISHED]: Listening for audio input..."
            );
            setIsConnecting(false);
          },

          onMessage: async (message: any) => {
            // Handle audio output
            const audioBase64 =
              message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (
              audioBase64 &&
              outputAudioCtxRef.current &&
              aiAnalyserRef.current
            ) {
              setIsAiTalking(true);

              const buffer = await decodeAudioData(
                decode(audioBase64),
                outputAudioCtxRef.current,
                24000,
                1
              );

              const audioSource =
                outputAudioCtxRef.current.createBufferSource();
              audioSource.buffer = buffer;
              audioSource.connect(aiAnalyserRef.current);

              const now = outputAudioCtxRef.current.currentTime;
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                now
              );
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
              sourcesRef.current.forEach((s) => {
                try {
                  s.stop();
                } catch (e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsAiTalking(false);
            }

            // Handle transcripts
            const inputTranscript =
              message.serverContent?.inputTranscription?.text;
            const outputTranscript =
              message.serverContent?.outputTranscription?.text;

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
                if (fc.name === "showProject") {
                  const project = PORTFOLIO_DATA.projects.find(
                    (p) => p.id === fc.args.projectId
                  );
                  if (project) {
                    onProjectShow?.(project);
                  }
                  sessionPromise.then((s) =>
                    s.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result: "Project displayed successfully." },
                      },
                    })
                  );
                } else if (fc.name === "requestResumeEmail") {
                  // Trigger email modal
                  if (onResumeRequest) {
                    onResumeRequest();
                  }
                  sessionPromise.then((s) =>
                    s.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result: "Email request initiated." },
                      },
                    })
                  );
                } else if (fc.name === "showGitHeatmap") {
                  // Show git heatmap
                  if (onShowGitHeatmap) {
                    onShowGitHeatmap();
                  }
                  sessionPromise.then((s) =>
                    s.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: {
                          result: "Git heatmap displayed successfully.",
                        },
                      },
                    })
                  );
                } else if (fc.name === "closeDisplay") {
                  // Close displayed panel
                  if (onCloseDisplay) {
                    const target = fc.args?.target || "all";
                    onCloseDisplay(target as "project" | "heatmap" | "all");
                  }
                  sessionPromise.then((s) =>
                    s.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: {
                          result: "Display closed successfully.",
                        },
                      },
                    })
                  );
                }
              }
            }
          },

          onClose: () => stopVoiceChat(),
          onError: (e: any) => {
            console.error("Voice chat error:", e);
            stopVoiceChat();
          },
        },
        userContext
      );

      sessionRef.current = sessionPromise;
      setIsVoiceEnabled(true);
    } catch (err: any) {
      console.error("Microphone access denied or error:", err);
      setIsVoiceEnabled(false);
      setIsConnecting(false);

      // Show user-friendly error message with mobile-specific guidance
      let errorMessage = "";

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        errorMessage =
          "[ERROR]: Microphone access denied. On mobile, please:\n1. Tap 'Allow' when prompted\n2. Check browser settings if permission was blocked\n3. Try refreshing the page";
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        errorMessage =
          "[ERROR]: No microphone found. Please connect a microphone and try again.";
      } else if (err.name === "NotSupportedError") {
        errorMessage =
          "[ERROR]: Audio features not supported. Please use a modern browser (Chrome, Firefox, Safari).";
      } else if (err.message?.includes("AudioContext")) {
        errorMessage =
          "[ERROR]: Audio not supported. On mobile, ensure you're using a supported browser and tap the button again.";
      } else {
        errorMessage = `[ERROR]: Failed to start voice chat: ${
          err.message || "Unknown error"
        }\n\nOn mobile devices, ensure:\n- You're using Chrome, Firefox, or Safari\n- Microphone permissions are granted\n- You tap the button directly (not through a keyboard shortcut)`;
      }

      onSystemMessage?.(errorMessage);
    }
  }, [
    userContext,
    onProjectShow,
    onInputTranscript,
    onOutputTranscript,
    onTurnComplete,
    onSystemMessage,
    onResumeRequest,
    onShowGitHeatmap,
    stopVoiceChat,
  ]);

  const toggleVoice = useCallback(() => {
    console.log("toggleVoice called, isVoiceEnabled:", isVoiceEnabled);
    if (isVoiceEnabled) {
      stopVoiceChat();
    } else {
      // Set state immediately for visual feedback, especially on mobile
      setIsVoiceEnabled(true);
      console.log("Starting voice chat...");
      startVoiceChat().catch((err) => {
        console.error("Error in startVoiceChat:", err);
        // Reset state on error
        setIsVoiceEnabled(false);
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
    isConnecting,
    isAiTalking,
    userVolume,
    aiVolume,
    startVoiceChat,
    stopVoiceChat,
    toggleVoice,
  };
};
