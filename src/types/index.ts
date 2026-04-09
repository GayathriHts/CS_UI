// ── Auth ──
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface RegisterStartRequest {
  firstName: string;
  lastName: string;
  email?: string;
  mobileNumber?: string;
}

export interface RegisterConfirmRequest {
  firstName: string;
  lastName: string;
  email?: string;
  mobileNumber?: string;
  password: string;
  otp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    user: User;
  };
}

// ── User ──
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  city?: string;
  country?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  playerRole?: string;
}

export interface PlayerStats {
  userId: string;
  playerName: string;
  totalMatches: number;
  totalRuns: number;
  totalWickets: number;
  centuries: number;
  halfCenturies: number;
  fiveWicketHauls: number;
  battingAverage?: number;
  bowlingAverage?: number;
  strikeRate?: number;
  economyRate?: number;
  highestScore: number;
  bestBowling?: string;
}
// ── Board Owner ──
export interface BoardOwner {
  id: string;
  userName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  profileImageUrl?: string;
  city?: string;
  country?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  playerRole?: string;
}

// ── Board ──
export interface Board {
  id: string;
  name: string;
  boardType: 'Team' | 'League';
  description?: string;
  logoUrl?: string;
  city?: string;
  state?: string;
  country?: string;
  address1?: string;
  address2?: string;
  contactNumber?: string;
  contactEmail?: string;
  websiteAddress?: string;
  ownerId: string;
  coOwnerId?: string;
  owner?: BoardOwner;
  coOwner?: BoardOwner;
  ownerName: string;
  fanCount: number;
  rosterCount: number;
  isActive?: boolean;
}

// ── Roster ──
export interface Roster {
  id: string;
  name: string;
  boardId: string;
  boardName: string;
  logoUrl?: string;
  memberCount: number;
}

export interface RosterMember {
  id: string;
  userId: string;
  userName: string;
  profileImageUrl?: string;
  role: string;
  status: string;
}

// ── Tournament ──
export interface Tournament {
  id: string;
  name: string;
  format?: string;
  oversPerInning?: number;
  maxPlayersPerTeam?: number;
  status: string;
  startDate?: string;
  endDate?: string;
  boardId: string;
  boardName: string;
  matchCount: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  tournamentName: string;
  homeTeamId?: string;
  homeTeamName: string;
  awayTeamId?: string;
  awayTeamName: string;
  groundId?: string;
  groundName?: string;
  umpireId?: string;
  umpireName?: string;
  scorerId?: string;
  scorerName?: string;
  scheduledAt: string;
  status: string;
  result?: string;
}

// ── Scorecard ──
export interface Scorecard {
  id: string;
  matchId: string;
  tossWonBy?: string;
  tossDecision?: string;
  isLocked: boolean;
  status: string;
  innings: Innings[];
}

export interface Innings {
  id: string;
  inningsNumber: number;
  battingTeamName: string;
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  extras: number;
  batting: BattingEntry[];
  bowling: BowlingEntry[];
}

export interface BattingEntry {
  batsmanId: string;
  batsmanName: string;
  runsScored: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  dismissalType?: string;
  bowlerName?: string;
  battingPosition: number;
}

export interface BowlingEntry {
  bowlerId: string;
  bowlerName: string;
  overs: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  wides: number;
  noBalls: number;
}

// ── Live Scoring ──
export interface BallUpdate {
  matchId: string;
  overNumber: number;
  ballNumber: number;
  batsmanId: string;
  bowlerId: string;
  runs: number;
  extraType?: string;
  extraRuns: number;
  isWicket: boolean;
  wicketType?: string;
  commentary?: string;
}

export interface LiveScore {
  matchId: string;
  battingTeam: string;
  bowlingTeam: string;
  totalRuns: number;
  totalWickets: number;
  currentOver: number;
  currentBatsman: string;
  currentBowler: string;
  lastSixBalls: string;
}

