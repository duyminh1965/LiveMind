
import { Brain, ChevronDown, Home, LogOut, User } from 'lucide-react';
import { SignedIn, SignedOut, useClerk, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const Header = () => {    
  const [showUserMenu, setShowUserMenu] = useState(false);  
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  let user_id = user?.id;  
  if (!user_id) user_id="authenticated_users00001";

  const Avarta = String(user?.firstName || "")[0] + String(user?.lastName || "")[0];

  return (
    <header className="relative top-0 shrink-0 z-10 flex justify-between items-center mb-4 md:mb-6">
      <Link href="/" className="flex items-center gap-3">        
            <Brain className="w-8 h-8 text-purple-400" />            
          <h1 className="text-xl md:text-2xl font-bold bg-linear-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
            LiveMind 
            <span className="text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-tighter">LIVE</span>
          </h1>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/" className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${                    
                     'text-slate-600 hover:text-slate-100 hover:bg-slate-600'}`}>
            <Home className="w-4 h-4 text-purple-400" />            
            <h5 className="text-[15px] md:text-[15px] font-bold text-white/80 flex items-center gap-2">
              Home             
            </h5>
          </Link>
          <Link href="/live" className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${                    
                     'text-slate-600 hover:text-slate-100 hover:bg-slate-600'}`}>
            <div className="w-3.5 h-3.5 rounded-full bg-purple-400 flex items-center justify-center" >         
              <div className="w-2 h-2 rounded-full bg-indigo-400" />         
            </div>
            <h5 className="text-[15px] md:text-[15px] font-bold text-white/80 flex items-center gap-2">
              Live             
            </h5>
          </Link>
        </div>        
        {/* User Menu */}
        <div className="flex gap-3">
          <SignedOut>
            <div className="text-[15px] md:text-[15px] font-bold bg-linear-to-r from-slate-400 via-purple-600 to-slate-500 text-white rounded-full shadow-lg flex items-center gap-2 py-1 px-4">                
              <Link href="/sign-in">Sign in</Link>           
            </div>
          </SignedOut>
          <SignedIn>
            <div className="relative">
              <motion.button
              onClick={() => setShowUserMenu(!showUserMenu)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 bg-linear-to-br from-slate-400 via-purple-600 to-slate-500 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-2xs">
                {Avarta}
              </div>
              <span className="hidden sm:inline text-indigo-500">{user?.firstName}</span>
              <ChevronDown className="h-4 w-4" />
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-64 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/50 py-2 z-50"
                >
                  <div className="px-4 py-3 border-b border-slate-200/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-linear-to-br from-slate-400 via-purple-600 to-slate-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {Avarta}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div className="text-sm text-slate-600">
                          {user?.primaryEmailAddress?.emailAddress}</div>                        
                      </div>
                    </div>
                  </div>

                  <div className="py-2"> 
                                       
                    <Link href={`/history?userId=${user?.id}`} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>History</span>
                      </Link>

                    
                    <button
                      onClick={() => signOut(() => router.push('/'))}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </SignedIn>
        </div>
      </header>
  )
}

export default Header