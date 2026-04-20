import api, { boardApi, umpireApi } from './api';

/** crypto.randomUUID() is only available in secure contexts (HTTPS/localhost).
 *  This fallback works on plain HTTP too. */
const generateUUID = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
import type {
  AuthResponse, LoginRequest, RegisterConfirmRequest, RegisterRequest, RegisterStartRequest,
  User, PlayerStats, Board, Roster, RosterMember,
  Tournament, Match, Scorecard, Feed, FeedComment,
  PagedResponse, BoardInfo, BoardDirector, BoardSponsor,
  BoardFan, BoardEvent, BoardFeedItem, BoardFollowing,
  BoardScore, RosterDetail, Umpire, Ground,
  LeagueApplication, Invoice, WaiverReport,
  BattingOrder, OverCompletion, BallByBallDetail, ScoreboardSummary,
  FeedLike, MediaUpload, BoardFeedComment,
} from '../types';

// ── Auth ──
export const authService = {
    resendRegisterOtp: (data: RegisterStartRequest) => api.post('/auth/register', data),
  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register/confirm', {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || undefined,
      mobileNumber: data.phoneNumber || undefined,
      password: data.password,
      otp: '',
    }),
  startRegister: (data: RegisterStartRequest) => api.post('/auth/register', data),
  verifyRegisterOtp: (email: string, otp: string) =>
    api.post('/auth/register/verify-otp', { email, otp }, {
      headers: { 'Content-Type': 'application/json' },
    }),
  confirmRegister: (data: RegisterConfirmRequest) => api.post<AuthResponse>('/auth/register/confirm', data),
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }, {
    headers: { 'Content-Type': 'application/json' },
  }),
  verifyForgotPasswordOtp: (email: string, otp: string) =>
    api.post('/auth/verify-forgot-password-otp', {
      email,
      otp,
    }, { headers: { 'Content-Type': 'application/json' } }),
  resetPassword: (email: string, token: string, newPassword: string) =>
    api.post('/auth/reset-password', {
      email,
      token,
      newPassword,
    }, { headers: { 'Content-Type': 'application/json' } }),
  sendEmailOtp: (email: string) => api.post('/auth/send-email-otp', { email }),
  verifyEmailOtp: (email: string, otp: string) => api.post('/auth/verify-email-otp', { email, otp }),
  verifyOtp: (email: string, otp: string) => api.post('/auth/verify-otp', { email, otp }),
  sendPhoneOtp: (phoneNumber: string) => api.post('/auth/send-phone-otp', { phoneNumber }),
  verifyPhoneOtp: (phoneNumber: string, otp: string) =>
    api.post('/auth/verify-phone-otp', { phoneNumber, otp }),
};

