import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import * as signalR from '@microsoft/signalr';

// ── Mock scoringHub service ──────────────────────────────────────────────────
// vi.mock is hoisted, so we cannot reference variables declared outside.
// Instead, define the mock object inline with vi.hoisted().

const {
  mockConnect,
  mockDisconnect,
  mockJoinMatch,
  mockGetScorecard,
  captured,
} = vi.hoisted(() => {
  const captured = {
    onLiveUpdated: null as any,
    onDeliveryAdded: null as any,
    onDeliveryVoided: null as any,
    onConnectionStateChange: null as any,
  };
  return {
    mockConnect: vi.fn().mockResolvedValue(undefined),
    mockDisconnect: vi.fn().mockResolvedValue(undefined),
    mockJoinMatch: vi.fn().mockResolvedValue(undefined),
    mockGetScorecard: vi.fn(),
    captured,
  };
});

vi.mock('../services/scoringHub', () => ({
  scoringHub: {
    connect: mockConnect,
    disconnect: mockDisconnect,
    joinMatch: mockJoinMatch,
    get onLiveUpdated() { return captured.onLiveUpdated; },
    set onLiveUpdated(fn: any) { captured.onLiveUpdated = fn; },
    get onDeliveryAdded() { return captured.onDeliveryAdded; },
    set onDeliveryAdded(fn: any) { captured.onDeliveryAdded = fn; },
    get onDeliveryVoided() { return captured.onDeliveryVoided; },
    set onDeliveryVoided(fn: any) { captured.onDeliveryVoided = fn; },
    get onConnectionStateChange() { return captured.onConnectionStateChange; },
    set onConnectionStateChange(fn: any) { captured.onConnectionStateChange = fn; },
  },
}));

vi.mock('../services/cricketSocialService', () => ({
  scoringService: {
    getScorecard: (...args: any[]) => mockGetScorecard(...args),
  },
}));

// ── Import hook AFTER mocks ─────────────────────────────────────────────────
import { useLiveScoring } from '../hooks/useLiveScoring';

// ── Test Data ────────────────────────────────────────────────────────────────
const MATCH_ID = 'test-match-123';

const mockLiveUpdatedEvent = {
  matchId: MATCH_ID,
  inningsNo: 1,
  totalRuns: 156,
  totalWickets: 4,
  overNo: 20,
  ballInOver: 3,
  strikerId: 'p1',
  nonStrikerId: 'p2',
  currentBowlerId: 'p5',
  strikerFirstName: 'Virat',
  strikerLastName: 'Kohli',
  nonStrikerFirstName: 'Rohit',
  nonStrikerLastName: 'Sharma',
  bowlerFirstName: 'Pat',
  bowlerLastName: 'Cummins',
};

const mockDeliveryEvent = {
  id: 'delivery-001',
  seq: 1,
  overNo: 20,
  ballIndexLegal: 3,
  strikerId: 'p1',
  nonStrikerId: 'p2',
  bowlerId: 'p5',
  runsOffBat: 4,
  wideRuns: 0,
  noBallRuns: 0,
  byeRuns: 0,
  legByeRuns: 0,
  penaltyRuns: 0,
  totalRuns: 4,
  isLegalDelivery: true,
  isWicket: false,
  dismissalKind: null,
  playerOutId: null,
  isVoided: false,
  clientEventId: 'evt-001',
  createdAt: '2026-05-20T14:30:00Z',
};

