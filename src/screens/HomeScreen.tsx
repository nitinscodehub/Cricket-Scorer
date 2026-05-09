import React, { useState } from 'react';
import { Layout, ActionButton } from '../components/SharedUI';
import { Target, Users, Play, History, Settings, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  onNavigate: (screen: string) => void;
}

export const HomeScreen: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center group cursor-pointer" onClick={() => onNavigate('home')}>
             <div className="w-24 h-24 bg-neon-accent rounded-3xl flex items-center justify-center transform group-hover:rotate-6 transition-transform shadow-[0_0_40px_-10px_#CCFF00]">
                 <span className="text-5xl font-black text-black italic">B</span>
             </div>
             <div className="mt-4 text-center">
                 <h1 className="text-3xl font-black tracking-tighter uppercase leading-none italic">Badmosh <span className="text-neon-accent">Scorer</span></h1>
                 <span className="text-white/20 font-bold tracking-[0.4em] text-[10px] uppercase block mt-1">Professional Engine</span>
             </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-4 w-full">
            <MenuButton 
                onClick={() => onNavigate('setup')}
                icon={<Play className="w-5 h-5 fill-current" />}
                label="New Match"
                highlight
            />
            <MenuButton 
                onClick={() => onNavigate('history')}
                icon={<History className="w-5 h-5" />}
                label="History"
            />
            <MenuButton 
                onClick={() => onNavigate('tournament')}
                icon={<Trophy className="w-5 h-5" />}
                label="Tournament"
            />
            <MenuButton 
                onClick={() => onNavigate('settings')}
                icon={<Settings className="w-5 h-5" />}
                label="Settings"
            />
        </div>

        {/* Quick Tips */}
        <div className="w-full glass-card p-4 flex items-center gap-3 bg-white/5 border-none">
             <div className="w-10 h-10 rounded-full bg-neon-accent/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-neon-accent" />
             </div>
             <div>
                 <p className="text-xs font-semibold text-white/30 uppercase tracking-widest text-[9px]">Pro Tip</p>
                 <p className="text-xs text-white/70 italic">Use 'Undo' to revert accidental scores instantly.</p>
             </div>
        </div>
      </div>
    </Layout>
  );
};

const MenuButton = ({ onClick, icon, label, highlight = false }: any) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all active:scale-95
                   ${highlight 
                     ? 'bg-neon-accent border-neon-accent text-black shadow-[0_0_20px_-5px_#CCFF00]' 
                     : 'bg-card-bg border-white/5 text-white/80 hover:border-neon-accent/30'}`}
    >
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
);
