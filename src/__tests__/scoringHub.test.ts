import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as signalR from '@microsoft/signalr';

// ── Mock SignalR ──────────────────────────────────────────────────────────────
// We mock the entire @microsoft/signalr module so no real WebSocket is opened.

const mockOn = vi.fn();
const mockOff = vi.fn();
const mockStart = vi.fn().mockResolvedValue(undefined);
const mockStop = vi.fn().mockResolvedValue(undefined);
const mockInvoke = vi.fn().mockResolvedValue(undefined);
const mockOnReconnecting = vi.fn();
const mockOnReconnected = vi.fn();
const mockOnClose = vi.fn();

const mockConnection = {
  on: mockOn,
  off: mockOff,
  start: mockStart,
  stop: mockStop,
  invoke: mockInvoke,
  onreconnecting: mockOnReconnecting,
  onreconnected: mockOnReconnected,
  onclose: mockOnClose,
  state: signalR.HubConnectionState.Disconnected,
};

const mockWithUrl = vi.fn().mockReturnThis();
const mockWithAutoReconnect = vi.fn().mockReturnThis();
const mockConfigureLogging = vi.fn().mockReturnThis();
const mockBuild = vi.fn().mockReturnValue(mockConnection);

vi.mock('@microsoft/signalr', async () => {
  const actual = await vi.importActual<typeof signalR>('@microsoft/signalr');
  class MockHubConnectionBuilder {
    withUrl(...args: any[]) { mockWithUrl(...args); return this; }
    withAutomaticReconnect(...args: any[]) { mockWithAutoReconnect(...args); return this; }
    configureLogging(...args: any[]) { mockConfigureLogging(...args); return this; }
    build() { return mockBuild(); }
  }
  return {
    ...actual,
    HubConnectionBuilder: MockHubConnectionBuilder,
  };
});