// ── Users ──
export const userService = {
  getProfile: () => api.get<User>('/users/me'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  updateProfile: (data: Partial<User>) => api.put<User>('/users/me', data),
  getTopBatsmen: (page = 1, pageSize = 20) => api.get<PagedResponse<PlayerStats>>('/users/top-batsmen', { params: { page, pageSize } }),
  getTopBowlers: (page = 1, pageSize = 20) => api.get<PagedResponse<PlayerStats>>('/users/top-bowlers', { params: { page, pageSize } }),
  comparePlayers: (user1: string, user2: string) => api.get<PlayerStats[]>('/users/compare', { params: { user1, user2 } }),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ imageUrl: string }>('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  search: (q: string) => api.get<User[]>('/users/search', { params: { q } }),
  list: () => api.get<User[]>('/users/list'),
};

// ── Boards ──
export const boardService = {
  // Create a new board
  create: (data: {
    name: string;
    description: string;
    boardType: number;
    city: string;
    state: string;
    country: string;
    address1?: string;
    address2?: string;
    contactNumber?: string;
    contactEmail?: string;
    websiteAddress?: string;
    ownerId: string;
    coOwnerId?: string;
    logoUrl: string;
  }) => {
    // Strip undefined/empty optional fields so the API won't reject invalid blanks
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined && v !== '')
    );
    return boardApi.post('/Boards', cleaned);
  },

  // Get all boards (with optional pagination)
  // getAll: (page = 1, pageSize = 20, version = 1) =>
  // boardApi.get('/Boards', { 
  //   params: { page, pageSize, version } 
  // }),
    getMyBoards: (page = 1, pageSize = 20) => boardApi.get('/Boards', {
      params: { page, pageSize, _t: Date.now() },
      headers: { 'Cache-Control': 'no-cache' },
    }),


  // Get a board by ID — tries GET /Boards/{id} first, falls back to byowner search
  // because the GET /Boards/{id} endpoint on the backend may hang/timeout
  getById: async (id: string) => {
    try {
      const r = await boardApi.get(`/Boards/${id}`, {
        params: { _t: Date.now() },
        headers: { 'Cache-Control': 'no-cache' },
        timeout: 8000,
      });
      const raw = r.data as any;
      const board = raw?.data && raw.data.id ? raw.data : raw;
      return { ...r, data: board };
    } catch (directErr: any) {
      // If the direct endpoint fails (timeout, 500, etc.), try finding the board via byowner
      console.warn('[boardService.getById] Direct fetch failed, trying byowner fallback:', directErr?.message);
      try {
        const ownerRes = await boardApi.get('/Boards/byowner', {
          params: { _t: Date.now() },
          headers: { 'Cache-Control': 'no-cache' },
        });
        const raw = ownerRes.data as any;
        const items = raw?.data || raw?.items || (Array.isArray(raw) ? raw : []);
        const board = items.find((b: any) => b.id === id);
        if (board) return { ...ownerRes, data: board };
      } catch {}
      // If byowner also fails, throw the original error
      throw directErr;
    }
  },

  // Update a board by ID (PUT /api/v1/Boards/{id}) — normalizes nested response
  update: (id: string, data: any) => {
    // Allow logoUrl: '' through so the API can clear it; strip other empty strings
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([k, v]) => v !== undefined && (k === 'logoUrl' || v !== ''))
    );
    return boardApi.put(`/Boards/${id}`, cleaned).then(r => {
      const raw = r.data as any;
      const board = raw?.data && raw.data.id ? raw.data : raw;
      return { ...r, data: board };
    });
  },

  // Get boards by owner/co-owner
  getByOwner: (ownerId?: string, coOwnerId?: string) => boardApi.get('/Boards/byowner', {
    params: {
      ...(ownerId ? { ownerId } : {}),
      ...(coOwnerId ? { coOwnerId } : {}),
      _t: Date.now(),
    },
    headers: { 'Cache-Control': 'no-cache' },
  }),

  // Get boards by type (e.g. boardType=1 for Team Boards)
  getByType: (boardType: number, page = 1, pageSize = 50) =>
    boardApi.get(`/Boards/bytype/${boardType}`, {
      params: { page, pageSize, _t: Date.now() },
      headers: { 'Cache-Control': 'no-cache' },
    }),

  // Get team boards for a specific league board
  getTeamBoardsByLeague: (leagueBoardId: string, page = 1, pageSize = 50) =>
    boardApi.get(`/Boards/teamboards/league/${leagueBoardId}`, {
      params: { page, pageSize },
    }),

  // Delete a board by ID
  delete: (id: string) => boardApi.delete(`/Boards/${id}`),

  // The following endpoints are not supported by the current Swagger spec and are commented out:
  // getMyBoards: (page = 1, pageSize = 20) => boardApi.get('/Boards/mine', { params: { page, pageSize } }),
  // search: (query?: string, type?: string, page = 1, pageSize = 20) =>
  //   boardApi.get('/Boards', { params: { query, type, page, pageSize } }),
  // addFan: (id: string) => boardApi.post(`/Boards/${id}/fans`, {}),
  // removeFan: (id: string) => boardApi.delete(`/Boards/${id}/fans`),
};

// ── Rosters ──
// Endpoints: POST/GET /boards/{boardId}/Rosters, GET/PUT/DELETE /boards/{boardId}/Rosters/{rosterId}
const DEFAULT_LOGO_URL = 'https://cricketsocial.com/default-logo.png';

