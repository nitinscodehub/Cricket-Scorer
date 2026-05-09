import React, { useState } from 'react';
import { Layout, ActionButton } from '../components/SharedUI';
import { db, type Match } from '../db/database';
import { Users, Timer, Info, ChevronRight } from 'lucide-react';

interface MatchSetupProps {
  onBack: () => void;
  onStartMatch: (matchId: string) => void;
}

export const MatchSetupScreen: React.FC<MatchSetupProps> = ({ onBack, onStartMatch }) => {
  const [teamA, setTeamA] = useState('Team A');
  const [teamB, setTeamB] = useState('Team B');
  const [overs, setOvers] = useState(5);
  const [players, setPlayers] = useState(6);
  const [teamAPlayers, setTeamAPlayers] = useState<string[]>(Array(6).fill('').map((_, i) => `A Player ${i + 1}`));
  const [teamBPlayers, setTeamBPlayers] = useState<string[]>(Array(6).fill('').map((_, i) => `B Player ${i + 1}`));
  const [step, setStep] = useState(1);
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');
  const [isCreating, setIsCreating] = useState(false);

  // Custom Rules
  const [wideExtra, setWideExtra] = useState(1);
  const [noBallExtra, setNoBallExtra] = useState(1);

  const updatePlayerCount = (val: number) => {
    setPlayers(val);
    setTeamAPlayers(prev => {
        const next = [...prev];
        if (val > prev.length) {
            for (let i = prev.length; i < val; i++) next.push(`A Player ${i + 1}`);
        } else {
            return next.slice(0, val);
        }
        return next;
    });
    setTeamBPlayers(prev => {
        const next = [...prev];
        if (val > prev.length) {
            for (let i = prev.length; i < val; i++) next.push(`B Player ${i + 1}`);
        } else {
            return next.slice(0, val);
        }
        return next;
    });
  };

  const handleStart = async () => {
    setIsCreating(true);
    
    const finalTeamAPlayers = teamAPlayers.map((p, i) => p.trim() || `A Player ${i + 1}`);
    const finalTeamBPlayers = teamBPlayers.map((p, i) => p.trim() || `B Player ${i + 1}`);

    const teamABattsFirst = (tossWinner === teamA && tossDecision === 'bat') || (tossWinner === teamB && tossDecision === 'bowl');
    
    const battingSquad = teamABattsFirst ? finalTeamAPlayers : finalTeamBPlayers;
    const bowlingSquad = teamABattsFirst ? finalTeamBPlayers : finalTeamAPlayers;

    const newMatch: Match = {
      id: crypto.randomUUID(),
      teamAName: teamA || 'Team A',
      teamBName: teamB || 'Team B',
      totalOvers: overs,
      playersPerTeam: players,
      teamAPlayers: finalTeamAPlayers,
      teamBPlayers: finalTeamBPlayers,
      tossWinner: tossWinner || teamA,
      tossChoice: tossDecision,
      status: 'ongoing',
      startTime: Date.now(),
      rules: {
        wideExtraRuns: wideExtra,
        noBallExtraRuns: noBallExtra
      },
      currentInnings: 1,
      strikerId: battingSquad[0],
      nonStrikerId: battingSquad[1],
      currentBowlerId: bowlingSquad[0],
      innings1: {
        runs: 0, wickets: 0, balls: 0, ballsList: [], battingStats: {}, bowlingStats: {}
      },
      innings2: {
        runs: 0, wickets: 0, balls: 0, ballsList: [], battingStats: {}, bowlingStats: {}
      }
    };
    await db.matches.add(newMatch);
    onStartMatch(newMatch.id);
  };

  if (step === 2) {
    return (
        <Layout title="Toss & Decision" showBackButton onBack={() => setStep(1)}>
            <div className="flex flex-col gap-6 py-4">
                <section className="glass-card flex flex-col gap-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-accent">Who won the toss?</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setTossWinner(teamA)}
                            className={`p-4 rounded-xl border font-bold transition-all ${tossWinner === teamA ? 'bg-neon-accent text-black border-neon-accent font-black italic' : 'bg-white/5 border-white/5'}`}
                        >
                            {teamA}
                        </button>
                        <button 
                            onClick={() => setTossWinner(teamB)}
                            className={`p-4 rounded-xl border font-bold transition-all ${tossWinner === teamB ? 'bg-neon-accent text-black border-neon-accent font-black italic' : 'bg-white/5 border-white/5'}`}
                        >
                            {teamB}
                        </button>
                    </div>
                </section>

                {tossWinner && (
                    <section className="glass-card flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-accent">{tossWinner} decided to:</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setTossDecision('bat')}
                                className={`p-4 rounded-xl border font-bold transition-all ${tossDecision === 'bat' ? 'bg-neon-accent text-black border-neon-accent font-black italic' : 'bg-white/5 border-white/5'}`}
                            >
                                BAT
                            </button>
                            <button 
                                onClick={() => setTossDecision('bowl')}
                                className={`p-4 rounded-xl border font-bold transition-all ${tossDecision === 'bowl' ? 'bg-neon-accent text-black border-neon-accent font-black italic' : 'bg-white/5 border-white/5'}`}
                            >
                                BOWL
                            </button>
                        </div>
                    </section>
                )}

                <ActionButton onClick={handleStart} className="mt-4" id="finalize_match_button">
                    {isCreating ? 'Creating Match...' : 'Start Match'}
                </ActionButton>
            </div>
        </Layout>
    );
  }

  return (
    <Layout title="New Match" showBackButton onBack={onBack}>
      <div className="flex flex-col gap-6 py-4">
        {/* Team Names */}
        <section className="glass-card flex flex-col gap-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-accent flex items-center gap-2">
                <Users className="w-3 h-3" /> Team Identity
            </h3>
            <div className="grid grid-cols-2 gap-3">
                <InputGroup label="Team A" value={teamA} onChange={setTeamA} />
                <InputGroup label="Team B" value={teamB} onChange={setTeamB} />
            </div>
        </section>

        {/* Player Names */}
        <section className="glass-card flex flex-col gap-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-accent">Squad Details</h3>
            <div className="max-h-48 overflow-y-auto px-2 space-y-4">
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-white/20 uppercase sticky top-0 bg-card-bg py-1">{teamA} Squad</p>
                    {teamAPlayers.map((p, i) => (
                        <input key={i} value={p} onChange={(e) => {
                            const n = [...teamAPlayers]; n[i] = e.target.value; setTeamAPlayers(n);
                        }} className="w-full bg-white/5 border border-white/5 rounded px-3 py-2 text-xs font-bold focus:outline-none focus:border-neon-accent/50" />
                    ))}
                </div>
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-white/20 uppercase sticky top-0 bg-card-bg py-1">{teamB} Squad</p>
                    {teamBPlayers.map((p, i) => (
                        <input key={i} value={p} onChange={(e) => {
                            const n = [...teamBPlayers]; n[i] = e.target.value; setTeamBPlayers(n);
                        }} className="w-full bg-white/5 border border-white/5 rounded px-3 py-2 text-xs font-bold focus:outline-none focus:border-neon-accent/50" />
                    ))}
                </div>
            </div>
        </section>

        {/* Match Settings */}
        <section className="glass-card flex flex-col gap-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-accent flex items-center gap-2">
                <Timer className="w-3 h-3" /> Match Configuration
            </h3>
            
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                    <SliderGroup 
                        label="Overs" 
                        value={overs} 
                        min={1} 
                        max={20} 
                        onChange={setOvers} 
                    />
                    <SliderGroup 
                        label="Players" 
                        value={players} 
                        min={2} 
                        max={15} 
                        onChange={updatePlayerCount} 
                    />
                </div>

                <div className="border-t border-white/5 pt-4">
                    <h4 className="text-[9px] font-black uppercase text-white/30 tracking-[0.2em] mb-4">Extra Runs Rules</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <RuleToggle label="Wide Ball" value={wideExtra} onChange={setWideExtra} />
                        <RuleToggle label="No Ball" value={noBallExtra} onChange={setNoBallExtra} />
                    </div>
                </div>
            </div>
        </section>

        <section className="glass-card bg-neon-accent/5 border-neon-accent/20">
             <div className="flex gap-3">
                 <Info className="w-5 h-5 text-neon-accent shrink-0" />
                 <p className="text-[11px] text-white/50 leading-relaxed font-medium italic">
                     Once started, you can manage the toss and striker selection directly on the live scoring screen.
                 </p>
             </div>
        </section>

        <ActionButton onClick={() => setStep(2)} className="mt-4" id="continue_to_toss_button">
            CONTINUE TO TOSS <ChevronRight className="w-4 h-4 ml-2" />
        </ActionButton>
      </div>
    </Layout>
  );
};

