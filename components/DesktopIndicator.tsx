import { SessionStatus } from '@/types'

const DesktopIndicator = ({status}: {status: SessionStatus}) => {
  return (    
    <div className="hidden lg:flex glass rounded-2xl p-2 flex-col items-center text-center space-y-3">
        <div className="relative">
            <div className={`w-12 h-12 rounded-full border-2 border-dashed border-indigo-500/30 flex items-center justify-center ${status === SessionStatus.ACTIVE ? 'animate-spin-slow' : ''}`}>
                <div className={`w-8 h-8 rounded-full bg-linear-to-tr from-indigo-600 to-purple-500 ${status === SessionStatus.ACTIVE ? 'pulse-glow scale-110' : 'opacity-20'}`} />
            </div>
        </div>
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">System Ready</p>
    </div>   
  )
}

export default DesktopIndicator