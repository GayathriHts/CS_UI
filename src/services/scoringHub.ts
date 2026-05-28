import * as signalR from '@microsoft/signalr';
import type { LiveUpdatedEvent, DeliveryAddedEvent, DeliveryVoidedEvent } from '../types';

// Hub path must match the backend: /hubs/score (not /hubs/scoring)
const SCORING_HUB_URL = import.meta.env.VITE_SIGNALR_URL || (import.meta.env.DEV ? '/hubs/score' : 'http://40.81.244.40:9000/hubs/score');

class ScoringHubService {
  private connection: signalR.HubConnection | null = null;
  private matchId: string | null = null;

  // Event callbacks
  public onLiveUpdated: ((data: LiveUpdatedEvent) => void) | null = null;
  public onDeliveryAdded: ((data: DeliveryAddedEvent) => void) | null = null;
  public onDeliveryVoided: ((data: DeliveryVoidedEvent) => void) | null = null;
  public onConnectionStateChange: ((state: signalR.HubConnectionState) => void) | null = null;

  async connect(): Promise<void> {
    // Reuse existing connection if already connected or connecting
    if (this.connection) {
      const state = this.connection.state;
      if (state === signalR.HubConnectionState.Connected) return;
      if (state === signalR.HubConnectionState.Connecting || state === signalR.HubConnectionState.Reconnecting) {
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
      try { await this.connection.stop(); } catch { /* ignore */ }
      this.connection = null;
    }

    // No JWT required for SignalR hub (confirmed by backend)
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(SCORING_HUB_URL)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.setupListeners();
    await this.connection.start();
    this.onConnectionStateChange?.(signalR.HubConnectionState.Connected);
  }

  private setupListeners(): void {
    if (!this.connection) return;

    this.connection.on('LiveUpdated', (data: LiveUpdatedEvent) => {
      this.onLiveUpdated?.(data);
    });

    this.connection.on('DeliveryAdded', (data: DeliveryAddedEvent) => {
      this.onDeliveryAdded?.(data);
    });

    this.connection.on('DeliveryVoided', (data: DeliveryVoidedEvent) => {
      this.onDeliveryVoided?.(data);
    });

    this.connection.onreconnecting(() => {
      this.onConnectionStateChange?.(signalR.HubConnectionState.Reconnecting);
    });

    this.connection.onreconnected(() => {
      this.onConnectionStateChange?.(signalR.HubConnectionState.Connected);
      // Re-join the match group after reconnection
      if (this.matchId) {
        this.joinMatch(this.matchId);
      }
    });

    this.connection.onclose(() => {
      this.onConnectionStateChange?.(signalR.HubConnectionState.Disconnected);
    });
  }

  async disconnect(): Promise<void> {
    if (this.matchId && this.connection) {
      await this.leaveMatch(this.matchId);
    }
    await this.connection?.stop();
    this.connection = null;
  }

  async joinMatch(matchId: string): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    this.matchId = matchId;
    await this.connection.invoke('JoinMatch', matchId);
  }

  async leaveMatch(matchId: string): Promise<void> {
    if (!this.connection) return;
    this.matchId = null;
    await this.connection.invoke('LeaveMatch', matchId);
  }

  get state(): signalR.HubConnectionState {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected;
  }
}

export const scoringHub = new ScoringHubService();