export const rosterService = {
  create: (boardId: string, data: {
    name: string;
    logoUrl?: string | null;
    captainId?: string;
    viceCaptainId?: string;
    coachId?: string;
    playerIds?: string[];
    leagueBoardIds?: string[];
  }) => boardApi.post(`/boards/${boardId}/Rosters`, {
    name: data.name,
    logoUrl: data.logoUrl || DEFAULT_LOGO_URL,
    boardId,
    captainId: data.captainId || '',
    viceCaptainId: data.viceCaptainId || '',
    coachId: data.coachId || '',
    playerIds: data.playerIds || [],
    leagueBoardIds: data.leagueBoardIds || [],
  }) as Promise<{ data: Roster }>,
  getByBoard: (boardId: string) => boardApi.get(`/boards/${boardId}/Rosters`, {
    params: { _t: Date.now() },
    headers: { 'Cache-Control': 'no-cache' },
  }) as Promise<{ data: Roster[] }>,
  getById: (boardId: string, rosterId: string) => boardApi.get(`/boards/${boardId}/Rosters/${rosterId}`, {
    params: { _t: Date.now() },
    headers: { 'Cache-Control': 'no-cache' },
  }) as Promise<{ data: Roster }>,

  update: (boardId: string, rosterId: string, data: {
    name: string;
    logoUrl?: string | null;
    captainId?: string;
    viceCaptainId?: string;
    coachId?: string;
    playerIds?: string[];
    leagueBoardIds?: string[];
  }) => boardApi.put(`/boards/${boardId}/Rosters/${rosterId}`, {
    name: data.name,
    logoUrl: data.logoUrl || DEFAULT_LOGO_URL,
    boardId,
    captainId: data.captainId || '',
    viceCaptainId: data.viceCaptainId || '',
    coachId: data.coachId || '',
    playerIds: data.playerIds || [],
    leagueBoardIds: data.leagueBoardIds || [],
  }) as Promise<{ data: Roster }>,
  delete: (boardId: string, rosterId: string) => boardApi.delete(`/boards/${boardId}/Rosters/${rosterId}`),
};

