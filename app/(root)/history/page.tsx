"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, MessageSquare, User, Bot } from 'lucide-react';
import { useSearchParams } from 'next/navigation'; 
 
// Types matching DB schema
interface SessionSummary {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  model_name: string;
}

interface Message {
  id: string;
  sender: 'user' | 'model';
  content: string;
  created_at: string;
}

export default function HistoryPage() {
  const searchParams = useSearchParams(); // <--- 1. Get the hook
  const user_id = searchParams.get('userId'); // <--- 2. Read the param
  
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);  

  // 1. Fetch Session List on Mount
  useEffect(() => {
    if (!user_id) return;    
    fetch(`/api/live/sessions/user/${user_id}`)
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, [user_id]);

  // 2. Fetch Messages when a Session is clicked
  useEffect(() => {
    if (!selectedId) return;

    fetch(`/api/live/sessions/${selectedId}`)
      .then(res => res.json())
      .then(data => {
        setMessages(data.messages);
      })
      .catch(err => console.error(err));
  }, [selectedId]);

  // Helper to format timestamps
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getDuration = (start: string, end: string | null) => {
    if (!end) return 'Ongoing';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = ((diff % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Sidebar: Session List */}
      <div className="w-full md:w-80 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-bold text-lg">Session History</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loading ? (
             <div className="text-center p-4 text-slate-500 text-sm">Loading sessions...</div>
          ) : sessions.length === 0 ? (
             <div className="text-center p-4 text-slate-500 text-sm">No history found.</div>
          ) : (
            sessions.map(session => (
              <button
                key={session.id}
                onClick={() => setSelectedId(session.id)}
                className={`w-full text-left p-3 rounded-xl transition-all border ${
                  selectedId === session.id 
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-white' 
                    : 'bg-slate-800/50 border-transparent hover:bg-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm flex items-center gap-2">
                    <Calendar size={12} /> {formatDate(session.started_at)}
                  </span>
                  <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${session.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {session.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs opacity-60">
                   <Clock size={12} /> 
                   {getDuration(session.started_at, session.ended_at)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main View: Transcript */}
      <div className="flex-1 flex flex-col bg-slate-950">
        {selectedId ? (
          <>
            {/* Transcript Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <div>
                <h2 className="font-bold">Transcript Log</h2>
                <p className="text-xs text-slate-500 font-mono">ID: {selectedId}</p>
              </div>
              <div className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
                {""+messages.length} Messages
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 && (
                 <div className="text-center text-slate-600 italic mt-10">Empty session (Audio only or no data saved).</div>
              )}
              
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] space-y-1`}>
                    <div className={`flex items-center gap-2 text-xs ${msg.sender === 'user' ? 'justify-end text-indigo-400' : 'text-emerald-400'}`}>
                       {msg.sender === 'user' ? <User size={12}/> : <Bot size={12}/>}
                       <span className="uppercase font-bold">{msg.sender}</span>
                       <span className="text-slate-600">{new Date(msg.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-slate-800 text-slate-200 rounded-tr-sm' 
                        : 'bg-indigo-900/20 border border-indigo-500/20 text-indigo-100 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>Select a session to view the transcript.</p>
          </div>
        )}
      </div>
    </div>
  );
}