import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardService, boardDetailService, rosterService, tournamentService, userService } from '../services/cricketSocialService';
import { useAuthStore } from '../store/slices/authStore';
import type { BoardInfo, BoardDirector, BoardSponsor, BoardFan, BoardFeedItem, BoardScore, RosterDetail, BoardFollowing, BoardEvent } from '../types';

type BoardTab = 'info' | 'pitch' | 'score' | 'fans' | 'squad' | 'invite' | 'events';
type InfoSubTab = 'about' | 'history' | 'rules' | 'awards' | 'faq' | 'directors' | 'sponsors';

const tabs: { id: BoardTab; label: string; icon: string }[] = [
  { id: 'info', label: 'Board Info', icon: 'ℹ️' },
  { id: 'pitch', label: 'Pitch', icon: '📢' },
  { id: 'score', label: 'Score', icon: '📊' },
  { id: 'fans', label: 'Fans', icon: '👥' },
  { id: 'squad', label: 'Squad', icon: '🏏' },
  { id: 'invite', label: 'Invite', icon: '📩' },
  { id: 'events', label: 'Events', icon: '📅' },
];

const visibleTabs = tabs.filter((tab) => tab.id === 'info' || tab.id === 'squad');

export default function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<BoardTab>('info');
  const [showEditBoard, setShowEditBoard] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: board, isError } = useQuery({
    queryKey: ['board', id],
    queryFn: () => boardService.getById(id!).then((r) => {
      const raw = r.data;
      // Normalize: API may return the board directly, or nested in { data: { ... } }
      const board = raw?.data && raw.data.id ? raw.data : raw;
      console.log('getById raw:', raw, 'resolved board:', board);
      return board;
    }),
    enabled: !!id,
    retry: false,
  });

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600 text-lg">Board not found or has been deleted.</p>
        <Link to="/dashboard?tab=board" className="btn-primary px-6 py-2">Back to Dashboard</Link>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-dark shadow-lg">
        <div className="max-w-full mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link to="/dashboard?tab=board" className="text-white/80 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </Link>
              <Link to="/" className="flex items-center gap-2">
                <img src="/images/cs-logo.png" alt="CricketSocial" className="h-8" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-14 bg-gradient-to-r from-brand-green to-brand-dark text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center">
              {board.logoUrl ? <img src={board.logoUrl} alt="" className="w-16 h-16 rounded-lg object-cover" /> : <img src="/images/boardIcon.png" alt="" className="w-12 h-12" />}
            </div>
            <div className="flex-1">
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">{board.boardType} Board</span>
              <h1 className="text-3xl font-bold mt-2">{board.name}</h1>
              <p className="text-green-200 mt-1">{board.city && `${board.city}, `}{board.country} · {board.fanCount} fans · {board.rosterCount} teams</p>
            </div>
            <button
              onClick={() => setShowEditBoard(true)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              Edit Board
            </button>
          </div>
          {board.description && <p className="mt-4 text-green-100 max-w-2xl">{board.description}</p>}
          <div className="flex gap-1 mt-6 -mb-px overflow-x-auto">
            {visibleTabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-gray-100 text-brand-green' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'info' && <InfoTab boardId={id!} />}
        {activeTab === 'pitch' && <PitchTab boardId={id!} />}
        {activeTab === 'score' && <ScoreTab boardId={id!} />}
        {activeTab === 'fans' && <FansTab boardId={id!} />}
        {activeTab === 'squad' && <SquadTab boardId={id!} />}
        {activeTab === 'invite' && <InviteTab boardId={id!} />}
        {activeTab === 'events' && <EventsTab boardId={id!} />}
      </div>

      {/* Edit Board Modal */}
      {showEditBoard && (
        <EditBoardModal
          board={board}
          boardId={id!}
          onClose={() => setShowEditBoard(false)}
          onSaved={() => {
            setShowEditBoard(false);
            qc.invalidateQueries({ queryKey: ['board', id] });
          }}
        />
      )}
    </div>
  );
}

