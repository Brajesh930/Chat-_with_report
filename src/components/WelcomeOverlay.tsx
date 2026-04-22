import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface WelcomeOverlayProps {
  username: string;
}

export default function WelcomeOverlay({ username }: WelcomeOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white font-sans"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-brand-orange/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] bg-brand-orange/10 blur-[120px] rounded-full" />
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
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <ShieldCheck size={40} />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight"
        >
          Welcome, <span className="text-brand-orange">{username}</span>!
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-lg md:text-xl text-slate-500 mb-10 leading-relaxed font-light"
        >
          Your secure identity context has been established. 
          The Analytics Portal is now preparing your personalized insights and 
          latest industry intelligence for review.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-2 text-brand-orange/80 font-bold uppercase tracking-[0.4em] text-[10px]">
             Initializing secure session
             <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
             >
               ...
             </motion.span>
          </div>
          
          <div className="w-56 h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="h-full bg-brand-orange shadow-[0_0_10px_rgba(234,107,20,0.3)]"
            />
          </div>
        </motion.div>

        <div className="mt-16 flex justify-center gap-6">
           <motion.div 
             animate={{ y: [0, -4, 0] }}
             transition={{ duration: 2, repeat: Infinity, delay: 0 }}
           >
             <Sparkles className="text-brand-orange/30" size={24} />
           </motion.div>
           <motion.div 
             animate={{ y: [0, -4, 0] }}
             transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
           >
             <ArrowRight className="text-brand-orange/30" size={24} />
           </motion.div>
           <motion.div 
             animate={{ y: [0, -4, 0] }}
             transition={{ duration: 2, repeat: Infinity, delay: 1 }}
           >
             <Sparkles className="text-brand-orange/30" size={24} />
           </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
