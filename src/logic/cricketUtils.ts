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
  const allStats: Record<string, number> = {};
  const innings = [match.innings1, match.innings2];

  innings.forEach(inn => {
    Object.values(inn.battingStats).forEach(s => {
      const score = (s.runs * 1) + (s.fours * 0.5) + (s.sixes * 1) + (s.runs > 50 ? 5 : 0);
      allStats[s.name] = (allStats[s.name] || 0) + score;
    });
    Object.values(inn.bowlingStats).forEach(s => {
      const score = (s.wickets * 20) + (s.maidens * 10) - (s.runsConceded * 0.5);
      allStats[s.name] = (allStats[s.name] || 0) + score;
    });
  });

  let bestPlayer = 'N/A';
  let maxScore = -Infinity;
  for (const [name, score] of Object.entries(allStats)) {
    if (score > maxScore) {
      maxScore = score;
      bestPlayer = name;
    }
  }
  return bestPlayer;
};
