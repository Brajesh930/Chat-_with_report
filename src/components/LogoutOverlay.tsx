import React from 'react';
import { motion } from 'motion/react';
import { Heart, Stars, LogOut } from 'lucide-react';

interface LogoutOverlayProps {
  username: string;
}

export default function LogoutOverlay({ username }: LogoutOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 font-sans"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-orange/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-orange/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative text-center px-6 max-w-2xl">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          className="mb-8 flex justify-center"
        >
          <div className="w-24 h-24 bg-brand-orange/10 border border-brand-orange/20 rounded-full flex items-center justify-center text-brand-orange">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <LogOut size={40} />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight"
        >
          Thank you, <span className="text-brand-orange">{username}</span>!
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed font-light"
        >
          It was a pleasure having you in the Analytics Portal today. 
          Your contributions help us build better IP solutions. 
          We're looking forward to seeing you again soon!
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-2 text-brand-orange/60 font-medium uppercase tracking-[0.3em] text-[10px]">
             Signing you out securely
             <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
             >
               ...
             </motion.span>
          </div>
          
          <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 4, ease: "linear" }}
              className="h-full bg-brand-orange shadow-[0_0_15px_rgba(234,107,20,0.5)]"
            />
          </div>
        </motion.div>

        <div className="mt-16 flex justify-center gap-8 text-slate-700">
           <Stars className="animate-pulse" size={20} />
           <Heart className="animate-pulse" size={20} />
           <Stars className="animate-pulse" size={20} />
        </div>
      </div>
    </motion.div>
  );
}
