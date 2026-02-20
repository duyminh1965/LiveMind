"use client";

import { Zap, Eye, Brain, Activity } from "lucide-react";
import Header from "@/components/Header";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen font-sans text-white bg-cover bg-center bg-no-repeat p-8" style={{
    backgroundImage: "url('/home2.png')"}}>
        <Header />      
        <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/40 to-black/80" />
      {/* HERO */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">               

        <div className="relative z-10 max-w-4xl text-center px-6">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            LiveMind
          </h1>
          <p className="text-xl md:text-2xl text-cyan-300 mb-8">
            A Real-Time Multimodal Reasoning Companion
          </p>
          <p className="text-lg text-white/80 mb-10">
            Watches. Listens. Reasons. Responds — turning into a thinking
            partner that understands the world as it unfolds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/live">
            <button className="px-8 py-4 bg-cyan-500 text-black font-semibold rounded-xl hover:bg-cyan-400 transition">
              Get Started
            </button>
            </Link>            
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 relative flex items-center justify-center overflow-hidden">
        
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Continuous Intelligence, Not Just Chat
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Feature
              icon={<Eye className="w-8 h-8" />}
              title="Sees & Hears"
              desc="Processes live camera frames and audio input to understand real-world context." 
            />
            <Feature
              icon={<Brain className="w-8 h-8" />}
              title="Thinks in Real Time"
              desc="Performs causal reasoning, anomaly detection, and intent inference." 
            />
            <Feature
              icon={<Activity className="w-8 h-8" />}
              title="Guides Instantly"
              desc="Low-latency streaming feedback adapts as situations change." 
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 relative flex items-center justify-center overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="text-3xl font-bold mb-6">Always-On Reasoning Agent</h3>
            <p className="text-white/80 leading-relaxed mb-6">
              LiveMind fuses visual context, audio cues, and temporal changes into
              a continuous stream of understanding. Instead of isolated prompts,
              it maintains short-term memory to support multi-step guidance and
              follow-up assistance.
            </p>
            <p className="text-white/60">
              Supported by multimodal inference capabilities and a low-latency streaming APIs.              
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 p-8 bg-black/40">
            <ul className="space-y-4">
              <li className="flex items-center gap-3"><Zap className="text-cyan-400" /> Detects risks & mistakes</li>
              <li className="flex items-center gap-3"><Zap className="text-cyan-400" /> Explains why actions matter</li>
              <li className="flex items-center gap-3"><Zap className="text-cyan-400" /> Adapts guidance instantly</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center relative">
        <h2 className="text-4xl text-white font-bold mb-6">Experience the Future of AI</h2>
        <p className="text-white/70 mb-10 max-w-2xl mx-auto">
          LiveMind demonstrates a new class of AI applications — ones that
          perceive, reason, and assist continuously in the real world.
        </p>
        <Link href="/live">
          <button className="px-10 py-5 bg-cyan-500 text-black font-bold rounded-2xl hover:bg-cyan-400 transition">
            Get Started
          </button>
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center text-white/60 text-sm relative">
        Real-Time Multimodal Reasoning
      </footer>
    </main>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-8 rounded-2xl border border-white/10 bg-zinc-900/50">
      <div className="mb-4 text-cyan-400">{icon}</div>
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className="text-white/70">{desc}</p>
    </div>
  );
}