const mockScorecardData = {
  id: 'sc-1',
  matchId: MATCH_ID,
  status: 'InProgress',
  isLocked: false,
  innings: [
    {
      id: 'inn-1',
      inningsNumber: 1,
      battingTeamName: 'India',
      totalRuns: 156,
      totalWickets: 4,
      totalOvers: 20.3,
      extras: 8,
      batting: [
        { batsmanId: 'p1', batsmanName: 'Virat Kohli', runsScored: 82, ballsFaced: 56, fours: 8, sixes: 3, battingPosition: 1 },
      ],
      bowling: [
        { bowlerId: 'p5', bowlerName: 'Pat Cummins', overs: 4, maidens: 0, runsConceded: 32, wickets: 1, wides: 1, noBalls: 0 },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('useLiveScoring hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.onLiveUpdated = null;
    captured.onDeliveryAdded = null;
    captured.onDeliveryVoided = null;
    captured.onConnectionStateChange = null;

    // Default: getScorecard returns mock data
    mockGetScorecard.mockResolvedValue({ data: { data: mockScorecardData } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Connection Tests ─────────────────────────────────────────────────────

  it('connects to SignalR hub and joins match on mount', async () => {
    renderHook(() => useLiveScoring(MATCH_ID));

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockJoinMatch).toHaveBeenCalledWith(MATCH_ID);
    });
  });

  it('does NOT connect when matchId is undefined', () => {
    renderHook(() => useLiveScoring(undefined));

    expect(mockConnect).not.toHaveBeenCalled();
    expect(mockJoinMatch).not.toHaveBeenCalled();
  });

  it('sets isConnected to true after successful connection', async () => {
    const { result } = renderHook(() => useLiveScoring(MATCH_ID));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('disconnects and cleans up on unmount', async () => {
    const { unmount } = renderHook(() => useLiveScoring(MATCH_ID));

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
    expect(captured.onLiveUpdated).toBeNull();
    expect(captured.onDeliveryAdded).toBeNull();
    expect(captured.onDeliveryVoided).toBeNull();
    expect(captured.onConnectionStateChange).toBeNull();
  });

  // ── Initial Scorecard Fetch ──────────────────────────────────────────────

  it('fetches initial scorecard via REST API on mount', async () => {
    const { result } = renderHook(() => useLiveScoring(MATCH_ID));

    await waitFor(() => {
      expect(mockGetScorecard).toHaveBeenCalledWith(MATCH_ID);
      expect(result.current.scorecard).toEqual(mockScorecardData);
    });
  });

  it('still fetches scorecard even if hub connection fails', async () => {
    mockConnect.mockRejectedValueOnce(new Error('Connection refused'));

    const { result } = renderHook(() => useLiveScoring(MATCH_ID));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(mockGetScorecard).toHaveBeenCalledWith(MATCH_ID);
      expect(result.current.scorecard).toEqual(mockScorecardData);
    });
  });

  // ── LiveUpdated Event ────────────────────────────────────────────────────

  it('updates liveUpdate state when LiveUpdated event fires', async () => {
    const { result } = renderHook(() => useLiveScoring(MATCH_ID));

    await waitFor(() => {
      expect(captured.onLiveUpdated).not.toBeNull();
    });

    // Simulate backend sending LiveUpdated event
    act(() => {
      captured.onLiveUpdated(mockLiveUpdatedEvent);
    });

    expect(result.current.liveUpdate).toEqual(mockLiveUpdatedEvent);
    expect(result.current.liveUpdate?.totalRuns).toBe(156);
    expect(result.current.liveUpdate?.totalWickets).toBe(4);
    expect(result.current.liveUpdate?.strikerFirstName).toBe('Virat');
    expect(result.current.liveUpdate?.bowlerFirstName).toBe('Pat');
  });

  // ── DeliveryAdded Event ──────────────────────────────────────────────────

  it('updates lastDelivery and re-fetches scorecard on DeliveryAdded', async () => {
    const { result } = renderHook(() => useLiveScoring(MATCH_ID));

    await waitFor(() => {
      expect(captured.onDeliveryAdded).not.toBeNull();
    });

    // Reset to track re-fetch
    mockGetScorecard.mockClear();
    const updatedScorecard = {
      ...mockScorecardData,
      innings: [{
        ...mockScorecardData.innings[0],
        totalRuns: 160,  // Score increased after the delivery
      }],
    };
    mockGetScorecard.mockResolvedValue({ data: { data: updatedScorecard } });

    // Simulate backend sending DeliveryAdded event
    act(() => {
      captured.onDeliveryAdded(mockDeliveryEvent);
    });

    // Last delivery state should update immediately
    expect(result.current.lastDelivery).toEqual(mockDeliveryEvent);
    expect(result.current.lastDelivery?.runsOffBat).toBe(4);
    expect(result.current.lastDelivery?.isWicket).toBe(false);

    // Scorecard should be re-fetched
    await waitFor(() => {
      expect(mockGetScorecard).toHaveBeenCalledWith(MATCH_ID);
      expect(result.current.scorecard?.innings[0].totalRuns).toBe(160);
    });
  });

  // ── DeliveryVoided Event ─────────────────────────────────────────────────

  it('updates lastDelivery and re-fetches scorecard on DeliveryVoided', async () => {
    const { result } = renderHook(() => useLiveScoring(MATCH_ID));

    await waitFor(() => {
      expect(captured.onDeliveryVoided).not.toBeNull();
    });

    mockGetScorecard.mockClear();
    const voidedScorecard = {
      ...mockScorecardData,
      innings: [{
        ...mockScorecardData.innings[0],
        totalRuns: 152,  // Score reduced after voiding
      }],
    };
    mockGetScorecard.mockResolvedValue({ data: { data: voidedScorecard } });

    const voidedEvent = {
      ...mockDeliveryEvent,
      isVoided: true,
      voidedBy: 'scorer-1',
      voidReason: 'Incorrect entry',
      voidedAt: '2026-05-20T14:31:00Z',
    };

    act(() => {
      captured.onDeliveryVoided(voidedEvent);
    });

    expect(result.current.lastDelivery?.isVoided).toBe(true);

    await waitFor(() => {
      expect(mockGetScorecard).toHaveBeenCalledWith(MATCH_ID);
      expect(result.current.scorecard?.innings[0].totalRuns).toBe(152);
    });
  });

  // ── Connection State Changes ─────────────────────────────────────────────

  it('updates isConnected when connection state changes', async () => {
    const { result } = renderHook(() => useLiveScoring(MATCH_ID));

    await waitFor(() => {
      expect(captured.onConnectionStateChange).not.toBeNull();
      expect(result.current.isConnected).toBe(true);
    });

    // Simulate disconnection
    act(() => {
      captured.onConnectionStateChange(signalR.HubConnectionState.Reconnecting);
    });
    expect(result.current.isConnected).toBe(false);

    // Simulate reconnection
    act(() => {
      captured.onConnectionStateChange(signalR.HubConnectionState.Connected);
    });
    expect(result.current.isConnected).toBe(true);
  });

  // ── Real-time Update Flow (End-to-End Simulation) ────────────────────────

  it('simulates full real-time flow: mobile records ball → web updates', async () => {
    const { result } = renderHook(() => useLiveScoring(MATCH_ID));

    // 1. Initial state: scorecard loaded on mount
    await waitFor(() => {
      expect(result.current.scorecard?.innings[0].totalRuns).toBe(156);
      expect(result.current.isConnected).toBe(true);
    });

    // 2. Mobile app records a delivery → backend emits LiveUpdated
    act(() => {
      captured.onLiveUpdated({
        ...mockLiveUpdatedEvent,
        totalRuns: 160,      // Score updated
        ballInOver: 4,       // Next ball
      });
    });

    // Live score updates INSTANTLY (no API call)
    expect(result.current.liveUpdate?.totalRuns).toBe(160);

    // 3. Backend also emits DeliveryAdded
    mockGetScorecard.mockClear();
    mockGetScorecard.mockResolvedValue({
      data: {
        data: {
          ...mockScorecardData,
          innings: [{
            ...mockScorecardData.innings[0],
            totalRuns: 160,
            batting: [
              { ...mockScorecardData.innings[0].batting[0], runsScored: 86 }, // +4 runs
            ],
          }],
        },
      },
    });

    act(() => {
      captured.onDeliveryAdded({
        ...mockDeliveryEvent,
        runsOffBat: 4,
        totalRuns: 4,
      });
    });

    // 4. Full scorecard re-fetched with updated batting stats
    await waitFor(() => {
      expect(mockGetScorecard).toHaveBeenCalledWith(MATCH_ID);
      expect(result.current.scorecard?.innings[0].totalRuns).toBe(160);
      expect(result.current.scorecard?.innings[0].batting[0].runsScored).toBe(86);
    });
  });

  // ── Registers All 3 Event Callbacks ──────────────────────────────────────

  it('registers all three SignalR event callbacks', async () => {
    renderHook(() => useLiveScoring(MATCH_ID));

    await waitFor(() => {
      expect(captured.onLiveUpdated).toBeInstanceOf(Function);
      expect(captured.onDeliveryAdded).toBeInstanceOf(Function);
      expect(captured.onDeliveryVoided).toBeInstanceOf(Function);
      expect(captured.onConnectionStateChange).toBeInstanceOf(Function);
    });
  });
});
