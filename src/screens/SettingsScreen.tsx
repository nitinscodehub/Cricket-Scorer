import React, { useState, useEffect } from 'react';
import { Layout } from '../components/SharedUI';
import { Volume2, Bell, Shield, Database, Trash2 } from 'lucide-react';
import { db } from '../db/database';

export const SettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);

  const clearData = async () => {
    if (confirm('Are you sure? This will delete ALL match history.')) {
        await db.matches.clear();
        await db.tournaments.clear();
        alert('All data cleared.');
    }
  };

  return (
    <Layout title="Settings" showBackButton onBack={onBack}>
      <div className="flex flex-col gap-6 py-4">
        
        <section className="flex flex-col gap-3">
            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-neon-accent px-4 italic">Audio-Visual</h3>
            <div className="glass-card p-0 border-white/5 overflow-hidden divide-y divide-white/[0.03]">
                <ToggleItem 
                    icon={<Volume2 className="w-5 h-5" />} 
                    label="Match Sountrack" 
                    value={sound} 
                    onChange={setSound} 
                />
                <ToggleItem 
                    icon={<Bell className="w-5 h-5" />} 
                    label="Tactile Response" 
                    value={vibration} 
                    onChange={setVibration} 
                />
            </div>
        </section>

        <section className="flex flex-col gap-3">
            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-red-500/50 px-4 italic">Storage Management</h3>
            <div className="glass-card p-0 border-white/5 overflow-hidden">
                <button 
                   onClick={clearData}
                   className="w-full flex items-center gap-4 p-5 hover:bg-red-500/5 transition-colors"
                >
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-black uppercase italic tracking-tight">Purge Database</p>
                        <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mt-1">Erase history and cloud cache</p>
                    </div>
                </button>
            </div>
        </section>

        <section className="glass-card border-none bg-white/[0.02] p-8 flex flex-col items-center text-center gap-3">
             <div className="w-14 h-14 bg-neon-accent rounded-2xl flex items-center justify-center font-black text-black italic text-2xl shadow-xl shadow-neon-accent/10">B</div>
             <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Badmosh Pro</h4>
                <p className="text-[8px] text-neon-accent uppercase font-black tracking-widest mt-1">Build 16.05.2024.REL</p>
             </div>
        </section>

      </div>
    </Layout>
  );
};

const ToggleItem = ({ icon, label, value, onChange }: any) => (
    <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-4">
            <div className="text-white/30">{icon}</div>
            <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
        </div>
        <button 
            onClick={() => onChange(!value)}
            className={`w-10 h-5 rounded-full transition-all relative ${value ? 'bg-neon-accent' : 'bg-white/10'}`}
        >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${value ? 'right-0.5' : 'left-0.5'}`} />
        </button>
    </div>
);
