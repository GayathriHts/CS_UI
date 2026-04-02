import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/slices/authStore';
import { boardService, tournamentService, userService, feedService } from '../services/cricketSocialService';
import { fetchCountries, fetchStates, fetchCities } from '../services/locationService';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

type MenuSection = 'score' | 'pitch' | 'events' | 'fans' | 'fanof' | 'board' | 'buddies' | 'compare' | 'book' | 'invoices';

const menuItems: { id: MenuSection; label: string; icon: string; iconImg?: string }[] = [
  { id: 'score', label: 'My Score', icon: '📊', iconImg: '/images/MyScore.png' },
  { id: 'pitch', label: 'Pitch', icon: '📢', iconImg: '/images/pitch-icon.png' },
  { id: 'events', label: 'My Events & Fixtures', icon: '📅', iconImg: '/images/MyEvents.png' },
  { id: 'fans', label: 'My Fans', icon: '👥', iconImg: '/images/MyFans.png' },
  { id: 'fanof', label: 'I Am Fan Of', icon: '⭐', iconImg: '/images/IAmFanOf.png' },
  { id: 'board', label: 'My Boards', icon: '🏟️', iconImg: '/images/MyBoard.png' },
  { id: 'buddies', label: 'My Buddies', icon: '🤝', iconImg: '/images/MyBuddyList.png' },
  { id: 'compare', label: 'Player Compare', icon: '⚖️', iconImg: '/images/PlayerCompare.png' },
  { id: 'book', label: 'Cricket Book', icon: '📖', iconImg: '/images/CricketBook.png' },
  { id: 'invoices', label: 'My Invoices', icon: '🧾' },
];

