import { useState, useEffect, useCallback } from 'react';
import { scoringHub } from '../services/scoringHub';
import type { LiveScore, BallUpdate, Scorecard } from '../types';

export function useLiveScoring(matchId: string | undefined) {
  const [liveScore, setLiveScore] = useState<LiveScore | null>(null);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [lastBall, setLastBall] = useState<BallUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!matchId) return;

    const connect = async () => {
      try {
        await scoringHub.connect();
        setIsConnected(true);
        await scoringHub.joinMatch(matchId);

        scoringHub.onScorecardLoaded(setScorecard);
        scoringHub.onScoreUpdate(setLiveScore);
        scoringHub.onBallUpdate(setLastBall);
      } catch (err) {
        console.error('Failed to connect to scoring hub:', err);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      scoringHub.removeAllListeners();
      scoringHub.leaveMatch(matchId);
      scoringHub.disconnect();
      setIsConnected(false);
    };
  }, [matchId]);

  const sendBall = useCallback(async (ball: BallUpdate) => {
    await scoringHub.recordBall(ball);
  }, []);

  return { liveScore, scorecard, lastBall, isConnected, sendBall };
}
