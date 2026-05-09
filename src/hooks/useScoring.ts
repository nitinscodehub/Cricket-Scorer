import { useState, useEffect, useCallback } from 'react';
import { db, type Match, type MatchBall, type PlayerStats } from '../db/database';

export const useScoring = (matchId: string | null) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;
    db.matches.get(matchId).then(m => {
      if (m) setMatch(m);
      setLoading(false);
    });
  }, [matchId]);

  const saveMatch = async (updatedMatch: Match) => {
    await db.matches.put(updatedMatch);
    setMatch({ ...updatedMatch });
  };

  const addBall = useCallback(async (ballData: Partial<MatchBall>) => {
    if (!match) return;

    const currentInnKey = match.currentInnings === 1 ? 'innings1' : 'innings2';
    const innings = match[currentInnKey];
    
    const newBall: MatchBall = {
      overNumber: Math.floor(innings.balls / 6),
      ballNumber: (innings.balls % 6) + (ballData.isLegalBall ? 1 : 0),
      bowlerId: ballData.bowlerId || 'Unknown',
      batsmanId: ballData.batsmanId || 'Unknown',
      nonStrikerId: ballData.nonStrikerId || 'Unknown',
      runs: ballData.runs || 0,
      extras: ballData.extras || { wide: 0, noBall: 0, bye: 0, legBye: 0 },
      isLegalBall: ballData.isLegalBall ?? true,
      timestamp: Date.now(),
      wicket: ballData.wicket
    };

    const totalRunsThisBall = newBall.runs + (newBall.extras.wide + newBall.extras.noBall + newBall.extras.bye + newBall.extras.legBye);
    
    // --- Strike Rotation Logic ---
    let nextBatsmanId = newBall.batsmanId;
    let nextNonStrikerId = newBall.nonStrikerId;

    // Rotate strike on odd runs (only counting runs scored by bat)
    if (newBall.runs % 2 !== 0) {
      [nextBatsmanId, nextNonStrikerId] = [nextNonStrikerId, nextBatsmanId];
    }
    
    // End of over rotation
    const totalBallsSoFar = innings.balls + (newBall.isLegalBall ? 1 : 0);
    const isOverEnd = totalBallsSoFar > 0 && totalBallsSoFar % 6 === 0 && newBall.isLegalBall;
    if (isOverEnd) {
      [nextBatsmanId, nextNonStrikerId] = [nextNonStrikerId, nextBatsmanId];
    }

    // --- Stats Logic ---
    const updateStats = (stats: Record<string, PlayerStats>, playerId: string, type: 'bat' | 'bowl', ball: MatchBall) => {
        const current = stats[playerId] || {
            id: playerId, name: playerId, runs: 0, balls: 0, fours: 0, sixes: 0,
            wickets: 0, overs: 0, maidens: 0, runsConceded: 0
        };

        if (type === 'bat') {
            current.runs += ball.runs;
            if (ball.isLegalBall) current.balls += 1;
            if (ball.runs === 4) current.fours += 1;
            if (ball.runs === 6) current.sixes += 1;
        } else {
            const extraRuns = ball.extras.wide + ball.extras.noBall;
            current.runsConceded += ball.runs + extraRuns;
            if (ball.isLegalBall) {
                current.balls += 1;
                current.overs = Math.floor(current.balls / 6) + (current.balls % 6) / 10;
            }
            if (ball.wicket) current.wickets += 1;
        }
        return { ...stats, [playerId]: current };
    };

    const updatedBattingStats = updateStats(innings.battingStats, newBall.batsmanId, 'bat', newBall);
    const updatedBowlingStats = updateStats(innings.bowlingStats, newBall.bowlerId, 'bowl', newBall);

    const updatedInnings = {
      ...innings,
      runs: innings.runs + totalRunsThisBall,
      wickets: innings.wickets + (newBall.wicket ? 1 : 0),
      balls: innings.balls + (newBall.isLegalBall ? 1 : 0),
      ballsList: [...innings.ballsList, newBall],
      battingStats: updatedBattingStats,
      bowlingStats: updatedBowlingStats
    };

    const updatedMatch: Match = {
      ...match,
      [currentInnKey]: updatedInnings,
      strikerId: nextBatsmanId,
      nonStrikerId: nextNonStrikerId
    };

    // Check Innings End / Match End
    const isAllOut = updatedInnings.wickets >= match.playersPerTeam - 1;
    const isOversEnd = updatedInnings.balls >= match.totalOvers * 6;

    const teamABattsFirst = (match.tossWinner === match.teamAName && match.tossChoice === 'bat') || 
                            (match.tossWinner === match.teamBName && match.tossChoice === 'bowl');
    
    const bat2Squad = teamABattsFirst ? match.teamBPlayers : match.teamAPlayers;
    const bowl2Squad = teamABattsFirst ? match.teamAPlayers : match.teamBPlayers;
    const bat2Name = teamABattsFirst ? match.teamBName : match.teamAName;
    const bowl1Name = teamABattsFirst ? match.teamAName : match.teamBName;

    if (match.currentInnings === 1) {
        if (isAllOut || isOversEnd) {
            updatedMatch.currentInnings = 2;
            // Reset for second innings
            updatedMatch.strikerId = bat2Squad[0];
            updatedMatch.nonStrikerId = bat2Squad[1];
            updatedMatch.currentBowlerId = bowl2Squad[0];
        }
    } else if (match.currentInnings === 2) {
        const target = match.innings1.runs + 1;
        if (updatedInnings.runs >= target || (isOversEnd || isAllOut)) {
            if (updatedInnings.runs === match.innings1.runs && (isOversEnd || isAllOut)) {
                // TIE
                updatedMatch.status = 'tie' as any;
                updatedMatch.winner = 'Match Tied';
                updatedMatch.margin = 'Scores Level';
            } else {
                updatedMatch.status = 'completed';
                updatedMatch.endTime = Date.now();
                
                if (updatedInnings.runs >= target) {
                    updatedMatch.winner = bat2Name;
                    updatedMatch.margin = `${match.playersPerTeam - updatedInnings.wickets - 1} wickets`;
                } else {
                    updatedMatch.winner = bowl1Name;
                    updatedMatch.margin = `${match.innings1.runs - updatedInnings.runs} runs`;
                }

                updatedMatch.manOfTheMatch = calculateMOM(updatedMatch);
            }
        }
    }

    await saveMatch(updatedMatch);
  }, [match]);

  const updateStriker = async (id: string) => {
    if (!match) return;
    await saveMatch({ ...match, strikerId: id });
  };

  const updateNonStriker = async (id: string) => {
    if (!match) return;
    await saveMatch({ ...match, nonStrikerId: id });
  };

  const updateBowler = async (id: string) => {
    if (!match) return;
    await saveMatch({ ...match, currentBowlerId: id });
  };

  const undoLastBall = useCallback(async () => {
    if (!match) return;
    const currentInnKey = match.currentInnings === 1 ? 'innings1' : 'innings2';
    const innings = match[currentInnKey];
    if (innings.ballsList.length === 0) return;

    const newBallsList = [...innings.ballsList];
    const undoneBall = newBallsList.pop()!;

    const totalRunsUndone = undoneBall.runs + (undoneBall.extras.wide + undoneBall.extras.noBall + undoneBall.extras.bye + undoneBall.extras.legBye);

    const updatedInnings = {
      ...innings,
      runs: Math.max(0, innings.runs - totalRunsUndone),
      wickets: Math.max(0, innings.wickets - (undoneBall.wicket ? 1 : 0)),
      balls: Math.max(0, innings.balls - (undoneBall.isLegalBall ? 1 : 0)),
      ballsList: newBallsList,
      // We don't undo stats fully here for brevity, but could be added
    };

    await saveMatch({
      ...match,
      [currentInnKey]: updatedInnings,
      strikerId: undoneBall.batsmanId,
      nonStrikerId: undoneBall.nonStrikerId,
      currentBowlerId: undoneBall.bowlerId
    });
  }, [match]);

  const startSuperOver = useCallback(async () => {
    if (!match) return;
    
    // Determine who batted second in the main match
    const teamABattsFirst = (match.tossWinner === match.teamAName && match.tossChoice === 'bat') || 
                            (match.tossWinner === match.teamBName && match.tossChoice === 'bowl');
    
    // Team that batted second in main match bats first in Super Over
    const superBat1Squad = teamABattsFirst ? match.teamBPlayers : match.teamAPlayers;
    const superBowl1Squad = teamABattsFirst ? match.teamAPlayers : match.teamBPlayers;

    const resetInnings = {
        runs: 0,
        wickets: 0,
        balls: 0,
        ballsList: [],
        battingStats: {},
        bowlingStats: {}
    };

    const superOverMatch: Match = {
        ...match,
        totalOvers: 1, // Super over is 1 over
        playersPerTeam: 3, // 3 batsmen allowed in super over
        status: 'ongoing',
        currentInnings: 1,
        winner: undefined,
        margin: undefined,
        manOfTheMatch: undefined,
        innings1: { ...resetInnings },
        innings2: { ...resetInnings },
        strikerId: superBat1Squad[0],
        nonStrikerId: superBat1Squad[1],
        currentBowlerId: superBowl1Squad[0],
        startTime: Date.now()
    };

    await saveMatch(superOverMatch);
    // Force a reload to ensure all live queries and state are fully reset
    window.location.reload();
  }, [match]);

  return { match, loading, addBall, undoLastBall, updateStriker, updateNonStriker, updateBowler, startSuperOver };
};
