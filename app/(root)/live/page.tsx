/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, decodeAudioData, createPcmBlob } from '@/services/audioUtils';
import { LiveMindSettings, SessionStatus, SystemInstruction00, Transcription } from '@/types';
import NoHasKey from '@/components/NoHasKey';
import Header from '@/components/Header';
import ErrorBanner from '@/components/ErrorBanner';
import SettingsPanel from '@/components/SettingsPanel';
import DesktopIndicator from '@/components/DesktopIndicator';
import TranscriptionList from '@/components/TranscriptionList';
import config from '@/lib/config';
import { useUser } from '@clerk/nextjs';
import { getClientData } from '@/lib/clientInfo';
import { getDeviceIdentity } from '@/lib/identity';

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';
const SAMPLE_RATE_IN = 16000;
const SAMPLE_RATE_OUT = 24000;
const FRAME_RATE = 1;
const SYSTEMINSTRUCTION = SystemInstruction00;

const Live = () => {
  // ... existing state ...
  const [status, setStatus] = useState<SessionStatus>(SessionStatus.IDLE);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [history, setHistory] = useState<Transcription[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');
  const [settings, setSettings] = useState<LiveMindSettings>({ isCameraEnabled: true, isMicEnabled: true, voiceName: 'Zephyr' });
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  let user_id = user?.id;  
  if (!user_id) user_id="authenticated_users00001";
  // ... existing refs ...
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const frameIntervalRef = useRef<number | null>(null);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  // 1. NEW: Ref to store the PostgreSQL Session ID
  const dbSessionIdRef = useRef<string | null>(null);

  // ... handleOpenSelectKey ... 
  const handleOpenSelectKey = async () => {
    await (window as any).aistudio.openSelectKey();
    setHasKey(true);
  };

  // 2. MODIFIED: Stop Session triggers DB update
  const stopSession = useCallback(async () => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextInRef.current) audioContextInRef.current.close();
    if (audioContextOutRef.current) audioContextOutRef.current.close();
    if (sessionPromiseRef.current) sessionPromiseRef.current.then(session => session.close()).catch(() => {});

    // DB: Close the session in Postgres
    if (dbSessionIdRef.current) {
        try {
            await fetch('/api/live/session', {
                method: 'PUT',
                body: JSON.stringify({ id: dbSessionIdRef.current, status: 'completed' })
            });
        } catch (e) { console.error("Failed to close DB session", e); }
        dbSessionIdRef.current = null;
    }

    setStatus(SessionStatus.IDLE);
    setHistory([]);
    setCurrentInput('');
    setCurrentOutput('');
    setError(null);
  }, []);

  // Helper to save messages to DB (Fire and Forget)
  const saveMessageToDb = async (sender: 'user' | 'model', text: string) => {
    if (!dbSessionIdRef.current || !text) return;
    fetch('/api/live/message', {
        method: 'POST',
        body: JSON.stringify({
            sessionId: dbSessionIdRef.current,
            sender,
            text
        })
    }).catch(e => console.error("DB Save Failed", e));
  };

  const startSession = async () => {
    try {
      setStatus(SessionStatus.CONNECTING);
      setError(null); 

       // --- 1. NEW: Gather Client Data before starting ---
      const clientData = await getClientData();
      // --------------------------------------------------
      // 2. Get Persistent Identity (Unique ID)
      const identity = getDeviceIdentity(); 

      const ai = new GoogleGenAI({ apiKey: config.env.gemini_Api_Key || "your_key_here"});
      
      // ... Audio Context Setup (same as before) ...
      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE_IN });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE_OUT });
      const outputNode = audioContextOutRef.current.createGain();
      outputNode.connect(audioContextOutRef.current.destination);

      const constraints = {
        audio: true,
        video: settings.isCameraEnabled ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current && settings.isCameraEnabled) {
        videoRef.current.srcObject = stream;
      }

      sessionPromiseRef.current = ai.live.connect({
        model: MODEL_NAME,
        callbacks: {
          onopen: async () => {
            setStatus(SessionStatus.ACTIVE);
            
            // 3. NEW: Create Session in DB on Open
            try {              
                const res = await fetch('/api/live/session', {
                    method: 'POST',
                    body: JSON.stringify({ modelName: MODEL_NAME, user_id: user_id,
                      // Identification Data
                        client_identifier: identity.clientId, // UUID
                      // Pass gathered info:
                        latitude: clientData.latitude,
                        longitude: clientData.longitude,
                        device_type: clientData.device_type,
                        screen_res: clientData.screen_res
                     })
                });
                const data = await res.json();
                dbSessionIdRef.current = data.id;
            } catch (e) { console.error("Failed to init DB session", e); }

            // ... Audio/Video Processor Setup (same as before) ...
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!settings.isMicEnabled) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromiseRef.current?.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);

            if (settings.isCameraEnabled && canvasRef.current && videoRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              frameIntervalRef.current = window.setInterval(() => {
                if (!canvasRef.current || !videoRef.current || !ctx) return;
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                ctx.drawImage(videoRef.current, 0, 0);
                canvasRef.current.toBlob(async (blob) => {
                  if (blob) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64Data = (reader.result as string).split(',')[1];
                      sessionPromiseRef.current?.then(session => {
                        session.sendRealtimeInput({
                          media: { data: base64Data, mimeType: 'image/jpeg' }
                        });
                      });
                    };
                    reader.readAsDataURL(blob);
                  }
                }, 'image/jpeg', 0.5);
              }, 1000 / FRAME_RATE);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // ... Transcription Accumulation ...
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
              setCurrentOutput(currentOutputTranscriptionRef.current);
            } else if (message.serverContent?.inputTranscription) {
              currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
              setCurrentInput(currentInputTranscriptionRef.current);
            }

            // 4. MODIFIED: Save to DB when turn completes
            if (message.serverContent?.turnComplete) {
              const newEntries: Transcription[] = [];
              
              if (currentInputTranscriptionRef.current) {
                const text = currentInputTranscriptionRef.current;
                newEntries.push({
                  id: Math.random().toString(36),
                  sender: 'user',
                  text: text,
                  timestamp: new Date()
                });
                // DB Call
                saveMessageToDb('user', text);
              }

              if (currentOutputTranscriptionRef.current) {
                const text = currentOutputTranscriptionRef.current;
                newEntries.push({
                  id: Math.random().toString(36),
                  sender: 'model',
                  text: text,
                  timestamp: new Date()
                });
                // DB Call
                saveMessageToDb('model', text);
              }

              setHistory(prev => [...prev, ...newEntries]);
              currentInputTranscriptionRef.current = '';
              currentOutputTranscriptionRef.current = '';
              setCurrentInput('');
              setCurrentOutput('');
            }

            // ... Audio Playback Logic (same as before) ...
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextOutRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextOutRef.current.currentTime);
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                audioContextOutRef.current,
                SAMPLE_RATE_OUT,
                1
              );
              const source = audioContextOutRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            
            // ... Interruption Logic ...
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(source => {
                try { source.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: { message: string; }) => {
            // 5. NEW: Log error to DB session
            if (dbSessionIdRef.current) {
                 fetch('/api/live/session', {
                    method: 'PUT',
                    body: JSON.stringify({ id: dbSessionIdRef.current, status: 'error' })
                }).catch(() => {});
            }
            console.error('Session Error:', e);
            // ... rest of error handling ...
            const msg = e.message || '';
            if (msg.includes('Requested entity was not found') || msg.includes('Network error')) {
              setError('Session interrupted. Ensure your API key is correct and has billing enabled.');
              setHasKey(false);
            } else {
              setError('Connection lost. Please check your network and try again.');
            }
            setStatus(SessionStatus.ERROR);
            stopSession();
          },
          onclose: () => {
            setStatus(SessionStatus.IDLE);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.voiceName } },
          },
          systemInstruction: SYSTEMINSTRUCTION,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        }
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to start session.');
      setStatus(SessionStatus.IDLE);
    }
  };

  if (hasKey === false) return ( <NoHasKey handleOpenSelectKey={handleOpenSelectKey}/> );  

  // ... Return JSX (same as before) ...
  return (
    <div className="h-dvh bg-linear-to-br from-slate-900 via-black-900 to-slate-900 flex flex-col p-3 md:p-6 lg:p-8 overflow-hidden"
    style={{
    backgroundImage: "url('/home2.png')"}}
    >
        {/* ... JSX Content ... */}
        <Header/>      
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
        <main className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden">
             {/* ... Left Panel ... */}
            <div className="shrink-0 w-full lg:w-80 flex flex-col space-y-4 max-h-screen overflow-y-auto">
                 {/* Video, Settings, etc */}
                 <div className="glass rounded-2xl aspect-video lg:aspect-square overflow-hidden relative border-indigo-500/20 shrink-0">
                    <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${settings.isCameraEnabled ? 'opacity-100' : 'opacity-0'}`} />
                    {/* --- NEW: ANALYSIS HUD OVERLAY --- */}
    {status === SessionStatus.ACTIVE && settings.isCameraEnabled && (
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 bg-linear-to-b from-black/40 via-transparent to-black/60">
        
        {/* Top: Status Badge */}
        <div className="flex justify-between items-start">
           <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-indigo-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] font-bold text-indigo-300 tracking-widest">LIVE ANALYSIS</span>
           </div>
        </div>

        {/* Bottom: Live Analysis Text Stream */}
        <div className="space-y-2">
           {/* Show what the model is currently saying/thinking */}
           {currentOutput && (
             <div className="bg-black/70 backdrop-blur-md border-l-2 border-indigo-500 pl-3 py-2 pr-2 rounded-r-lg">
                <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Detected:</p>
                <p className="text-sm text-white leading-snug animate-in fade-in slide-in-from-bottom-2">
                  {currentOutput}
                </p>
             </div>
           )}
           
           {!currentOutput && (
             <p className="text-[10px] text-white/50 text-center uppercase tracking-widest animate-pulse">
               Scanning visual feed...
             </p>
           )}
        </div>
      </div>
    )}
    {/* --- END HUD OVERLAY --- */}
{/* Existing Camera Off State */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {!settings.isCameraEnabled && (
        <div className="text-slate-500 flex flex-col items-center">
          {/* ... existing SVG ... */}
          <p className="text-[10px] uppercase font-bold tracking-widest">Camera Off</p>
        </div>
      )}
    </div>
                    
                 </div>

                  

                 <div className="hidden lg:block">
                     <SettingsPanel settings={settings} onUpdate={(u) => setSettings(s => ({ ...s, ...u }))} disabled={status !== SessionStatus.IDLE} />
                 </div>          
                 <DesktopIndicator status={status} />
            </div>

            {/* ... Right Panel ... */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <TranscriptionList history={history} currentInput={currentInput} currentOutput={currentOutput} status={status} onStart={startSession} onStop={stopSession} />
            </div>

            {/* ... Mobile Controls ... */}
            <div className="lg:hidden shrink-0 flex gap-2">
                 <button onClick={() => setSettings(s => ({...s, isCameraEnabled: !s.isCameraEnabled}))} disabled={status !== SessionStatus.IDLE} className="flex-1 py-2 rounded-xl text-[10px] font-bold border transition-colors bg-slate-800 text-slate-500 border-slate-700">CAM</button>
                 <button onClick={() => setSettings(s => ({...s, isMicEnabled: !s.isMicEnabled}))} className="flex-1 py-2 rounded-xl text-[10px] font-bold border transition-colors bg-slate-800 text-slate-500 border-slate-700">MIC</button>
            </div>
        </main>
        <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default Live;