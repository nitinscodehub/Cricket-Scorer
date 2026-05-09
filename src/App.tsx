import { useState, useEffect } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { MatchSetupScreen } from './screens/MatchSetupScreen';
import { LiveScoringScreen } from './screens/LiveScoringScreen';
import { SummaryScreen } from './screens/SummaryScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { TournamentScreen } from './screens/TournamentScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { db } from './db/database';

type Screen = 'home' | 'setup' | 'live' | 'history' | 'summary' | 'tournament' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  // Auto-resume logic
  useEffect(() => {
    db.matches.where('status').equals('ongoing').limit(1).toArray().then(ongoing => {
      if (ongoing.length > 0) {
        // Option to resume would be nice, for now just allow manual navigation
      }
    });
  }, []);

  const navigate = (screen: string, matchId?: string) => {
    setCurrentScreen(screen as Screen);
    if (matchId) setActiveMatchId(matchId);
  };

  return (
    <div className="min-h-screen bg-off-black">
      {currentScreen === 'home' && <HomeScreen onNavigate={navigate} />}
      {currentScreen === 'setup' && <MatchSetupScreen onBack={() => navigate('home')} onStartMatch={(id) => navigate('live', id)} />}
      {currentScreen === 'live' && activeMatchId && (
        <LiveScoringScreen 
          matchId={activeMatchId} 
          onBack={() => navigate('home')} 
          onViewSummary={(id) => navigate('summary', id)} 
        />
      )}
      {currentScreen === 'summary' && activeMatchId && (
        <SummaryScreen matchId={activeMatchId} onBack={() => navigate('home')} />
      )}
      {currentScreen === 'history' && (
        <HistoryScreen onBack={() => navigate('home')} onSelectMatch={(id) => navigate('summary', id)} />
      )}
      {currentScreen === 'tournament' && (
        <TournamentScreen onBack={() => navigate('home')} />
      )}
      {currentScreen === 'settings' && (
        <SettingsScreen onBack={() => navigate('home')} />
      )}
      {/* Fallback for generic screens */}
      {(['generic'].includes(currentScreen)) && (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
             <p className="text-neon-green font-bold uppercase tracking-widest text-sm">Feature coming soon</p>
             <button onClick={() => navigate('home')} className="btn-secondary">Go Home</button>
        </div>
      )}
    </div>
  );
}
