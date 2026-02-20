const NoHasKey = ({ handleOpenSelectKey }: { handleOpenSelectKey: () => void;}) => {
  return (
    <div className="h-dvh bg-slate-950 flex items-center justify-center p-6">
        <div className="glass max-w-md w-full p-6 md:p-8 rounded-3xl text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
            <svg className="w-8 h-8 md:w-10 md:h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Setup Required</h1>
          <p className="text-slate-400 text-sm">
            LiveMind requires a paid API key for real-time multimodal reasoning.
          </p>
          <div className="pt-2">
            <button 
              onClick={handleOpenSelectKey}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95"
            >
              Select API Key
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block mt-6 text-xs text-slate-500 hover:text-indigo-400 underline"
            >
              Learn about billing
            </a>
          </div>
        </div>
      </div>
  )
}

export default NoHasKey