// ── Feed ──
export interface Feed {
  id: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  content?: string;
  mediaUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface FeedComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

// ── Pagination ──
export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Board Info / Team Board ──
export interface BoardInfo {
  aboutOrganization?: string;
  history?: string;
  rulesAndRegulations?: string;
  awardsAndHonors?: string;
  faq?: string;
}

export interface BoardDirector {
  id: string;
  name: string;
  title?: string;
  imageUrl?: string;
}

export interface BoardSponsor {
  id: string;
  name: string;
  logoUrl?: string;
  websiteUrl?: string;
}

export interface BoardFan {
  userId: string;
  userName: string;
  profileImageUrl?: string;
  joinedAt: string;
}

export interface BoardEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  eventDate: string;
  eventType: string;
  status: string;
}

export interface BoardFeedItem {
  id: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  content?: string;
  mediaUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface BoardFollowing {
  boardId: string;
  boardName: string;
  logoUrl?: string;
  boardType?: string;
}

export interface BoardScore {
  totalMatches: number;
  matchesWon: number;
  matchesLost: number;
  matchesTied: number;
  tournaments: Tournament[];
}

export interface RosterDetail {
  id: string;
  name: string;
  logoUrl?: string;
  memberCount: number;
  members: RosterMemberDetail[];
}

export interface RosterMemberDetail {
  userId: string;
  userName: string;
  profileImageUrl?: string;
  role: string;
  status: string;
  stats?: PlayerStats;
}

// ── Umpire ──
export interface Umpire {
  id: string;
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  contactNumber?: string;
  countryCode?: string;
  email?: string;
  rating: number;
  totalMatches: number;
  createdByBoardId: string;
}

// ── Ground ──
export interface Ground {
  groundId: string;
  groundName: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  landmark?: string;
  homeTeam?: string;
  placeOfGround?: string;
  additonalDirection?: string;
  additionalDirection?: string;
  groundFacilities?: string;
  pitchDescription?: string;
  wicketType?: string;
  permitTime?: string;
}

// ── League Application ──
export interface LeagueApplication {
  id: string;
  tournamentId: string;
  tournamentName: string;
  teamId: string;
  teamName: string;
  status: string;
  paymentAmount?: number;
  paymentStatus?: string;
  waiverSigned: boolean;
  submittedAt: string;
}

// ── Invoice ──
export interface Invoice {
  id: string;
  invoiceNumber: string;
  boardId: string;
  tournamentId?: string;
  tournamentName?: string;
  teamId?: string;
  teamName?: string;
  amount: number;
  paidAmount?: number;
  status: string;
  description?: string;
  dueDate: string;
  paidDate?: string;
  createdAt: string;
}

// ── Waiver Report ──
export interface WaiverReport {
  id: string;
  tournamentId: string;
  tournamentName: string;
  teamId: string;
  teamName: string;
  playerId: string;
  playerName: string;
  waiverSigned: boolean;
  signedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── EPIC E: SCORING & LIVE SCORING ──
// ═══════════════════════════════════════════════════════════════════════════════

export interface BattingOrder {
  inningsId: string;
  position: number;
  batsmanId: string;
  batsmanName: string;
  status: 'YetToBat' | 'Batting' | 'Out' | 'DNB';
}

export interface OverCompletion {
  inningsId: string;
  overNumber: number;
  totalRuns: number;
  wickets: number;
  balls: BallUpdate[];
}

export interface BallByBallDetail {
  id: string;
  overNumber: number;
  ballNumber: number;
  batsmanName: string;
  bowlerName: string;
  runs: number;
  extraType?: string;
  extraRuns: number;
  isWicket: boolean;
  wicketType?: string;
  commentary?: string;
  timestamp: string;
}

export interface ScoreboardSummary {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  homeWickets: number;
  homeOvers: number;
  awayScore: number;
  awayWickets: number;
  awayOvers: number;
  status: string;
  result?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── EPIC F: SOCIAL ──
// ═════════════════════════════════════════════════════════════════════════════

export interface FeedLike {
  feedId: string;
  userId: string;
  isLiked: boolean;
}

export interface MediaUpload {
  fileName: string;
  fileUrl: string;
  mediaType: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface FeedStatistics {
  feedId: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  likedByUserIds: string[];
}

export interface BoardFeedComment {
  id: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  content: string;
  createdAt: string;
}