// ── Tournaments ──
export const tournamentService = {
  create: (data: { name: string; boardId: string; format?: string; oversPerInning?: number; maxPlayersPerTeam?: number; startDate?: Date; endDate?: Date }) =>
    api.post<Tournament>('/tournaments', data),
  createTournament: (boardId: string, data: {
    name: string;
    winPoints: number;
    allowUmpireFromList: boolean;
    allowBuddyAsUmpire: boolean;
    groups: {
      name: string;
      sortOrder: number;
      teamBoardIds: string[];
    }[];
  }) =>
    umpireApi.post(`/tournament/boards/${boardId}/tournaments`, {
      name: data.name,
      winPoints: data.winPoints,
      allowUmpireFromList: data.allowUmpireFromList,
      allowBuddyAsUmpire: data.allowBuddyAsUmpire,
      groups: data.groups.map((g, idx) => ({
        name: g.name,
        sortOrder: g.sortOrder ?? idx,
        teamBoardIds: g.teamBoardIds,
      })),
    }),
  // GET /api/v1/tournament/boards/{boardId}/tournaments
  getTournaments: (boardId: string, page = 1, pageSize = 20) => umpireApi.get(`/tournament/boards/${boardId}/tournaments`, { params: { page, pageSize } }),
  // GET /api/v1/tournament/tournaments/{tournamentId}
  getTournamentById: (tournamentId: string) => umpireApi.get(`/tournament/tournaments/${tournamentId}`),
  // PUT /api/v1/tournament/tournaments/{tournamentId}
  updateTournament: (tournamentId: string, data: Record<string, any>) =>
    umpireApi.put(`/tournament/tournaments/${tournamentId}`, data, { timeout: 30000 }),
  // DELETE /api/v1/tournament/tournaments/{tournamentId}
  deleteTournament: (tournamentId: string) => umpireApi.delete(`/tournament/tournaments/${tournamentId}`),
  getById: (id: string) => api.get<Tournament>(`/tournaments/${id}`),
  getByBoard: (boardId: string, page = 1, pageSize = 20) =>
    api.get<PagedResponse<Tournament>>(`/tournaments/board/${boardId}`, { params: { page, pageSize } }),
  update: (id: string, data: { name?: string; format?: string; oversPerInning?: number; maxPlayersPerTeam?: number; startDate?: Date; endDate?: Date }) =>
    api.put<Tournament>(`/tournaments/${id}`, data),
  cancel: (id: string) => api.delete(`/tournaments/${id}`),
  createMatch: (data: { tournamentId: string; homeTeamId: string; awayTeamId: string; groundId?: string; umpireId?: string; scorerId?: string; scheduledAt: string }) =>
    api.post<Match>('/tournaments/matches', data),
  createSchedule: (data: {
    tournamentId?: string;
    gameType?: string;
    homeTeamId?: string;
    awayTeamId?: string;
    groundId?: string;
    startAtUtc?: string;
    umpireId?: string;
    appScorerId?: string;
    portalScorerId?: string;
    active?: boolean;
  }) => {
    console.log('[createSchedule] POST /tournament/Schedules');
    console.log('[createSchedule] payload:', JSON.stringify(data, null, 2));
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    console.log('[createSchedule] token present:', !!token, 'length:', token?.length);
    return umpireApi.post('/tournament/Schedules', data).then(res => {
      console.log('[createSchedule] Success:', res.status, res.data);
      return res;
    }).catch(err => {
      console.error('[createSchedule] Error status:', err?.response?.status);
      console.error('[createSchedule] Error headers:', JSON.stringify(Object.fromEntries(Object.entries(err?.response?.headers || {}))));
      console.error('[createSchedule] Error data:', JSON.stringify(err?.response?.data, null, 2));
      console.error('[createSchedule] Request headers sent:', JSON.stringify(err?.config?.headers));
      console.error('[createSchedule] Request body sent:', err?.config?.data);
      throw err;
    });
  },
  updateMatch: (id: string, data: { groundId?: string; umpireId?: string; scorerId?: string; scheduledAt?: string }) =>
    api.put<Match>(`/tournaments/matches/${id}`, data),
  getMatches: (tournamentId: string) => api.get<Match[]>(`/tournaments/${tournamentId}/matches`),
  cancelMatch: (matchId: string) => api.delete(`/tournaments/matches/${matchId}`),
  bulkCancelMatches: (tournamentId: string, startDate: string, endDate: string) =>
    api.post(`/tournaments/${tournamentId}/bulk-cancel`, { startDate, endDate }),
};

// ── Scoring (EPIC E) ──
export const scoringService = {
  // E1: Scorecard & Innings
  getScorecard: (matchId: string) => api.get<Scorecard>(`/scoring/${matchId}`),
  getScorecardSummary: (matchId: string) => api.get<ScoreboardSummary>(`/scoring/${matchId}/summary`),
  createScorecard: (matchId: string, tossWonBy: string, tossDecision: string) =>
    api.post<Scorecard>(`/scoring/${matchId}`, { tossWonBy, tossDecision }),
  createInnings: (scorecardId: string, inningsNumber: number, battingTeamId: string, bowlingTeamId: string) =>
    api.post<Scorecard>(`/scoring/${scorecardId}/innings`, { inningsNumber, battingTeamId, bowlingTeamId }),

  // E2: Batting Order & Management
  getBattingOrder: (inningsId: string) => api.get<BattingOrder[]>(`/scoring/innings/${inningsId}/batting-order`),
  updateBattingEntry: (inningsId: string, data: any) =>
    api.put(`/scoring/innings/${inningsId}/batting-entry`, data),
  updateBowlingEntry: (inningsId: string, data: any) =>
    api.put(`/scoring/innings/${inningsId}/bowling-entry`, data),
  updateStriker: (inningsId: string, batsmanId: string) =>
    api.put(`/scoring/innings/${inningsId}/striker`, batsmanId),

  // E3: Ball-by-Ball & Live Scoring
  recordBall: (matchId: string, ball: any) =>
    api.post(`/scoring/${matchId}/ball`, ball),
  completeOver: (inningsId: string, overNumber: number) =>
    api.post<OverCompletion>(`/scoring/innings/${inningsId}/over-complete`, overNumber),
  getBallByBall: (inningsId: string) => api.get<BallByBallDetail[]>(`/scoring/innings/${inningsId}/ball-by-ball`),

  // E4: Lock/Unlock with Verification
  lockScorecard: (scorecardId: string) => api.put(`/scoring/${scorecardId}/lock`),
  unlockScorecard: (scorecardId: string, verificationCode: string) =>
    api.put(`/scoring/${scorecardId}/unlock`, { verificationCode }),
};

