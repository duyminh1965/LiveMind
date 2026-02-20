"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Zap, Activity, AlertTriangle, CheckCircle } from "lucide-react";

// Types for our AI response
type LiveMindResponse = {
  status: "Neutral" | "Warning" | "Success";
  analysis: string;
  reasoning: string;
  action: string;
};

export default function LiveMindHUD() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isLive, setIsLive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [data, setData] = useState<LiveMindResponse | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  // 1. Initialize Camera 
  const startCamera = async () => {
  try {
    if (!videoRef.current) return;

    // 🔐 iOS requires explicit user gesture + clean state
    videoRef.current.setAttribute("playsinline", "true");
    videoRef.current.muted = true;

    // Stop existing stream if any (important on mobile)
    if (videoRef.current.srcObject) {
      const oldStream = videoRef.current.srcObject as MediaStream;
      oldStream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    // 📱 Mobile-optimized constraints
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: "environment" }, // rear cam
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 30 }
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Attach stream
    videoRef.current.srcObject = stream;

    // iOS Safari requires explicit play()
    await videoRef.current.play();

    // 🔓 Wake lock (keeps screen on after unlock)
    if ("wakeLock" in navigator) {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await navigator.wakeLock.request("screen");
      } catch {
        // Ignore if not supported
      }
    }

    setIsLive(true);

  } catch (err) {
    console.error("Camera access failed", err);
    alert("Camera access is required. Please unlock your device and allow camera permissions.");
  }
};

  //Add Stop
  const stopCamera = useCallback(() => {
  // Stop video tracks
  const video = videoRef.current;
  if (video && video.srcObject) {
    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }

  // Cancel speech immediately
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  // Reset states
  setIsLive(false);
  setIsThinking(false);
  setData(null);
  setHistory([]);

}, []);


  //end Stop
  // 2. The Core Loop: Capture -> Send -> Speak
  const analyzeFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isLive) return;

    setIsThinking(true);

    // Draw video frame to canvas
    const context = canvasRef.current.getContext("2d");
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      const imageBase64 = canvasRef.current.toDataURL("image/jpeg", 0.7);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          body: JSON.stringify({ image: imageBase64 }),
        });
        const result: LiveMindResponse = await res.json();
        
        setData(result);
        setHistory((prev) => [result.action, ...prev].slice(0, 3)); // Keep last 3 actions

        // Text-to-Speech (The "Voice" of the AI)
        if (result.status === "Warning") {
          speak(result.action, true); // Urgent voice
        } else {
          speak(result.action, false);
        }

      } catch (err) {
        console.error("AI Error", err);
      } finally {
        setIsThinking(false);
      }
    }
  }, [isLive]);

  // 3. Loop Interval (Every 3 seconds to prevent rate limits/chaos)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(analyzeFrame, 3000);
    }
    return () => clearInterval(interval);
  }, [isLive, analyzeFrame]);

  
  // Helper: TTS
  const speak = (text: string, urgent: boolean) => {
    if (!window.speechSynthesis) return;
    // Prevent overlapping speech
    if (window.speechSynthesis.speaking) return; 

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1; // Slightly faster for efficiency
    utterance.pitch = urgent ? 1.2 : 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // UI Helpers
  const getStatusColor = (status?: string) => {
    switch(status) {
      case "Warning": return "text-red-500 border-red-500 bg-red-500/10";
      case "Success": return "text-green-500 border-green-500 bg-green-500/10";
      default: return "text-cyan-400 border-cyan-400 bg-cyan-400/10";
    }
  };

  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden font-mono text-cyan-400 selection:bg-cyan-900">
      
      {/* --- VIDEO LAYER --- */}
      {/* <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      />
      <canvas ref={canvasRef} className="hidden" /> */}

      <video
  ref={videoRef}
  autoPlay
  playsInline
  muted
  className="w-full h-full object-cover"
/>


      {/* --- HUD OVERLAY --- */}
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start bg-linear-to-b from-black/80 to-transparent z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-widest flex items-center gap-2">
            <Zap className="w-6 h-6 animate-pulse" /> LIVEMIND <span className="text-xs bg-cyan-900 px-2 py-1 rounded">GEMINI 3 API</span>
          </h1>
          <p className="text-xs text-cyan-400/60 mt-1">LATENCY: LOW // MODE: REASONING</p>
        </div>
        
        {/* Start Button */}
        {!isLive && (
          <button 
            onClick={startCamera}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded uppercase tracking-wider transition-all"
          >
            <Camera className="w-5 h-5" /> Initialize System
          </button>
        )}

        {isLive && (
          <button
            onClick={stopCamera}
            className="flex items-center gap-2 px-5 py-2 border border-red-500 text-red-400 hover:bg-red-500/20 rounded uppercase tracking-wider transition-all"
          >
          <AlertTriangle className="w-4 h-4" /> Shutdown
          </button>
        )}
      </div>

      {/* Central Targeting Reticle (Decorative) */}
      {isLive && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
           <div className={`w-75 h-75 border border-cyan-400/30 rounded-full flex items-center justify-center ${isThinking ? 'animate-ping opacity-20' : 'opacity-50'}`}>
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
           </div>
        </div>
      )}

      {/* Bottom Interface */}
      {isLive && (
        <div className="absolute bottom-0 w-full p-6 pb-12 bg-linear-to-t from-black via-black/90 to-transparent z-10 flex flex-col md:flex-row gap-6 items-end">
          
          {/* Left Panel: Reasoning Stream */}
          <div className="flex-1 space-y-2">
             <h3 className="text-xs uppercase tracking-widest opacity-60 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Cognitive Stream
             </h3>
             <div className="h-32 overflow-hidden flex flex-col justify-end mask-image-linear-gradient">
                {history.map((item, i) => (
                  <div key={i} className="text-sm opacity-50 py-1 border-l-2 border-cyan-900 pl-2">
                    {`>> ${item}`}
                  </div>
                ))}
             </div>
          </div>

          {/* Right Panel: Active Analysis (The "Brain") */}
          <div className={`flex-1 p-6 rounded-lg border backdrop-blur-md transition-all duration-300 ${getStatusColor(data?.status)}`}>
            
            {!data ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                <span className="uppercase tracking-widest">Acquiring Visual Target...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                   <span className="text-xs font-bold uppercase tracking-widest border border-current px-2 py-0.5 rounded">
                     {data.status}
                   </span>
                   {data.status === "Warning" ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                </div>
                
                <h2 className="text-2xl font-bold leading-tight mb-2">
                  {data.action}
                </h2>
                
                <div className="text-sm opacity-80 border-t border-current/20 pt-2 mt-2">
                  <span className="font-bold">ANALYSIS:</span> {data.analysis} <br/>
                  <span className="font-bold">REASONING:</span> {data.reasoning}
                </div>
              </>
            )}
          </div>

        </div>
      )}
    </main>
  );
}