const InputGroup = ({ label, value, onChange }: any) => (
    <div className="flex flex-col gap-1">
        <label className="text-[9px] uppercase font-black text-white/30 tracking-widest">{label}</label>
        <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="bg-white/5 border border-white/5 rounded-lg px-3 py-3 text-sm font-bold focus:outline-none focus:border-neon-accent/50 focus:bg-white/10 transition-all uppercase tracking-tight"
        />
    </div>
);

const SliderGroup = ({ label, value, min, max, onChange }: any) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
            <label className="text-[9px] uppercase font-black text-white/30 tracking-widest">{label}</label>
            <span className="text-lg font-black italic neon-text">{value}</span>
        </div>
        <input 
            type="range" 
            min={min} 
            max={max} 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-neon-accent"
        />
    </div>
);

const RuleToggle = ({ label, value, onChange }: any) => (
    <div className="flex flex-col gap-2">
        <label className="text-[8px] uppercase font-black text-white/20 tracking-widest">{label}</label>
        <div className="flex bg-white/5 p-1 rounded-lg">
            <button 
                onClick={() => onChange(0)}
                className={`flex-1 py-1 text-[10px] font-black rounded ${value === 0 ? 'bg-white/10 text-white' : 'text-white/20'}`}
            >
                0
            </button>
            <button 
                onClick={() => onChange(1)}
                className={`flex-1 py-1 text-[10px] font-black rounded ${value === 1 ? 'bg-neon-accent text-black font-black italic' : 'text-white/20'}`}
            >
                +1
            </button>
        </div>
    </div>
);
