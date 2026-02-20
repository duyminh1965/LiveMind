
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

export const WelcomeScreen = () => { 
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
      <div className="text-center mb-16">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }} className="relative" >
          <div className="absolute inset-0 bg-linear-to-r from-teal-200 to-amber-100 blur-3xl rounded-full" />
          <div className="relative bg-white backdrop-blur-sm rounded-3xl p-6 border border-white shadow-xl">
            <div className="flex items-center justify-center gap-2">
              <Brain className="w-12 h-12 text-purple-400" />            
              <h1 className="text-5xl block font-serif font-bold bg-linear-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent gap-2">
                LiveMind
              </h1>
            </div>
            <span className="text-2xl block bg-linear-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
                Your Real-Time AI Reasoning Companion
              </span>
            <p className="text-xl text-slate-600 mb-2 max-w-4xl mx-auto leading-relaxed">
              Powered by Gemini 3, LiveMind is an always-on assistant that sees, hears, and understands your world in real time—providing intelligent guidance exactly when you need it.
            </p>
            <span className="text-2xl block bg-linear-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
                Beyond Chat
              </span>
            <p className="text-xl text-slate-600 mb-2 max-w-4xl mx-auto leading-relaxed">
              LiveMind doesn&apos;t wait for questions. It continuously processes live video and audio to understand what you&apos;re doing, identify risks or mistakes, and offer actionable insights as situations unfold.
            </p>
            <span className="text-2xl block bg-linear-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
                Intelligence That Reasons
              </span>
            <p className="text-xl text-slate-600 mb-2 max-w-4xl mx-auto leading-relaxed">
              Gemini 3 performs causal inference, detects anomalies, and explains why something matters. With contextual memory, it provides adaptive multi-step guidance without needing to be re-prompted.
            </p>
            <span className="text-2xl block bg-linear-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
                Experience AI that perceives, reasons, and assists in the real world.
              </span>            
          </div>
        </motion.div>
      </div>      
    </div>
  );
};