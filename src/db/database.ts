import Dexie, { type Table } from 'dexie';

export interface PlayerStats {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  wickets: number;
  overs: number;
  maidens: number;
  runsConceded: number;
}

export interface MatchBall {
  overNumber: number;
  ballNumber: number;
  bowlerId: string;
  batsmanId: string;
  nonStrikerId: string;
  runs: number;
  extras: {
    wide: number;
    noBall: number;
    bye: number;
    legBye: number;
  };
  wicket?: {
    type: string;
    playerOutId: string;
  };
  isLegalBall: boolean;
  timestamp: number;
}

export interface Match {
  id: string;
  teamAName: string;
  teamBName: string;
  totalOvers: number;
  playersPerTeam: number;
  tossWinner?: string;
  tossChoice?: 'bat' | 'bowl';
  status: 'ongoing' | 'completed';
  startTime: number;
  endTime?: number;
  winner?: string;
  margin?: string;
  manOfTheMatch?: string;
  
  // Custom Rules
  rules: {
    wideExtraRuns: number;
    noBallExtraRuns: number;
  };
  
  // Players
  teamAPlayers: string[];
  teamBPlayers: string[];

  // Scoring State
  currentInnings: 1 | 2;
  strikerId?: string;
  nonStrikerId?: string;
  currentBowlerId?: string;
  innings1: {
    runs: number;
    wickets: number;
    balls: number;
    ballsList: MatchBall[];
    battingStats: Record<string, PlayerStats>;
    bowlingStats: Record<string, PlayerStats>;
  };
  innings2: {
    runs: number;
    wickets: number;
    balls: number;
    ballsList: MatchBall[];
    battingStats: Record<string, PlayerStats>;
    bowlingStats: Record<string, PlayerStats>;
  };
}

export interface Tournament {
  id: string;
  name: string;
  teams: string[];
  matchIds: string[];
  createdAt: number;
}

export class BadmoshDatabase extends Dexie {
  matches!: Table<Match>;
  tournaments!: Table<Tournament>;

  constructor() {
    super('BadmoshScorerDB');
    this.version(1).stores({
      matches: 'id, teamAName, teamBName, status, startTime',
      tournaments: 'id, name, createdAt'
    });
  }
}

export const db = new BadmoshDatabase();
