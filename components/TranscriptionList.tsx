import React, { useEffect, useRef } from 'react';
import { SessionStatus, Transcription } from '@/types';

interface TranscriptionListProps {
  history: Transcription[];
  currentInput: string;
  currentOutput: string;
  status: SessionStatus ;  
  onStart: () => void;
  onStop: () => void;
}

const TranscriptionList: React.FC<TranscriptionListProps> = ({ history, currentInput, currentOutput, status, onStart, onStop }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, currentInput, currentOutput]);

  return (
    <div className="glass rounded-2xl flex flex-col h-full overflow-hidden border-indigo-500/10">
      <div className="p-3 md:p-4 border-b border-slate-700/50 bg-slate-800/30 flex justify-between items-center shrink-0"> 
        <h3 className="text-xs md:text-sm font-bold text-slate-300 uppercase tracking-tight">Intelligence Stream</h3>
        {/* <span className="text-[8px] md:text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest font-black">Live</span> */}
        <div className="flex gap-2">
                  
                  {status === SessionStatus.ACTIVE ? (
                    <button 
                      onClick={onStop}
                      className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold flex items-center gap-2 active:scale-95"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      Stop
                    </button>
                  ) : (
                    <button 
                      disabled={status === SessionStatus.CONNECTING}
                      onClick={onStart}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-full text-xs font-bold shadow-lg disabled:opacity-50 active:scale-95 transition-transform"
                    >
                      {status === SessionStatus.CONNECTING ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                  
                  
                </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 scroll-smooth scrollbar-hide">
        {history.length === 0 && !currentInput && !currentOutput && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3 opacity-40">
            <div className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest">Awaiting interaction</p>
          </div>
        )}

        {history.map((entry) => (
          <div key={entry.id} className={`flex flex-col ${entry.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[90%] md:max-w-[85%] p-3 rounded-2xl text-[13px] md:text-sm leading-relaxed ${
              entry.sender === 'user' 
                ? 'bg-indigo-600/20 text-indigo-100 rounded-tr-none border border-indigo-500/20' 
                : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700/50 shadow-sm'
            }`}>
              {entry.text}
            </div>
            <span className="text-[9px] text-slate-600 mt-1 px-1 font-medium">
              {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {currentInput && (
          <div className="flex flex-col items-end">
            <div className="max-w-[90%] md:max-w-[85%] p-3 rounded-2xl text-[13px] md:text-sm bg-indigo-600/10 text-indigo-200/50 rounded-tr-none border border-indigo-500/10 italic animate-pulse">
              {currentInput}
            </div>
          </div>
        )}

        {currentOutput && (
          <div className="flex flex-col items-start animate-in fade-in duration-200">
            <div className="max-w-[90%] md:max-w-[85%] p-3 rounded-2xl text-[13px] md:text-sm bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50 shadow-md">
              {currentOutput}
              <span className="inline-block w-1.5 h-3.5 ml-1.5 bg-indigo-500 animate-pulse rounded-full align-middle"></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptionList;
