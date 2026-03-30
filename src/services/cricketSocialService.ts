import api, { boardApi } from './api';
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
    ownerId: string;
    logoUrl: string;
    coOwnerIds?: string[];
  }) => boardApi.post('/Boards', data),

  // Get all boards (with optional pagination)
  // getAll: (page = 1, pageSize = 20, version = 1) =>
  // boardApi.get('/Boards', { 
  //   params: { page, pageSize, version } 
  // }),
    getMyBoards: (page = 1, pageSize = 20) => boardApi.get('/Boards', {
      params: { page, pageSize, _t: Date.now() },
      headers: { 'Cache-Control': 'no-cache' },
    }),


  // Get a board by ID
  getById: (id: string) => boardApi.get(`/Boards/${id}`, {
    params: { _t: Date.now() },
    headers: { 'Cache-Control': 'no-cache' },
  }),

  // Update a board by ID (PUT /api/v1/Boards/{id})
  update: (id: string, data: any) => boardApi.put(`/Boards/${id}`, data),

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
export const rosterService = {
  create: (boardId: string, data: {
    name: string;
    boardId?: string;
    rosterName?: string;
    logoUrl?: string;
    captain?: string;
    viceCaptain?: string;
    coach?: string;
    members?: string[];
  }) => boardApi.post(`/boards/${boardId}/Rosters`, {
    name: data.name,
    rosterName: data.rosterName || data.name,
    boardId: data.boardId || boardId,
    logoUrl: data.logoUrl || '',
    captain: data.captain || '',
    viceCaptain: data.viceCaptain || '',
    coach: data.coach || '',
    members: data.members || [],
  }) as Promise<{ data: Roster }>,
  getByBoard: (boardId: string) => boardApi.get(`/boards/${boardId}/Rosters`) as Promise<{ data: Roster[] }>,
  getById: (boardId: string, rosterId: string) => boardApi.get(`/boards/${boardId}/Rosters/${rosterId}`) as Promise<{ data: Roster }>,
  update: (boardId: string, rosterId: string, data: {
    name: string;
    logoUrl?: string;
  }) => boardApi.put(`/boards/${boardId}/Rosters/${rosterId}`, {
    name: data.name,
    logoUrl: data.logoUrl || '',
  }) as Promise<{ data: Roster }>,
  delete: (boardId: string, rosterId: string) => boardApi.delete(`/boards/${boardId}/Rosters/${rosterId}`),
};

// ── Tournaments ──
export const tournamentService = {
  create: (data: { name: string; boardId: string; format?: string; oversPerInning?: number; maxPlayersPerTeam?: number; startDate?: Date; endDate?: Date }) =>
    api.post<Tournament>('/tournaments', data),
  getById: (id: string) => api.get<Tournament>(`/tournaments/${id}`),
  getByBoard: (boardId: string, page = 1, pageSize = 20) =>
    api.get<PagedResponse<Tournament>>(`/tournaments/board/${boardId}`, { params: { page, pageSize } }),
  update: (id: string, data: { name?: string; format?: string; oversPerInning?: number; maxPlayersPerTeam?: number; startDate?: Date; endDate?: Date }) =>
    api.put<Tournament>(`/tournaments/${id}`, data),
  cancel: (id: string) => api.delete(`/tournaments/${id}`),
  createMatch: (data: { tournamentId: string; homeTeamId: string; awayTeamId: string; groundId?: string; umpireId?: string; scorerId?: string; scheduledAt: string }) =>
    api.post<Match>('/tournaments/matches', data),
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
      headers: { 'Cache-Control': 'no-cache' },
    }).then((r: { data: any }) => {
      const raw = r.data;
      console.log('getSquad raw response:', raw);
      // Normalize: API may return array directly, or { data: [...] }, or { items: [...] }
      const list = Array.isArray(raw) ? raw
        : Array.isArray(raw?.data) ? raw.data
        : Array.isArray(raw?.items) ? raw.items
        : raw ? [raw] : [];
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
};

// ── League Management ──
export const leagueService = {
  // Umpires
  createUmpire: (boardId: string, data: { name: string; email?: string; contactNumber?: string; city?: string }) =>
    api.post<Umpire>(`/league/boards/${boardId}/umpires`, data),
  getUmpires: (boardId: string) => api.get<Umpire[]>(`/league/boards/${boardId}/umpires`),
  updateUmpire: (umpireId: string, data: { name?: string; contactNumber?: string; city?: string }) =>
    api.put<Umpire>(`/league/umpires/${umpireId}`, data),
  deleteUmpire: (umpireId: string) => api.delete(`/league/umpires/${umpireId}`),
  // Grounds
  createGround: (data: { name: string; address?: string; city?: string; state?: string }) =>
    api.post<Ground>('/league/grounds', data),
  getGrounds: () => api.get<Ground[]>('/league/grounds'),
  deleteGround: (groundId: string) => api.delete(`/league/grounds/${groundId}`),
  // Tournament Management
  cancelTournament: (tournamentId: string) => api.delete(`/tournaments/${tournamentId}`),
  getSchedule: (boardId: string, from: string, to: string) =>
    api.get<Match[]>(`/league/boards/${boardId}/schedule`, { params: { from, to } }),
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
