import React from 'react';
import { Layout } from '../components/SharedUI';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { format } from 'date-fns';
import { ChevronRight, Calendar, Trash2 } from 'lucide-react';

interface HistoryProps {
  onBack: () => void;
  onSelectMatch: (id: string) => void;
}

export const HistoryScreen: React.FC<HistoryProps> = ({ onBack, onSelectMatch }) => {
  const matches = useLiveQuery(() => db.matches.orderBy('startTime').reverse().toArray());

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this match?')) {
      await db.matches.delete(id);
    }
  };

  return (
    <Layout title="Match History" showBackButton onBack={onBack}>
      <div className="flex flex-col gap-4 py-4 px-2 sm:px-0">
        {matches?.map(match => (
          <div key={match.id} className="relative group/card">
            <div 
              onClick={() => onSelectMatch(match.id)}
              className="w-full glass-card p-5 text-left border-white/5 hover:border-neon-accent/30 transition-all active:scale-95 group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">
                      <Calendar className="w-3 h-3" />
                      {format(match.startTime, 'dd MMM yyyy')}
                  </div>
                  <div className="flex items-center gap-3">
                      <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.2em]
                          ${match.status === 'completed' ? 'bg-neon-accent/10 text-neon-accent' : 'bg-orange-500/10 text-orange-400'}`}>
                          {match.status}
                      </div>
                      <button 
                        onClick={(e) => handleDelete(e, match.id)}
                        className="p-1.5 bg-red-500/10 text-red-400 rounded-md opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500/20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                  </div>
              </div>

              <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                      <span className="text-xl font-black uppercase italic tracking-tighter leading-none">{match.teamAName}</span>
                      <span className="text-[8px] font-black text-white/10 my-2 uppercase tracking-[0.5em]">VS</span>
                      <span className="text-xl font-black uppercase italic tracking-tighter leading-none">{match.teamBName}</span>
                  </div>
                  
                  <div className="flex items-center gap-6">
                      <div className="text-right">
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Victor</p>
                          <p className="text-sm font-black text-neon-accent uppercase italic">{match.winner || 'Active'}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-neon-accent transition-colors" />
                  </div>
              </div>
            </div>
          </div>
        ))}

        {!matches || matches.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gray-700" />
                </div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No matches recorded yet</p>
            </div>
        )}
      </div>
    </Layout>
  );
};
