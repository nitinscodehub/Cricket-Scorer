import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, onBack, showBackButton = false }) => {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto relative bg-off-black">
      {title && (
        <header className="sticky top-0 z-50 p-6 flex items-center justify-between bg-off-black/80 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <button 
                onClick={onBack}
                className="p-2 -ml-2 rounded-full active:bg-white/10 transition-colors"
                id="back_button"
              >
                <ChevronLeft className="w-6 h-6 text-neon-accent" />
              </button>
            )}
            <h1 className="text-xl font-bold tracking-tight uppercase italic">Badmosh <span className="neon-accent">Scorer</span></h1>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-neon-accent animate-pulse" />
             <span className="text-[10px] uppercase font-bold tracking-widest text-neon-accent/50">Live Sync</span>
          </div>
        </header>
      )}
      <main className="flex-1 w-full overflow-y-auto px-4 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={title}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export const ScoreCard = ({ label, value, subValue, highlight = false }: { label: string; value: string | number; subValue?: string; highlight?: boolean }) => (
  <div className={`glass-card p-4 flex flex-col items-center justify-center ${highlight ? 'border-neon-accent/30' : ''}`}>
    <span className="text-[10px] uppercase font-bold tracking-widest text-white/30 mb-1">{label}</span>
    <span className={`text-2xl font-black italic ${highlight ? 'neon-text' : 'text-white'}`}>{value}</span>
    {subValue && <span className="text-[10px] font-mono text-gray-600 mt-1 uppercase">{subValue}</span>}
  </div>
);

export const ActionButton = ({ onClick, children, variant = 'primary', className = '', id }: { onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'secondary' | 'danger'; className?: string; id?: string }) => {
  const baseClasses = variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : 'btn-secondary text-red-500 border-red-500/20';
  return (
    <button onClick={onClick} className={`${baseClasses} ${className}`} id={id}>
      {children}
    </button>
  );
};
