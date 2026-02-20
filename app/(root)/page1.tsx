/* eslint-disable @typescript-eslint/no-unused-vars */ 
"use client";

import Header from '@/components/Header';
import { WelcomeScreen } from '@/components/WelcomeScreen';

const Home = () => {

  return (
    <div className="h-dvh bg-linear-to-br from-slate-900 via-black-900 to-slate-900 flex flex-col p-3 md:p-6 lg:p-8 overflow-hidden">
      {/* Header */}
      <Header/>
      {/* Main Content */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden max-h-screen overflow-y-auto">        
         <WelcomeScreen/>        
      </main>
      <footer className="shrink-0 mt-2 text-center">
        <p className="text-slate-200 text-[9px] uppercase tracking-widest font-bold">Multimodal Companion Engine</p>
      </footer>     
    </div>
  );
};

export default Home;