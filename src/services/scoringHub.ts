import * as signalR from '@microsoft/signalr';
import type { BallUpdate, LiveScore, Scorecard } from '../types';

const SCORING_HUB_URL = import.meta.env.VITE_SIGNALR_URL || (import.meta.env.DEV ? '/hubs/scoring' : 'http://124.123.3.225:9000/hubs/scoring');

class ScoringHubService {
  private connection: signalR.HubConnection | null = null;

  async connect(): Promise<void> {
    // Reuse existing connection if already connected or connecting
    if (this.connection) {
      const state = this.connection.state;
      if (state === signalR.HubConnectionState.Connected) return;
      if (state === signalR.HubConnectionState.Connecting || state === signalR.HubConnectionState.Reconnecting) {
        // Wait for existing connection attempt
        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (this.connection?.state === signalR.HubConnectionState.Connected ||
                this.connection?.state === signalR.HubConnectionState.Disconnected) {
              clearInterval(check);
              resolve();
            }
          }, 200);
        });
        if (this.connection.state === signalR.HubConnectionState.Connected) return;
      }
      // Disconnected — clean up and create fresh
      try { await this.connection.stop(); } catch { /* ignore */ }
      this.connection = null;
    }

    const token = localStorage.getItem('token');
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(SCORING_HUB_URL, { accessTokenFactory: () => token || '' })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    await this.connection.start();
  }

  async disconnect(): Promise<void> {
    if (this.connection) await this.connection.stop();
  }

  async joinMatch(matchId: string): Promise<void> {
    await this.connection?.invoke('JoinMatch', matchId);
  }

  async leaveMatch(matchId: string): Promise<void> {
    await this.connection?.invoke('LeaveMatch', matchId);
  }

  async recordBall(ball: BallUpdate): Promise<void> {
    await this.connection?.invoke('RecordBall', ball);
  }

  onScorecardLoaded(callback: (scorecard: Scorecard) => void): void {
    this.connection?.on('ScorecardLoaded', callback);
  }

  onBallUpdate(callback: (ball: BallUpdate) => void): void {
    this.connection?.on('BallUpdate', callback);
  }

  onScoreUpdate(callback: (score: LiveScore) => void): void {
    this.connection?.on('ScoreUpdate', callback);
  }

  onWicketFallen(callback: (data: { batsmanName: string; dismissalType: string; teamScore: number; wickets: number }) => void): void {
    this.connection?.on('WicketFallen', callback);
  }

  onInningsBreak(callback: (data: { inningsNumber: number; totalRuns: number; totalWickets: number; totalOvers: number }) => void): void {
    this.connection?.on('InningsBreak', callback);
  }

  removeAllListeners(): void {
    this.connection?.off('ScorecardLoaded');
    this.connection?.off('BallUpdate');
    this.connection?.off('ScoreUpdate');
    this.connection?.off('WicketFallen');
    this.connection?.off('InningsBreak');
  }
}

export const scoringHub = new ScoringHubService();
