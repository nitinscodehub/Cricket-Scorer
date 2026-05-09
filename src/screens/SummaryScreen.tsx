import { useState, useRef } from 'react';
import { Layout, ActionButton } from '../components/SharedUI';
import { useScoring } from '../hooks/useScoring';
import { formatOver, calculateRR, calculateMOM } from '../logic/cricketUtils';
import { Share2, Download, Trophy, User, Check, Edit2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface SummaryProps {
  matchId: string;
  onBack: () => void;
}

const InningsSummary = ({ teamName, runs, wickets, balls, battingStats, bowlingStats, squad, bowlingSquad }: any) => {
    const rr = calculateRR(runs, balls);

    return (
        <div className="glass-card p-0 border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="flex justify-between items-center p-5 bg-white/5">
                <div>
                    <h4 className="font-black uppercase italic tracking-tight text-lg">{teamName}</h4>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">OVERS {formatOver(balls)} • RR {rr.toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-end text-right">
                    <span className="text-3xl font-black italic neon-text leading-none">{runs}/{wickets}</span>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Batting Stats */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h5 className="text-[9px] font-black uppercase text-neon-accent tracking-widest italic font-mono opacity-80">Batting Card</h5>
                        <div className="flex gap-4 text-[7px] font-black text-white/20 uppercase tracking-widest pr-2">
                            <span className="w-10 text-right">R(B)</span>
                            <span className="w-4 text-center">4s</span>
                            <span className="w-4 text-center">6s</span>
                            <span className="w-8 text-center">SR</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {squad.map((player: string) => {
                            const stats = battingStats[player];
                            if (!stats || (stats.balls === 0 && stats.runs === 0)) return null; 
                            
                            const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : '0';

                            return (
                                <div key={player} className="flex justify-between items-center text-[11px] p-2 rounded bg-white/[0.02] border border-white/[0.02]">
                                    <span className="font-bold opacity-90 truncate max-w-[100px]">{player}</span>
                                    <div className="flex gap-4 font-mono font-black italic items-center">
                                        <span className="w-10 text-right">{stats.runs}<span className="text-[9px] opacity-30 font-normal ml-0.5">({stats.balls})</span></span>
                                        <span className="w-4 text-center opacity-40">{stats.fours || 0}</span>
                                        <span className="w-4 text-center opacity-40">{stats.sixes || 0}</span>
                                        <span className="w-8 text-center text-[9px] text-neon-accent/60 font-normal">{sr}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bowling Stats */}
                <div>
                    <h5 className="text-[9px] font-black uppercase text-white/30 tracking-widest mb-3 italic font-mono">Bowling Card</h5>
                    <div className="space-y-1">
                        {bowlingSquad.map((player: string) => {
                            const stats = bowlingStats[player];
                            if (!stats || (stats.balls === 0 && stats.wickets === 0)) return null;
                            
                            const econ = stats.balls > 0 ? (stats.runsConceded / (stats.balls / 6)).toFixed(2) : '0.00';

                            return (
                                <div key={player} className="flex justify-between items-center text-[10px] p-2 rounded border border-white/[0.01]">
                                    <span className="font-bold opacity-60 truncate max-w-[100px]">{player}</span>
                                    <div className="flex gap-4 font-mono italic items-center">
                                        <span className="text-neon-accent font-black text-xs">{stats.wickets}<span className="text-[10px] opacity-40 font-normal ml-0.5">/{stats.runsConceded}</span></span>
                                        <span className="text-[9px] opacity-40 w-10 text-center">({formatOver(stats.balls)})</span>
                                        <span className="text-[9px] opacity-30 w-8 text-right font-normal">EC {econ}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SummaryScreen: React.FC<SummaryProps> = ({ matchId, onBack }) => {
    const { match, loading } = useScoring(matchId);
    const [showEditMOM, setShowEditMOM] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    if (loading || !match) return <Layout title="Loading..."><div className="p-8 text-center">Crunching numbers...</div></Layout>;

    const winningSquad = match.winner === match.teamAName ? match.teamAPlayers : match.teamBPlayers;

    const handleUpdateMOM = async (playerName: string) => {
        if (!match) return;
        const { db } = await import('../db/database');
        await db.matches.update(match.id, { manOfTheMatch: playerName });
        setShowEditMOM(false);
        window.location.reload(); // Quick way to refresh for dexie
    };

    const teamABattsFirst = (match.tossWinner === match.teamAName && match.tossChoice === 'bat') || 
                            (match.tossWinner === match.teamBName && match.tossChoice === 'bowl');
    
    // Innings 1 data
    const inn1BattingTeam = teamABattsFirst ? match.teamAName : match.teamBName;
    const inn1BowlingTeam = teamABattsFirst ? match.teamBName : match.teamAName;
    const inn1BattingSquad = teamABattsFirst ? match.teamAPlayers : match.teamBPlayers;
    const inn1BowlingSquad = teamABattsFirst ? match.teamBPlayers : match.teamAPlayers;

    // Innings 2 data
    const inn2BattingTeam = teamABattsFirst ? match.teamBName : match.teamAName;
    const inn2BowlingTeam = teamABattsFirst ? match.teamAName : match.teamBName;
    const inn2BattingSquad = teamABattsFirst ? match.teamBPlayers : match.teamAPlayers;
    const inn2BowlingSquad = teamABattsFirst ? match.teamAPlayers : match.teamBPlayers;

    const handleExportPDF = async () => {
        if (!printRef.current) return;
        const canvas = await html2canvas(printRef.current, { backgroundColor: '#0D0D0D' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`badmosh_match_${match.id.slice(0, 5)}.pdf`);
    };

    return (
        <Layout title="Match Summary" showBackButton onBack={onBack}>
            <div className="flex flex-col gap-6 py-4" ref={printRef}>
                {/* Result Header */}
                <div className="glass-card bg-black flex flex-col items-center justify-center border-[#CCFF00]/20 text-center py-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#CCFF00] shadow-[0_0_15px_#CCFF00]" />
                    <Trophy className="w-12 h-12 text-[#CCFF00] mx-auto mb-4 animate-bounce" />
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.5em] mb-2 font-mono">MATCH RESULT</p>
                    <h2 className="text-3xl font-black text-[#CCFF00] uppercase italic tracking-tighter drop-shadow-[0_0_10px_#CCFF0020]">{match.winner}</h2>
                    <p className="text-white font-black uppercase tracking-[0.2em] text-[10px] mt-4 opacity-50">WON BY {match.margin}</p>
                </div>

                {/* MOM Section */}
                <div className="glass-card flex flex-col border-[#CCFF00]/10 active-player-highlight p-0 overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full border border-[#CCFF00] p-1">
                                <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center">
                                    <User className="w-5 h-5 text-[#CCFF00]" />
                                </div>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Man of the Match</p>
                                <p className="text-base font-black uppercase italic tracking-tight">{match.manOfTheMatch || 'N/A'}</p>
                            </div>
                        </div>
                        {match.winner !== 'Match Tied' && !showEditMOM && (
                            <button 
                                onClick={() => setShowEditMOM(true)}
                                className="p-2 bg-white/5 rounded-full text-white/40 hover:text-[#CCFF00] hover:bg-[#CCFF00]/10 transition-all"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {showEditMOM && (
                        <div className="bg-white/5 p-4 border-t border-white/5">
                            <p className="text-[9px] font-black text-neon-accent uppercase tracking-widest mb-3">Choose from {match.winner}</p>
                            <div className="grid grid-cols-2 gap-2">
                                {winningSquad.map((player) => (
                                    <button 
                                        key={player}
                                        onClick={() => handleUpdateMOM(player)}
                                        className={`p-2 text-[10px] font-black uppercase rounded border transition-all ${match.manOfTheMatch === player ? 'bg-neon-accent text-black border-neon-accent' : 'bg-white/5 text-white/60 border-white/5'}`}
                                    >
                                        {player}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => setShowEditMOM(false)}
                                className="w-full mt-4 py-2 text-[9px] font-black text-white/30 uppercase tracking-widest border border-white/5 rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* Scorecard Sections */}
                <div className="flex flex-col gap-8">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] px-2 italic">1st Innings</h3>
                        <InningsSummary 
                            teamName={inn1BattingTeam} 
                            runs={match.innings1.runs} 
                            wickets={match.innings1.wickets} 
                            balls={match.innings1.balls}
                            battingStats={match.innings1.battingStats}
                            bowlingStats={match.innings1.bowlingStats}
                            squad={inn1BattingSquad}
                            bowlingSquad={inn1BowlingSquad}
                        />
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] px-2 italic">2nd Innings</h3>
                        <InningsSummary 
                            teamName={inn2BattingTeam} 
                            runs={match.innings2.runs} 
                            wickets={match.innings2.wickets} 
                            balls={match.innings2.balls}
                            battingStats={match.innings2.battingStats}
                            bowlingStats={match.innings2.bowlingStats}
                            squad={inn2BattingSquad}
                            bowlingSquad={inn2BowlingSquad}
                        />
                    </div>
                </div>

                {/* Export Actions */}
                <div className="grid grid-cols-2 gap-3 mt-4 no-print sm:px-0 px-2">
                    <button onClick={handleExportPDF} className="btn-secondary w-full py-4 bg-white/5 flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" /> PDF Report
                    </button>
                    <button onClick={onBack} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                         DONE
                    </button>
                </div>
            </div>
        </Layout>
    );
};