// ── Import AFTER mocking ─────────────────────────────────────────────────────
// Dynamic import to ensure the mock is in place before the module loads.
let scoringHub: any;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import('../services/scoringHub');
  scoringHub = mod.scoringHub;

  // Reset all mock call history
  mockOn.mockClear();
  mockStart.mockClear();
  mockStop.mockClear();
  mockInvoke.mockClear();
  mockOnReconnecting.mockClear();
  mockOnReconnected.mockClear();
  mockOnClose.mockClear();
  mockWithUrl.mockClear();
  mockBuild.mockClear();

  // Set state to connected after start
  mockStart.mockImplementation(async () => {
    (mockConnection as any).state = signalR.HubConnectionState.Connected;
  });
  mockStop.mockImplementation(async () => {
    (mockConnection as any).state = signalR.HubConnectionState.Disconnected;
  });
  (mockConnection as any).state = signalR.HubConnectionState.Disconnected;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('ScoringHubService', () => {
  // ── Connection Tests ─────────────────────────────────────────────────────

  it('connects to the correct hub URL (/hubs/score)', async () => {
    await scoringHub.connect();

    expect(mockWithUrl).toHaveBeenCalledWith(
      expect.stringContaining('/hubs/score')
    );
    // Must NOT contain the old wrong path
    const urlArg = mockWithUrl.mock.calls[0][0];
    expect(urlArg).not.toContain('/hubs/scoring');
  });

  it('does NOT send JWT token in the connection', async () => {
    await scoringHub.connect();

    // withUrl should be called with just the URL, no accessTokenFactory
    expect(mockWithUrl).toHaveBeenCalledTimes(1);
    const args = mockWithUrl.mock.calls[0];
    // Should only have 1 argument (the URL), no options object with accessTokenFactory
    expect(args.length).toBe(1);
  });

  it('starts the SignalR connection', async () => {
    await scoringHub.connect();

    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it('enables automatic reconnect with correct delays', async () => {
    await scoringHub.connect();

    expect(mockWithAutoReconnect).toHaveBeenCalledWith([0, 2000, 5000, 10000, 30000]);
  });

  // ── Event Listener Tests ─────────────────────────────────────────────────

  it('registers listener for "LiveUpdated" event (not old "ScoreUpdate")', async () => {
    await scoringHub.connect();

    const registeredEvents = mockOn.mock.calls.map((call: any[]) => call[0]);
    expect(registeredEvents).toContain('LiveUpdated');
    expect(registeredEvents).not.toContain('ScoreUpdate');
    expect(registeredEvents).not.toContain('ScorecardLoaded');
  });

  it('registers listener for "DeliveryAdded" event (not old "BallUpdate")', async () => {
    await scoringHub.connect();

    const registeredEvents = mockOn.mock.calls.map((call: any[]) => call[0]);
    expect(registeredEvents).toContain('DeliveryAdded');
    expect(registeredEvents).not.toContain('BallUpdate');
  });

  it('registers listener for "DeliveryVoided" event', async () => {
    await scoringHub.connect();

    const registeredEvents = mockOn.mock.calls.map((call: any[]) => call[0]);
    expect(registeredEvents).toContain('DeliveryVoided');
  });

  it('does NOT register old event names (WicketFallen, InningsBreak)', async () => {
    await scoringHub.connect();

    const registeredEvents = mockOn.mock.calls.map((call: any[]) => call[0]);
    expect(registeredEvents).not.toContain('WicketFallen');
    expect(registeredEvents).not.toContain('InningsBreak');
  });

  // ── Callback Tests ───────────────────────────────────────────────────────

  it('calls onLiveUpdated callback when LiveUpdated event fires', async () => {
    const callback = vi.fn();
    scoringHub.onLiveUpdated = callback;

    await scoringHub.connect();

    // Find the LiveUpdated handler and invoke it
    const liveUpdatedCall = mockOn.mock.calls.find((call: any[]) => call[0] === 'LiveUpdated');
    expect(liveUpdatedCall).toBeDefined();

    const handler = liveUpdatedCall![1];
    const mockData = { matchId: 'test-match', totalRuns: 150, totalWickets: 3 };
    handler(mockData);

    expect(callback).toHaveBeenCalledWith(mockData);
  });

  it('calls onDeliveryAdded callback when DeliveryAdded event fires', async () => {
    const callback = vi.fn();
    scoringHub.onDeliveryAdded = callback;

    await scoringHub.connect();

    const deliveryCall = mockOn.mock.calls.find((call: any[]) => call[0] === 'DeliveryAdded');
    const handler = deliveryCall![1];
    const mockData = { id: 'del-1', totalRuns: 4, isWicket: false };
    handler(mockData);

    expect(callback).toHaveBeenCalledWith(mockData);
  });

  it('calls onDeliveryVoided callback when DeliveryVoided event fires', async () => {
    const callback = vi.fn();
    scoringHub.onDeliveryVoided = callback;

    await scoringHub.connect();

    const voidedCall = mockOn.mock.calls.find((call: any[]) => call[0] === 'DeliveryVoided');
    const handler = voidedCall![1];
    const mockData = { id: 'del-1', isVoided: true, voidReason: 'Wrong entry' };
    handler(mockData);

    expect(callback).toHaveBeenCalledWith(mockData);
  });

  // ── Match Group Tests ────────────────────────────────────────────────────

  it('joins the correct match group via JoinMatch', async () => {
    await scoringHub.connect();
    await scoringHub.joinMatch('match-123');

    expect(mockInvoke).toHaveBeenCalledWith('JoinMatch', 'match-123');
  });

  it('leaves the match group via LeaveMatch', async () => {
    await scoringHub.connect();
    await scoringHub.joinMatch('match-123');
    await scoringHub.leaveMatch('match-123');

    expect(mockInvoke).toHaveBeenCalledWith('LeaveMatch', 'match-123');
  });

  // ── Reconnection Tests ──────────────────────────────────────────────────

  it('re-joins match group after reconnection', async () => {
    await scoringHub.connect();
    await scoringHub.joinMatch('match-456');

    // Simulate reconnection: find the onreconnected callback and invoke it
    expect(mockOnReconnected).toHaveBeenCalled();
    const reconnectedHandler = mockOnReconnected.mock.calls[0][0];
    
    mockInvoke.mockClear();
    reconnectedHandler();

    expect(mockInvoke).toHaveBeenCalledWith('JoinMatch', 'match-456');
  });

  it('fires onConnectionStateChange on reconnecting and reconnected', async () => {
    const stateCallback = vi.fn();
    scoringHub.onConnectionStateChange = stateCallback;

    await scoringHub.connect();

    // Simulate reconnecting
    const reconnectingHandler = mockOnReconnecting.mock.calls[0][0];
    reconnectingHandler();
    expect(stateCallback).toHaveBeenCalledWith(signalR.HubConnectionState.Reconnecting);

    // Simulate reconnected
    const reconnectedHandler = mockOnReconnected.mock.calls[0][0];
    reconnectedHandler();
    expect(stateCallback).toHaveBeenCalledWith(signalR.HubConnectionState.Connected);
  });

  // ── Disconnect Tests ─────────────────────────────────────────────────────

  it('leaves match and stops connection on disconnect', async () => {
    await scoringHub.connect();
    await scoringHub.joinMatch('match-789');

    mockInvoke.mockClear();
    await scoringHub.disconnect();

    expect(mockInvoke).toHaveBeenCalledWith('LeaveMatch', 'match-789');
    expect(mockStop).toHaveBeenCalled();
  });

  it('fires Disconnected state on connection close', async () => {
    const stateCallback = vi.fn();
    scoringHub.onConnectionStateChange = stateCallback;

    await scoringHub.connect();

    const closeHandler = mockOnClose.mock.calls[0][0];
    closeHandler();

    expect(stateCallback).toHaveBeenCalledWith(signalR.HubConnectionState.Disconnected);
  });
});
