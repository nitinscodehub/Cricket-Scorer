import React, { useState } from 'react';
import { Layout, ActionButton } from '../components/SharedUI';
import { db, type Tournament, type Match } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trophy, Plus, TrendingUp, Info } from 'lucide-react';
import { calculateRR } from '../logic/cricketUtils';

export const TournamentScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const tournaments = useLiveQuery(() => db.tournaments.toArray()) || [];
  const matches = useLiveQuery(() => db.matches.toArray()) || [];
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = async () => {
    if (!name) return;
    await db.tournaments.add({
        id: crypto.randomUUID(),
        name,
        teams: [],
        matchIds: [],
        createdAt: Date.now()
    });
    setName('');
    setShowCreate(false);
  };

  // Simplified: Show points table for all matches for now
  const getPointsTable = () => {
    const table: Record<string, { p: number; w: number; l: number; pts: number; nrr: number }> = {};
    
    matches.forEach(m => {
        if (m.status !== 'completed') return;
        [m.teamAName, m.teamBName].forEach(team => {
            if (!table[team]) table[team] = { p: 0, w: 0, l: 0, pts: 0, nrr: 0 };
        });

        table[m.teamAName].p++;
        table[m.teamBName].p++;

        if (m.winner === m.teamAName) {
            table[m.teamAName].w++;
            table[m.teamAName].pts += 2;
            table[m.teamBName].l++;
        } else {
            table[m.teamBName].w++;
            table[m.teamBName].pts += 2;
            table[m.teamAName].l++;
        }

        // Extremely simplified NRR logic for demo
        table[m.teamAName].nrr += (calculateRR(m.innings1.runs, m.innings1.balls) - calculateRR(m.innings2.runs, m.innings2.balls)) / 10;
        table[m.teamBName].nrr += (calculateRR(m.innings2.runs, m.innings2.balls) - calculateRR(m.innings1.runs, m.innings1.balls)) / 10;
    });

    return Object.entries(table).sort((a, b) => b[1].pts - a[1].pts || b[1].nrr - a[1].nrr);
  };

  const pointsTable = getPointsTable();

  return (
    <Layout title="Tournament Hub" showBackButton onBack={onBack}>
      <div className="flex flex-col gap-6 py-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
             <div className="glass-card border-none bg-neon-accent/5 p-5">
                <span className="text-[9px] font-black text-neon-accent uppercase tracking-widest">Global Events</span>
                <p className="text-3xl font-black italic mt-1">{tournaments.length}</p>
             </div>
             <div className="glass-card border-none bg-white/[0.03] p-5">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Match Syncs</span>
                <p className="text-3xl font-black italic mt-1">{matches.length}</p>
             </div>
        </div>

        {/* Global Points Table */}
        <section className="glass-card flex flex-col gap-6 border-white/5">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-accent flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" /> Division Standings
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                    <thead>
                        <tr className="text-white/20 uppercase font-black tracking-widest text-[9px]">
                            <th className="pb-4">Franchise</th>
                            <th className="pb-4 text-center">P</th>
                            <th className="pb-4 text-center">W</th>
                            <th className="pb-4 text-center">PTS</th>
                            <th className="pb-4 text-right">NRR</th>
                        </tr>
                    </thead>
                    <tbody className="font-bold">
                        {pointsTable.map(([team, stats]) => (
                            <tr key={team} className="border-b border-white/[0.02]">
                                <td className="py-4 uppercase italic tracking-tighter truncate max-w-[90px]">{team}</td>
                                <td className="py-4 text-center text-white/60">{stats.p}</td>
                                <td className="py-4 text-center text-neon-accent italic">{stats.w}</td>
                                <td className="py-4 text-center">{stats.pts}</td>
                                <td className="py-4 text-right font-mono text-[10px] text-white/40">{(stats.nrr > 0 ? '+' : '')}{stats.nrr.toFixed(3)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {pointsTable.length === 0 && (
                    <div className="py-12 text-center text-white/20 uppercase text-[9px] font-black tracking-[0.5em]">
                        Sync matches to compute
                    </div>
                )}
            </div>
        </section>

        <section className="glass-card bg-neon-accent/[0.02] border-neon-accent/10">
             <div className="flex gap-4">
                 <Info className="w-5 h-5 text-neon-accent shrink-0 opacity-50" />
                 <p className="text-[10px] text-white/30 leading-relaxed uppercase tracking-widest font-black">
                     NRR and global metrics are locally computed and optimized for real-time tournament analysis.
                 </p>
             </div>
        </section>
      </div>
    </Layout>
  );
};