// ── EDIT BOARD MODAL ──
function EditBoardModal({ board, boardId, onClose, onSaved }: { board: any; boardId: string; onClose: () => void; onSaved: () => void }) {
  console.log('EditBoardModal board object:', board, 'boardId:', boardId);
  const [name, setName] = useState(board.name || '');
  const [boardNameError, setBoardNameError] = useState('');
  const [description, setDescription] = useState(board.description || '');
  const [city, setCity] = useState(board.city || '');
  const [state, setState] = useState(board.state || '');
  const [country, setCountry] = useState(board.country || '');
  const qc = useQueryClient();

  const isLeague = (board.boardType === 2 || board.boardType === 'League' || board.BoardType === 2);
  const [coOwnerSearch, setCoOwnerSearch] = useState('');
  const [showCoOwnerDropdown, setShowCoOwnerDropdown] = useState(false);
  const [selectedCoOwner, setSelectedCoOwner] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);

  // Fetch user list eagerly for League boards so we can resolve the co-owner from ownerId
  const { data: coOwnerUserList, isLoading: coOwnerLoading } = useQuery({
    queryKey: ['usersList'],
    queryFn: async () => {
      const r = await userService.list();
      const raw = r.data as any;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.items) ? raw.items : Array.isArray(raw?.users) ? raw.users : Array.isArray(raw?.result) ? raw.result : raw ? [raw] : [];
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
    enabled: isLeague,
  });

  // Pre-select co-owner from board's ownerId once user list loads
  useEffect(() => {
    if (!isLeague || !coOwnerUserList || selectedCoOwner) return;
    const boardOwnerId = board.ownerId || board.owneriD || board.OwnerId || board.owner_id || board.ownerid || '';
    const loggedInUserId = useAuthStore.getState().user?.id || '';
    // If the board's ownerId is different from logged-in user, it's the co-owner
    if (boardOwnerId && boardOwnerId !== loggedInUserId) {
      const match = coOwnerUserList.find((u: any) => u.id === boardOwnerId);
      if (match) {
        setSelectedCoOwner({ id: match.id, firstName: match.firstName, lastName: match.lastName, email: match.email });
      }
    }
  }, [coOwnerUserList, isLeague]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Check for duplicate board name - fetch fresh list from API
      const boardsRes = await boardService.getMyBoards(1, 100);
      const raw = boardsRes.data as any;
      const allBoards = raw?.items || (Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
      const existingNames = allBoards
        .filter((b: any) => b.id !== boardId)
        .map((b: any) => b.name?.toLowerCase().trim());
      if (existingNames.includes(name.toLowerCase().trim())) {
        throw new Error('Board name already exists. Please create a different name.');
      }
      console.log('Full board object keys:', Object.keys(board), 'values:', board);
      // Resolve ownerId - only set for League boards; use co-owner's ID when selected
      const existingOwnerId = board.ownerId || board.owneriD || board.OwnerId 
        || board.owner_id || board.createdBy || board.userId || board.ownerid
        || '';
      const resolvedOwnerId = isLeague
        ? (selectedCoOwner ? selectedCoOwner.id : existingOwnerId)
        : existingOwnerId;
      console.log('Edit board - selectedCoOwner:', selectedCoOwner, 'resolvedOwnerId:', resolvedOwnerId, 'existingOwnerId:', existingOwnerId);
      const payload: any = {
        id: boardId,
        name,
        description,
        isActive: board.isActive ?? board.IsActive ?? true,
        city: city || '',
        state: state || '',
        country: country || '',
        ...(board.address1 ? { address1: board.address1 } : {}),
        ...(board.address2 ? { address2: board.address2 } : {}),
        ...(board.contactNumber ? { contactNumber: board.contactNumber } : {}),
        ...(board.contactEmail ? { contactEmail: board.contactEmail } : {}),
        ...(board.websiteAddress ? { websiteAddress: board.websiteAddress } : {}),
        ownerId: resolvedOwnerId,
        logoUrl: board.logoUrl || board.LogoUrl || board.logourl || '',
        ...(isLeague && selectedCoOwner ? { coOwnerId: selectedCoOwner.id } : {}),
      };
      console.log('Updating board:', boardId, 'payload:', JSON.stringify(payload));
      return boardService.update(boardId, payload).then((r) => {
        // Unwrap the response - API may nest the board in { data: { ... } }
        const raw = r.data;
        return raw?.data && raw.data.id ? raw.data : raw;
      });
    },
    onSuccess: (updatedBoard: any) => {
      // Use server response if available, otherwise fall back to local state values
      const newName = updatedBoard?.name || name;
      const newDescription = updatedBoard?.description ?? description;
      const newCity = updatedBoard?.city ?? city;
      const newState = updatedBoard?.state ?? state;
      const newCountry = updatedBoard?.country ?? country;

      const editOverlay = { name: newName, description: newDescription, city: newCity, state: newState, country: newCountry };

      // Persist edit in sessionStorage so it survives page refresh and refetch race conditions
      try {
        const pending = JSON.parse(sessionStorage.getItem('boardEdits') || '{}');
        pending[boardId] = editOverlay;
        sessionStorage.setItem('boardEdits', JSON.stringify(pending));
      } catch {}

      // Update board detail cache
      qc.setQueryData(['board', boardId], (old: any) => {
        if (!old) return updatedBoard || old;
        return { ...old, ...editOverlay };
      });
      // Update the boards list cache
      qc.setQueryData(['myBoards'], (old: any) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((b: any) =>
            b.id === boardId ? { ...b, ...editOverlay } : b
          ),
        };
      });
      // Update stale recentBoards in sessionStorage
      try {
        const stored = sessionStorage.getItem('recentBoards');
        if (stored) {
          const recent = JSON.parse(stored);
          const updated = recent.map((b: any) =>
            b.id === boardId ? { ...b, ...editOverlay } : b
          );
          sessionStorage.setItem('recentBoards', JSON.stringify(updated));
        }
      } catch {}
      // Refetch board detail (backend is authoritative for single-board endpoint)
      qc.invalidateQueries({ queryKey: ['board', boardId] });
      onSaved();
    },
    onError: (error: any) => {
      console.error('Board update error:', error?.response?.status, error?.response?.data);
      if (error?.message === 'Board name already exists. Please create a different name.') {
        setBoardNameError(error.message);
      } else if (error?.response?.status === 401) {
        alert('Session expired. Please login again.');
        window.location.href = '/login';
      } else {
        alert(`Failed to update board. ${error?.response?.data?.title || error?.response?.data?.message || ''}`);
      }
    },
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Edit Board</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Board Name *</label>
            <input value={name} onChange={(e) => { setName(e.target.value); setBoardNameError(''); }} className={`input-field ${boardNameError ? 'border-red-500' : ''}`} placeholder="Board name" />
            {boardNameError && <p className="text-red-500 text-xs mt-1">{boardNameError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={3} placeholder="Board description" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="input-field" placeholder="City" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input value={state} onChange={(e) => setState(e.target.value)} className="input-field" placeholder="State" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} className="input-field" placeholder="Country" />
            </div>
          </div>
          {isLeague && (
            <div>
              <label className="block text-sm font-medium text-blue-600 mb-1 italic">Co-Owner</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  {showCoOwnerDropdown && (
                    <div className="fixed inset-0 z-[5]" onClick={() => { setShowCoOwnerDropdown(false); setCoOwnerSearch(''); }} />
                  )}
                  <div
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between"
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
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                      <div className="p-2 border-b border-gray-100">
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
                      <div className="max-h-48 overflow-y-auto">
                        {coOwnerLoading ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading users...</div>
                        ) : (() => {
                          const currentUserId = board.ownerId || board.owneriD || board.OwnerId || '';
                          const loggedInUserId = useAuthStore.getState().user?.id || '';
                          const filtered = (coOwnerUserList || []).filter((u: any) =>
                            u.id !== currentUserId &&
                            u.id !== loggedInUserId &&
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
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => name.trim() && updateMutation.mutate()}
            disabled={!name.trim() || updateMutation.isPending}
            className="btn-primary text-sm px-6"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── INFO TAB ──
function InfoTab({ boardId }: { boardId: string }) {
  const [subTab, setSubTab] = useState<InfoSubTab>('about');
  const { data: info } = useQuery({ queryKey: ['boardInfo', boardId], queryFn: () => boardDetailService.getInfo(boardId).then((r: any) => r.data).catch(() => null), retry: false, refetchOnWindowFocus: false });
  const { data: directors } = useQuery({ queryKey: ['directors', boardId], queryFn: () => boardDetailService.getDirectors(boardId).then((r: any) => r.data).catch(() => []), retry: false, refetchOnWindowFocus: false });
  const { data: sponsors } = useQuery({ queryKey: ['sponsors', boardId], queryFn: () => boardDetailService.getSponsors(boardId).then((r: any) => r.data).catch(() => []), retry: false, refetchOnWindowFocus: false });
  const { data: following } = useQuery({ queryKey: ['following', boardId], queryFn: () => boardDetailService.getFollowing(boardId).then((r: any) => r.data).catch(() => []), retry: false, refetchOnWindowFocus: false });

  const subTabs: { id: InfoSubTab; label: string }[] = [
    { id: 'about', label: 'About Organization' }, { id: 'history', label: 'History' },
    { id: 'rules', label: 'Rules & Regulations' }, { id: 'awards', label: 'Awards & Honors' },
    { id: 'faq', label: 'FAQ' }, { id: 'directors', label: 'Directors' }, { id: 'sponsors', label: 'Sponsors' },
  ];

  const renderContent = () => {
    if (!info) return <p className="text-gray-400 text-center py-8">No information available yet.</p>;
    const contentMap: Record<string, string | undefined> = {
      about: info.aboutOrganization, history: info.history, rules: info.rulesAndRegulations,
      awards: info.awardsAndHonors, faq: info.faq,
    };
    if (subTab === 'directors') {
      return directors?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {directors.map((d: any) => (
            <div key={d.id} className="bg-white rounded-xl p-4 text-center shadow-sm border">
              <div className="w-16 h-16 mx-auto bg-brand-green/10 rounded-full flex items-center justify-center text-2xl text-brand-green font-bold mb-3">{d.name[0]}</div>
              <p className="font-semibold text-gray-800">{d.name}</p>
              {d.title && <p className="text-sm text-gray-500">{d.title}</p>}
            </div>
          ))}
        </div>
      ) : <p className="text-gray-400 text-center py-8">No directors added yet.</p>;
    }
    if (subTab === 'sponsors') {
      return sponsors?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sponsors.map((s: any) => (
            <div key={s.id} className="bg-white rounded-xl p-4 text-center shadow-sm border">
              <div className="w-16 h-16 mx-auto bg-blue-50 rounded-lg flex items-center justify-center text-xl font-bold text-blue-600 mb-3">{s.name[0]}</div>
              <p className="font-semibold text-gray-800">{s.name}</p>
              {s.websiteUrl && <a href={s.websiteUrl} target="_blank" className="text-sm text-brand-green hover:underline">{s.websiteUrl}</a>}
            </div>
          ))}
        </div>
      ) : <p className="text-gray-400 text-center py-8">No sponsors added yet.</p>;
    }
    const content = contentMap[subTab];
    return content ? <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">{content}</div>
      : <p className="text-gray-400 text-center py-8">No content available.</p>;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap gap-2 mb-6">
        {subTabs.map(st => (
          <button key={st.id} onClick={() => setSubTab(st.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${subTab === st.id ? 'bg-brand-green text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}>
            {st.label}
          </button>
        ))}
      </div>
      <div className="card">{renderContent()}</div>
      {following && following.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-800 mb-3">Fan Of</h3>
          <div className="flex flex-wrap gap-3">
            {following.map((f: any) => (
              <Link key={f.boardId} to={`/boards/${f.boardId}`} className="bg-white rounded-lg px-4 py-2 border hover:shadow-md transition-shadow flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-sm">{f.boardName[0]}</div>
                <span className="text-sm font-medium">{f.boardName}</span>
                <span className="text-xs text-gray-400">{f.boardType}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── PITCH TAB ──
function PitchTab({ boardId }: { boardId: string }) {
  const [content, setContent] = useState('');
  const qc = useQueryClient();
  const { data: feeds } = useQuery({ queryKey: ['boardFeeds', boardId], queryFn: () => boardDetailService.getFeeds(boardId).then((r: any) => r.data).catch(() => ({ items: [] })), retry: false, refetchOnWindowFocus: false });
  const createMutation = useMutation({
    mutationFn: (data: { content: string }) => boardDetailService.createFeed(boardId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['boardFeeds', boardId] }); setContent(''); },
  });
  const likeMutation = useMutation({
    mutationFn: (feedId: string) => boardDetailService.likeFeed(boardId, feedId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boardFeeds', boardId] }),
  });

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="card mb-6">
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What's happening on the pitch?"
          className="w-full border rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green" rows={3} />
        <div className="flex justify-end mt-3">
          <button onClick={() => content.trim() && createMutation.mutate({ content })} disabled={!content.trim() || createMutation.isPending}
            className="btn-primary text-sm px-6">{createMutation.isPending ? 'Posting...' : 'Post'}</button>
        </div>
      </div>
      <div className="space-y-4">
        {feeds?.items.map((f: any) => (
          <div key={f.id} className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold">{f.userName[0]}</div>
              <div><p className="font-semibold text-sm text-gray-800">{f.userName}</p><p className="text-xs text-gray-400">{new Date(f.createdAt).toLocaleDateString()}</p></div>
            </div>
            {f.content && <p className="text-gray-700 text-sm mb-3">{f.content}</p>}
            {f.mediaUrl && <img src={f.mediaUrl} alt="" className="rounded-lg mb-3 max-h-64 object-cover" />}
            <div className="flex gap-4 text-sm text-gray-500">
              <button onClick={() => likeMutation.mutate(f.id)} className="flex items-center gap-1 hover:text-brand-green">👍 {f.likesCount}</button>
              <span>💬 {f.commentsCount}</span>
            </div>
          </div>
        ))}
        {(!feeds?.items.length) && <div className="card text-center py-8 text-gray-400">No posts yet. Be the first to post!</div>}
      </div>
    </div>
  );
}

// ── SCORE TAB ──
function ScoreTab({ boardId }: { boardId: string }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number | undefined>(undefined);
  const { data: score } = useQuery({ queryKey: ['boardScore', boardId, year], queryFn: () => boardDetailService.getScore(boardId, year).then((r: any) => r.data).catch(() => null), retry: false, refetchOnWindowFocus: false });
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <h3 className="font-semibold text-gray-800">Team Achievements</h3>
        <select value={year ?? ''} onChange={e => setYear(e.target.value ? Number(e.target.value) : undefined)}
          className="border rounded-lg px-3 py-1.5 text-sm">
          <option value="">All Time</option>
          {years.map((y: any) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Matches', value: score?.totalMatches ?? 0, color: 'bg-blue-50 text-blue-700' },
          { label: 'Won', value: score?.matchesWon ?? 0, color: 'bg-green-50 text-green-700' },
          { label: 'Lost', value: score?.matchesLost ?? 0, color: 'bg-red-50 text-red-700' },
          { label: 'Tied', value: score?.matchesTied ?? 0, color: 'bg-yellow-50 text-yellow-700' },
        ].map((s: any) => (
          <div key={s.label} className={`rounded-xl p-6 text-center ${s.color}`}>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>
      {score?.tournaments && score.tournaments.length > 0 && (
        <div className="card">
          <h4 className="font-semibold text-gray-800 mb-4">🏆 Tournaments</h4>
          <div className="space-y-3">
            {score.tournaments.map((t: any) => (
              <div key={t.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                <div><p className="font-medium">{t.name}</p><p className="text-xs text-gray-500">{t.format} · {t.matchCount} matches</p></div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${t.status === 'Completed' ? 'bg-green-100 text-green-700' : t.status === 'InProgress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── FANS TAB ──
function FansTab({ boardId }: { boardId: string }) {
  const { data: fans } = useQuery({ queryKey: ['boardFans', boardId], queryFn: () => boardDetailService.getFans(boardId).then((r: any) => r.data).catch(() => ({ items: [], totalCount: 0 })), retry: false, refetchOnWindowFocus: false });

  return (
    <div className="animate-fade-in">
      <h3 className="font-semibold text-gray-800 mb-4">Fans ({fans?.totalCount ?? 0})</h3>
      {fans?.items.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {fans.items.map((f: any) => (
            <div key={f.userId} className="card text-center py-4">
              {f.profileImageUrl ? (
                <img src={f.profileImageUrl} alt="" className="w-16 h-16 rounded-full mx-auto object-cover mb-2" />
              ) : (
                <div className="w-16 h-16 mx-auto bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-xl mb-2">{f.userName[0]}</div>
              )}
              <p className="font-medium text-sm text-gray-800 truncate">{f.userName}</p>
              <p className="text-xs text-gray-400">{new Date(f.joinedAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      ) : <div className="card text-center py-8 text-gray-400">No fans yet.</div>}
    </div>
  );
}

// ── SQUAD TAB ──
interface RosterFormData {
  rosterName: string;
  captain: string;
  viceCaptain: string;
  coach: string;
  members: string[];
}

function SquadTab({ boardId }: { boardId: string }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRosterId, setEditingRosterId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RosterFormData>({
    rosterName: '', captain: '', viceCaptain: '', coach: '', members: [],
  });
  const [newMember, setNewMember] = useState('');
  const [activeSearchField, setActiveSearchField] = useState<'captain' | 'viceCaptain' | 'coach' | 'member' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rosterFieldSearch, setRosterFieldSearch] = useState('');
  const qc = useQueryClient();

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setErrorMsg(null); setTimeout(() => setSuccessMsg(null), 4000); };
  const showError = (msg: string) => { setErrorMsg(msg); setSuccessMsg(null); setTimeout(() => setErrorMsg(null), 5000); };

  const { data: squads, isLoading } = useQuery({
    queryKey: ['squad', boardId],
    queryFn: () => boardDetailService.getSquad(boardId).then(r => {
      console.log('Squad query result:', r.data);
      return r.data;
    }),
  });

  // Load user list for autocomplete (same as co-owner)
  const { data: rosterUserList, isLoading: rosterUsersLoading } = useQuery({
    queryKey: ['usersList'],
    queryFn: async () => {
      const r = await userService.list();
      const raw = r.data as any;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.items) ? raw.items : Array.isArray(raw?.users) ? raw.users : Array.isArray(raw?.result) ? raw.result : raw ? [raw] : [];
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
    enabled: activeSearchField !== null,
  });

  const createRosterMutation = useMutation({
    mutationFn: async (data: RosterFormData) => {
      const createRes = await rosterService.create(boardId, {
        name: data.rosterName,
        rosterName: data.rosterName,
        boardId: boardId,
        captain: data.captain || '',
        viceCaptain: data.viceCaptain || '',
        coach: data.coach || '',
        members: data.members || [],
      });
      return createRes;
    },
    onSuccess: () => {
      resetForm();
      showSuccess('Roster created successfully!');
      qc.invalidateQueries({ queryKey: ['squad', boardId] });
      qc.invalidateQueries({ queryKey: ['board', boardId] });
    },
    onError: (error: any) => {
      console.error('Create roster error:', error?.response?.status, error?.response?.data);
      const errData = error?.response?.data;
      const errMsg = errData?.errors
        ? Object.values(errData.errors).flat().join(', ')
        : errData?.message || errData?.title || 'Failed to create roster. Please try again.';
      showError(errMsg);
    },
  });

  const updateRosterMutation = useMutation({
    mutationFn: (data: RosterFormData & { rosterId: string }) => {
      return rosterService.update(boardId, data.rosterId, {
        name: data.rosterName,
      });
    },
    onSuccess: () => {
      resetForm();
      showSuccess('Roster updated successfully!');
      qc.invalidateQueries({ queryKey: ['squad', boardId] });
      qc.invalidateQueries({ queryKey: ['board', boardId] });
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || error?.response?.data?.title || 'Failed to update roster. Please try again.');
    },
  });

  const deleteRosterMutation = useMutation({
    mutationFn: (rosterId: string) => rosterService.delete(boardId, rosterId),
    onSuccess: () => {
      setDeleteConfirmId(null);
      showSuccess('Roster deleted successfully!');
      qc.invalidateQueries({ queryKey: ['squad', boardId] });
      qc.invalidateQueries({ queryKey: ['board', boardId] });
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || error?.response?.data?.title || 'Failed to delete roster.');
    },
  });

  const resetForm = () => {
    setShowCreateForm(false);
    setEditingRosterId(null);
    setFormData({ rosterName: '', captain: '', viceCaptain: '', coach: '', members: [] });
    setNewMember('');
    setSearchTerm('');
    setRosterFieldSearch('');
    setActiveSearchField(null);
    setErrors({});
  };

  const startEdit = (roster: any) => {
    const captain = roster.members?.find((m: any) => m.role === 'Captain');
    const viceCaptain = roster.members?.find((m: any) => m.role === 'ViceCaptain');
    const coach = roster.members?.find((m: any) => m.role === 'Coach');
    const members = roster.members?.filter((m: any) => m.role === 'Member').map((m: any) => m.userId || m.userName) || [];
    setEditingRosterId(roster.id);
    setShowCreateForm(true);
    setFormData({
      rosterName: roster.name || '',
      captain: captain?.userId || captain?.userName || '',
      viceCaptain: viceCaptain?.userId || viceCaptain?.userName || '',
      coach: coach?.userId || coach?.userName || '',
      members,
    });
    setErrors({});
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.rosterName.trim() || formData.rosterName.trim().length < 2) {
      newErrors.rosterName = 'Roster name must be at least 2 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      if (editingRosterId) {
        updateRosterMutation.mutate({ ...formData, rosterId: editingRosterId });
      } else {
        createRosterMutation.mutate(formData);
      }
    }
  };

  const isSubmitting = createRosterMutation.isPending || updateRosterMutation.isPending;

  const handleAddMember = (userId?: string) => {
    const id = userId || newMember.trim();
    if (id && !formData.members.includes(id) && id !== formData.captain && id !== formData.viceCaptain && id !== formData.coach) {
      setFormData(prev => ({ ...prev, members: [...prev.members, id] }));
      setNewMember('');
      setSearchTerm('');
      setActiveSearchField(null);
    }
  };

  const handleRemoveMember = (userId: string) => {
    setFormData(prev => ({ ...prev, members: prev.members.filter(m => m !== userId) }));
  };

  const handleSelectUser = (userId: string, field: 'captain' | 'viceCaptain' | 'coach') => {
    setFormData(prev => ({ ...prev, [field]: userId }));
    setSearchTerm('');
    setActiveSearchField(null);
  };

  const handleFieldSearch = (value: string, field: 'captain' | 'viceCaptain' | 'coach' | 'member') => {
    setRosterFieldSearch(value);
    setActiveSearchField(field);
  };

  const renderSearchDropdown = (field: 'captain' | 'viceCaptain' | 'coach' | 'member') => {
    if (activeSearchField !== field) return null;
    const filtered = (rosterUserList || []).filter((u: any) =>
      !formData.members.includes(u.id) &&
      u.id !== formData.captain && u.id !== formData.viceCaptain && u.id !== formData.coach &&
      (!rosterFieldSearch || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(rosterFieldSearch.toLowerCase()))
    );
    return (
      <>
        <div className="fixed inset-0 z-[5]" onClick={() => { setActiveSearchField(null); setRosterFieldSearch(''); }} />
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={rosterFieldSearch}
              onChange={e => setRosterFieldSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent"
              placeholder="Search users..."
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {rosterUsersLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading users...</div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No users found</div>
            ) : (
              filtered.map((u: any) => (
                <button
                  key={u.id}
                  onClick={() => {
                    if (field === 'member') {
                      handleAddMember(u.id);
                    } else {
                      handleSelectUser(u.id, field);
                    }
                    setRosterFieldSearch('');
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
            )}
          </div>
        </div>
      </>
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Captain': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ViceCaptain': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Coach': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Success/Error Messages */}
      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 flex items-center gap-2 text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 flex items-center gap-2 text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {errorMsg}
        </div>
      )}

      {/* Create Roster Button */}
      {!showCreateForm && (
        <div className="mb-6">
          <button onClick={() => { setEditingRosterId(null); setShowCreateForm(true); }} className="btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Roster
          </button>
        </div>
      )}

      {/* Create Roster Form — matches legacy screenshot layout */}
      {showCreateForm && (
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">{editingRosterId ? 'Edit Roster' : 'Create Roster'}</h3>

          <div className="space-y-5">
            {/* Roster Name row */}
            <div className="flex items-center gap-0">
              <span className="bg-brand-dark text-white text-sm font-semibold px-5 py-2.5 rounded-l-lg whitespace-nowrap">
                Roster Name
              </span>
              <input
                type="text"
                value={formData.rosterName}
                onChange={(e) => setFormData(prev => ({ ...prev, rosterName: e.target.value }))}
                placeholder="e.g., Chennai Super Kings"
                className={`flex-1 px-4 py-2.5 border border-l-0 rounded-r-lg focus:ring-2 focus:ring-brand-green focus:border-transparent ${errors.rosterName ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
            </div>
            {errors.rosterName && <p className="text-xs text-red-600 ml-36">{errors.rosterName}</p>}

            {/* Add Member / Action header */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-700">Add Member</h4>
                <span className="text-sm text-gray-500 font-medium">Action</span>
              </div>
              <hr className="border-brand-green mb-4" />

              {/* Captain */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-blue-600 mb-1 italic">Captain</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.captain}
                    readOnly
                    onClick={() => setActiveSearchField(activeSearchField === 'captain' ? null : 'captain')}
                    placeholder="Search and select captain..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent cursor-pointer"
                  />
                  {renderSearchDropdown('captain')}
                </div>
              </div>

              {/* Vice Captain */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-blue-600 mb-1 italic">Vice Captain</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.viceCaptain}
                    readOnly
                    onClick={() => setActiveSearchField(activeSearchField === 'viceCaptain' ? null : 'viceCaptain')}
                    placeholder="Search and select vice captain..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent cursor-pointer"
                  />
                  {renderSearchDropdown('viceCaptain')}
                </div>
              </div>

              {/* Coach */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 italic">Coach</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.coach}
                    readOnly
                    onClick={() => setActiveSearchField(activeSearchField === 'coach' ? null : 'coach')}
                    placeholder="Search and select coach..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent cursor-pointer"
                  />
                  {renderSearchDropdown('coach')}
                </div>
              </div>

              {/* Add Member */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-blue-600 mb-1 italic">Add Member</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMember}
                      readOnly
                      onClick={() => setActiveSearchField(activeSearchField === 'member' ? null : 'member')}
                      placeholder="Search member to add..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent cursor-pointer"
                    />
                    {renderSearchDropdown('member')}
                  </div>
                  <button
                    onClick={() => setActiveSearchField(activeSearchField === 'member' ? null : 'member')}
                    className="px-3 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    title="Add member"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Added Members List */}
              {formData.members.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-500 font-medium">Added Members ({formData.members.length})</p>
                  {formData.members.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-xs">
                          {idx + 1}
                        </div>
                        <span className="text-sm text-gray-700">{m}</span>
                      </div>
                      <button onClick={() => handleRemoveMember(m)} className="text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create/Update & Cancel Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-brand-green text-white rounded-lg hover:bg-brand-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? (editingRosterId ? 'Updating...' : 'Creating...')
                  : (editingRosterId ? 'Update Roster' : 'Create')}
              </button>
              <button
                onClick={resetForm}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Rosters List */}
      {squads?.length ? squads.map((roster: any) => (
        <div key={roster.id} className="card mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center">
                {roster.logoUrl ? (
                  <img src={roster.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <span className="text-brand-green font-bold text-lg">{(roster.name || roster.rosterName || 'R')[0]}</span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">{roster.name || roster.rosterName || 'Unnamed Roster'}</h3>
                <p className="text-xs text-gray-500">{roster.memberCount ?? roster.members?.length ?? 0} members</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {deleteConfirmId === roster.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600">Delete?</span>
                  <button onClick={() => deleteRosterMutation.mutate(roster.id)} disabled={deleteRosterMutation.isPending}
                    className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">Yes</button>
                  <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">No</button>
                </div>
              ) : (
                <>
                  <button onClick={() => startEdit(roster)} className="text-gray-400 hover:text-brand-green transition-colors" title="Edit roster">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button onClick={() => setDeleteConfirmId(roster.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete roster">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Members grouped by role */}
          {roster.members?.length > 0 ? (
            <div className="space-y-3">
              {['Captain', 'ViceCaptain', 'Coach', 'Member'].map(role => {
                const roleMembers = roster.members.filter((m: any) => m.role === role);
                if (roleMembers.length === 0) return null;
                return (
                  <div key={role}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      {role === 'Captain' ? '👑' : role === 'ViceCaptain' ? '⭐' : role === 'Coach' ? '📋' : '🏏'}{' '}
                      {role === 'ViceCaptain' ? 'Vice Captain' : role}{roleMembers.length > 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {roleMembers.map((m: any) => (
                        <div key={m.userId} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 hover:shadow-sm transition-shadow group">
                          {m.profileImageUrl ? (
                            <img src={m.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-sm">
                              {m.userName[0]}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-800 truncate">{m.userName}</p>
                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${getRoleBadge(m.role)}`}>
                              {m.role === 'ViceCaptain' ? 'Vice Captain' : m.role}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 border-t">
              <p className="text-sm">No members in this roster yet.</p>
            </div>
          )}
        </div>
      )) : !isLoading && !showCreateForm && (
        <div className="card text-center py-12 text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-lg font-medium text-gray-500 mb-2">No Rosters Yet</p>
          <p className="text-sm text-gray-400">Click "Create New Roster" to build your team squad.</p>
        </div>
      )}
    </div>
  );
}

// ── INVITE TAB ──
function InviteTab({ boardId }: { boardId: string }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [sent, setSent] = useState(false);
  const { data: buddies } = useQuery({
    queryKey: ['buddySearch', boardId, search],
    queryFn: () => boardDetailService.searchBuddies(boardId, search).then(r => r.data),
    enabled: search.length >= 2,
  });
  const inviteMutation = useMutation({
    mutationFn: () => boardDetailService.invite(boardId, { email, message }),
    onSuccess: () => { setSent(true); setEmail(''); setMessage(''); setTimeout(() => setSent(false), 3000); },
  });

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">📩 Invite Members</h3>
        {sent && <div className="bg-green-50 text-green-700 rounded-lg p-3 mb-4 text-sm">✅ Invitation sent successfully!</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="player@example.com" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Buddies</label>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name..." className="input-field" />
            {buddies && buddies.length > 0 && (
              <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                {buddies.map((b: any) => (
                  <button key={b.id} onClick={() => { setEmail(b.email); setSearch(''); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm border-b last:border-b-0">
                    <div className="w-8 h-8 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-xs">{b.firstName[0]}</div>
                    <span>{b.firstName} {b.lastName}</span>
                    <span className="text-gray-400 ml-auto text-xs">{b.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Join our team!" className="input-field resize-none" rows={3} />
          </div>
          <button onClick={() => email && inviteMutation.mutate()} disabled={!email || inviteMutation.isPending}
            className="btn-primary w-full">{inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}</button>
        </div>
      </div>
    </div>
  );
}

// ── EVENTS TAB ──
function EventsTab({ boardId }: { boardId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState('Fixture');
  const qc = useQueryClient();
  const { data: events } = useQuery({ queryKey: ['boardEvents', boardId], queryFn: () => boardDetailService.getEvents(boardId).then((r: any) => r.data).catch(() => []), retry: false, refetchOnWindowFocus: false });
  const createMutation = useMutation({
    mutationFn: () => boardDetailService.createEvent(boardId, { title, description, location, eventDate, eventType }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['boardEvents', boardId] }); setShowForm(false); setTitle(''); setDescription(''); setLocation(''); setEventDate(''); },
  });

  const statusColor = (s: string) => s === 'Upcoming' ? 'bg-blue-100 text-blue-700' : s === 'InProgress' ? 'bg-green-100 text-green-700' : s === 'Completed' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700';

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-gray-800">Events & Fixtures</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm px-4">{showForm ? 'Cancel' : '+ New Event'}</button>
      </div>
      {showForm && (
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input value={title} onChange={e => setTitle(e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={eventType} onChange={e => setEventType(e.target.value)} className="input-field">
                <option>Fixture</option><option>Social</option><option>Meeting</option><option>Practice</option>
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><input value={location} onChange={e => setLocation(e.target.value)} className="input-field" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field resize-none" rows={2} /></div>
          </div>
          <button onClick={() => title && eventDate && createMutation.mutate()} disabled={!title || !eventDate || createMutation.isPending}
            className="btn-primary text-sm px-6 mt-4">{createMutation.isPending ? 'Creating...' : 'Create Event'}</button>
        </div>
      )}
      <div className="space-y-3">
        {events?.map((e: any) => (
          <div key={e.id} className="card flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-green/10 rounded-xl flex flex-col items-center justify-center text-brand-green">
              <span className="text-lg font-bold">{new Date(e.eventDate).getDate()}</span>
              <span className="text-xs">{new Date(e.eventDate).toLocaleString('default', { month: 'short' })}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{e.title}</p>
              <p className="text-xs text-gray-500">{e.eventType} · {e.location || 'TBD'} · {new Date(e.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              {e.description && <p className="text-sm text-gray-600 mt-1">{e.description}</p>}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(e.status)}`}>{e.status}</span>
          </div>
        ))}
        {(!events?.length) && <div className="card text-center py-8 text-gray-400">No events scheduled.</div>}
      </div>
    </div>
  );
}
