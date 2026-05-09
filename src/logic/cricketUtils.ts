import { type Match, type MatchBall, type PlayerStats } from '../db/database';

export const calculateRR = (runs: number, balls: number) => {
  if (balls === 0) return 0;
  return (runs / (balls / 6));
};

export const formatOver = (balls: number) => {
  const overs = Math.floor(balls / 6);
  const extraBalls = balls % 6;
  return `${overs}.${extraBalls}`;
};

export const getTarget = (innings1Runs: number) => innings1Runs + 1;

export const calculateMOM = (match: Match): string => {
  const winner = match.winner;
  if (!winner || winner === 'Match Tied') return 'N/A';

  const winningSquad = winner === match.teamAName ? match.teamAPlayers : match.teamBPlayers;
  const allBatStats = { ...match.innings1.battingStats, ...match.innings2.battingStats };
  const allBowlStats = { ...match.innings1.bowlingStats, ...match.innings2.bowlingStats };

  let bestPlayer = 'N/A';
  let maxScore = -Infinity;

  winningSquad.forEach(player => {
    const bat = allBatStats[player] || { runs: 0, fours: 0, sixes: 0, balls: 0 };
    const bowl = allBowlStats[player] || { wickets: 0, runsConceded: 0, balls: 0 };
    
    // Weighted scoring
    const score = (bat.runs * 1) + 
                  (bat.fours * 0.5) + 
                  (bat.sixes * 1) + 
                  (bowl.wickets * 25) - 
                  (bowl.runsConceded * 0.2);

    if (score > maxScore) {
      maxScore = score;
      bestPlayer = player;
    }
  });

  return bestPlayer;
};
