import React, { useState, useEffect } from 'react';
import { Layout, ScoreCard, ActionButton } from '../components/SharedUI';
import { useScoring } from '../hooks/useScoring';
import { formatOver, calculateRR } from '../logic/cricketUtils';
import { playSound } from '../utils/sounds';
import { Undo2, RotateCw, Trophy, AlertCircle, User, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LiveScoringProps {
  matchId: string;
  onBack: () => void;
  onViewSummary: (matchId: string) => void;
}

export const LiveScoringScreen: React.FC<LiveScoringProps> = ({ matchId, onBack, onViewSummary }) => {
  const { 
    match, loading, addBall, undoLastBall, 
    updateStriker, updateNonStriker, updateBowler,
    startSuperOver 
  } = useScoring(matchId);
  const [showPlayerModal, setShowPlayerModal] = useState<'striker' | 'nonstriker' | 'bowler' | null>(null);

  useEffect(() => {
    if (!match) return;
    const currentInn = match.currentInnings === 1 ? match.innings1 : match.innings2;
    const isOverEnd = currentInn.balls > 0 && currentInn.balls % 6 === 0 && currentInn.ballsList[currentInn.ballsList.length-1]?.isLegalBall;
    
    if (isOverEnd && match.status === 'ongoing') {
      setShowPlayerModal('bowler');
    }
  }, [match?.innings1.balls, match?.innings2.balls, match?.status]);

  if (loading || !match) return <Layout title="Loading..."><div className="p-8 text-center">Initalizing Score Engine...</div></Layout>;

  if (match.status === 'completed' || (match.status as any) === 'tie') {
    const isTie = (match.status as any) === 'tie';

    return (
        <Layout title={isTie ? "Match Tied!" : "Match Over"} showBackButton onBack={onBack}>
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isTie ? 'bg-orange-500/10' : 'bg-neon-accent/10'}`}>
                    {isTie ? <AlertCircle className="w-10 h-10 text-orange-500" /> : <Trophy className="w-10 h-10 text-neon-accent" />}
                </div>
                <div>
                    <h2 className="text-3xl font-black neon-text uppercase italic leading-none">
                        {isTie ? 'Scores Level' : `${match.winner} wins`}
                    </h2>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-3">
                        {isTie ? 'Dramatic Finish!' : `BY ${match.margin}`}
                    </p>
                </div>
                
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    {isTie && (
                        <button 
                            onClick={() => {
                                if (window.confirm('Start Super Over? This will reset scores for a 1-over showdown.')) {
                                    startSuperOver();
                                }
                            }}
                            className="btn-primary w-full bg-orange-500 text-black border-orange-500 shadow-lg shadow-orange-500/20"
                        >
                            START SUPER OVER
                        </button>
                    )}
                    <ActionButton onClick={() => onViewSummary(match.id)} className="w-full">
                        Official Scorecard
                    </ActionButton>
                </div>
            </div>
        </Layout>
    );
  }

  const currentInn = match.currentInnings === 1 ? match.innings1 : match.innings2;

  // Determine who is batting and bowling based on toss and current innings
  const teamABattsFirst = (match.tossWinner === match.teamAName && match.tossChoice === 'bat') || 
                          (match.tossWinner === match.teamBName && match.tossChoice === 'bowl');
  
  const battingTeam = match.currentInnings === 1 
    ? (teamABattsFirst ? match.teamAName : match.teamBName)
    : (teamABattsFirst ? match.teamBName : match.teamAName);

  const bowlingTeam = match.currentInnings === 1 
    ? (teamABattsFirst ? match.teamBName : match.teamAName)
    : (teamABattsFirst ? match.teamAName : match.teamBName);

  const battingSquad = match.currentInnings === 1 
    ? (teamABattsFirst ? match.teamAPlayers : match.teamBPlayers)
    : (teamABattsFirst ? match.teamBPlayers : match.teamAPlayers);

  const bowlingSquad = match.currentInnings === 1 
    ? (teamABattsFirst ? match.teamBPlayers : match.teamAPlayers)
    : (teamABattsFirst ? match.teamAPlayers : match.teamBPlayers);
  
  const rr = calculateRR(currentInn.runs, currentInn.balls);
  const target = match.innings1.runs + 1;
  const isSecondInnings = match.currentInnings === 2;

  const handleScore = (runs: number, extraType: 'none' | 'wide' | 'noBall' | 'bye' | 'legBye' = 'none') => {
    playSound(runs >= 4 ? 'boundary' : 'click');
    const isLegal = extraType === 'none' || extraType === 'bye' || extraType === 'legBye';
    
    const widePenalty = match.rules?.wideExtraRuns ?? 1;
    const noBallPenalty = match.rules?.noBallExtraRuns ?? 1;

    const extras = {
        wide: extraType === 'wide' ? (widePenalty + runs) : 0,
        noBall: extraType === 'noBall' ? noBallPenalty : 0,
        bye: extraType === 'bye' ? runs : 0,
        legBye: extraType === 'legBye' ? runs : 0
    };
    
    // For Wide, Batsman gets 0 runs. Team gets Penalty + runs.
    // For No Ball, Batsman gets runs (from bat). Team gets Penalty + runs.
    // For Bye/LegBye, Batsman gets 0 runs. Team gets runs.
    const actualRuns = (extraType === 'wide' || extraType === 'bye' || extraType === 'legBye') ? 0 : runs;

    addBall({
        runs: actualRuns,
        extras,
        isLegalBall: isLegal,
        batsmanId: match.strikerId,
        nonStrikerId: match.nonStrikerId,
        bowlerId: match.currentBowlerId
    });

    if (runs === 4 || runs === 6) {
        confetti({ particleCount: 50, spread: 60, colors: ['#CCFF00', '#000000'] });
    }
  };

  const handleWicket = () => {
    playSound('wicket');
    addBall({
        isLegalBall: true,
        wicket: { type: 'Out', playerOutId: match.strikerId || 'Unknown' },
        batsmanId: match.strikerId,
        nonStrikerId: match.nonStrikerId,
        bowlerId: match.currentBowlerId
    });
    
    const isAllOut = currentInn.wickets + 1 >= match.playersPerTeam - 1;
    if (!isAllOut) {
        setShowPlayerModal('striker');
    }
  };

  const PlayerModal = () => {
    if (!showPlayerModal) return null;
    
    const isBatsman = showPlayerModal === 'striker' || showPlayerModal === 'nonstriker';
    const list = isBatsman ? battingSquad : bowlingSquad;
    const title = showPlayerModal === 'striker' ? 'New Striker' : 
                  showPlayerModal === 'nonstriker' ? 'New Non-Striker' : 'New Bowler';

    // Filter logic:
    // Batsmen: Only those from batting squad who aren't currently on strike/non-strike
    // Bowlers: Only those from bowling squad who aren't the previous over's bowler
    const availablePlayers = isBatsman 
        ? list.filter(p => p !== match.strikerId && p !== match.nonStrikerId)
        : list.filter(p => showPlayerModal === 'bowler' ? p !== match.currentBowlerId : true);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <div className="glass-card w-full max-w-sm border-neon-accent/30 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black uppercase text-neon-accent tracking-widest italic">{title}</h3>
                    <button onClick={() => setShowPlayerModal(null)} className="text-[10px] uppercase font-black tracking-widest text-white/30">Close</button>
                </div>
                <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-2">
                    {availablePlayers.map((p, i) => (
                        <button 
                            key={i} 
                            onClick={() => {
                                if (showPlayerModal === 'striker') updateStriker(p);
                                if (showPlayerModal === 'nonstriker') updateNonStriker(p);
                                if (showPlayerModal === 'bowler') updateBowler(p);
                                setShowPlayerModal(null);
                            }}
                            className="flex items-center justify-between p-4 bg-white/5 hover:bg-neon-accent/10 rounded-xl border border-white/5 transition-all text-left"
                        >
                            <span className="font-bold text-sm">{p}</span>
                            <ChevronRight className="w-4 h-4 text-neon-accent" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
  };

  const getBatsmanScore = (id: string | undefined) => {
    if (!id) return { runs: 0, balls: 0 };
    return currentInn.battingStats[id] || { runs: 0, balls: 0 };
  };

  const strikerScore = getBatsmanScore(match.strikerId);
  const nonStrikerScore = getBatsmanScore(match.nonStrikerId);

  return (
    <Layout title={`${battingTeam} vs ${bowlingTeam}`} showBackButton onBack={onBack}>
      <PlayerModal />
      <div className="flex flex-col gap-4 py-2">
        {/* Main Scoreboard */}
        <div className="glass-card bg-black/40 border-[#CCFF00]/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 flex flex-col items-end">
                <span className="text-[9px] font-black text-neon-accent/50 tracking-widest">INN {match.currentInnings}</span>
                {isSecondInnings && (
                    <span className="text-[9px] font-black text-white/20 uppercase">TARGET: {target}</span>
                )}
             </div>
             
             <div className="flex flex-col items-center">
                 <div className="flex items-baseline gap-2">
                    <h1 className="text-7xl font-black tracking-tighter italic">{currentInn.runs}/{currentInn.wickets}</h1>
                 </div>
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">
                    {formatOver(currentInn.balls)} / {match.totalOvers} OVERS 
                 </p>
             </div>

             <div className="grid grid-cols-2 mt-8 pt-6 border-t border-white/5 gap-4">
                 <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Curr RR</span>
                    <span className="text-lg font-black italic">{rr.toFixed(2)}</span>
                 </div>
                 <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Req RR</span>
                    <span className="text-lg font-black italic">
                        {isSecondInnings ? calculateRR(target - currentInn.runs, (match.totalOvers * 6) - currentInn.balls).toFixed(2) : '--'}
                    </span>
                 </div>
             </div>
        </div>

        {/* Active Players Display */}
        <div className="grid grid-cols-2 gap-3">
            <div 
              onClick={() => setShowPlayerModal('striker')}
              className="glass-card p-3 flex items-center gap-3 active-player-highlight border-[#CCFF00]/20 cursor-pointer"
            >
                <div className="w-8 h-8 rounded-full bg-[#CCFF00]/10 flex items-center justify-center relative">
                    <User className="w-4 h-4 text-[#CCFF00]" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-neon-accent rounded-full animate-pulse" />
                </div>
                <div className="overflow-hidden flex-1">
                    <div className="flex justify-between items-start">
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Striker</p>
                        <p className="text-[8px] font-mono text-neon-accent font-bold">SR {strikerScore.balls > 0 ? ((strikerScore.runs / strikerScore.balls) * 100).toFixed(0) : '0'}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="font-bold text-[11px] truncate">{match.strikerId || '---'}</p>
                        <p className="font-black italic text-xs text-white">{strikerScore.runs}({strikerScore.balls})</p>
                    </div>
                </div>
            </div>
            <div 
              onClick={() => setShowPlayerModal('nonstriker')}
              className="glass-card p-3 flex items-center gap-3 border-white/5 cursor-pointer"
            >
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <User className="w-4 h-4 text-white/30" />
                </div>
                <div className="overflow-hidden flex-1">
                    <div className="flex justify-between items-start">
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Non-Striker</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="font-bold text-[11px] truncate">{match.nonStrikerId || '---'}</p>
                        <p className="font-bold text-xs text-white/40">{nonStrikerScore.runs}({nonStrikerScore.balls})</p>
                    </div>
                </div>
            </div>
            <div className="glass-card p-3 col-span-2 flex items-center justify-between border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <RotateCw className="w-4 h-4 text-white/30" />
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Current Bowler</p>
                        <p className="font-bold text-xs">{match.currentBowlerId || '---'}</p>
                    </div>
                </div>
                <button 
                  onClick={() => setShowPlayerModal('bowler')}
                  className="text-[9px] font-black text-neon-accent uppercase tracking-widest bg-neon-accent/10 px-2 py-1 rounded border border-neon-accent/20"
                >
                    Change
                </button>
            </div>
        </div>

        {isSecondInnings && (
            <div className="p-3 bg-neon-accent text-black rounded-lg text-center font-black text-[11px] uppercase tracking-tighter shadow-lg shadow-neon-accent/20">
                {battingTeam} NEEDS <span className="text-sm">{target - currentInn.runs}</span> RUNS IN <span className="text-sm">{(match.totalOvers * 6) - currentInn.balls}</span> BALLS
            </div>
        )}

        {/* Scoring Actions Grid */}
        <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3, 4, 6].map(r => (
                <button 
                    key={r} 
                    onClick={() => handleScore(r)}
                    className="score-btn italic"
                >
                    {r}
                </button>
            ))}
            <button 
                onClick={() => handleScore(0, 'wide')}
                className="score-btn text-neon-accent text-sm tracking-widest"
            >
                WD
            </button>
            <button 
                onClick={() => handleScore(0, 'noBall')}
                className="score-btn text-neon-accent text-sm tracking-widest"
            >
                NB
            </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
            <button 
                onClick={handleWicket}
                className="btn-secondary text-red-500 border-red-500/20 py-6"
            >
                <AlertCircle className="w-5 h-5" /> WICKET
            </button>
            <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={() => handleScore(0, 'bye')}
                    className="btn-secondary py-3 text-xs"
                >
                    BYE
                </button>
                <button 
                    onClick={() => handleScore(0, 'legBye')}
                    className="btn-secondary py-3 text-xs"
                >
                    L.BYE
                </button>
            </div>
        </div>

        {/* Secondary Actions */}
        <div className="flex gap-2">
            <button 
                onClick={undoLastBall}
                className="flex-1 btn-secondary py-3 border-none bg-white/5 disabled:opacity-50"
                disabled={currentInningsBallsList(match).length === 0}
            >
                <Undo2 className="w-4 h-4" /> UNDO
            </button>
            <button className="flex-1 btn-secondary py-3 border-none bg-white/5">
                <RotateCw className="w-4 h-4" /> REFRESH
            </button>
        </div>

        {/* Recent Balls */}
        <div className="glass-card p-3">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase font-bold text-gray-500">This Over</span>
                <span className="text-[10px] font-mono text-gray-500">{currentInn.balls % 6 === 0 && currentInn.balls > 0 ? 'Over complete!' : ''}</span>
             </div>
             <div className="flex gap-2 overflow-x-auto pb-2">
                 {currentInn.ballsList.slice(-6).map((b, i) => (
                     <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-[10px] tracking-tighter
                        ${b.wicket ? 'bg-red-500 text-white' : b.runs === 6 ? 'bg-neon-accent text-black' : b.runs === 4 ? 'bg-neon-accent/40 text-black font-black' : 'bg-white/5 border border-white/5 text-white/50'}`}>
                        {b.wicket ? 'W' : (b.extras.wide ? 'Wd' : (b.extras.noBall ? 'Nb' : b.runs))}
                     </div>
                 ))}
                 {currentInn.ballsList.length === 0 && <span className="text-xs text-gray-600">No balls yet</span>}
             </div>
        </div>
      </div>
    </Layout>
  );
};

const currentInningsBallsList = (match: any) => {
    return (match.currentInnings === 1 ? match.innings1 : match.innings2).ballsList;
};