// ── Feeds (EPIC F) ──
export const feedService = {
  // F1: Global & Personal Feed
  create: (data: { content?: string; mediaUrl?: string; mediaType?: string }) => api.post<Feed>('/feeds', data),
  getFeed: (page = 1, pageSize = 20) => api.get<PagedResponse<Feed>>('/feeds', { params: { page, pageSize } }),
  getGlobalFeed: (page = 1, pageSize = 20) => api.get<PagedResponse<Feed>>('/feeds/global', { params: { page, pageSize } }),

  // F1: Idempotent Likes (replaces toggle-based pattern)
  like: (id: string) => api.post<{ isLiked: boolean; likesCount: number }>(`/feeds/${id}/like`),
  unlike: (id: string) => api.post<{ isLiked: boolean; likesCount: number }>(`/feeds/${id}/unlike`),

  // F1: Comments
  addComment: (id: string, content: string) => api.post<FeedComment>(`/feeds/${id}/comments`, { content }),
  getComments: (id: string) => api.get<FeedComment[]>(`/feeds/${id}/comments`),
  deleteComment: (feedId: string, commentId: string) => api.delete(`/feeds/${feedId}/comments/${commentId}`),

  // F1: Delete Own Post
  delete: (id: string) => api.delete(`/feeds/${id}`),

  // F3: Media Upload
  uploadMedia: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<MediaUpload>('/feeds/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// ── Board Detail (Team Board Side Menus) ──
export const boardDetailService = {
  // Info
  getInfo: (boardId: string) => boardApi.get(`/boards/${boardId}/info`),
  updateInfo: (boardId: string, data: Partial<BoardInfo>) => boardApi.put(`/boards/${boardId}/info`, data),
  // Directors
  getDirectors: (boardId: string) => boardApi.get(`/boards/${boardId}/directors`),
  addDirector: (boardId: string, data: { name: string; title?: string; imageUrl?: string }) =>
    boardApi.post(`/boards/${boardId}/directors`, data),
  removeDirector: (boardId: string, directorId: string) => boardApi.delete(`/boards/${boardId}/directors/${directorId}`),
  // Sponsors
  getSponsors: (boardId: string) => boardApi.get(`/boards/${boardId}/sponsors`),
  addSponsor: (boardId: string, data: { name: string; logoUrl?: string; websiteUrl?: string }) =>
    boardApi.post(`/boards/${boardId}/sponsors`, data),
  removeSponsor: (boardId: string, sponsorId: string) => boardApi.delete(`/boards/${boardId}/sponsors/${sponsorId}`),
  // Fans
  getFans: (boardId: string, page = 1, pageSize = 20) =>
    boardApi.get(`/boards/${boardId}/fans`, { params: { page, pageSize } }),
  // Pitch (Board Feed)
  getFeeds: (boardId: string, page = 1, pageSize = 20) =>
    boardApi.get(`/boards/${boardId}/feeds`, { params: { page, pageSize } }),
  createFeed: (boardId: string, data: { content?: string; mediaUrl?: string; mediaType?: string }) =>
    boardApi.post(`/boards/${boardId}/feeds`, data),
  likeFeed: (boardId: string, feedId: string) => boardApi.post(`/boards/${boardId}/feeds/${feedId}/like`, {}),
  unlikeFeed: (boardId: string, feedId: string) => boardApi.post(`/boards/${boardId}/feeds/${feedId}/unlike`, {}),
  addFeedComment: (boardId: string, feedId: string, content: string) =>
    boardApi.post(`/boards/${boardId}/feeds/${feedId}/comments`, { content }),
  getFeedComments: (boardId: string, feedId: string) =>
    boardApi.get(`/boards/${boardId}/feeds/${feedId}/comments`),
  deleteFeed: (boardId: string, feedId: string) => boardApi.delete(`/boards/${boardId}/feeds/${feedId}`),
  // Score
  getScore: (boardId: string, year?: number) => boardApi.get(`/boards/${boardId}/score`, { params: { year } }),
  // Squad — uses board API roster endpoint
  getSquad: (boardId: string) =>
    boardApi.get(`/boards/${boardId}/Rosters`, {
      params: { _t: Date.now() },
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
    }).then((r: { data: any }) => {
      const raw = r.data;
      console.log('getSquad raw response:', raw);
      // Normalize: API may return array directly, or { data: [...] }, or { items: [...] },
      // or .NET-style { $values: [...] }, or { data: { $values: [...] } }
      let list: any[];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (Array.isArray(raw?.data)) {
        list = raw.data;
      } else if (Array.isArray(raw?.data?.$values)) {
        list = raw.data.$values;
      } else if (Array.isArray(raw?.items)) {
        list = raw.items;
      } else if (Array.isArray(raw?.$values)) {
        list = raw.$values;
      } else if (Array.isArray(raw?.result)) {
        list = raw.result;
      } else {
        list = [];
      }
      return { data: list as RosterDetail[] };
    }),
  // Following (Fan-Of)
  getFollowing: (boardId: string) => boardApi.get(`/boards/${boardId}/following`),
  follow: (boardId: string, targetBoardId: string) => boardApi.post(`/boards/${boardId}/following/${targetBoardId}`, {}),
  unfollow: (boardId: string, targetBoardId: string) => boardApi.delete(`/boards/${boardId}/following/${targetBoardId}`),
  // Events
  getEvents: (boardId: string, status?: string) =>
    boardApi.get(`/boards/${boardId}/events`, { params: { status } }),
  createEvent: (boardId: string, data: { title: string; description?: string; location?: string; eventDate: string; eventType: string }) =>
    boardApi.post(`/boards/${boardId}/events`, data),
  deleteEvent: (boardId: string, eventId: string) => boardApi.delete(`/boards/${boardId}/events/${eventId}`),
  // Invite
  invite: (boardId: string, data: { email: string; message?: string }) => boardApi.post(`/boards/${boardId}/invite`, data),
  searchBuddies: (boardId: string, q: string) => boardApi.get(`/boards/${boardId}/buddies/search`, { params: { q } }),
  // Grounds (league boards)
  getBoardGrounds: (boardId: string, page = 1, pageSize = 20) =>
    boardApi.get(`/boards/${boardId}/Ground`, { params: { page, pageSize } }),
  createBoardGround: (boardId: string, data: {
    boardId: string; groundId: string; groundName: string;
    address1?: string; address2?: string; city?: string; state?: string;
    country?: string; zipcode?: string; landmark?: string; homeTeam?: string;
  }) =>
    boardApi.post(`/boards/${boardId}/Ground`, data),
};

// ── League Management ──
export const leagueService = {
  // Umpires (all via umpireApi → port 9004)
  createUmpire: (boardId: string, data: {
    umpireName: string; address1?: string; address2?: string;
    city?: string; state?: string; country?: string; zipcode?: string;
    homePhone?: string; workPhone?: string; mobile?: string; countryCode?: string; email?: string;
  }) => {
    const payload = {
      boardId,
      umpireName: data.umpireName,
      address1: data.address1 ?? '',
      address2: data.address2 ?? '',
      city: data.city ?? '',
      state: data.state ?? '',
      country: data.country ?? '',
      zipcode: data.zipcode ?? '',
      homePhone: data.homePhone ?? '',
      workPhone: data.workPhone ?? '',
      mobile: data.mobile ?? '',
      countryCode: data.countryCode ?? '',
      email: data.email ?? '',
    };
    console.log('[createUmpire] POST /tournament/boards/' + boardId + '/Umpire');
    console.log('[createUmpire] payload:', JSON.stringify(payload, null, 2));
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    console.log('[createUmpire] token present:', !!token, 'length:', token?.length);
    return umpireApi.post(`/tournament/boards/${boardId}/Umpire`, payload).then(res => {
      console.log('[createUmpire] Success:', res.status, res.data);
      return res;
    }).catch(err => {
      console.error('[createUmpire] Error status:', err?.response?.status);
      console.error('[createUmpire] Error headers:', JSON.stringify(Object.fromEntries(Object.entries(err?.response?.headers || {}))));
      console.error('[createUmpire] Error data:', JSON.stringify(err?.response?.data, null, 2));
      console.error('[createUmpire] Request headers sent:', JSON.stringify(err?.config?.headers));
      throw err;
    });
  },
  getUmpires: (boardId: string) => umpireApi.get(`/tournament/boards/${boardId}/Umpire`),
  getUmpireById: (boardId: string, umpireId: string) => umpireApi.get(`/tournament/boards/${boardId}/Umpire/${umpireId}`),
  updateUmpire: (boardId: string, umpireId: string, data: {
    id: string; umpireName: string; address1: string; address2: string;
    city: string; state: string; country: string; zipcode: string;
    homePhone: string; workPhone: string; mobile: string; countryCode: string; email: string;
  }) => {
    const payload = { boardId, ...data };
    console.log('[updateUmpire] PUT /tournament/boards/' + boardId + '/Umpire/' + umpireId);
    console.log('[updateUmpire] payload:', JSON.stringify(payload, null, 2));
    return umpireApi.put(`/tournament/boards/${boardId}/Umpire/${umpireId}`, payload).then(res => {
      console.log('[updateUmpire] Success:', res.status, JSON.stringify(res.data, null, 2));
      return res;
    }).catch(err => {
      console.error('[updateUmpire] Error:', err?.response?.status, JSON.stringify(err?.response?.data, null, 2));
      throw err;
    });
  },
  deleteUmpire: (boardId: string, umpireId: string) => umpireApi.delete(`/tournament/boards/${boardId}/Umpire/${umpireId}`),
  // Grounds
  createGround: (data: {
    boardId: string; groundName: string; address1?: string; address2?: string;
    city?: string; state?: string; country?: string; zipcode?: string;
    landmark?: string; homeTeam?: string; placeOfGround?: string;
    additionalDirection?: string; groundFacilities?: string;
    pitchDescription?: string; wicketType?: string; permitTime?: string;
  }) => {
    const payload = {
      boardId: data.boardId,
      groundId: generateUUID(),
      groundName: data.groundName,
      address1: data.address1 ?? '',
      address2: data.address2 ?? '',
      placeOfGround: data.placeOfGround ?? '',
      city: data.city ?? '',
      state: data.state ?? '',
      country: data.country ?? '',
      zipcode: data.zipcode ?? '',
      landmark: data.landmark ?? '',
      homeTeam: data.homeTeam ?? '',
      additonalDirection: data.additionalDirection ?? '',
      groundFacilities: data.groundFacilities ?? '',
      pitchDescription: data.pitchDescription ?? '',
      wicketType: data.wicketType ?? '',
      permitTime: data.permitTime ?? '',
    };
    console.log('[createGround] POST /tournament/boards/' + data.boardId + '/Ground');
    console.log('[createGround] payload:', JSON.stringify(payload, null, 2));
    return umpireApi.post(`/tournament/boards/${data.boardId}/Ground`, payload).then(res => {
      console.log('[createGround] Success:', res.status, res.data);
      return res;
    }).catch(err => {
      console.error('[createGround] Error status:', err?.response?.status);
      console.error('[createGround] Error data:', JSON.stringify(err?.response?.data, null, 2));
      console.error('[createGround] Request URL:', err?.config?.url);
      console.error('[createGround] Request headers:', JSON.stringify(err?.config?.headers));
      throw err;
    });
  },
  getGrounds: (boardId: string, page = 1, pageSize = 100) => umpireApi.get(`/tournament/boards/${boardId}/Ground`, { params: { page, pageSize } }),
  getGroundById: (boardId: string, groundId: string) => umpireApi.get(`/tournament/boards/${boardId}/Ground/${groundId}`),
  updateGround: (boardId: string, groundId: string, data: {
    id: string; groundId: string; groundName: string; address1: string; address2: string;
    placeOfGround?: string; city: string; state: string; country: string; zipcode: string;
    landmark: string; homeTeam: string;
    additionalDirection?: string; groundFacilities?: string;
    pitchDescription?: string; wicketType?: string; permitTime?: string;
  }) => {
    // Map to API field name (typo in backend: additonalDirection)
    const { additionalDirection, ...rest } = data;
    const payload = {
      ...rest,
      boardId,
      additonalDirection: additionalDirection ?? '',
    };
    console.log('[updateGround] PUT /tournament/boards/' + boardId + '/Ground/' + groundId, JSON.stringify(payload, null, 2));
    return umpireApi.put(`/tournament/boards/${boardId}/Ground/${groundId}`, payload);
  },
  deleteGround: (boardId: string, groundId: string) => umpireApi.delete(`/tournament/boards/${boardId}/Ground/${groundId}`),
  // Tournament Management
  cancelTournament: (tournamentId: string) => api.delete(`/tournaments/${tournamentId}`),
  getSchedule: (boardId: string, from: string, to: string) =>
    umpireApi.get('/tournament/Schedules', { params: { boardId, from, to } }),
  getScheduleById: (id: string) =>
    umpireApi.get(`/tournament/Schedules/${id}`),
  updateSchedule: (id: string, data: {
    tournamentId?: string | null;
    gameType?: string;
    homeTeamId?: string | null;
    awayTeamId?: string | null;
    groundId?: string | null;
    startAtUtc?: string | null;
    umpireId?: string | null;
    appScorerId?: string;
    portalScorerId?: string;
    active?: boolean;
  }) =>
    umpireApi.put(`/tournament/Schedules/${id}`, data),
  deleteSchedule: (id: string) =>
    umpireApi.delete(`/tournament/Schedules/${id}`),
  getTeamsByTournament: (tournamentId: string) =>
    umpireApi.get(`/tournament/Schedules/dropdowns/${tournamentId}/teams`),
  getGameTypes: () => umpireApi.get('/tournament/Schedules/dropdowns/gametypes'),
  assignUmpire: (matchId: string, umpireId: string) => api.put(`/league/matches/${matchId}/umpire/${umpireId}`),
  assignScorer: (matchId: string, scorerId: string) => api.put(`/league/matches/${matchId}/scorer/${scorerId}`),
  cancelGames: (boardId: string, from: string, to: string) =>
    api.post(`/league/boards/${boardId}/cancel-games`, null, { params: { from, to } }),
  // Applications
  createApplication: (data: { tournamentId: string; teamId: string; paymentAmount?: number }) =>
    api.post<LeagueApplication>('/league/applications', data),
  getApplications: (tournamentId: string) => api.get<LeagueApplication[]>(`/league/tournaments/${tournamentId}/applications`),
  updateApplicationStatus: (applicationId: string, status: string) =>
    api.put(`/league/applications/${applicationId}/status`, { status }),
  // Invoicing
  createInvoice: (boardId: string, data: { tournamentId?: string; teamId?: string; amount: number; description?: string; dueDate: string }) =>
    api.post<Invoice>(`/league/boards/${boardId}/invoices`, data),
  getInvoices: (boardId: string) => api.get<Invoice[]>(`/league/boards/${boardId}/invoices`),
  recordPayment: (invoiceId: string, amount: number) => api.post<Invoice>(`/league/invoices/${invoiceId}/payment`, { amount }),
  // Waiver Report
  getWaiverReport: (tournamentId: string) => api.get<WaiverReport[]>(`/league/tournaments/${tournamentId}/waivers`),
};