const visibleMenuItems = menuItems.filter((item) => item.id === 'board');

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as MenuSection) || 'board';
  const [activeMenu, setActiveMenu] = useState<MenuSection>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Track recently created boards to prevent them vanishing on refetch or reload
  const [recentBoards, setRecentBoards] = useState<any[]>(() => {
    try {
      const stored = sessionStorage.getItem('recentBoards');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const updateRecentBoards = (boards: any[]) => {
    setRecentBoards(boards);
    if (boards.length > 0) {
      sessionStorage.setItem('recentBoards', JSON.stringify(boards));
    } else {
      sessionStorage.removeItem('recentBoards');
    }
  };

  const { data: boards } = useQuery({
    queryKey: ['myBoards', user?.id],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!user?.id) return { items: [] };
      // Fetch boards where user is owner or co-owner
      const [ownerRes, coOwnerRes] = await Promise.all([
        boardService.getByOwner(user.id).catch(() => ({ data: null })),
        boardService.getByOwner(undefined, user.id).catch(() => ({ data: null })),
      ]);

      const extractItems = (raw: any): any[] => {
        if (!raw) return [];
        if (raw?.items) return raw.items;
        if (Array.isArray(raw)) return raw;
        if (raw?.data?.items) return raw.data.items;
        if (raw?.data && Array.isArray(raw.data)) return raw.data;
        return [];
      };

      const ownerItems = extractItems(ownerRes.data);
      const coOwnerItems = extractItems(coOwnerRes.data);

      // Merge and deduplicate by id
      const seen = new Set<string>();
      let items: any[] = [];
      for (const b of [...ownerItems, ...coOwnerItems]) {
        if (b.id && !seen.has(b.id)) {
          seen.add(b.id);
          items.push(b);
        }
      }

      // Apply pending board edits from sessionStorage (survives refresh + refetch race conditions)
      try {
        const pendingEdits = JSON.parse(sessionStorage.getItem('boardEdits') || '{}');
        if (Object.keys(pendingEdits).length > 0) {
          let changed = false;
          items = items.map((b: any) => {
            const edit = pendingEdits[b.id];
            if (edit) {
              // If backend has caught up (name matches), remove the pending edit
              if (b.name === edit.name) {
                delete pendingEdits[b.id];
                changed = true;
                return b;
              }
              return { ...b, ...edit };
            }
            return b;
          });
          if (changed) {
            if (Object.keys(pendingEdits).length === 0) {
              sessionStorage.removeItem('boardEdits');
            } else {
              sessionStorage.setItem('boardEdits', JSON.stringify(pendingEdits));
            }
          }
        }
      } catch {}

      const serverIds = new Set(items.map((b: any) => b.id));
      const missing = recentBoards.filter(b => b.id && !serverIds.has(b.id));
      // Clean up recentBoards once backend returns them
      if (recentBoards.length > 0 && missing.length === 0) {
        updateRecentBoards([]);
      }
      return { items: [...missing, ...items] };
    },
  });


  const { data: feed } = useQuery({
    queryKey: ['feed'],
    queryFn: () => feedService.getFeed(1, 5).then((r) => r.data),
    enabled: activeMenu === 'pitch',
  });

  // B6 Fix: Add like/comment mutations for Pitch tab
  const qc = useQueryClient();
  const [pitchContent, setPitchContent] = useState('');
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [boardNameError, setBoardNameError] = useState('');
  const [newBoardType, setNewBoardType] = useState<'' | 'Team' | 'League'>('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [newBoardCity, setNewBoardCity] = useState('');
  const [newBoardState, setNewBoardState] = useState('');
  const [newBoardCountry, setNewBoardCountry] = useState('');
  const [newBoardLogo, setNewBoardLogo] = useState<File | null>(null);
  const [newBoardLogoPreview, setNewBoardLogoPreview] = useState<string>('');
  const [coOwnerSearch, setCoOwnerSearch] = useState('');
  const [showCoOwnerDropdown, setShowCoOwnerDropdown] = useState(false);
  const [selectedCoOwner, setSelectedCoOwner] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);

  // Location async state
  const [countryList, setCountryList] = useState<string[]>([]);
  const [stateList, setStateList] = useState<string[]>([]);
  const [cityList, setCityList] = useState<string[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);

  // Custom dropdown open/search state
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [countrySearchText, setCountrySearchText] = useState('');
  const [stateSearchText, setStateSearchText] = useState('');
  const [citySearchText, setCitySearchText] = useState('');

  // Fetch countries on mount
  useEffect(() => {
    setCountriesLoading(true);
    fetchCountries().then(setCountryList).catch(() => setCountryList([])).finally(() => setCountriesLoading(false));
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    setStateList([]);
    setCityList([]);
    if (!newBoardCountry) return;
    setStatesLoading(true);
    fetchStates(newBoardCountry).then(setStateList).catch(() => setStateList([])).finally(() => setStatesLoading(false));
  }, [newBoardCountry]);

  // Fetch cities when state changes
  useEffect(() => {
    setCityList([]);
    if (!newBoardCountry || !newBoardState) return;
    setCitiesLoading(true);
    fetchCities(newBoardCountry, newBoardState).then(setCityList).catch(() => setCityList([])).finally(() => setCitiesLoading(false));
  }, [newBoardCountry, newBoardState]);

  const { data: coOwnerUserList, isLoading: coOwnerLoading } = useQuery({
    queryKey: ['usersList'],
    queryFn: async () => {
      const r = await userService.list();
      const raw = r.data as any;
      // Handle all possible response shapes
      const list = Array.isArray(raw) ? raw
        : Array.isArray(raw?.data) ? raw.data
        : Array.isArray(raw?.items) ? raw.items
        : Array.isArray(raw?.users) ? raw.users
        : Array.isArray(raw?.result) ? raw.result
        : raw ? [raw] : [];
      // Normalize user fields (API may use name/fullName instead of firstName/lastName)
      return list.map((u: any) => {
        const first = u.firstName || u.name?.split(' ')[0] || u.fullName?.split(' ')[0] || '';
        const last = u.lastName || u.name?.split(' ').slice(1).join(' ') || u.fullName?.split(' ').slice(1).join(' ') || '';
        const email = u.email || u.emailAddress || '';
        return {
          id: u.id || u.Id || u.userId || u.UserId,
          firstName: first || email.split('@')[0] || email,
          lastName: last,
          email,
        };
      });
    },
    enabled: showCoOwnerDropdown,
  });

  const likeMutation = useMutation({
    mutationFn: (feedId: string) => feedService.like(feedId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });

  const { data: comments } = useQuery({
    queryKey: ['feedComments', activeCommentsPostId],
    queryFn: () => feedService.getComments(activeCommentsPostId!).then((r) => r.data),
    enabled: !!activeCommentsPostId && activeMenu === 'pitch',
  });

 const addCommentMutation = useMutation({
  mutationFn: ({ id, content }: { id: string; content: string }) =>
    feedService.addComment(id, content),

  onSuccess: () => {
    // ✅ Refresh only feed (not boards)
    qc.invalidateQueries({ queryKey: ['feed'] });

    // Optional: also refresh comments for that post
    qc.invalidateQueries({ queryKey: ['feedComments'] });
  },
});

  

  const postMutation = useMutation({
    mutationFn: (content: string) => feedService.create({ content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['feed'] }); setPitchContent(''); },
  });

  // B7 Fix: Add create board mutation
  const boardTypeValue = newBoardType === 'Team' ? 1 : newBoardType === 'League' ? 2 : 1;
  const createBoardMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      // Check for duplicate board name
      const existingNames = (boards?.items || []).map((b: any) => b.name?.toLowerCase().trim());
      if (existingNames.includes(newBoardName.toLowerCase().trim())) {
        throw new Error('Board name already exists. Please create a different name.');
      }
      // Only set ownerId for League boards; use co-owner's ID when selected
      const resolvedOwnerId = newBoardType === 'League'
        ? (selectedCoOwner ? selectedCoOwner.id : user.id)
        : user.id;
      console.log('Creating board - selectedCoOwner:', selectedCoOwner, 'resolvedOwnerId:', resolvedOwnerId, 'loggedInUserId:', user.id);
      // The API returns the created board in res.data.data
      const res = await boardService.create({
        name: newBoardName,
        description: newBoardDescription,
        boardType: boardTypeValue,
        city: newBoardCity,
        state: newBoardState,
        country: newBoardCountry,
        ownerId: resolvedOwnerId,
        logoUrl: newBoardLogoPreview || '',
        ...(newBoardType === 'League' && selectedCoOwner
          ? { coOwnerId: selectedCoOwner.id }
          : {}),
      });
      // Support both .data and .data.data (API response wrapper)
      return res.data?.data || res.data;
    },
    onSuccess: (newBoard) => {
      // Track the new board so it persists even if backend is slow
      updateRecentBoards([newBoard, ...recentBoards]);
      // Add to cache instantly
      qc.setQueryData(['myBoards'], (old: any) => {
        if (!old) return { items: [newBoard] };
        return {
          ...old,
          items: [newBoard, ...(old.items || [])],
        };
      });
      setShowCreateBoard(false);
      setNewBoardName('');
      setNewBoardDescription('');
      setNewBoardCity('');
      setNewBoardState('');
      setNewBoardCountry('');
      setNewBoardLogo(null);
      setNewBoardLogoPreview('');
      setSelectedCoOwner(null);
      setCoOwnerSearch('');
      setShowCoOwnerDropdown(false);
      // Stay on the boards dashboard
      qc.invalidateQueries({ queryKey: ['myBoards'] });
    },
    onError: (error: any) => {
      if (error?.message === 'Board name already exists. Please create a different name.') {
        setBoardNameError(error.message);
      } else if (error?.response?.status === 401) {
        alert('Session expired. Please sign in again.');
        window.location.href = '/login';
      } else {
        const detail = error?.response?.data?.title || error?.response?.data?.message || error?.response?.data?.errors ? JSON.stringify(error.response.data.errors) : '';
        console.error('Create board error:', error?.response?.status, error?.response?.data);
        alert(`Failed to create board.${detail ? ' ' + detail : ''}`);
      }
    },
  });
