import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/slices/authStore';
import { boardService, tournamentService, userService, feedService } from '../services/cricketSocialService';
import { Link, useNavigate } from 'react-router-dom';

type MenuSection = 'score' | 'pitch' | 'events' | 'fans' | 'fanof' | 'board' | 'buddies' | 'compare' | 'book' | 'invoices';

const menuItems: { id: MenuSection; label: string; icon: string; iconImg?: string }[] = [
  { id: 'score', label: 'My Score', icon: '📊', iconImg: '/images/MyScore.png' },
  { id: 'pitch', label: 'Pitch', icon: '📢', iconImg: '/images/pitch-icon.png' },
  { id: 'events', label: 'My Events & Fixtures', icon: '📅', iconImg: '/images/MyEvents.png' },
  { id: 'fans', label: 'My Fans', icon: '👥', iconImg: '/images/MyFans.png' },
  { id: 'fanof', label: 'I Am Fan Of', icon: '⭐', iconImg: '/images/IAmFanOf.png' },
  { id: 'board', label: 'My Board', icon: '🏟️', iconImg: '/images/MyBoard.png' },
  { id: 'buddies', label: 'My Buddies', icon: '🤝', iconImg: '/images/MyBuddyList.png' },
  { id: 'compare', label: 'Player Compare', icon: '⚖️', iconImg: '/images/PlayerCompare.png' },
  { id: 'book', label: 'Cricket Book', icon: '📖', iconImg: '/images/CricketBook.png' },
  { id: 'invoices', label: 'My Invoices', icon: '🧾' },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<MenuSection>('score');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  

const { data: boards } = useQuery({
  queryKey: ['myBoards'],
  queryFn: async () => {
    //console.log('🔥 QUERY RUNNING');
    const res = await boardService.getAll(1, 20);
    return res.data;
  },
});


  const { data: upcoming } = useQuery({
    queryKey: ['upcomingTournaments'],
    queryFn: () => tournamentService.getUpcoming().then((r) => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['myStats', user?.id],
    queryFn: () => userService.getStats(user!.id).then((r) => r.data),
    enabled: !!user?.id,
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
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardType, setNewBoardType] = useState<'Team' | 'League'>('Team');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [newBoardCity, setNewBoardCity] = useState('');
  const [newBoardState, setNewBoardState] = useState('');
  const [newBoardCountry, setNewBoardCountry] = useState('');

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
    mutationFn: () => {
      if (!user) throw new Error('User not authenticated');
      return boardService.create({
        name: newBoardName,
        description: newBoardDescription,
        boardType: boardTypeValue,
        city: newBoardCity,
        state: newBoardState,
        country: newBoardCountry,
        ownerId: user.id,
        logoUrl: '',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myBoards'] });
      setShowCreateBoard(false);
      setNewBoardName('');
      setNewBoardDescription('');
      setNewBoardCity('');
      setNewBoardState('');
      setNewBoardCountry('');
    },
    onError: (error: any) => {
      if (error?.response?.status === 401) {
        alert('Session expired. Please login again.');
        window.location.href = '/login';
      } else {
        alert('Failed to create board.');
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
              <span className="text-white font-bold text-lg hidden sm:block">CricketSocial</span>
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
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-14">
        {/* Left Sidebar */}
        <aside className="fixed left-0 top-14 bottom-0 w-64 bg-white shadow-lg overflow-y-auto">
          {/* User Profile Card */}
          <Link to="/profile" className="block p-4 border-b bg-gradient-to-b from-brand-green/10 to-white hover:from-brand-green/20 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-brand-green rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <>{user?.firstName?.[0]}{user?.lastName?.[0]}</>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">{user?.playerRole || 'Cricket Player'}</p>
                <p className="text-xs text-brand-green font-medium mt-0.5">View Profile →</p>
              </div>
            </div>
            <div className="flex gap-4 text-center text-xs">
              <div className="flex-1 bg-white rounded-lg py-2 shadow-sm">
                <p className="font-bold text-brand-green">{stats?.totalMatches || 0}</p>
                <p className="text-gray-500">Matches</p>
              </div>
              <div className="flex-1 bg-white rounded-lg py-2 shadow-sm">
                <p className="font-bold text-brand-green">{stats?.totalRuns || 0}</p>
                <p className="text-gray-500">Runs</p>
              </div>
              <div className="flex-1 bg-white rounded-lg py-2 shadow-sm">
                <p className="font-bold text-brand-green">{stats?.totalWickets || 0}</p>
                <p className="text-gray-500">Wickets</p>
              </div>
            </div>
          </Link>

          {/* Navigation Menu */}
          <nav className="p-3">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={activeMenu === item.id ? 'sidebar-item-active w-full text-left' : 'sidebar-item w-full text-left'}
              >
                {item.iconImg ? (
                  <img src={item.iconImg} alt="" className="w-5 h-5 object-contain" 
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <span className="text-lg">{item.icon}</span>
                )}
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 mr-72 p-6 min-h-[calc(100vh-56px)]">
          {/* My Score Section */}
          {activeMenu === 'score' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">My Score</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Batting Stats */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <img src="/images/batsman.png" alt="" className="w-6 h-6" onError={(e) => { (e.target as HTMLImageElement).textContent = '🏏'; }} />
                    <h3 className="font-semibold text-gray-800">Batting</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-brand-green">{stats?.totalMatches || 0}</p>
                      <p className="text-xs text-gray-500">Matches</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-brand-green">{stats?.totalRuns || 0}</p>
                      <p className="text-xs text-gray-500">Runs</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-brand-green">{stats?.battingAverage?.toFixed(1) || '-'}</p>
                      <p className="text-xs text-gray-500">Average</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-brand-green">{stats?.strikeRate?.toFixed(1) || '-'}</p>
                      <p className="text-xs text-gray-500">Strike Rate</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-brand-green">{stats?.centuries || 0}</p>
                      <p className="text-xs text-gray-500">100s</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-brand-green">{stats?.halfCenturies || 0}</p>
                      <p className="text-xs text-gray-500">50s</p>
                    </div>
                  </div>
                </div>

                {/* Bowling Stats */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <img src="/images/ball3.png" alt="" className="w-6 h-6" />
                    <h3 className="font-semibold text-gray-800">Bowling</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-brand-green">{stats?.totalWickets || 0}</p>
                      <p className="text-xs text-gray-500">Wickets</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-brand-green">{stats?.bowlingAverage?.toFixed(1) || '-'}</p>
                      <p className="text-xs text-gray-500">Average</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-brand-green">{stats?.economyRate?.toFixed(1) || '-'}</p>
                      <p className="text-xs text-gray-500">Economy</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-brand-green">{stats?.fiveWicketHauls || 0}</p>
                      <p className="text-xs text-gray-500">5W Hauls</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center col-span-2">
                      <p className="text-2xl font-bold text-brand-green">{stats?.bestBowling || '-'}</p>
                      <p className="text-xs text-gray-500">Best Bowling</p>
                    </div>
                  </div>
                </div>

                {/* Highest Score */}
                <div className="card">
                  <h3 className="font-semibold text-gray-800 mb-4">Career Highlights</h3>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-brand-green to-brand-dark rounded-lg p-4 text-white">
                      <p className="text-3xl font-bold">{stats?.highestScore || 0}</p>
                      <p className="text-green-200 text-sm">Highest Score</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-3xl font-bold text-brand-green">{stats?.totalMatches || 0}</p>
                      <p className="text-gray-500 text-sm">Total Matches</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
          {activeMenu === 'events' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">My Events & Fixtures</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Upcoming Matches
                  </h3>
                  {upcoming?.items.length ? (
                    <ul className="space-y-3">
                      {upcoming.items.slice(0, 5).map((t) => (
                        <li key={t.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                          <p className="font-medium text-gray-800">{t.name}</p>
                          <p className="text-sm text-gray-500 mt-1">{t.format} · {t.matchCount} matches</p>
                          <p className="text-xs text-gray-400 mt-1">{t.boardName}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-center py-8">No upcoming matches</p>
                  )}
                </div>
                <div className="card">
                  <h3 className="font-semibold text-gray-800 mb-4">My Tournaments</h3>
                  <p className="text-gray-400 text-center py-8">No tournaments to display</p>
                </div>
              </div>
            </div>
          )}

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

          {/* My Board */}
          {activeMenu === 'board' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Board</h2>
                <button onClick={() => setShowCreateBoard(!showCreateBoard)} className="btn-primary text-sm">{showCreateBoard ? 'Cancel' : '+ Create Board'}</button>
              </div>
              {showCreateBoard && (
                <div className="card mb-6">
                  <h3 className="font-semibold mb-4">Create New Board</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Board Name</label><input value={newBoardName} onChange={e => setNewBoardName(e.target.value)} className="input-field" placeholder="Enter board name" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select value={newBoardType} onChange={e => setNewBoardType(e.target.value as 'Team' | 'League')} className="input-field"><option value="Team">Team</option><option value="League">League</option></select></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={newBoardDescription} onChange={e => setNewBoardDescription(e.target.value)} className="input-field" rows={3} placeholder="Enter board description" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input value={newBoardCity} onChange={e => setNewBoardCity(e.target.value)} className="input-field" placeholder="City" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label><input value={newBoardState} onChange={e => setNewBoardState(e.target.value)} className="input-field" placeholder="State" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Country</label><input value={newBoardCountry} onChange={e => setNewBoardCountry(e.target.value)} className="input-field" placeholder="Country" /></div>
                  </div>
                  <button onClick={() => newBoardName && createBoardMutation.mutate()} disabled={!newBoardName || createBoardMutation.isPending}
                    className="btn-primary text-sm px-6 mt-4">{createBoardMutation.isPending ? 'Creating...' : 'Create Board'}</button>
                </div>
              )}
              {boards?.items?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {boards.items.map((b: any) => (
                    <Link key={b.id} to={`/boards/${b.id}`} className="card hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-brand-green/10 rounded-xl flex items-center justify-center">
                          <img src="/images/boardIcon.png" alt="" className="w-8 h-8" onError={(e) => { (e.target as HTMLImageElement).textContent = '🏟️'; }} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{b.name}</p>
                          <p className="text-sm text-gray-500">{b.boardType} Board</p>
                          <div className="flex gap-4 mt-1 text-xs text-gray-400">
                            <span>{b.rosterCount} teams</span>
                            <span>{b.fanCount} fans</span>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      {b.boardType === 'League' && (
                        <Link to={`/league/${b.id}`} onClick={e => e.stopPropagation()}
                          className="mt-3 block text-center bg-brand-green/10 text-brand-green text-sm font-medium py-2 rounded-lg hover:bg-brand-green/20 transition-colors">
                          ⚙️ Manage Your League
                        </Link>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="card text-center py-12">
                  <img src="/images/MyBoard.png" alt="" className="w-16 h-16 mx-auto mb-4 opacity-50" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <p className="text-gray-400 text-lg">No boards yet</p>
                  <p className="text-gray-400 text-sm mt-2">Create your first team or league board!</p>
                  <button onClick={() => setShowCreateBoard(true)} className="btn-primary mt-4">Create Board</button>
                </div>
              )}
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
    </div>
  );
}
