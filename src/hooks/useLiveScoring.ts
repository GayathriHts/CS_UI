import { useState, useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { scoringHub } from '../services/scoringHub';
import { scoringService } from '../services/cricketSocialService';
import type { LiveUpdatedEvent, DeliveryAddedEvent, DeliveryVoidedEvent, Scorecard } from '../types';

export function useLiveScoring(matchId: string | undefined) {
  const [liveUpdate, setLiveUpdate] = useState<LiveUpdatedEvent | null>(null);
  const [lastDelivery, setLastDelivery] = useState<DeliveryAddedEvent | null>(null);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const isMounted = useRef(true);

  // Fetch the full scorecard from the REST API
  const fetchScorecard = useCallback(async () => {
    if (!matchId) return;
    try {
      const res = await scoringService.getScorecard(matchId);
      if (isMounted.current) {
        setScorecard(res.data?.data ?? res.data);
      }
    } catch (err) {
      console.error('Failed to fetch scorecard:', err);
    }
  }, [matchId]);

  useEffect(() => {
    isMounted.current = true;
    if (!matchId) return;

    const connect = async () => {
      // Set up event handlers before connecting
      scoringHub.onLiveUpdated = (data: LiveUpdatedEvent) => {
        if (isMounted.current) {
          setLiveUpdate(data);
        }
      };

      scoringHub.onDeliveryAdded = (data: DeliveryAddedEvent) => {
        if (isMounted.current) {
          setLastDelivery(data);
          // Re-fetch the full scorecard when a delivery is recorded
          fetchScorecard();
        }
      };

      scoringHub.onDeliveryVoided = (data: DeliveryVoidedEvent) => {
        if (isMounted.current) {
          setLastDelivery(data);
          // Re-fetch scorecard when a delivery is voided
          fetchScorecard();
        }
      };

      scoringHub.onConnectionStateChange = (state: signalR.HubConnectionState) => {
        if (isMounted.current) {
          setIsConnected(state === signalR.HubConnectionState.Connected);
        }
      };

      try {
        await scoringHub.connect();
        await scoringHub.joinMatch(matchId);
        setIsConnected(true);
        // Fetch initial scorecard data
        await fetchScorecard();
      } catch (err) {
        console.error('Failed to connect to scoring hub:', err);
        setIsConnected(false);
        // Still try to load scorecard via REST even if hub fails
        await fetchScorecard();
      }
    };

    connect();

    return () => {
      isMounted.current = false;
      scoringHub.onLiveUpdated = null;
      scoringHub.onDeliveryAdded = null;
      scoringHub.onDeliveryVoided = null;
      scoringHub.onConnectionStateChange = null;
      scoringHub.disconnect();
      setIsConnected(false);
    };
  }, [matchId, fetchScorecard]);

  return { liveUpdate, scorecard, lastDelivery, isConnected, fetchScorecard };
}