// Login API call example (use in your login form handler)
//
// import { authService } from '../services/cricketSocialService';
// import { useAuthStore } from '../store/slices/authStore';
//
// const handleLogin = async (email: string, password: string) => {
//   const res = await authService.login({ email, password });
//   const { token, user } = res.data;
//   useAuthStore.getState().login(token, user);
// };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-dark shadow-lg">
        <div className="max-w-full mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2">
              <img src="/images/cs-logo.png" alt="CricketSocial" className="h-8" />
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search players, teams, boards..."
                  className="w-full bg-white/10 text-white placeholder-gray-300 rounded-full px-5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light border border-white/20"
                />
                <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <button className="text-white/80 hover:text-white relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-brand-dark" />
              </button>
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-brand-light rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <span className="text-white text-sm hidden md:block">{user?.firstName}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-white/80 hover:text-white text-sm px-3 py-1.5 border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-14">
        {/* Left Sidebar */}
        <aside className={`fixed left-0 top-14 bottom-0 bg-white shadow-lg overflow-y-auto transition-all duration-300 flex flex-col ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
          {/* User Profile Card */}
          <Link to="/profile" className="block p-4 border-b bg-gradient-to-b from-brand-green/10 to-white hover:from-brand-green/20 transition-colors">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} mb-3`}>
              <div className={`${sidebarCollapsed ? 'w-10 h-10 text-sm' : 'w-14 h-14 text-xl'} bg-brand-green rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 transition-all duration-300`}>
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <>{user?.firstName?.[0]}{user?.lastName?.[0]}</>
                )}
              </div>
              {!sidebarCollapsed && (
                <div>
                  <p className="font-semibold text-gray-800">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500">{user?.playerRole || 'Cricket Player'}</p>
                  <p className="text-xs text-brand-green font-medium mt-0.5">View Profile →</p>
                </div>
              )}
            </div>
          </Link>

          {/* Navigation Menu */}
          <nav className={sidebarCollapsed ? 'p-2' : 'p-3'}>
            {visibleMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`${activeMenu === item.id ? 'sidebar-item-active' : 'sidebar-item'} w-full ${sidebarCollapsed ? 'justify-center !px-2' : 'text-left'}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {item.iconImg ? (
                  <img src={item.iconImg} alt="" className="w-8 h-8 object-contain flex-shrink-0" 
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                )}
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Spacer to push toggle to bottom */}
          <div className="flex-1" />

          {/* Bottom Collapse/Expand Toggle */}
          <div className="border-t border-gray-200 p-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between px-3'} py-2.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-green transition-colors`}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {!sidebarCollapsed && <span className="text-xs font-medium">Collapse</span>}
              <svg className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} mr-72 p-6 min-h-[calc(100vh-56px)] transition-all duration-300`}>
          {/* My Score Section */}
          {/* Removed My Score section (stats) */}

          {/* Pitch (Feed) Section */}
          {activeMenu === 'pitch' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Pitch</h2>
              <div className="max-w-2xl">
                {/* New Post */}
                <div className="card mb-6">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-brand-green rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {user?.firstName?.[0]}
                    </div>
                    <textarea
                      placeholder="What's happening in your cricket world?"
                      className="flex-1 border border-gray-200 rounded-lg p-3 resize-none focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none"
                      rows={3}
                      value={pitchContent}
                      onChange={e => setPitchContent(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <div className="flex gap-2">
                      <button className="text-gray-400 hover:text-brand-green text-sm flex items-center gap-1">📷 Photo</button>
                      <button className="text-gray-400 hover:text-brand-green text-sm flex items-center gap-1">🎥 Video</button>
                    </div>
                    <button onClick={() => pitchContent.trim() && postMutation.mutate(pitchContent)} disabled={!pitchContent.trim() || postMutation.isPending}
                      className="btn-primary px-6 py-2 text-sm">{postMutation.isPending ? 'Posting...' : 'Post'}</button>
                  </div>
                </div>

                {/* Feed Posts */}
                {feed?.items.map((post) => (
                  <div key={post.id} className="card mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-brand-green rounded-full flex items-center justify-center text-white font-bold">
                        {post.userName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{post.userName}</p>
                        <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {post.content && <p className="text-gray-700 mb-3">{post.content}</p>}
                    {post.mediaUrl && <img src={post.mediaUrl} alt="" className="rounded-lg mb-3 w-full" />}
                    <div className="flex gap-6 pt-3 border-t text-sm text-gray-500">
                      <button onClick={() => likeMutation.mutate(post.id)} className="flex items-center gap-1 hover:text-red-500">❤️ {post.likesCount}</button>
                      <button
                        onClick={() => {
                          setCommentText('');
                          setActiveCommentsPostId((cur) => (cur === post.id ? null : post.id));
                        }}
                        className="flex items-center gap-1 hover:text-brand-green"
                      >
                        💬 {post.commentsCount}
                      </button>
                      <button className="flex items-center gap-1 hover:text-blue-500">🔗 Share</button>
                    </div>

                    {activeCommentsPostId === post.id && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="space-y-2 mb-3">
                          {comments?.length ? comments.map((c) => (
                            <div key={c.id} className="text-sm text-gray-700">
                              <span className="font-semibold text-gray-800">{c.userName}:</span>{' '}
                              <span>{c.content}</span>
                            </div>
                          )) : (
                            <p className="text-sm text-gray-400">No comments yet.</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none"
                          />
                          <button
                            onClick={() => {
                              const content = commentText.trim();
                              if (!content) return;
                              addCommentMutation.mutate({ id: post.id, content });
                            }}
                            disabled={!commentText.trim() || addCommentMutation.isPending}
                            className="btn-primary px-4 py-2 text-sm"
                          >
                            {addCommentMutation.isPending ? '...' : 'Send'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )) || (
                  <div className="card text-center text-gray-400 py-12">
                    <p className="text-lg mb-2">No posts yet</p>
                    <p className="text-sm">Start sharing your cricket moments!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* My Events & Fixtures */}
          {/* Removed My Events & Fixtures section (upcoming) */}

          {/* My Fans */}
          {activeMenu === 'fans' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">My Fans</h2>
              <div className="card text-center py-12">
                <img src="/images/MyFans.png" alt="" className="w-16 h-16 mx-auto mb-4 opacity-50" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <p className="text-gray-400 text-lg">No fans yet</p>
                <p className="text-gray-400 text-sm mt-2">Play matches and build your fan following!</p>
              </div>
            </div>
          )}

          {/* I Am Fan Of */}
          {activeMenu === 'fanof' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">I Am Fan Of</h2>
              <div className="card text-center py-12">
                <img src="/images/IAmFanOf.png" alt="" className="w-16 h-16 mx-auto mb-4 opacity-50" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <p className="text-gray-400 text-lg">Not following anyone yet</p>
                <p className="text-gray-400 text-sm mt-2">Search for players and teams to follow!</p>
              </div>
            </div>
          )}

          {/* My Boards */}
          {activeMenu === 'board' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Boards</h2>
                {!showCreateBoard && (
                  <button onClick={() => setShowCreateBoard(true)} className="btn-primary text-sm flex items-center gap-2">
                    <span className="text-xl font-bold leading-none">+</span> Create Board
                  </button>
                )}
              </div>
              {showCreateBoard && (
                <div className="card mb-6">
                  <h3 className="font-semibold mb-4">Create Your Board</h3>
                  {/* Logo Upload */}
                  <div className="flex flex-col items-start gap-1 mb-4">
                    <p className="text-sm font-medium text-gray-700">Board Logo</p>
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden hover:border-brand-green transition-colors cursor-pointer group"
                        onClick={() => document.getElementById('board-logo-input')?.click()}>
                        {newBoardLogoPreview ? (
                          <img src={newBoardLogoPreview} alt="Board logo" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center text-gray-400 group-hover:text-brand-green transition-colors px-1">
                            <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="text-[9px] leading-tight text-center font-medium">Upload Logo</span>
                          </div>
                        )}
                        {newBoardLogoPreview && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </div>
                        )}
                      </div>
                      {newBoardLogoPreview && (
                        <button className="text-xs text-red-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); setNewBoardLogo(null); setNewBoardLogoPreview(''); }}>Remove</button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 ml-2">Max 2MB</p>
                    <input id="board-logo-input" type="file" accept="image/*" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) { alert('Logo must be under 2MB'); return; }
                        setNewBoardLogo(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setNewBoardLogoPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Board Name <span className="text-red-500">*</span></label><input value={newBoardName} maxLength={50} onChange={e => { let val = e.target.value; if (val.length === 0 || (val.length > 0 && val[0] !== ' ' && /^[a-zA-Z0-9 ]*$/.test(val))) { val = val.charAt(0).toUpperCase() + val.slice(1); setNewBoardName(val); setBoardNameError(''); } }} className={`input-field ${boardNameError ? 'border-red-500' : ''}`} /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                      <select value={newBoardType} onChange={e => setNewBoardType(e.target.value as '' | 'Team' | 'League')} className="input-field"><option value="" disabled>Select Type</option><option value="Team">Team</option><option value="League">League</option></select></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={newBoardDescription} maxLength={1000} onChange={e => setNewBoardDescription(e.target.value)} className="input-field" rows={3} /></div>
                    <div className="relative"><label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                      {countryDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCountryDropdownOpen(false); setCountrySearchText(''); }} />}
                      <div
                        className={`input-field cursor-pointer flex items-center justify-between ${countriesLoading ? 'opacity-50' : ''}`}
                        onClick={() => { if (!countriesLoading) setCountryDropdownOpen(!countryDropdownOpen); }}
                      >
                        <span className={newBoardCountry ? 'text-gray-900' : 'text-gray-400'}>{countriesLoading ? 'Loading countries...' : newBoardCountry || 'Select Country'}</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                      {countryDropdownOpen && (
                        <div className="absolute z-10 bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                          <div className="max-h-80 overflow-y-auto">
                            {countryList.filter(c => !countrySearchText || c.toLowerCase().includes(countrySearchText.toLowerCase())).map(c => (
                              <button key={c} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${newBoardCountry === c ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                                onClick={() => { setNewBoardCountry(c); setNewBoardState(''); setNewBoardCity(''); setCountryDropdownOpen(false); setCountrySearchText(''); }}>{c}</button>
                            ))}
                            {countryList.filter(c => !countrySearchText || c.toLowerCase().includes(countrySearchText.toLowerCase())).length === 0 && (
                              <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
                            )}
                          </div>
                          <div className="p-2 border-t border-gray-100">
                            <input type="text" value={countrySearchText} onChange={e => setCountrySearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search country..." autoFocus onClick={e => e.stopPropagation()} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="relative"><label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                      {stateDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setStateDropdownOpen(false); setStateSearchText(''); }} />}
                      <div
                        className={`input-field cursor-pointer flex items-center justify-between ${!newBoardCountry || statesLoading ? 'pointer-events-none' : ''}`}
                        onClick={() => { if (newBoardCountry && !statesLoading) setStateDropdownOpen(!stateDropdownOpen); }}
                      >
                        <span className={newBoardState ? 'text-gray-900' : 'text-gray-400'}>{!newBoardCountry ? 'Select Country first' : statesLoading ? 'Loading states...' : newBoardState || 'Select State'}</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${stateDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                      {stateDropdownOpen && (
                        <div className="absolute z-10 bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                          <div className="max-h-80 overflow-y-auto">
                            {stateList.filter(s => !stateSearchText || s.toLowerCase().includes(stateSearchText.toLowerCase())).map(s => (
                              <button key={s} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${newBoardState === s ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                                onClick={() => { setNewBoardState(s); setNewBoardCity(''); setStateDropdownOpen(false); setStateSearchText(''); }}>{s}</button>
                            ))}
                            {stateList.filter(s => !stateSearchText || s.toLowerCase().includes(stateSearchText.toLowerCase())).length === 0 && (
                              <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
                            )}
                          </div>
                          <div className="p-2 border-t border-gray-100">
                            <input type="text" value={stateSearchText} onChange={e => setStateSearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search state..." autoFocus onClick={e => e.stopPropagation()} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="relative"><label className="block text-sm font-medium text-gray-700 mb-1">District / City <span className="text-red-500">*</span></label>
                      {cityDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCityDropdownOpen(false); setCitySearchText(''); }} />}
                      <div
                        className={`input-field cursor-pointer flex items-center justify-between ${!newBoardState || citiesLoading ? 'pointer-events-none' : ''}`}
                        onClick={() => { if (newBoardState && !citiesLoading) setCityDropdownOpen(!cityDropdownOpen); }}
                      >
                        <span className={newBoardCity ? 'text-gray-900' : 'text-gray-400'}>{!newBoardState ? 'Select State first' : citiesLoading ? 'Loading...' : newBoardCity || 'Select District / City'}</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                      {cityDropdownOpen && (
                        <div className="absolute z-10 bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                          <div className="max-h-80 overflow-y-auto">
                            {cityList.filter(c => !citySearchText || c.toLowerCase().includes(citySearchText.toLowerCase())).map(c => (
                              <button key={c} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${newBoardCity === c ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                                onClick={() => { setNewBoardCity(c); setCityDropdownOpen(false); setCitySearchText(''); }}>{c}</button>
                            ))}
                            {cityList.filter(c => !citySearchText || c.toLowerCase().includes(citySearchText.toLowerCase())).length === 0 && (
                              <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
                            )}
                          </div>
                          <div className="p-2 border-t border-gray-100">
                            <input type="text" value={citySearchText} onChange={e => setCitySearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search district / city..." autoFocus onClick={e => e.stopPropagation()} />
                          </div>
                        </div>
                      )}
                    </div>
                    {newBoardType === 'League' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Co-Owner</label>
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            {showCoOwnerDropdown && (
                              <div className="fixed inset-0 z-[5]" onClick={() => { setShowCoOwnerDropdown(false); setCoOwnerSearch(''); }} />
                            )}
                            <div
                              className="input-field cursor-pointer flex items-center justify-between"
                              onClick={() => setShowCoOwnerDropdown(prev => !prev)}
                            >
                              {selectedCoOwner ? (
                                <span className="text-gray-900 flex items-center gap-2">
                                  {selectedCoOwner.firstName || selectedCoOwner.lastName ? `${selectedCoOwner.firstName} ${selectedCoOwner.lastName}`.trim() : selectedCoOwner.email}
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setSelectedCoOwner(null); }}
                                    className="text-gray-400 hover:text-red-500 font-bold text-sm"
                                  >×</button>
                                </span>
                              ) : (
                                <span className="text-gray-400">Select Co-Owner</span>
                              )}
                            </div>
                            {showCoOwnerDropdown && (
                              <div className="absolute z-10 bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                                <div className="max-h-48 overflow-y-auto">
                                  {coOwnerLoading ? (
                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading users...</div>
                                  ) : (() => {
                                    const filtered = (coOwnerUserList || []).filter((u: any) =>
                                      u.id !== user?.id &&
                                      (!coOwnerSearch || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(coOwnerSearch.toLowerCase()))
                                    );
                                    return filtered.length === 0 ? (
                                      <div className="px-4 py-3 text-sm text-gray-500 text-center">No users found</div>
                                    ) : (
                                      filtered.map((u: any) => (
                                        <button
                                          key={u.id}
                                          onClick={() => {
                                            setSelectedCoOwner({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email });
                                            setCoOwnerSearch('');
                                            setShowCoOwnerDropdown(false);
                                          }}
                                          className="w-full text-left px-4 py-2 hover:bg-brand-green/5 flex items-center gap-2 text-sm border-b last:border-0"
                                        >
                                          <div className="w-7 h-7 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-xs">
                                            {u.firstName?.[0]}
                                          </div>
                                          <div className="min-w-0">
                                            <span className="block font-medium text-gray-900">{u.firstName} {u.lastName}</span>
                                            {u.email && <span className="block text-xs text-gray-600 truncate">{u.email}</span>}
                                          </div>
                                        </button>
                                      ))
                                    );
                                  })()}
                                </div>
                                <div className="p-2 border-t border-gray-100">
                                  <input
                                    type="text"
                                    value={coOwnerSearch}
                                    onChange={e => setCoOwnerSearch(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent"
                                    placeholder="Search users..."
                                    autoFocus
                                    onClick={e => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowCoOwnerDropdown(prev => !prev)}
                            className="px-3 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            title="Select co-owner"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <button onClick={() => {
                      const hasAnyData = newBoardName || newBoardDescription || newBoardLogoPreview || newBoardType || newBoardCountry || newBoardState || newBoardCity || selectedCoOwner;
                      if (hasAnyData) { setShowCancelConfirm(true); } else { setShowCreateBoard(false); }
                    }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">Cancel</button>
                    <button onClick={() => newBoardName && newBoardType && createBoardMutation.mutate()} disabled={!newBoardName || !newBoardType || !newBoardCountry || !newBoardState || !newBoardCity || createBoardMutation.isPending}
                      className="btn-primary text-sm px-6">{createBoardMutation.isPending ? 'Creating...' : 'Create Board'}</button>
                  </div>
                </div>
              )}
              {(() => { console.log('Boards rendered:', boards?.items); return null; })()}
              {!showCreateBoard && boards?.items?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {boards.items.map((b: any) => {
                    const boardTypeLabel = b.boardType === 1 || b.boardType === 'Team' ? 'Team' : b.boardType === 2 || b.boardType === 'League' ? 'League' : b.boardType;
                    const ownerDisplay = b.owner
                      ? `${b.owner.firstName || ''} ${b.owner.lastName || ''}`.trim() || b.owner.email || b.owner.userName || 'Unknown'
                      : b.ownerName || '';
                    const coOwnerDisplay = b.coOwner
                      ? `${b.coOwner.firstName || ''} ${b.coOwner.lastName || ''}`.trim() || b.coOwner.email || b.coOwner.userName || ''
                      : '';
                    return (
                    <Link key={b.id} to={boardTypeLabel === 'League' ? `/league/${b.id}` : `/boards/${b.id}`} className="card hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-brand-green/10 rounded-xl flex items-center justify-center overflow-hidden">
                          {b.logoUrl ? (
                            <img src={b.logoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <img src="/images/boardIcon.png" alt="" className="w-8 h-8" onError={(e) => { (e.target as HTMLImageElement).textContent = '🏟️'; }} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{b.name}</p>
                          <p className="text-sm text-gray-500">{boardTypeLabel} Board</p>
                          {ownerDisplay && (
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="font-medium text-gray-600">Owner:</span> {ownerDisplay}
                            </p>
                          )}
                          {coOwnerDisplay && (
                            <p className="text-xs text-gray-500">
                              <span className="font-medium text-gray-600">Co-Owner:</span> {coOwnerDisplay}
                            </p>
                          )}

                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      {boardTypeLabel === 'League' && (
                        <div
                          className="mt-3 block w-full text-center bg-brand-green/10 text-brand-green text-sm font-medium py-2 rounded-lg hover:bg-brand-green/20 transition-colors">
                          ⚙️ Manage Your League
                        </div>
                      )}
                    </Link>
                  );
                  })}
                </div>
              ) : !showCreateBoard ? (
                <div className="card text-center py-12">
                  <img src="/images/MyBoard.png" alt="" className="w-16 h-16 mx-auto mb-4 opacity-50" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <p className="text-gray-400 text-lg">No boards yet</p>
                  <p className="text-gray-400 text-sm mt-2">Create your first team or league board!</p>
                </div>
              ) : null}
            </div>
          )}

          {/* My Buddies */}
          {activeMenu === 'buddies' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">My Buddies</h2>
              <div className="card text-center py-12">
                <img src="/images/MyBuddyList.png" alt="" className="w-16 h-16 mx-auto mb-4 opacity-50" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <p className="text-gray-400 text-lg">No buddies yet</p>
                <p className="text-gray-400 text-sm mt-2">Connect with other cricket players!</p>
              </div>
            </div>
          )}

          {/* Player Compare */}
          {activeMenu === 'compare' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Player Compare</h2>
              <div className="card">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-brand-green transition-colors cursor-pointer">
                    <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">Select Player 1</p>
                  </div>
                  <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-brand-green transition-colors cursor-pointer">
                    <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">Select Player 2</p>
                  </div>
                </div>
                <div className="text-center mt-6">
                  <button className="btn-primary" disabled>Compare Players</button>
                </div>
              </div>
            </div>
          )}

          {/* Cricket Book */}
          {activeMenu === 'book' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Cricket Book</h2>
              <div className="card text-center py-12">
                <img src="/images/CricketBook.png" alt="" className="w-16 h-16 mx-auto mb-4 opacity-50" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <p className="text-gray-400 text-lg">Your cricket journey</p>
                <p className="text-gray-400 text-sm mt-2">Complete records of all your matches and achievements</p>
              </div>
            </div>
          )}

          {/* My Invoices */}
          {activeMenu === 'invoices' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">My Invoices</h2>
              <div className="card text-center py-12">
                <p className="text-gray-400 text-lg">No invoices</p>
                <p className="text-gray-400 text-sm mt-2">Your payment history will appear here</p>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="fixed right-0 top-14 bottom-0 w-72 bg-white shadow-lg overflow-y-auto p-4">
          {/* Buddies You May Know */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <img src="/images/MyBuddyList.png" alt="" className="w-5 h-5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              Buddies You May Know
            </h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 font-bold text-sm">
                    ?
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Cricket Player</p>
                    <p className="text-xs text-gray-400">Batsman</p>
                  </div>
                  <button className="text-xs text-brand-green font-medium hover:underline">+ Add</button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/feed" className="block text-sm text-gray-600 hover:text-brand-green py-1">📢 Social Feed</Link>
              <a href="#" className="block text-sm text-gray-600 hover:text-brand-green py-1">📋 Leaderboard</a>
              <a href="#" className="block text-sm text-gray-600 hover:text-brand-green py-1">🏆 Tournaments</a>
              <a href="#" className="block text-sm text-gray-600 hover:text-brand-green py-1">📖 Help & Support</a>
            </div>
          </div>

          {/* Ad Space */}
          <div className="bg-gray-100 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-2">ADVERTISEMENT</p>
            <div className="h-32 bg-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-gray-400 text-sm">Ad Space</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <h3 className="text-base font-bold text-gray-800 mb-1">Discard Changes?</h3>
              <p className="text-xs text-gray-500 mb-4">Are you sure you want to cancel? Any unsaved changes will be lost.</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
                >No, Keep Editing</button>
                <button
                  onClick={() => { setShowCancelConfirm(false); setShowCreateBoard(false); setNewBoardName(''); setNewBoardDescription(''); setNewBoardLogoPreview(''); setNewBoardLogo(null); setNewBoardType('' as any); setNewBoardCountry(''); setNewBoardState(''); setNewBoardCity(''); setSelectedCoOwner(null); setBoardNameError(''); }}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors text-sm"
                >Yes, Discard</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
