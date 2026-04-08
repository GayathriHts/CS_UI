import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardService, boardDetailService, rosterService, tournamentService, userService } from '../services/cricketSocialService';
import { fetchCountries, fetchStates, fetchCities } from '../services/locationService';
import { useAuthStore } from '../store/slices/authStore';
import Navbar from '../components/Navbar';
import type { BoardInfo, BoardDirector, BoardSponsor, BoardFan, BoardFeedItem, BoardScore, RosterDetail, BoardFollowing, BoardEvent } from '../types';

type BoardTab = 'info' | 'pitch' | 'score' | 'fans' | 'squad' | 'invite' | 'events' | 'edit';
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

const isLeagueBoard = (boardType: any) => boardType === 2 || boardType === 'League';

export default function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<BoardTab>('info');
  const [rosterFormDirty, setRosterFormDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<BoardTab | null>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: board, isError } = useQuery({
    queryKey: ['board', id],
    queryFn: () => boardService.getById(id!).then((r) => r.data),
    enabled: !!id,
    retry: false,
  });

  // Redirect League boards directly to the League Management page
  useEffect(() => {
    if (board && isLeagueBoard(board.boardType)) {
      navigate(`/league/${id}`, { replace: true });
    }
  }, [board, id, navigate]);

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
      <Navbar title={`Board Management — ${board.name}`} backTo="/dashboard?tab=board" />

      <div className="pt-14 flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-white border-r shadow-sm fixed left-0 top-14 overflow-y-auto">
          {/* Board Info */}
          <div className="p-4 border-b">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 flex items-center justify-center mb-3">
                {board.logoUrl
                  ? <img src={board.logoUrl} alt="" className="w-16 h-16 object-cover" />
                  : <img src="/images/boardIcon.png" alt="" className="w-12 h-12" />
                }
              </div>
              <button
                onClick={() => setActiveTab('edit')}
                className="font-bold text-sm flex items-center gap-1 hover:text-brand-green transition-colors cursor-pointer"
                title="Edit Board"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                {board.name}
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="py-2">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (activeTab === 'squad' && tab.id !== 'squad' && rosterFormDirty) {
                    setPendingTab(tab.id);
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors border-b last:border-b-0 ${
                  activeTab === tab.id
                    ? 'text-brand-green font-semibold bg-brand-green/5'
                    : 'text-gray-700 hover:text-brand-green hover:bg-gray-50'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="ml-64 flex-1 p-6">
          {activeTab === 'info' && <InfoTab boardId={id!} board={board} />}
          {activeTab === 'pitch' && <PitchTab boardId={id!} />}
          {activeTab === 'score' && <ScoreTab boardId={id!} />}
          {activeTab === 'fans' && <FansTab boardId={id!} />}
          {activeTab === 'squad' && <SquadTab boardId={id!} onDirtyChange={setRosterFormDirty} />}
          {activeTab === 'invite' && <InviteTab boardId={id!} />}
          {activeTab === 'events' && <EventsTab boardId={id!} />}
          {activeTab === 'edit' && (
            <EditBoardForm
              board={board}
              boardId={id!}
              onClose={() => setActiveTab('info')}
              onSaved={() => {
                setActiveTab('info');
                qc.invalidateQueries({ queryKey: ['board', id] });
              }}
            />
          )}
        </div>
      </div>

      {/* Tab Switch Confirmation */}
      {pendingTab && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPendingTab(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <h3 className="text-base font-bold text-gray-800 mb-1">Discard Changes?</h3>
              <p className="text-xs text-gray-500 mb-4">You have unsaved roster data. Are you sure you want to leave?</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setPendingTab(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
                >No, Keep Editing</button>
                <button
                  onClick={() => { setActiveTab(pendingTab); setPendingTab(null); setRosterFormDirty(false); }}
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
function EditBoardForm({ board, boardId, onClose, onSaved }: { board: any; boardId: string; onClose: () => void; onSaved: () => void }) {
  console.log('EditBoardModal board object:', board, 'boardId:', boardId);
  const [name, setName] = useState(board.name || '');
  const [boardNameError, setBoardNameError] = useState('');
  const [description, setDescription] = useState(board.description || '');
  const [city, setCity] = useState(board.city || '');
  const [state, setState] = useState(board.state || '');
  const [country, setCountry] = useState(board.country || '');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(board.logoUrl || board.LogoUrl || board.logourl || '');
  const [logoError, setLogoError] = useState<string>('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const qc = useQueryClient();

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
    if (!country) { setStateList([]); setCityList([]); return; }
    setStatesLoading(true);
    fetchStates(country).then(setStateList).catch(() => setStateList([])).finally(() => setStatesLoading(false));
  }, [country]);

  // Fetch cities when state changes
  useEffect(() => {
    if (!country || !state) { setCityList([]); return; }
    setCitiesLoading(true);
    fetchCities(country, state).then(setCityList).catch(() => setCityList([])).finally(() => setCitiesLoading(false));
  }, [country, state]);

  const isLeague = (board.boardType === 2 || board.boardType === 'League' || board.BoardType === 2);
  const [coOwnerSearch, setCoOwnerSearch] = useState('');
  const [showCoOwnerDropdown, setShowCoOwnerDropdown] = useState(false);
  const [selectedCoOwner, setSelectedCoOwner] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);
  const [initialCoOwnerId, setInitialCoOwnerId] = useState<string>('');

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
        setInitialCoOwnerId(match.id);
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
        logoUrl: logoPreview,
        ...(isLeague && selectedCoOwner ? { coOwnerId: selectedCoOwner.id } : {}),
      };
      console.log('Updating board:', boardId, 'payload:', JSON.stringify(payload));
      return boardService.update(boardId, payload).then((r) => r.data);
    },
    onSuccess: (updatedBoard: any) => {
      // Use server response for text fields but use local logoPreview as truth
      // (server may return old logo URL if it didn't process the clear)
      const newName = updatedBoard?.name || name;
      const newDescription = updatedBoard?.description ?? description;
      const newCity = updatedBoard?.city ?? city;
      const newState = updatedBoard?.state ?? state;
      const newCountry = updatedBoard?.country ?? country;
      const newLogoUrl = logoPreview; // always use local state — this is what the user chose

      const editOverlay = { name: newName, description: newDescription, city: newCity, state: newState, country: newCountry, logoUrl: newLogoUrl };

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
      const userId = useAuthStore.getState().user?.id;
      qc.setQueryData(['myBoards', userId], (old: any) => {
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
      // Invalidate the boards list so dashboard reflects changes
      qc.invalidateQueries({ queryKey: ['myBoards', userId] });
      onSaved();
    },
    onError: (error: any) => {
      console.error('Board update error:', error?.response?.status, error?.response?.data);
      if (error?.message === 'Board name already exists. Please create a different name.') {
        setBoardNameError(error.message);
      } else if (error?.response?.status === 401) {
        alert('Session expired. Please sign in again.');
        window.location.href = '/login';
      } else {
        alert(`Failed to update board. ${error?.response?.data?.title || error?.response?.data?.message || ''}`);
      }
    },
  });

  const hasChanges = name !== (board.name || '') || description !== (board.description || '') || country !== (board.country || '') || state !== (board.state || '') || city !== (board.city || '') || logoPreview !== (board.logoUrl || board.LogoUrl || board.logourl || '') || (selectedCoOwner?.id || '') !== initialCoOwnerId;

  return (
    <>
    <div className="card mb-6">
      <h3 className="font-semibold mb-4">Edit Board</h3>
      {/* Logo Upload */}
      <div className="flex flex-col items-start gap-1 mb-4">
        <p className="text-sm font-medium text-gray-700">Board Logo</p>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden hover:border-brand-green transition-colors cursor-pointer group"
            onClick={() => document.getElementById('edit-board-logo-input')?.click()}>
            {logoPreview ? (
              <img src={logoPreview} alt="Board logo" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-gray-400 group-hover:text-brand-green transition-colors px-1">
                <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-[9px] leading-tight text-center font-medium">Upload Logo</span>
              </div>
            )}
            {logoPreview && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </div>
            )}
          </div>
          {logoPreview && <button className="text-xs text-red-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); setLogo(null); setLogoPreview(''); }}>Remove</button>}
        </div>
        <p className="text-xs text-gray-400 ml-2">Max 2MB</p>
        {logoError && <p className="text-xs text-red-500 mt-1">{logoError}</p>}
        <input id="edit-board-logo-input" type="file" accept="image/*" className="hidden" onChange={e => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) {
            if (file.size > 2 * 1024 * 1024) { setLogoError('Logo must be under 2MB'); return; }
            setLogoError('');
            setLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
          }
        }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Board Name <span className="text-red-500">*</span></label>
          <input value={name} maxLength={50} onChange={(e) => { setName(e.target.value); setBoardNameError(''); }} className={`input-field ${boardNameError ? 'border-red-500' : ''}`} />
          {boardNameError && <p className="text-xs text-red-500 mt-1">{boardNameError}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <input value={isLeague ? 'League' : 'Team'} disabled className="input-field bg-gray-100 text-gray-500 cursor-not-allowed" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={3} />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
          {countryDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCountryDropdownOpen(false); setCountrySearchText(''); }} />}
          <div className={`input-field cursor-pointer flex items-center justify-between ${countriesLoading ? 'opacity-50' : ''}`} onClick={() => { if (!countriesLoading) setCountryDropdownOpen(!countryDropdownOpen); }}>
            <span className={country ? 'text-gray-900' : 'text-gray-400'}>{countriesLoading ? 'Loading countries...' : country || 'Select Country'}</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          {countryDropdownOpen && (
            <div className="absolute z-10 bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="max-h-80 overflow-y-auto">
                {countryList.filter(c => !countrySearchText || c.toLowerCase().includes(countrySearchText.toLowerCase())).map(c => (
                  <button key={c} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${country === c ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`} onClick={() => { setCountry(c); setState(''); setCity(''); setCountryDropdownOpen(false); setCountrySearchText(''); }}>{c}</button>
                ))}
                {countryList.filter(c => !countrySearchText || c.toLowerCase().includes(countrySearchText.toLowerCase())).length === 0 && <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>}
              </div>
              <div className="p-2 border-t border-gray-100"><input type="text" value={countrySearchText} onChange={e => setCountrySearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search country..." autoFocus onClick={e => e.stopPropagation()} /></div>
            </div>
          )}
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
          {stateDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setStateDropdownOpen(false); setStateSearchText(''); }} />}
          <div className={`input-field cursor-pointer flex items-center justify-between ${!country || statesLoading ? 'pointer-events-none' : ''}`} onClick={() => { if (country && !statesLoading) setStateDropdownOpen(!stateDropdownOpen); }}>
            <span className={state ? 'text-gray-900' : 'text-gray-400'}>{!country ? 'Select Country first' : statesLoading ? 'Loading states...' : state || 'Select State'}</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${stateDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          {stateDropdownOpen && (
            <div className="absolute z-10 bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="max-h-80 overflow-y-auto">
                {stateList.filter(s => !stateSearchText || s.toLowerCase().includes(stateSearchText.toLowerCase())).map(s => (
                  <button key={s} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${state === s ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`} onClick={() => { setState(s); setCity(''); setStateDropdownOpen(false); setStateSearchText(''); }}>{s}</button>
                ))}
                {stateList.filter(s => !stateSearchText || s.toLowerCase().includes(stateSearchText.toLowerCase())).length === 0 && <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>}
              </div>
              <div className="p-2 border-t border-gray-100"><input type="text" value={stateSearchText} onChange={e => setStateSearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search state..." autoFocus onClick={e => e.stopPropagation()} /></div>
            </div>
          )}
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">District / City <span className="text-red-500">*</span></label>
          {cityDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCityDropdownOpen(false); setCitySearchText(''); }} />}
          <div className={`input-field cursor-pointer flex items-center justify-between ${!state || citiesLoading ? 'pointer-events-none' : ''}`} onClick={() => { if (state && !citiesLoading) setCityDropdownOpen(!cityDropdownOpen); }}>
            <span className={city ? 'text-gray-900' : 'text-gray-400'}>{!state ? 'Select State first' : citiesLoading ? 'Loading...' : city || 'Select District / City'}</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          {cityDropdownOpen && (
            <div className="absolute z-10 bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="max-h-80 overflow-y-auto">
                {cityList.filter(c => !citySearchText || c.toLowerCase().includes(citySearchText.toLowerCase())).map(c => (
                  <button key={c} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${city === c ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`} onClick={() => { setCity(c); setCityDropdownOpen(false); setCitySearchText(''); }}>{c}</button>
                ))}
                {cityList.filter(c => !citySearchText || c.toLowerCase().includes(citySearchText.toLowerCase())).length === 0 && <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>}
              </div>
              <div className="p-2 border-t border-gray-100"><input type="text" value={citySearchText} onChange={e => setCitySearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search district / city..." autoFocus onClick={e => e.stopPropagation()} /></div>
            </div>
          )}
        </div>
        {isLeague && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Co-Owner</label>
            <div className="relative">
              {showCoOwnerDropdown && <div className="fixed inset-0 z-[5]" onClick={() => { setShowCoOwnerDropdown(false); setCoOwnerSearch(''); }} />}
              <div className="input-field cursor-pointer flex items-center justify-between" onClick={() => setShowCoOwnerDropdown(prev => !prev)}>
                {selectedCoOwner ? (
                  <span className="text-gray-900 flex items-center gap-2">
                    {selectedCoOwner.firstName || selectedCoOwner.lastName ? `${selectedCoOwner.firstName} ${selectedCoOwner.lastName}`.trim() : selectedCoOwner.email}
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedCoOwner(null); }} className="text-gray-400 hover:text-red-500 font-bold text-sm">×</button>
                  </span>
                ) : <span className="text-gray-400">Select Co-Owner</span>}
              </div>
              {showCoOwnerDropdown && (
                <div className="absolute z-10 bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="max-h-48 overflow-y-auto">
                    {coOwnerLoading ? <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading users...</div> : (() => {
                      const currentUserId = board.ownerId || board.owneriD || board.OwnerId || '';
                      const loggedInUserId = useAuthStore.getState().user?.id || '';
                      const filtered = (coOwnerUserList || []).filter((u: any) => u.id !== currentUserId && u.id !== loggedInUserId && (!coOwnerSearch || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(coOwnerSearch.toLowerCase())));
                      return filtered.length === 0 ? <div className="px-4 py-3 text-sm text-gray-500 text-center">No users found</div> : filtered.map((u: any) => (
                        <button key={u.id} onClick={() => { setSelectedCoOwner({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email }); setCoOwnerSearch(''); setShowCoOwnerDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-brand-green/5 flex items-center gap-2 text-sm border-b last:border-0">
                          <div className="w-7 h-7 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-xs">{u.firstName?.[0]}</div>
                          <div className="min-w-0"><span className="block font-medium text-gray-900">{u.firstName} {u.lastName}</span>{u.email && <span className="block text-xs text-gray-600 truncate">{u.email}</span>}</div>
                        </button>
                      ));
                    })()}
                  </div>
                  <div className="p-2 border-t border-gray-100"><input type="text" value={coOwnerSearch} onChange={e => setCoOwnerSearch(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search users..." autoFocus onClick={e => e.stopPropagation()} /></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <button onClick={() => { if (hasChanges) { setShowCancelConfirm(true); } else { onClose(); } }} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">Cancel</button>
        <button onClick={() => name.trim() && country && state && city && updateMutation.mutate()} disabled={!name.trim() || !country || !state || !city || updateMutation.isPending} className="btn-primary text-sm px-6">{updateMutation.isPending ? 'Saving...' : 'Save'}</button>
      </div>
    </div>

    {showCancelConfirm && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
        <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
          <div className="flex flex-col items-center text-center">
            <h3 className="text-base font-bold text-gray-800 mb-1">Discard Changes?</h3>
            <p className="text-xs text-gray-500 mb-4">Are you sure you want to cancel? Any unsaved changes will be lost.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowCancelConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">No, Keep Editing</button>
              <button onClick={() => { setShowCancelConfirm(false); onClose(); }} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors text-sm">Yes, Discard</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ── INFO TAB ──
function InfoTab({ boardId, board }: { boardId: string; board?: any }) {
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
    if (subTab === 'about') {
      const aboutText = info?.aboutOrganization;
      const description = board?.description;
      const city = board?.city;
      const state = board?.state;
      const country = board?.country;
      const locationParts = [city, state, country].filter(Boolean);
      const location = locationParts.join(', ');
      const hasContent = aboutText || description || location;
      if (!hasContent) return <p className="text-gray-400 text-center py-8">No information available yet.</p>;
      return (
        <div className="space-y-6">
          {(aboutText || description) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{aboutText || description}</p>
            </div>
          )}
          {location && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Location</h4>
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5 text-brand-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>{location}</span>
              </div>
            </div>
          )}
        </div>
      );
    }
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
    if (!info) return <p className="text-gray-400 text-center py-8">No information available yet.</p>;
    const contentMap: Record<string, string | undefined> = {
      history: info.history, rules: info.rulesAndRegulations,
      awards: info.awardsAndHonors, faq: info.faq,
    };
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
  leagueBoardIds: string[];
  logoUrl?: string;
}

function SquadTab({ boardId, onDirtyChange }: { boardId: string; onDirtyChange?: (dirty: boolean) => void }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRosterId, setEditingRosterId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RosterFormData>({
    rosterName: '', captain: '', viceCaptain: '', coach: '', members: [], leagueBoardIds: [], logoUrl: '',
  });
  const [newMember, setNewMember] = useState('');
  const [activeSearchField, setActiveSearchField] = useState<'captain' | 'viceCaptain' | 'coach' | 'member' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rosterFieldSearch, setRosterFieldSearch] = useState('');
  const [showRosterCancelConfirm, setShowRosterCancelConfirm] = useState(false);
  const deletedIdsRef = useRef<Set<string>>(new Set());
  const createdRostersRef = useRef<any[]>([]);
  const qc = useQueryClient();

  // ── Persist deleted/created roster IDs in sessionStorage so they survive page refresh ──
  const DELETED_KEY = `deletedRosters_${boardId}`;
  const CREATED_KEY = `createdRosters_${boardId}`;

  // Load persisted tracking on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DELETED_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { ids: string[]; ts: number };
        // Only keep if saved within last 60 seconds (backend propagation window)
        if (Date.now() - parsed.ts < 60000) {
          parsed.ids.forEach((id: string) => deletedIdsRef.current.add(id));
        } else {
          sessionStorage.removeItem(DELETED_KEY);
        }
      }
    } catch { /* ignore */ }
    try {
      const saved = sessionStorage.getItem(CREATED_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { rosters: any[]; ts: number };
        if (Date.now() - parsed.ts < 60000) {
          createdRostersRef.current = parsed.rosters;
        } else {
          sessionStorage.removeItem(CREATED_KEY);
        }
      }
    } catch { /* ignore */ }
  }, [boardId]);

  const persistDeletedIds = () => {
    const ids = Array.from(deletedIdsRef.current);
    if (ids.length > 0) {
      sessionStorage.setItem(DELETED_KEY, JSON.stringify({ ids, ts: Date.now() }));
    } else {
      sessionStorage.removeItem(DELETED_KEY);
    }
  };

  const persistCreatedRosters = () => {
    const rosters = createdRostersRef.current;
    if (rosters.length > 0) {
      sessionStorage.setItem(CREATED_KEY, JSON.stringify({ rosters, ts: Date.now() }));
    } else {
      sessionStorage.removeItem(CREATED_KEY);
    }
  };

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setErrorMsg(null); setTimeout(() => setSuccessMsg(null), 4000); };
  const showError = (msg: string) => { setErrorMsg(msg); setSuccessMsg(null); setTimeout(() => setErrorMsg(null), 5000); };

  // Shared roster fetching logic — used by useQuery and after create/update/delete
  const fetchRosterList = async () => {
    const rawRes = await rosterService.getByBoard(boardId);
    let raw = rawRes.data;

    console.log('[fetchRosterList] raw API response:', JSON.stringify(raw));

    // Handle string responses (server may return JSON as text/plain)
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch { /* leave as-is */ }
    }

    // Normalize the list from various possible API response shapes
    let rosterList: any[] = [];
    if (Array.isArray(raw)) {
      rosterList = raw;
    } else if (raw && typeof raw === 'object') {
      const d = (raw as any).data;
      const v = (raw as any).$values;
      const i = (raw as any).items;
      const r = (raw as any).result;
      const rv = (raw as any).rosters;
      if (Array.isArray(d)) {
        rosterList = d;
      } else if (d && Array.isArray(d.$values)) {
        rosterList = d.$values;
      } else if (Array.isArray(v)) {
        rosterList = v;
      } else if (Array.isArray(i)) {
        rosterList = i;
      } else if (Array.isArray(r)) {
        rosterList = r;
      } else if (Array.isArray(rv)) {
        rosterList = rv;
      } else if (d && typeof d === 'object' && !Array.isArray(d)) {
        // Single roster object returned, wrap in array
        rosterList = [d];
      } else if ((raw as any).id || (raw as any).Id) {
        // Single roster object at top level
        rosterList = [raw];
      }
    }
    console.log('[fetchRosterList] parsed', rosterList.length, 'rosters from response');

    if (rosterList.length === 0) return [];

    // Fetch full details for each roster using GET /boards/{boardId}/Rosters/{rosterId}
    const detailed = await Promise.all(
      rosterList.map(async (roster: any) => {
        try {
          const rid = roster.id || roster.Id || roster.rosterId || roster.RosterId;
          if (!rid) return roster;
          const detailRes = await rosterService.getById(boardId, rid);
          const detailRaw = detailRes.data as any;
          // Normalize: response may be { success: true, data: {...} } or direct object
          const detail = detailRaw?.data && typeof detailRaw.data === 'object' && !Array.isArray(detailRaw.data)
            ? detailRaw.data : detailRaw;

          // Extract user info from nested captain/viceCaptain/coach objects to enrich user list
          const extractUser = (obj: any) => {
            if (!obj || typeof obj !== 'object') return null;
            const uid = obj.id || obj.Id;
            const fn = obj.firstName || obj.FirstName || '';
            const ln = obj.lastName || obj.LastName || '';
            if (!uid || (!fn && !ln)) return null;
            return { id: uid, firstName: fn, lastName: ln, email: obj.email || obj.Email || '', userName: obj.userName || obj.UserName || '' };
          };
          const usersToEnrich: any[] = [];
          [detail.captain || detail.Captain, detail.viceCaptain || detail.ViceCaptain, detail.coach || detail.Coach].forEach(obj => {
            const u = extractUser(obj);
            if (u) usersToEnrich.push(u);
          });
          const membersArr = detail.members?.$values || detail.Members?.$values || detail.members || detail.Members;
          if (Array.isArray(membersArr)) {
            membersArr.forEach((m: any) => {
              const mu = extractUser(m.user || m.User || m);
              if (mu) usersToEnrich.push(mu);
            });
          }
          if (usersToEnrich.length > 0) {
            qc.setQueryData(['usersList'], (old: any[] | undefined) => {
              const existing = old || [];
              const existingIds = new Set(existing.map((u: any) => u.id));
              const newUsers = usersToEnrich.filter(u => u.id && !existingIds.has(u.id));
              const updated = existing.map((u: any) => {
                const enriched = usersToEnrich.find(e => e.id === u.id);
                if (enriched && (!u.firstName || !u.lastName) && enriched.firstName) {
                  return { ...u, firstName: enriched.firstName, lastName: enriched.lastName, userName: enriched.userName || u.userName };
                }
                return u;
              });
              return [...updated, ...newUsers];
            });
          }

          // Normalize playerIds from various API shapes
          const rawPids = detail.playerIds ?? detail.PlayerIds ?? detail.playerids ?? detail.player_ids ?? detail.players;
          let normalizedPlayerIds: string[] = [];
          if (Array.isArray(rawPids)) {
            normalizedPlayerIds = rawPids;
          } else if (rawPids?.$values && Array.isArray(rawPids.$values)) {
            normalizedPlayerIds = rawPids.$values;
          }
          // Also extract player IDs from members array if playerIds is empty
          if (normalizedPlayerIds.length === 0 && Array.isArray(membersArr)) {
            normalizedPlayerIds = membersArr
              .filter((m: any) => (m.role || m.Role) === 'Member' || (m.role || m.Role) === 'Player')
              .map((m: any) => m.userId || m.UserId || m.id || m.Id)
              .filter(Boolean);
          }

          return { ...roster, ...detail, playerIds: normalizedPlayerIds };
        } catch {
          return roster;
        }
      })
    );
    // Filter out recently deleted rosters that backend might still return
    const filtered = detailed.filter((r: any) => {
      const rid = r.id || r.Id;
      return !rid || !deletedIdsRef.current.has(rid);
    });

    // Merge in any recently created rosters that backend hasn't returned yet
    const existingIds = new Set(filtered.map((r: any) => r.id || r.Id));
    const missingCreated = createdRostersRef.current.filter(
      (cr: any) => !existingIds.has(cr.id) && !deletedIdsRef.current.has(cr.id)
    );
    const merged = [...filtered, ...missingCreated];

    // If backend now returns all created rosters, clear the tracking
    if (missingCreated.length === 0 && createdRostersRef.current.length > 0) {
      console.log('[fetchRosterList] Backend caught up — clearing created roster tracking');
      createdRostersRef.current = [];
      sessionStorage.removeItem(CREATED_KEY);
    }
    // If backend no longer returns deleted rosters, clear the tracking
    if (detailed.every((r: any) => !deletedIdsRef.current.has(r.id || r.Id)) && deletedIdsRef.current.size > 0) {
      console.log('[fetchRosterList] Backend caught up — clearing deleted roster tracking');
      deletedIdsRef.current.clear();
      sessionStorage.removeItem(DELETED_KEY);
    }

    return merged;
  };

  const { data: squads, isLoading } = useQuery({
    queryKey: ['squad', boardId],
    queryFn: fetchRosterList,
    refetchOnWindowFocus: false,
    staleTime: 10000,
  });

  // Load user list for autocomplete (same as co-owner)
  const { data: rosterUserList, isLoading: rosterUsersLoading } = useQuery({
    queryKey: ['usersList'],
    queryFn: async () => {
      const r = await userService.list();
      const raw = r.data as any;
      console.log('User list raw response:', raw);
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.items) ? raw.items : Array.isArray(raw?.users) ? raw.users : Array.isArray(raw?.result) ? raw.result : raw ? [raw] : [];
      console.log('User list parsed:', list.length, 'users');
      return list.map((u: any) => {
        let first = u.firstName || u.FirstName || '';
        let last = u.lastName || u.LastName || '';
        const email = u.email || u.Email || u.emailAddress || u.EmailAddress || '';
        const uid = u.id || u.Id || u.userId || u.UserId;
        const userName = u.userName || u.UserName || '';
        // If firstName/lastName empty, try fullName/name
        if (!first && !last) {
          const fullName = u.fullName || u.FullName || u.name || u.Name || '';
          if (fullName && !fullName.includes('@')) {
            const parts = fullName.split(' ');
            first = parts[0] || '';
            last = parts.slice(1).join(' ') || '';
          }
        }
        // If name looks like an email, treat it as no name
        if (first.includes('@')) first = '';
        if (last.includes('@')) last = '';

        console.log('[userList] raw user:', JSON.stringify({ uid, userName, first, last, email, rawFirstName: u.firstName, rawLastName: u.lastName }));

        return {
          id: uid,
          firstName: first || '',
          lastName: last || '',
          email,
          userName,
        };
      });
    },
  });

  // Load all boards for the League Board field — always enabled so list view can resolve names
  const { data: boardGroundsList, isLoading: boardGroundsLoading } = useQuery({
    queryKey: ['allBoardsForLeague'],
    queryFn: async () => {
      try {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return [];
        const [ownerRes, coOwnerRes] = await Promise.all([
          boardService.getByOwner(userId).catch(() => ({ data: null })),
          boardService.getByOwner(undefined, userId).catch(() => ({ data: null })),
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

        // Merge and deduplicate
        const seen = new Set<string>();
        const items: any[] = [];
        for (const b of [...ownerItems, ...coOwnerItems]) {
          const bid = b.id || b.Id;
          if (bid && !seen.has(bid)) {
            seen.add(bid);
            items.push(b);
          }
        }
        // Filter to only League boards (boardType === 2 or 'League')
        const leagueOnly = items.filter((b: any) => {
          const bt = b.boardType ?? b.BoardType ?? b.board_type;
          return bt === 2 || bt === 'League';
        });
        console.log('League Boards loaded:', leagueOnly.length, 'out of', items.length, 'total');
        return leagueOnly.map((b: any) => ({
          id: b.id || b.Id,
          name: b.name || b.Name || 'Unnamed',
        }));
      } catch (err) {
        console.error('Failed to load league boards:', err);
        return [];
      }
    },
  });

  const [leagueBoardSearchField, setLeagueBoardSearchField] = useState(false);
  const [leagueBoardSearch, setLeagueBoardSearch] = useState('');

  const createRosterMutation = useMutation({
    mutationFn: async (data: RosterFormData) => {
      const createRes = await rosterService.create(boardId, {
        name: data.rosterName,
        logoUrl: data.logoUrl || undefined,
        captainId: data.captain,
        viceCaptainId: data.viceCaptain,
        coachId: data.coach,
        playerIds: data.members,
        leagueBoardIds: data.leagueBoardIds,
      });
      // Return both the API response and the submitted form data
      return { res: createRes, submitted: data };
    },
    onSuccess: async (result: any) => {
      const { res, submitted } = result;
      const createdRaw = res?.data?.data || res?.data;
      const newRosterId = createdRaw?.id || createdRaw?.Id || createdRaw?.rosterId;
      if (newRosterId) {
        sessionStorage.setItem('lastCreatedRosterId', newRosterId);
      }

      // Build optimistic roster from the SUBMITTED data (not from state which will be reset)
      const optimisticRoster = {
        id: newRosterId || `temp-${Date.now()}`,
        name: submitted.rosterName,
        captainId: submitted.captain,
        viceCaptainId: submitted.viceCaptain,
        coachId: submitted.coach,
        playerIds: submitted.members,
        leagueBoardIds: submitted.leagueBoardIds,
        logoUrl: submitted.logoUrl || '',
        memberCount: submitted.members.length,
      };

      // Track the created roster so it survives refetches and page refresh
      createdRostersRef.current = [...createdRostersRef.current, optimisticRoster];
      persistCreatedRosters();

      // Cancel any in-flight queries to prevent stale data from overwriting
      await qc.cancelQueries({ queryKey: ['squad', boardId] });

      // Add to cache BEFORE resetting form
      const currentSquads: any[] = qc.getQueryData(['squad', boardId]) || [];
      qc.setQueryData(['squad', boardId], [...currentSquads, optimisticRoster]);

      showSuccess('Roster created successfully!');
      resetForm();

      // Do NOT invalidate ['squad', boardId] here — it triggers an immediate refetch
      // with stale backend data that overwrites the optimistic roster.
      // Instead, do a delayed refetch with retry to let backend propagate.
      const retryRefetch = async (attempt: number) => {
        try {
          const rosters = await fetchRosterList();
          const hasNewRoster = rosters.some((r: any) =>
            (r.id || r.Id) === newRosterId || r.name === submitted.rosterName
          );
          console.log(`[createRoster] refetch attempt ${attempt}: found ${rosters.length} rosters, hasNew=${hasNewRoster}`);
          if (hasNewRoster) {
            // Backend has caught up — use the fresh data
            qc.setQueryData(['squad', boardId], rosters);
          } else if (attempt < 4) {
            // Backend hasn't propagated yet — retry after a longer delay
            setTimeout(() => retryRefetch(attempt + 1), 3000);
          }
          // If all retries exhausted, the optimistic data + createdRostersRef keeps showing it
        } catch {
          if (attempt < 4) setTimeout(() => retryRefetch(attempt + 1), 3000);
        }
      };
      setTimeout(() => retryRefetch(1), 2000);
    },
    onError: (error: any) => {
      console.error('Create roster error:', error?.response?.status, JSON.stringify(error?.response?.data));
      const errData = error?.response?.data;
      let errMsg = 'Failed to create roster. Please try again.';
      if (errData?.errors) {
        const errs = Array.isArray(errData.errors)
          ? errData.errors.map((e: any) => (typeof e === 'string' ? e : e?.message || e?.field || JSON.stringify(e)))
          : Object.values(errData.errors).flat().map((e: any) => (typeof e === 'string' ? e : e?.message || JSON.stringify(e)));
        errMsg = errs.filter(Boolean).join(', ') || errMsg;
      } else if (errData?.message) {
        errMsg = typeof errData.message === 'string' ? errData.message : JSON.stringify(errData.message);
      } else if (errData?.title) {
        errMsg = typeof errData.title === 'string' ? errData.title : JSON.stringify(errData.title);
      }
      showError(errMsg);
    },
  });

  const updateRosterMutation = useMutation({
    mutationFn: (data: RosterFormData & { rosterId: string }) => {
      // Use rosterId from param, fallback to sessionStorage
      const rosterId = data.rosterId || sessionStorage.getItem('editingRosterId') || '';
      if (!rosterId) {
        return Promise.reject(new Error('Roster ID is missing'));
      }
      return rosterService.update(boardId, rosterId, {
        name: data.rosterName,
        logoUrl: data.logoUrl || undefined,
        captainId: data.captain,
        viceCaptainId: data.viceCaptain,
        coachId: data.coach,
        playerIds: data.members,
        leagueBoardIds: data.leagueBoardIds,
      });
    },
    onSuccess: async (_res: any, submittedData: RosterFormData & { rosterId: string }) => {
      showSuccess('Roster updated successfully!');

      // Cancel stale refetches first
      await qc.cancelQueries({ queryKey: ['squad', boardId] });

      // Optimistically update the roster in the list using SUBMITTED data (not state)
      const rid = submittedData.rosterId;
      qc.setQueryData(['squad', boardId], (old: any[] | undefined) =>
        (old || []).map((r: any) =>
          (r.id || r.Id) === rid
            ? { ...r, name: submittedData.rosterName, captainId: submittedData.captain, viceCaptainId: submittedData.viceCaptain, coachId: submittedData.coach, playerIds: submittedData.members, leagueBoardIds: submittedData.leagueBoardIds }
            : r
        )
      );
      resetForm();

      // Delayed refetch to sync with backend (no immediate invalidation)
      setTimeout(async () => {
        try {
          const rosters = await fetchRosterList();
          if (rosters.length > 0) {
            qc.setQueryData(['squad', boardId], rosters);
          }
        } catch { /* keep optimistic data */ }
      }, 3000);
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || error?.response?.data?.title || 'Failed to update roster. Please try again.');
    },
  });

  const deleteRosterMutation = useMutation({
    mutationFn: (rosterId: string) => {
      if (!rosterId) {
        return Promise.reject(new Error('Roster ID is missing'));
      }
      return rosterService.delete(boardId, rosterId);
    },
    onMutate: async (rosterId: string) => {
      // Track this ID so refetches won't bring it back (even after page refresh)
      deletedIdsRef.current.add(rosterId);
      persistDeletedIds();
      // Also remove from created tracking if it was recently created
      createdRostersRef.current = createdRostersRef.current.filter((r: any) => r.id !== rosterId);
      persistCreatedRosters();
      // Cancel any outgoing refetches
      await qc.cancelQueries({ queryKey: ['squad', boardId] });
      // Snapshot the previous value
      const previousSquads = qc.getQueryData(['squad', boardId]);
      // Optimistically remove the roster from the list
      qc.setQueryData(['squad', boardId], (old: any[] | undefined) =>
        (old || []).filter((r: any) => (r.id || r.Id) !== rosterId)
      );
      return { previousSquads };
    },
    onSuccess: (_data: any, rosterId: string) => {
      setDeleteConfirmId(null);
      showSuccess('Roster deleted successfully!');

      // Do NOT invalidate ['squad', boardId] — it would refetch stale data
      // The deletedIdsRef filter in fetchRosterList handles stale backend responses.
      // Do a delayed retry-refetch to confirm backend propagated the delete.
      const retryRefetch = async (attempt: number) => {
        try {
          const rosters = await fetchRosterList();
          const stillHasDeleted = rosters.some((r: any) => (r.id || r.Id) === rosterId);
          console.log(`[deleteRoster] refetch attempt ${attempt}: found ${rosters.length} rosters, stillHasDeleted=${stillHasDeleted}`);
          if (!stillHasDeleted) {
            // Backend has caught up — safe to use this data and clear tracking
            deletedIdsRef.current.delete(rosterId);
            persistDeletedIds();
            qc.setQueryData(['squad', boardId], rosters);
          } else if (attempt < 4) {
            setTimeout(() => retryRefetch(attempt + 1), 3000);
          }
          // If all retries exhausted, deletedIdsRef keeps filtering it out
        } catch {
          if (attempt < 4) setTimeout(() => retryRefetch(attempt + 1), 3000);
        }
      };
      setTimeout(() => retryRefetch(1), 2000);
    },
    onError: (error: any, rosterId: string, context: any) => {
      // Rollback: remove from deleted tracking and restore cache
      deletedIdsRef.current.delete(rosterId);
      persistDeletedIds();
      if (context?.previousSquads) {
        qc.setQueryData(['squad', boardId], context.previousSquads);
      }
      setDeleteConfirmId(null);
      showError(error?.response?.data?.message || error?.response?.data?.title || 'Failed to delete roster.');
    },
  });

  const resetForm = () => {
    setShowCreateForm(false);
    setEditingRosterId(null);
    setFormData({ rosterName: '', captain: '', viceCaptain: '', coach: '', members: [], leagueBoardIds: [] });
    setNewMember('');
    setSearchTerm('');
    setRosterFieldSearch('');
    setActiveSearchField(null);
    setErrors({});
    sessionStorage.removeItem('editingRosterId');
    onDirtyChange?.(false);
  };

  const [editLoading, setEditLoading] = useState(false);

  const startEdit = async (roster: any) => {
    const rid = roster.id || roster.Id || roster.rosterId || roster.RosterId;
    if (!rid) return;

    setEditLoading(true);
    setEditingRosterId(rid);
    // Store rosterId in sessionStorage for the update call
    sessionStorage.setItem('editingRosterId', rid);

    try {
      // Call GET /boards/{boardId}/Rosters/{rosterId} to fetch fresh details
      const detailRes = await rosterService.getById(boardId, rid);
      const detailRaw = detailRes.data as any;
      console.log('[startEdit] RAW API response:', JSON.stringify(detailRaw));
      // Normalize: response may be { success: true, data: {...} } or direct object
      const detail = detailRaw?.data && typeof detailRaw.data === 'object' && !Array.isArray(detailRaw.data)
        ? detailRaw.data : detailRaw;
      console.log('[startEdit] normalized detail keys:', Object.keys(detail || {}));

      // Extract full user objects from the roster detail response (captain, viceCaptain, coach are nested objects)
      const captainObj = detail.captain || detail.Captain;
      const viceCaptainObj = detail.viceCaptain || detail.ViceCaptain;
      const coachObj = detail.coach || detail.Coach;

      // Helper to extract user info from a nested object
      const extractUserInfo = (obj: any) => {
        if (!obj || typeof obj !== 'object') return null;
        return {
          id: obj.id || obj.Id || '',
          firstName: obj.firstName || obj.FirstName || '',
          lastName: obj.lastName || obj.LastName || '',
          email: obj.email || obj.Email || '',
          userName: obj.userName || obj.UserName || '',
        };
      };

      // Enrich the rosterUserList with user info from the roster detail response
      const enrichUsers: any[] = [];
      const captainInfo = extractUserInfo(captainObj);
      const viceCaptainInfo = extractUserInfo(viceCaptainObj);
      const coachInfo = extractUserInfo(coachObj);
      if (captainInfo?.id) enrichUsers.push(captainInfo);
      if (viceCaptainInfo?.id) enrichUsers.push(viceCaptainInfo);
      if (coachInfo?.id) enrichUsers.push(coachInfo);

      // Use direct ID fields from detail response, fallback to nested objects, then members array
      const membersRaw = detail.members?.$values || detail.Members?.$values || detail.members || detail.Members;
      const captainFromMembers = Array.isArray(membersRaw) ? membersRaw.find((m: any) => m.role === 'Captain' || m.Role === 'Captain') : undefined;
      const viceCaptainFromMembers = Array.isArray(membersRaw) ? membersRaw.find((m: any) => m.role === 'ViceCaptain' || m.Role === 'ViceCaptain') : undefined;
      const coachFromMembers = Array.isArray(membersRaw) ? membersRaw.find((m: any) => m.role === 'Coach' || m.Role === 'Coach') : undefined;

      // Extract member user details from the members array for display enrichment
      if (Array.isArray(membersRaw)) {
        membersRaw.forEach((m: any) => {
          const memberUser = m.user || m.User;
          const memberInfo = extractUserInfo(memberUser);
          if (memberInfo?.id) {
            enrichUsers.push(memberInfo);
          } else if (m.userId || m.UserId) {
            // At least track the userId
            enrichUsers.push({ id: m.userId || m.UserId, firstName: '', lastName: '', email: '', userName: '' });
          }
        });
      }

      // Merge enriched users into the query cache for rosterUserList
      if (enrichUsers.length > 0) {
        qc.setQueryData(['usersList'], (old: any[] | undefined) => {
          const existing = old || [];
          const existingIds = new Set(existing.map((u: any) => u.id));
          const newUsers = enrichUsers.filter(u => u.id && !existingIds.has(u.id) && u.firstName);
          // Also update existing users that have empty names with real names from roster detail
          const updated = existing.map((u: any) => {
            const enriched = enrichUsers.find(e => e.id === u.id);
            if (enriched && (!u.firstName || !u.lastName) && enriched.firstName) {
              return { ...u, firstName: enriched.firstName, lastName: enriched.lastName, userName: enriched.userName || u.userName };
            }
            return u;
          });
          return [...updated, ...newUsers];
        });
      }

      const membersFromArray = Array.isArray(membersRaw)
        ? membersRaw.filter((m: any) => (m.role || m.Role) === 'Member' || (m.role || m.Role) === 'Player')
            .map((m: any) => m.userId || m.UserId || m.id || m.Id)
            .filter(Boolean)
        : [];

      // Normalize playerIds — check all possible field names and formats
      const rawPlayerIds = detail.playerIds ?? detail.PlayerIds ?? detail.playerids ?? detail.player_ids ?? detail.players;
      let playerIds: string[] = [];
      if (Array.isArray(rawPlayerIds)) {
        playerIds = rawPlayerIds;
      } else if (rawPlayerIds?.$values && Array.isArray(rawPlayerIds.$values)) {
        playerIds = rawPlayerIds.$values;
      }
      // Similarly for leagueBoardIds
      const rawLeagueIds = detail.leagueBoardIds ?? detail.LeagueBoardIds ?? detail.leagueboardids ?? detail.league_board_ids;
      let leagueBoardIds: string[] = [];
      if (Array.isArray(rawLeagueIds)) {
        leagueBoardIds = rawLeagueIds;
      } else if (rawLeagueIds?.$values && Array.isArray(rawLeagueIds.$values)) {
        leagueBoardIds = rawLeagueIds.$values;
      }

      // Also check for players from the cached roster object (which was enriched by fetchRosterList)
      const cachedPlayerIds = roster.playerIds ?? roster.PlayerIds;
      let cachedMembers: string[] = [];
      if (Array.isArray(cachedPlayerIds)) cachedMembers = cachedPlayerIds;
      else if (cachedPlayerIds?.$values) cachedMembers = cachedPlayerIds.$values;

      const finalMembers = playerIds.length > 0 ? playerIds : membersFromArray.length > 0 ? membersFromArray : cachedMembers;
      const finalLeagueIds = leagueBoardIds.length > 0 ? leagueBoardIds : (Array.isArray(roster.leagueBoardIds) ? roster.leagueBoardIds : []);

      // Resolve IDs: prefer nested object id, then captainId field, then members array
      const resolvedCaptainId = captainInfo?.id || detail.captainId || detail.CaptainId || captainFromMembers?.userId || captainFromMembers?.UserId || '';
      const resolvedViceCaptainId = viceCaptainInfo?.id || detail.viceCaptainId || detail.ViceCaptainId || viceCaptainFromMembers?.userId || viceCaptainFromMembers?.UserId || '';
      const resolvedCoachId = coachInfo?.id || detail.coachId || detail.CoachId || coachFromMembers?.userId || coachFromMembers?.UserId || '';

      console.log('[startEdit] resolved — captain:', resolvedCaptainId, 'vc:', resolvedViceCaptainId, 'coach:', resolvedCoachId, 'members:', finalMembers, 'leagueBoards:', finalLeagueIds);

      setShowCreateForm(true);
      setFormData({
        rosterName: detail.name || detail.Name || roster.name || '',
        captain: resolvedCaptainId,
        viceCaptain: resolvedViceCaptainId,
        coach: resolvedCoachId,
        members: finalMembers,
        leagueBoardIds: finalLeagueIds,
      });
    } catch {
      // Fallback to cached roster data if API call fails
      const fallbackMembersRaw = roster.members?.$values || roster.members;
      const captainFromMembers = Array.isArray(fallbackMembersRaw) ? fallbackMembersRaw.find((m: any) => m.role === 'Captain') : undefined;
      const viceCaptainFromMembers = Array.isArray(fallbackMembersRaw) ? fallbackMembersRaw.find((m: any) => m.role === 'ViceCaptain') : undefined;
      const coachFromMembers = Array.isArray(fallbackMembersRaw) ? fallbackMembersRaw.find((m: any) => m.role === 'Coach') : undefined;
      const membersFromArray = Array.isArray(fallbackMembersRaw) ? fallbackMembersRaw.filter((m: any) => m.role === 'Member').map((m: any) => m.userId || m.id || m.userName) : [];

      let fallbackPlayerIds: string[] = [];
      if (Array.isArray(roster.playerIds)) fallbackPlayerIds = roster.playerIds;
      else if (roster.playerIds?.$values) fallbackPlayerIds = roster.playerIds.$values;

      let fallbackLeagueIds: string[] = [];
      if (Array.isArray(roster.leagueBoardIds)) fallbackLeagueIds = roster.leagueBoardIds;
      else if (roster.leagueBoardIds?.$values) fallbackLeagueIds = roster.leagueBoardIds.$values;

      console.log('[startEdit fallback] roster:', JSON.stringify({ playerIds: roster.playerIds, members: roster.members }));

      setShowCreateForm(true);
      setFormData({
        rosterName: roster.name || '',
        captain: roster.captainId || captainFromMembers?.userId || captainFromMembers?.userName || '',
        viceCaptain: roster.viceCaptainId || viceCaptainFromMembers?.userId || viceCaptainFromMembers?.userName || '',
        coach: roster.coachId || coachFromMembers?.userId || coachFromMembers?.userName || '',
        members: fallbackPlayerIds.length > 0 ? fallbackPlayerIds : membersFromArray,
        leagueBoardIds: fallbackLeagueIds,
      });
    } finally {
      setEditLoading(false);
    }

    setErrors({});
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.rosterName.trim() || formData.rosterName.trim().length < 2) {
      newErrors.rosterName = 'Roster name must be at least 2 characters';
    } else {
      // Check for duplicate roster name (case-insensitive)
      const trimmedName = formData.rosterName.trim().toLowerCase();
      const duplicate = (squads || []).find((r: any) => {
        const existingName = (r.name || r.rosterName || '').trim().toLowerCase();
        const existingId = r.id || r.Id;
        // Skip the roster being edited
        return existingName === trimmedName && existingId !== editingRosterId;
      });
      if (duplicate) {
        newErrors.rosterName = 'A roster with this name already exists';
      }
    }
    if (!formData.captain) {
      newErrors.captain = 'Captain is required';
    }
    if (!formData.viceCaptain) {
      newErrors.viceCaptain = 'Vice Captain is required';
    }
    if (!formData.coach) {
      newErrors.coach = 'Coach is required';
    }
    if (formData.members.length === 0) {
      newErrors.members = 'At least one member is required';
    }
    if (formData.leagueBoardIds.length === 0) {
      newErrors.leagueBoardIds = 'At least one league board is required';
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

  // Helper to resolve user ID to display name
  const getUserDisplay = (userId: string) => {
    if (!userId) return '';
    const user = (rosterUserList || []).find((u: any) =>
      u.id === userId || u.userName === userId || u.email === userId
    );
    if (!user) return userId;
    const first = (user.firstName || '').trim();
    const last = (user.lastName || '').trim();
    const email = (user.email || '').trim();
    const fullName = `${first} ${last}`.trim();
    // Return real name if available and not an email
    if (fullName && !fullName.includes('@')) {
      return fullName;
    }
    // Fall back to userName only if it doesn't look like an email
    if (user.userName && !user.userName.includes('@')) return user.userName;
    // Fall back to email prefix
    return email ? email.split('@')[0] : userId;
  };

  const handleAddMember = (userId?: string) => {
    const id = userId || newMember.trim();
    if (id && !formData.members.includes(id) && id !== formData.captain && id !== formData.viceCaptain && id !== formData.coach) {
      setFormData(prev => ({ ...prev, members: [...prev.members, id] }));
      setNewMember('');
      setSearchTerm('');
      onDirtyChange?.(true);
    }
  };

  const handleRemoveMember = (userId: string) => {
    setFormData(prev => ({ ...prev, members: prev.members.filter(m => m !== userId) }));
  };

  const handleSelectUser = (userId: string, field: 'captain' | 'viceCaptain' | 'coach') => {
    setFormData(prev => ({ ...prev, [field]: userId }));
    setSearchTerm('');
    setActiveSearchField(null);
    onDirtyChange?.(true);
  };

  const handleFieldSearch = (value: string, field: 'captain' | 'viceCaptain' | 'coach' | 'member') => {
    setRosterFieldSearch(value);
    setActiveSearchField(field);
  };

  const renderSearchDropdown = (field: 'captain' | 'viceCaptain' | 'coach' | 'member') => {
    if (activeSearchField !== field) return null;
    const matchesUser = (u: any, value: string) => u.id === value || u.userName === value;
    const filtered = (rosterUserList || []).filter((u: any) =>
      !formData.members.some(m => matchesUser(u, m)) &&
      !matchesUser(u, formData.captain) && !matchesUser(u, formData.viceCaptain) && !matchesUser(u, formData.coach) &&
      (!rosterFieldSearch || `${u.firstName} ${u.lastName} ${u.email} ${u.userName}`.toLowerCase().includes(rosterFieldSearch.toLowerCase()))
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
              placeholder={field === 'coach' ? "Search user" : "Search player"}
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {rosterUsersLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading users...</div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">{field === 'coach' ? 'No users found' : 'No players found'}</div>
            ) : (
              filtered.map((u: any) => {
                const displayName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.userName || (u.email ? u.email.split('@')[0] : u.id);
                const initial = (u.firstName?.[0] || u.userName?.[0] || '?').toUpperCase();
                return (
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
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <span className="block font-medium text-gray-900">{displayName}</span>
                    {u.email && <span className="block text-xs text-gray-600 truncate">{u.email}</span>}
                  </div>
                </button>
                );
              })
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
        <div className="mb-6 flex justify-end">
          <button onClick={() => { setEditingRosterId(null); setShowCreateForm(true); onDirtyChange?.(true); }} className="btn-primary text-sm flex items-center gap-2">
            <span className="text-xl font-bold leading-none">+</span> Create New Roster
          </button>
        </div>
      )}

      {/* Create Roster Form — matches legacy screenshot layout */}
      {showCreateForm && (
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">{editingRosterId ? 'Edit Roster' : 'Create Roster'}</h3>

          <div className="space-y-5">
            {/* Roster Name row */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roster Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.rosterName}
                onChange={(e) => {
                  let val = e.target.value;
                  // No spaces allowed, only alphanumeric
                  if (/\s/.test(val)) return;
                  if (!/^[a-zA-Z0-9]*$/.test(val)) return;
                  // Auto-capitalize first character
                  if (val.length > 0) {
                    val = val[0].toUpperCase() + val.slice(1);
                  }
                  setFormData(prev => ({ ...prev, rosterName: val }));
                  onDirtyChange?.(true);
                  // Inline duplicate check
                  const trimmed = val.trim().toLowerCase();
                  if (trimmed.length >= 2) {
                    const dup = (squads || []).find((r: any) => {
                      const existingName = (r.name || r.rosterName || '').trim().toLowerCase();
                      return existingName === trimmed && (r.id || r.Id) !== editingRosterId;
                    });
                    if (dup) {
                      setErrors(prev => ({ ...prev, rosterName: 'A roster with this name already exists' }));
                    } else {
                      setErrors(prev => { const { rosterName, ...rest } = prev; return rest; });
                    }
                  } else {
                    setErrors(prev => { const { rosterName, ...rest } = prev; return rest; });
                  }
                }}
                placeholder=""
                className={`w-full max-w-sm px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent ${errors.rosterName ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.rosterName && <p className="text-xs text-red-600 mt-1">{errors.rosterName}</p>}
            </div>

            {/* Captain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Captain <span className="text-red-500">*</span></label>
              <div className="relative max-w-sm">
                <input
                  type="text"
                  value={getUserDisplay(formData.captain)}
                  readOnly
                  onClick={() => setActiveSearchField(activeSearchField === 'captain' ? null : 'captain')}
                  placeholder=""
                  className={`w-full px-4 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent cursor-pointer ${errors.captain ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                />
                <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                {renderSearchDropdown('captain')}
              </div>
              {errors.captain && <p className="text-xs text-red-600 mt-1">{errors.captain}</p>}
            </div>

            {/* Vice Captain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vice Captain <span className="text-red-500">*</span></label>
              <div className="relative max-w-sm">
                <input
                  type="text"
                  value={getUserDisplay(formData.viceCaptain)}
                  readOnly
                  onClick={() => setActiveSearchField(activeSearchField === 'viceCaptain' ? null : 'viceCaptain')}
                  placeholder=""
                  className={`w-full px-4 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent cursor-pointer ${errors.viceCaptain ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                />
                <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                {renderSearchDropdown('viceCaptain')}
              </div>
              {errors.viceCaptain && <p className="text-xs text-red-600 mt-1">{errors.viceCaptain}</p>}
            </div>

            {/* Coach */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coach <span className="text-red-500">*</span></label>
              <div className="relative max-w-sm">
                <input
                  type="text"
                  value={getUserDisplay(formData.coach)}
                  readOnly
                  onClick={() => setActiveSearchField(activeSearchField === 'coach' ? null : 'coach')}
                  placeholder=""
                  className={`w-full px-4 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent cursor-pointer ${errors.coach ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                />
                <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                {renderSearchDropdown('coach')}
              </div>
              {errors.coach && <p className="text-xs text-red-600 mt-1">{errors.coach}</p>}
            </div>

            {/* Add Player — Multi-select checkbox dropdown (last field) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Add Players <span className="text-red-500">*</span></label>
                {/* Dropdown trigger (static at top) */}
                <div className="max-w-sm relative">
                  <div
                    onClick={() => setActiveSearchField(activeSearchField === 'member' ? null : 'member')}
                    className={`w-full min-h-[42px] px-4 py-2.5 border rounded-lg focus-within:ring-2 focus-within:ring-brand-green focus-within:border-transparent cursor-pointer flex items-center ${errors.members ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  >
                    <span className="text-gray-400 text-sm">{formData.members.length > 0 ? `${formData.members.length} member(s) selected` : ''}</span>
                    <svg className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  {activeSearchField === 'member' && (
                    <>
                      <div className="fixed inset-0 z-[5]" onClick={() => { setActiveSearchField(null); setRosterFieldSearch(''); }} />
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                        <div className="p-2 border-b border-gray-100">
                          <input
                            type="text"
                            value={rosterFieldSearch}
                            onChange={e => setRosterFieldSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent"
                            placeholder="Search player"
                            autoFocus
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {rosterUsersLoading ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading players...</div>
                          ) : (() => {
                            const matchesUser = (u: any, value: string) => u.id === value || u.userName === value;
                            const filtered = (rosterUserList || []).filter((u: any) =>
                              !matchesUser(u, formData.captain) && !matchesUser(u, formData.viceCaptain) && !matchesUser(u, formData.coach) &&
                              (!rosterFieldSearch || `${u.firstName} ${u.lastName} ${u.email} ${u.userName}`.toLowerCase().includes(rosterFieldSearch.toLowerCase()))
                            );
                            return filtered.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">No players found</div>
                            ) : (
                              filtered.map((u: any) => {
                                const isSelected = formData.members.includes(u.id) || formData.members.includes(u.userName);
                                return (
                                  <button
                                    key={u.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isSelected) {
                                        handleRemoveMember(u.id);
                                      } else {
                                        handleAddMember(u.id);
                                      }
                                    }}
                                    className={`w-full text-left px-4 py-2 hover:bg-brand-green/5 flex items-center gap-2 text-sm border-b last:border-0 ${isSelected ? 'bg-brand-green/5' : ''}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      readOnly
                                      className="w-4 h-4 text-brand-green border-gray-300 rounded focus:ring-brand-green accent-brand-green"
                                    />
                                    <div className="w-7 h-7 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-xs">
                                      {(u.firstName?.[0] || u.userName?.[0] || '?').toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="block font-medium text-gray-900">{`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.userName || (u.email ? u.email.split('@')[0] : u.id)}</span>
                                      {u.email && <span className="block text-xs text-gray-600 truncate">{u.email}</span>}
                                    </div>
                                  </button>
                                );
                              })
                            );
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {/* Selected members displayed as vertical boxes below the dropdown */}
                {formData.members.length > 0 && (
                  <div className="max-w-sm flex flex-col gap-2 mt-2">
                    {formData.members.map((m) => (
                      <div key={m} className="flex items-center justify-between bg-brand-green/5 border border-brand-green/20 rounded-lg px-4 py-2.5">
                        <span className="text-sm font-medium text-gray-800">{getUserDisplay(m)}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveMember(m); }}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-3"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {errors.members && <p className="text-xs text-red-600 mt-1">{errors.members}</p>}
            </div>

            {/* Affiliate to League — Multi-select checkbox dropdown */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate to League <span className="text-red-500">*</span></label>
                <div className="max-w-sm relative">
                  <div
                    onClick={() => setLeagueBoardSearchField(!leagueBoardSearchField)}
                    className={`w-full min-h-[42px] px-4 py-2 border rounded-lg focus-within:ring-2 focus-within:ring-brand-green focus-within:border-transparent cursor-pointer flex flex-wrap items-center gap-1.5 ${errors.leagueBoardIds ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  >
                    {formData.leagueBoardIds.length > 0 ? (
                      formData.leagueBoardIds.map((bId) => {
                        const board = (boardGroundsList || []).find((b: any) => b.id === bId);
                        return (
                          <span key={bId} className="inline-flex items-center gap-1 bg-brand-green/10 text-brand-green text-xs font-medium px-2 py-1 rounded-full">
                            {board ? board.name : bId}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, leagueBoardIds: prev.leagueBoardIds.filter(id => id !== bId) })); }}
                              className="hover:text-red-500 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-gray-400 text-sm"></span>
                    )}
                    <svg className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  {leagueBoardSearchField && (
                    <>
                      <div className="fixed inset-0 z-[5]" onClick={() => { setLeagueBoardSearchField(false); setLeagueBoardSearch(''); }} />
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                        <div className="p-2 border-b border-gray-100">
                          <input
                            type="text"
                            value={leagueBoardSearch}
                            onChange={e => setLeagueBoardSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent"
                            placeholder="Search boards"
                            autoFocus
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {boardGroundsLoading ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading boards...</div>
                          ) : (() => {
                            const filtered = (boardGroundsList || []).filter((b: any) =>
                              !leagueBoardSearch || b.name.toLowerCase().includes(leagueBoardSearch.toLowerCase())
                            );
                            return filtered.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">No boards found</div>
                            ) : (
                              filtered.map((b: any) => {
                                const isSelected = formData.leagueBoardIds.includes(b.id);
                                return (
                                  <button
                                    key={b.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isSelected) {
                                        setFormData(prev => ({ ...prev, leagueBoardIds: prev.leagueBoardIds.filter(id => id !== b.id) }));
                                      } else {
                                        setFormData(prev => ({ ...prev, leagueBoardIds: [...prev.leagueBoardIds, b.id] }));
                                        onDirtyChange?.(true);
                                      }
                                    }}
                                    className={`w-full text-left px-4 py-2 hover:bg-brand-green/5 flex items-center gap-2 text-sm border-b last:border-0 ${isSelected ? 'bg-brand-green/5' : ''}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      readOnly
                                      className="w-4 h-4 text-brand-green border-gray-300 rounded focus:ring-brand-green accent-brand-green"
                                    />
                                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                      {b.name[0]}
                                    </div>
                                    <span className="font-medium text-gray-900">{b.name}</span>
                                  </button>
                                );
                              })
                            );
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {errors.leagueBoardIds && <p className="text-xs text-red-600 mt-1">{errors.leagueBoardIds}</p>}
            </div>

            {/* Create/Update & Cancel Buttons */}
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  const hasDirtyData = formData.rosterName || formData.captain || formData.viceCaptain || formData.coach || formData.members.length > 0 || formData.leagueBoardIds.length > 0;
                  if (hasDirtyData) { setShowRosterCancelConfirm(true); } else { resetForm(); }
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.rosterName.trim() || formData.rosterName.trim().length < 2 || !formData.captain || !formData.viceCaptain || !formData.coach || formData.members.length === 0 || formData.leagueBoardIds.length === 0 || !!errors.rosterName}
                className="btn-primary text-sm px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? (editingRosterId ? 'Updating...' : 'Creating...')
                  : (editingRosterId ? 'Update Roster' : 'Create')}
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
      {!showCreateForm && squads?.length ? squads.map((roster: any) => (
        <div key={roster.id} className="card mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">{(() => { const n = roster.name || roster.rosterName || 'Unnamed Roster'; return n.charAt(0).toUpperCase() + n.slice(1); })()}</h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(roster)} disabled={editLoading} className="text-gray-400 hover:text-brand-green transition-colors disabled:opacity-50" title="Edit roster">
                    {editLoading && editingRosterId === roster.id ? (
                      <div className="w-5 h-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    )}
                  </button>
            </div>
          </div>

          {/* Roster Details */}
          <div className="space-y-3 border-t pt-4">
            {/* Captain */}
            {(roster.captain?.id || roster.captainId) && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-700 w-28">Captain</span>
                <span className="text-sm text-gray-800">{getUserDisplay(roster.captain?.id || roster.captainId)}</span>
              </div>
            )}
            {/* Vice Captain */}
            {(roster.viceCaptain?.id || roster.viceCaptainId) && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-700 w-28">Vice Captain</span>
                <span className="text-sm text-gray-800">{getUserDisplay(roster.viceCaptain?.id || roster.viceCaptainId)}</span>
              </div>
            )}
            {/* Coach */}
            {(roster.coach?.id || roster.coachId) && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-700 w-28">Coach</span>
                <span className="text-sm text-gray-800">{getUserDisplay(roster.coach?.id || roster.coachId)}</span>
              </div>
            )}
            {/* Players removed from card display */}

            {/* Legacy members display (if API returns members array instead) */}
            {(roster.members || []).length > 0 && !roster.captainId && (
              <div className="space-y-3">
                {['Captain', 'ViceCaptain', 'Coach', 'Member'].map(role => {
                  const roleMembers = (roster.members || []).filter((m: any) => m.role === role);
                  if (roleMembers.length === 0) return null;
                  return (
                    <div key={role}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        {role === 'Captain' ? '👑' : role === 'ViceCaptain' ? '⭐' : role === 'Coach' ? '📋' : '🏏'}{' '}
                        {role === 'ViceCaptain' ? 'Vice Captain' : role}{roleMembers.length > 1 ? 's' : ''}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {roleMembers.map((m: any) => (
                          <div key={m.userId || m.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 hover:shadow-sm transition-shadow group">
                            {m.profileImageUrl ? (
                              <img src={m.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-sm">
                                {(m.userName || m.name || '?')[0]}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-800 truncate">{m.userName || m.name || 'Unknown'}</p>
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
            )}

            {/* Empty state */}
            {!roster.captainId && !roster.viceCaptainId && !roster.coachId && !(roster.playerIds || []).length && !(roster.members || []).length && (
              <div className="text-center py-4 text-gray-400">
                <p className="text-sm">No details available for this roster.</p>
              </div>
            )}
          </div>
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

      {/* Roster Cancel Confirmation */}
      {showRosterCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRosterCancelConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <h3 className="text-base font-bold text-gray-800 mb-1">Discard Changes?</h3>
              <p className="text-xs text-gray-500 mb-4">Are you sure you want to cancel? Any unsaved changes will be lost.</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowRosterCancelConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
                >No, Keep Editing</button>
                <button
                  onClick={() => { setShowRosterCancelConfirm(false); resetForm(); }}
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
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Buddies</label>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input-field" />
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
            <textarea value={message} onChange={e => setMessage(e.target.value)} className="input-field resize-none" rows={3} />
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
