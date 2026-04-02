import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardService, leagueService, rosterService, tournamentService, userService } from '../services/cricketSocialService';
import { fetchCountries, fetchStates, fetchCities, fetchCountryPhoneCodes } from '../services/locationService';
import type { Umpire, Ground, Tournament, Match, LeagueApplication, Invoice } from '../types';
import { useAuthStore } from '../store/slices/authStore';
import Navbar from '../components/Navbar';

type LeagueTab = 'dashboard' | 'umpire-list' | 'ground-list' | 'schedule' | 'tournaments' | 'applications' | 'invoices' | 'cancel-game';

type SidebarSection = 'umpires' | 'grounds' | 'trophy' | 'schedules';

const sidebarSections: { id: SidebarSection; label: string; items: { id: LeagueTab; label: string }[] }[] = [
  {
    id: 'umpires', label: 'UMPIRES',
    items: [
      { id: 'umpire-list', label: 'Umpire' },
    ],
  },
  {
    id: 'grounds', label: 'GROUNDS',
    items: [
      { id: 'ground-list', label: 'Ground' },
    ],
  },
  {
    id: 'trophy', label: 'TOURNAMENTS',
    items: [
      { id: 'tournaments', label: 'Tournament' },
    ],
  },
  {
    id: 'schedules', label: 'SCHEDULES AND RESULTS',
    items: [
      { id: 'schedule', label: 'Schedule' },
      { id: 'cancel-game', label: 'Cancel Game by Date' },
    ],
  },
];

export default function LeagueManagementPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const [activeTab, setActiveTab] = useState<LeagueTab>('dashboard');
  const [expandedSections, setExpandedSections] = useState<SidebarSection[]>([]);
  const [showEditBoard, setShowEditBoard] = useState(false);
  const qc = useQueryClient();
  const { data: board } = useQuery({ queryKey: ['board', boardId], queryFn: () => boardService.getById(boardId!).then(r => r.data), enabled: !!boardId });

  const toggleSection = (section: SidebarSection) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleTabClick = (tab: LeagueTab, section: SidebarSection) => {
    setActiveTab(tab);
    if (!expandedSections.includes(section)) {
      setExpandedSections(prev => [...prev, section]);
    }
  };

  if (!board) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar title={`League Management — ${board.name}`} backTo="/dashboard" />

      <div className="pt-14 flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-white border-r shadow-sm fixed left-0 top-14 overflow-y-auto">
          {/* Board Info */}
          <div className="p-4 border-b">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-3">
                {board.logoUrl
                  ? <img src={board.logoUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
                  : <img src="/images/boardIcon.png" alt="" className="w-12 h-12" />
                }
              </div>
              <button
                onClick={() => setShowEditBoard(true)}
                className="font-bold text-sm flex items-center gap-1 hover:text-brand-green transition-colors cursor-pointer"
                title="Edit Board"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                {board.name}
              </button>
            </div>
          </div>

          {/* Collapsible Sections */}
          <div className="py-2">
            {sidebarSections.map(section => (
              <div key={section.id} className="border-b last:border-b-0">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  <span>{section.label}</span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${expandedSections.includes(section.id) ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.includes(section.id) && (
                  <div className="pb-2">
                    {section.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id, section.id)}
                        className={`w-full text-left pl-8 pr-4 py-2 text-sm transition-colors ${
                          activeTab === item.id
                            ? 'text-brand-green font-semibold bg-brand-green/5'
                            : 'text-blue-600 hover:text-blue-800 hover:bg-gray-50'
                        }`}
                      >
                        &gt; {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="ml-64 flex-1 p-6">
          {activeTab === 'dashboard' && <LeagueLandingTab boardId={boardId!} />}
          {activeTab === 'umpire-list' && <UmpireListTab boardId={boardId!} />}
          {activeTab === 'ground-list' && <GroundListTab />}
          {activeTab === 'tournaments' && <TournamentsTab boardId={boardId!} />}
          {activeTab === 'schedule' && <ScheduleTab boardId={boardId!} />}
          {activeTab === 'cancel-game' && <CancelGameTab boardId={boardId!} />}
          {activeTab === 'applications' && <ApplicationsTab boardId={boardId!} />}
          {activeTab === 'invoices' && <InvoicesTab boardId={boardId!} />}
        </div>
      </div>

      {/* Edit Board Modal */}
      {showEditBoard && (
        <EditLeagueModal
          board={board}
          boardId={boardId!}
          onClose={() => setShowEditBoard(false)}
          onSaved={() => {
            setShowEditBoard(false);
            qc.invalidateQueries({ queryKey: ['board', boardId] });
          }}
        />
      )}
    </div>
  );
}

// ── EDIT LEAGUE MODAL ──
function EditLeagueModal({ board, boardId, onClose, onSaved }: { board: any; boardId: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(board.name || '');
  const [boardNameError, setBoardNameError] = useState('');
  const [description, setDescription] = useState(board.description || '');
  const [city, setCity] = useState(board.city || '');
  const [state, setState] = useState(board.state || '');
  const [country, setCountry] = useState(board.country || '');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(board.logoUrl || board.LogoUrl || board.logourl || '');
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

  // Co-Owner state
  const [coOwnerSearch, setCoOwnerSearch] = useState('');
  const [showCoOwnerDropdown, setShowCoOwnerDropdown] = useState(false);
  const [selectedCoOwner, setSelectedCoOwner] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);

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

  // Fetch user list for co-owner dropdown
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
        return { id: u.id || u.Id || u.userId || u.UserId, firstName: first || email.split('@')[0] || email, lastName: last, email };
      });
    },
  });

  // Pre-select co-owner from board data
  useEffect(() => {
    if (!coOwnerUserList || selectedCoOwner) return;
    const boardOwnerId = board.ownerId || board.owneriD || board.OwnerId || board.owner_id || board.ownerid || '';
    const loggedInUserId = useAuthStore.getState().user?.id || '';
    if (boardOwnerId && boardOwnerId !== loggedInUserId) {
      const match = coOwnerUserList.find((u: any) => u.id === boardOwnerId);
      if (match) setSelectedCoOwner({ id: match.id, firstName: match.firstName, lastName: match.lastName, email: match.email });
    }
    // Also check coOwnerId field
    const coOwnerId = board.coOwnerId || board.CoOwnerId || board.coOwnerid || '';
    if (coOwnerId) {
      const match = coOwnerUserList.find((u: any) => u.id === coOwnerId);
      if (match) setSelectedCoOwner({ id: match.id, firstName: match.firstName, lastName: match.lastName, email: match.email });
    }
  }, [coOwnerUserList]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Check for duplicate board name
      const boardsRes = await boardService.getMyBoards(1, 100);
      const raw = boardsRes.data as any;
      const allBoards = raw?.items || (Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
      const existingNames = allBoards
        .filter((b: any) => b.id !== boardId)
        .map((b: any) => b.name?.toLowerCase().trim());
      if (existingNames.includes(name.toLowerCase().trim())) {
        throw new Error('Board name already exists. Please create a different name.');
      }
      const existingOwnerId = board.ownerId || board.owneriD || board.OwnerId || board.owner_id || board.createdBy || board.userId || board.ownerid || '';
      const resolvedOwnerId = selectedCoOwner ? selectedCoOwner.id : existingOwnerId;
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
        logoUrl: logoPreview || board.logoUrl || board.LogoUrl || board.logourl || '',
        ...(selectedCoOwner ? { coOwnerId: selectedCoOwner.id } : {}),
      };
      return boardService.update(boardId, payload).then((r) => r.data);
    },
    onSuccess: (updatedBoard: any) => {
      const newName = updatedBoard?.name || name;
      const newDescription = updatedBoard?.description ?? description;
      const newCity = updatedBoard?.city ?? city;
      const newState = updatedBoard?.state ?? state;
      const newCountry = updatedBoard?.country ?? country;
      const editOverlay = { name: newName, description: newDescription, city: newCity, state: newState, country: newCountry };
      try {
        const pending = JSON.parse(sessionStorage.getItem('boardEdits') || '{}');
        pending[boardId] = editOverlay;
        sessionStorage.setItem('boardEdits', JSON.stringify(pending));
      } catch {}
      qc.setQueryData(['board', boardId], (old: any) => old ? { ...old, ...editOverlay } : updatedBoard || old);
      qc.setQueryData(['myBoards'], (old: any) => {
        if (!old?.items) return old;
        return { ...old, items: old.items.map((b: any) => b.id === boardId ? { ...b, ...editOverlay } : b) };
      });
      qc.invalidateQueries({ queryKey: ['board', boardId] });
      onSaved();
    },
    onError: (error: any) => {
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

  const hasChanges = name !== (board.name || '') || description !== (board.description || '') || country !== (board.country || '') || state !== (board.state || '') || city !== (board.city || '') || logoPreview !== (board.logoUrl || board.LogoUrl || board.logourl || '');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Edit Board</h2>
          <button onClick={() => { if (hasChanges) { setShowCancelConfirm(true); } else { onClose(); } }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          {/* Logo Upload */}
          <div className="flex flex-col items-start gap-1">
            <p className="text-sm font-medium text-gray-700">Board Logo</p>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden hover:border-brand-green transition-colors cursor-pointer group"
                onClick={() => document.getElementById('edit-league-logo-input')?.click()}>
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
              {logoPreview && (
                <button className="text-xs text-red-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); setLogo(null); setLogoPreview(''); }}>Remove</button>
              )}
            </div>
            <p className="text-xs text-gray-400 ml-2">Max 2MB</p>
            <input id="edit-league-logo-input" type="file" accept="image/*" className="hidden" onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 2 * 1024 * 1024) { alert('Logo must be under 2MB'); return; }
                setLogo(file);
                const reader = new FileReader();
                reader.onloadend = () => setLogoPreview(reader.result as string);
                reader.readAsDataURL(file);
              }
            }} />
          </div>

          {/* Board Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Board Name <span className="text-red-500">*</span></label>
            <input value={name} maxLength={50} onChange={(e) => { setName(e.target.value); setBoardNameError(''); }} className={`input-field ${boardNameError ? 'border-red-500' : ''}`} />
            {boardNameError && <p className="text-xs text-red-500 mt-1">{boardNameError}</p>}
          </div>

          {/* Type (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <input value="League" disabled className="input-field bg-gray-100 text-gray-500 cursor-not-allowed" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={3} />
          </div>

          {/* Country, State, City */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Country */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
              {countryDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCountryDropdownOpen(false); setCountrySearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between ${countriesLoading ? 'opacity-50' : ''}`}
                onClick={() => { if (!countriesLoading) setCountryDropdownOpen(!countryDropdownOpen); }}
              >
                <span className={country ? 'text-gray-900' : 'text-gray-400'}>{countriesLoading ? 'Loading countries...' : country || 'Select Country'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {countryDropdownOpen && (
                <div className="absolute z-10 bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="max-h-80 overflow-y-auto">
                    {countryList.filter(c => !countrySearchText || c.toLowerCase().includes(countrySearchText.toLowerCase())).map(c => (
                      <button key={c} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${country === c ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                        onClick={() => { setCountry(c); setState(''); setCity(''); setCountryDropdownOpen(false); setCountrySearchText(''); }}>{c}</button>
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

            {/* State */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
              {stateDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setStateDropdownOpen(false); setStateSearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between ${!country || statesLoading ? 'pointer-events-none' : ''}`}
                onClick={() => { if (country && !statesLoading) setStateDropdownOpen(!stateDropdownOpen); }}
              >
                <span className={state ? 'text-gray-900' : 'text-gray-400'}>{!country ? 'Select Country first' : statesLoading ? 'Loading states...' : state || 'Select State'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${stateDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {stateDropdownOpen && (
                <div className="absolute z-10 bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="max-h-80 overflow-y-auto">
                    {stateList.filter(s => !stateSearchText || s.toLowerCase().includes(stateSearchText.toLowerCase())).map(s => (
                      <button key={s} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${state === s ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                        onClick={() => { setState(s); setCity(''); setStateDropdownOpen(false); setStateSearchText(''); }}>{s}</button>
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

            {/* District / City */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">District / City <span className="text-red-500">*</span></label>
              {cityDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCityDropdownOpen(false); setCitySearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between ${!state || citiesLoading ? 'pointer-events-none' : ''}`}
                onClick={() => { if (state && !citiesLoading) setCityDropdownOpen(!cityDropdownOpen); }}
              >
                <span className={city ? 'text-gray-900' : 'text-gray-400'}>{!state ? 'Select State first' : citiesLoading ? 'Loading...' : city || 'Select District / City'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {cityDropdownOpen && (
                <div className="absolute z-10 bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="max-h-80 overflow-y-auto">
                    {cityList.filter(c => !citySearchText || c.toLowerCase().includes(citySearchText.toLowerCase())).map(c => (
                      <button key={c} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${city === c ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                        onClick={() => { setCity(c); setCityDropdownOpen(false); setCitySearchText(''); }}>{c}</button>
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
          </div>

          {/* Co-Owner */}
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
                      >&times;</button>
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <button
            onClick={() => name.trim() && country && state && city && updateMutation.mutate()}
            disabled={!name.trim() || !country || !state || !city || updateMutation.isPending}
            className="btn-primary text-sm px-6"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
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
                  onClick={() => { setShowCancelConfirm(false); onClose(); }}
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

// ── LEAGUE LANDING TAB (default when Manage League is opened) ──
function LeagueLandingTab({ boardId }: { boardId: string }) {
  const { data: tournaments } = useQuery({
    queryKey: ['tournaments', boardId],
    queryFn: () => tournamentService.getByBoard(boardId).then(r => r.data),
  });
  const { data: schedule } = useQuery({
    queryKey: ['schedule-landing', boardId],
    queryFn: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const to = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split('T')[0];
      return leagueService.getSchedule(boardId, from, to).then(r => {
        const d = r.data;
        return (Array.isArray(d) ? d : (d as any)?.items ?? (d as any)?.data ?? []) as Match[];
      });
    },
  });

  const recentResults = (schedule ?? []).filter((m: any) => m.status === 'Completed').slice(0, 5);
  const upcomingMatches = (schedule ?? []).filter((m: any) => m.status === 'Scheduled' || m.status === 'Live').slice(0, 5);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Star Batsmen of the Week */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase border-b-2 border-yellow-400 pb-2 mb-3">
          Star Batsmen of the Week
        </h3>
        <p className="text-red-500 text-sm italic">No Star Batsmen for the week</p>
      </div>

      {/* Star Bowlers of the Week */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase border-b-2 border-yellow-400 pb-2 mb-3">
          Star Bowlers of the Week
        </h3>
        <p className="text-red-500 text-sm italic">No Star Bowler for the week</p>
      </div>

      {/* Recent Match Results */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase border-b-2 border-yellow-400 pb-2 mb-3">
          Recent Match Results
        </h3>
        {recentResults.length > 0 ? (
          <div className="space-y-3">
            {recentResults.map((m: any) => (
              <div key={m.id} className="bg-white rounded-lg p-4 border flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{m.homeTeamName} vs {m.awayTeamName}</p>
                  <p className="text-xs text-gray-500">{m.tournamentName} · {new Date(m.scheduledAt).toLocaleString()}</p>
                  {m.result && <p className="text-xs text-gray-600 mt-1">{m.result}</p>}
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium cursor-pointer hover:bg-blue-200">View Score</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-red-500 text-sm italic">No completed match results</p>
        )}
      </div>

      {/* Upcoming / In Progress Matches */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase border-b-2 border-yellow-400 pb-2 mb-3">
          Upcoming/In Progress Matches
        </h3>
        {upcomingMatches.length > 0 ? (
          <div className="space-y-3">
            {upcomingMatches.map((m: any) => (
              <div key={m.id} className="bg-white rounded-lg p-4 border flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{m.homeTeamName} vs {m.awayTeamName}</p>
                  <p className="text-xs text-gray-500">{m.tournamentName} · {new Date(m.scheduledAt).toLocaleString()}</p>
                  {m.groundName && <p className="text-xs text-gray-400">📍 {m.groundName}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${m.status === 'Live' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-red-500 text-sm italic">No upcoming matches</p>
        )}
      </div>
    </div>
  );
}

// ── CREATE UMPIRE TAB ──
function CreateUmpireTab({ boardId, onClose }: { boardId: string; onClose?: () => void }) {
  const [name, setName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [contactNo, setContactNo] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const qc = useQueryClient();

  // Phone codes state
  const [phoneCodeList, setPhoneCodeList] = useState<{ name: string; code: string; dial_code: string }[]>([]);
  const [phoneCodesLoading, setPhoneCodesLoading] = useState(false);

  // Location cascading dropdown state
  const [countryList, setCountryList] = useState<string[]>([]);
  const [stateList, setStateList] = useState<string[]>([]);
  const [cityList, setCityList] = useState<string[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [countrySearchText, setCountrySearchText] = useState('');
  const [stateSearchText, setStateSearchText] = useState('');
  const [citySearchText, setCitySearchText] = useState('');

  useEffect(() => {
    setCountriesLoading(true);
    fetchCountries().then(setCountryList).catch(() => setCountryList([])).finally(() => setCountriesLoading(false));
    setPhoneCodesLoading(true);
    fetchCountryPhoneCodes().then(setPhoneCodeList).catch(() => setPhoneCodeList([])).finally(() => setPhoneCodesLoading(false));
  }, []);

  useEffect(() => {
    if (!country) { setStateList([]); setCityList([]); return; }
    setStatesLoading(true);
    fetchStates(country).then(setStateList).catch(() => setStateList([])).finally(() => setStatesLoading(false));
  }, [country]);

  useEffect(() => {
    if (!country || !state) { setCityList([]); return; }
    setCitiesLoading(true);
    fetchCities(country, state).then(setCityList).catch(() => setCityList([])).finally(() => setCitiesLoading(false));
  }, [country, state]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Umpire Name is required';
    if (!city.trim()) newErrors.city = 'City is required';
    if (!state.trim()) newErrors.state = 'State is required';
    if (!country.trim()) newErrors.country = 'Country is required';
    if (!zipCode.trim()) {
      newErrors.zipCode = 'Zip Code is required';
    } else if (!/^\d{6}$/.test(zipCode.trim())) {
      newErrors.zipCode = 'Zip Code must be exactly 6 digits';
    }
    if (!email.trim()) {
      newErrors.email = 'E-mail ID is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: () => leagueService.createUmpire(boardId, {
      umpireName: name.trim(),
      address1: addressLine1.trim(),
      address2: addressLine2.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      zipcode: zipCode.trim(),
      homePhone: '',
      workPhone: '',
      mobile: contactNo.trim() ? `${countryCode}${contactNo.trim()}` : '',
      email: email.trim(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['umpires', boardId] });
      setName(''); setAddressLine1(''); setAddressLine2('');
      setCity(''); setState(''); setCountry('');
      setZipCode(''); setContactNo(''); setEmail('');
      setErrors({});
      setSubmitStatus({ type: 'success', message: 'Umpire created successfully!' });
      if (onClose) onClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Failed to create umpire. Please try again.';
      setSubmitStatus({ type: 'error', message: msg });
    },
  });

  const handleSubmit = () => {
    setSubmitStatus(null);
    if (!validate()) return;
    createMutation.mutate();
  };

  const hasAnyData = () => name.trim() || addressLine1.trim() || addressLine2.trim() || city.trim() || state.trim() || country.trim() || zipCode.trim() || contactNo.trim() || email.trim();

  const handleCancel = () => {
    if (hasAnyData()) { setShowCancelConfirm(true); return; }
    if (onClose) onClose();
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    setName(''); setAddressLine1(''); setAddressLine2('');
    setCity(''); setState(''); setCountry('');
    setZipCode(''); setContactNo(''); setEmail('');
    setErrors({});
    setSubmitStatus(null);
    if (onClose) onClose();
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="bg-gray-100 px-6 py-3 border-b">
          <h2 className="text-base font-bold text-gray-800">Create Umpire</h2>
        </div>
        <div className="p-6">
          {/* Status message */}
          {submitStatus && (
            <div className={`mb-4 px-4 py-3 rounded text-sm font-medium ${submitStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {submitStatus.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            {/* Row 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Umpire Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={e => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: '' })); }}
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input
                value={addressLine1}
                onChange={e => setAddressLine1(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input
                value={addressLine2}
                onChange={e => setAddressLine2(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Row 2: Country → State → City cascading dropdowns */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              {countryDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCountryDropdownOpen(false); setCountrySearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between ${countriesLoading ? 'opacity-50' : ''} ${errors.country ? 'border-red-500' : ''}`}
                onClick={() => { if (!countriesLoading) setCountryDropdownOpen(!countryDropdownOpen); if (errors.country) setErrors(prev => ({ ...prev, country: '' })); }}
              >
                <span className={country ? 'text-gray-900' : 'text-gray-400'}>{countriesLoading ? 'Loading countries...' : country || 'Select Country'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {countryDropdownOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <input type="text" value={countrySearchText} onChange={e => setCountrySearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search country..." autoFocus onClick={e => e.stopPropagation()} />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {countryList.filter(c => !countrySearchText || c.toLowerCase().includes(countrySearchText.toLowerCase())).map(c => (
                      <button key={c} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${country === c ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                        onClick={() => { setCountry(c); setState(''); setCity(''); setCountryDropdownOpen(false); setCountrySearchText(''); }}>{c}</button>
                    ))}
                    {countryList.filter(c => !countrySearchText || c.toLowerCase().includes(countrySearchText.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
                    )}
                  </div>
                </div>
              )}
              {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              {stateDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setStateDropdownOpen(false); setStateSearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between ${!country || statesLoading ? 'pointer-events-none' : ''} ${errors.state ? 'border-red-500' : ''}`}
                onClick={() => { if (country && !statesLoading) setStateDropdownOpen(!stateDropdownOpen); if (errors.state) setErrors(prev => ({ ...prev, state: '' })); }}
              >
                <span className={state ? 'text-gray-900' : 'text-gray-400'}>{!country ? 'Select Country first' : statesLoading ? 'Loading states...' : state || 'Select State'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${stateDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {stateDropdownOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <input type="text" value={stateSearchText} onChange={e => setStateSearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search state..." autoFocus onClick={e => e.stopPropagation()} />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {stateList.filter(s => !stateSearchText || s.toLowerCase().includes(stateSearchText.toLowerCase())).map(s => (
                      <button key={s} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${state === s ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                        onClick={() => { setState(s); setCity(''); setStateDropdownOpen(false); setStateSearchText(''); }}>{s}</button>
                    ))}
                    {stateList.filter(s => !stateSearchText || s.toLowerCase().includes(stateSearchText.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
                    )}
                  </div>
                </div>
              )}
              {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              {cityDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCityDropdownOpen(false); setCitySearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between ${!state || citiesLoading ? 'pointer-events-none' : ''} ${errors.city ? 'border-red-500' : ''}`}
                onClick={() => { if (state && !citiesLoading) setCityDropdownOpen(!cityDropdownOpen); if (errors.city) setErrors(prev => ({ ...prev, city: '' })); }}
              >
                <span className={city ? 'text-gray-900' : 'text-gray-400'}>{!state ? 'Select State first' : citiesLoading ? 'Loading...' : city || 'Select City'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {cityDropdownOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <input type="text" value={citySearchText} onChange={e => setCitySearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search city..." autoFocus onClick={e => e.stopPropagation()} />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {cityList.filter(c => !citySearchText || c.toLowerCase().includes(citySearchText.toLowerCase())).map(c => (
                      <button key={c} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${city === c ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                        onClick={() => { setCity(c); setCityDropdownOpen(false); setCitySearchText(''); }}>{c}</button>
                    ))}
                    {cityList.filter(c => !citySearchText || c.toLowerCase().includes(citySearchText.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
                    )}
                  </div>
                </div>
              )}
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>

            {/* Row 3 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zip Code <span className="text-red-500">*</span>
              </label>
              <input
                value={zipCode}
                maxLength={6}
                onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setZipCode(v); if (errors.zipCode) setErrors(prev => ({ ...prev, zipCode: '' })); }}
                className={`input-field ${errors.zipCode ? 'border-red-500' : ''}`}
              />
              {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="input-field w-32"
                  disabled={phoneCodesLoading}
                >
                  {phoneCodesLoading ? (
                    <option>Loading...</option>
                  ) : phoneCodeList.length > 0 ? (
                    phoneCodeList.map(c => (
                      <option key={`${c.code}-${c.dial_code}`} value={c.dial_code}>{c.dial_code} ({c.code})</option>
                    ))
                  ) : (
                    <>
                      <option value="+1">+1 (US)</option>
                      <option value="+91">+91 (IN)</option>
                      <option value="+44">+44 (GB)</option>
                    </>
                  )}
                </select>
                <input
                  value={contactNo}
                  maxLength={10}
                  onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setContactNo(v); }}
                  className="input-field flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email ID <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: '' })); }}
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded text-sm font-semibold hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !name.trim() || !city.trim() || !state.trim() || !country.trim() || !zipCode.trim() || !email.trim()}
              className="px-8 py-2 bg-green-700 text-white rounded text-sm font-semibold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Discard Changes?</h3>
              <p className="text-xs text-gray-500 mb-4">You have unsaved changes. Are you sure you want to discard them?</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">No, Keep Editing</button>
                <button onClick={confirmCancel} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors text-sm">Yes, Discard</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── UMPIRE LIST TAB ──
function UmpireListTab({ boardId }: { boardId: string }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress1, setEditAddress1] = useState('');
  const [editAddress2, setEditAddress2] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editZipcode, setEditZipcode] = useState('');
  const [editHomePhone, setEditHomePhone] = useState('');
  const [editWorkPhone, setEditWorkPhone] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [editOriginal, setEditOriginal] = useState<any>(null);

  // Location cascading dropdown state for edit form
  const [countryList, setCountryList] = useState<string[]>([]);
  const [stateList, setStateList] = useState<string[]>([]);
  const [cityList, setCityList] = useState<string[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [countrySearchText, setCountrySearchText] = useState('');
  const [stateSearchText, setStateSearchText] = useState('');
  const [citySearchText, setCitySearchText] = useState('');

  // Phone codes state for edit
  const [editPhoneCodeList, setEditPhoneCodeList] = useState<{ name: string; code: string; dial_code: string }[]>([]);
  const [editPhoneCodesLoading, setEditPhoneCodesLoading] = useState(false);
  const [editCountryCode, setEditCountryCode] = useState('+1');

  useEffect(() => {
    setCountriesLoading(true);
    fetchCountries().then(setCountryList).catch(() => setCountryList([])).finally(() => setCountriesLoading(false));
    setEditPhoneCodesLoading(true);
    fetchCountryPhoneCodes().then(setEditPhoneCodeList).catch(() => setEditPhoneCodeList([])).finally(() => setEditPhoneCodesLoading(false));
  }, []);

  useEffect(() => {
    if (!editCountry) { setStateList([]); setCityList([]); return; }
    setStatesLoading(true);
    fetchStates(editCountry).then(setStateList).catch(() => setStateList([])).finally(() => setStatesLoading(false));
  }, [editCountry]);

  useEffect(() => {
    if (!editCountry || !editState) { setCityList([]); return; }
    setCitiesLoading(true);
    fetchCities(editCountry, editState).then(setCityList).catch(() => setCityList([])).finally(() => setCitiesLoading(false));
  }, [editCountry, editState]);

  const { data: umpires, isLoading } = useQuery({
    queryKey: ['umpires', boardId],
    queryFn: () => leagueService.getUmpires(boardId).then(r => {
      const d = r.data;
      return (Array.isArray(d) ? d : (d as any)?.items ?? (d as any)?.data ?? []) as Umpire[];
    }),
    enabled: !!boardId,
  });
  const umpireList = Array.isArray(umpires) ? umpires : [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leagueService.deleteUmpire(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['umpires', boardId] }),
  });

  const updateMutation = useMutation({
    mutationFn: () => leagueService.updateUmpire(editId!, {
      id: editId!,
      umpireName: editName,
      address1: editAddress1,
      address2: editAddress2,
      city: editCity,
      state: editState,
      country: editCountry,
      zipcode: editZipcode,
      homePhone: editHomePhone,
      workPhone: editWorkPhone,
      mobile: editMobile.trim() ? `${editCountryCode}${editMobile.trim()}` : '',
      email: editEmail,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['umpires', boardId] });
      setEditId(null);
      setUpdateError('');
      setUpdateSuccess('Umpire updated successfully!');
      setTimeout(() => setUpdateSuccess(''), 4000);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.response?.data?.title || error?.message || 'Failed to update umpire.';
      setUpdateError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const handleEdit = (u: any) => {
    const uid = u.id || u.umpireId;
    setEditId(uid);
    setEditName(u.umpireName || u.name || '');
    setEditAddress1(u.address1 || u.addressLine1 || '');
    setEditAddress2(u.address2 || u.addressLine2 || '');
    setEditCity(u.city || '');
    setEditState(u.state || '');
    setEditCountry(u.country || '');
    setEditZipcode(u.zipcode || u.zipCode || '');
    setEditHomePhone(u.homePhone || '');
    setEditWorkPhone(u.workPhone || '');
    // Extract country code from mobile (e.g. "+91" prefix)
    const rawMobile = u.mobile || u.contactNumber || '';
    const codeMatch = rawMobile.match(/^(\+\d{1,4})/);
    if (codeMatch) {
      setEditCountryCode(codeMatch[1]);
      setEditMobile(rawMobile.slice(codeMatch[1].length));
    } else {
      setEditCountryCode('+1');
      setEditMobile(rawMobile);
    }
    setEditEmail(u.email || '');
    setEditOriginal({ name: u.umpireName || u.name || '', address1: u.address1 || u.addressLine1 || '', address2: u.address2 || u.addressLine2 || '', city: u.city || '', state: u.state || '', country: u.country || '', zipcode: u.zipcode || u.zipCode || '', homePhone: u.homePhone || '', workPhone: u.workPhone || '', mobile: rawMobile, email: u.email || '' });
    setUpdateError('');
    setUpdateSuccess('');
  };

  const cancelEdit = () => {
    const hasChanges = editOriginal && (editName !== editOriginal.name || editAddress1 !== editOriginal.address1 || editAddress2 !== editOriginal.address2 || editCity !== editOriginal.city || editState !== editOriginal.state || editCountry !== editOriginal.country || editZipcode !== editOriginal.zipcode || editHomePhone !== editOriginal.homePhone || editWorkPhone !== editOriginal.workPhone || editMobile !== editOriginal.mobile || editEmail !== editOriginal.email);
    if (hasChanges) { setShowCancelConfirm(true); return; }
    setEditId(null);
    setUpdateError('');
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    setEditId(null);
    setUpdateError('');
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Umpires</h2>
        {!showCreate && !editId && (
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-4">
            + Create Umpire
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-6">
          <CreateUmpireTab boardId={boardId} onClose={() => setShowCreate(false)} />
        </div>
      )}

      {!showCreate && (
        <>
      {updateSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{updateSuccess}</div>}

      {/* Edit form */}
      {editId && (
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="bg-gray-100 px-6 py-3 border-b">
            <h2 className="text-base font-bold text-gray-800">Edit Umpire</h2>
          </div>
          <div className="p-6">
          {updateError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{updateError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            {/* Row 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Umpire Name <span className="text-red-500">*</span></label>
              <input value={editName} onChange={e => setEditName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input value={editAddress1} onChange={e => setEditAddress1(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input value={editAddress2} onChange={e => setEditAddress2(e.target.value)} className="input-field" />
            </div>

            {/* Row 2: Country → State → City */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
              {countryDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCountryDropdownOpen(false); setCountrySearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between ${countriesLoading ? 'opacity-50' : ''}`}
                onClick={() => { if (!countriesLoading) setCountryDropdownOpen(!countryDropdownOpen); }}
              >
                <span className={editCountry ? 'text-gray-900' : 'text-gray-400'}>{countriesLoading ? 'Loading countries...' : editCountry || 'Select Country'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {countryDropdownOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <input type="text" value={countrySearchText} onChange={e => setCountrySearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search country..." autoFocus onClick={e => e.stopPropagation()} />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {countryList.filter(c => !countrySearchText || c.toLowerCase().includes(countrySearchText.toLowerCase())).map(c => (
                      <button key={c} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${editCountry === c ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                        onClick={() => { setEditCountry(c); setEditState(''); setEditCity(''); setCountryDropdownOpen(false); setCountrySearchText(''); }}>{c}</button>
                    ))}
                    {countryList.filter(c => !countrySearchText || c.toLowerCase().includes(countrySearchText.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
              {stateDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setStateDropdownOpen(false); setStateSearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between ${!editCountry || statesLoading ? 'pointer-events-none' : ''}`}
                onClick={() => { if (editCountry && !statesLoading) setStateDropdownOpen(!stateDropdownOpen); }}
              >
                <span className={editState ? 'text-gray-900' : 'text-gray-400'}>{!editCountry ? 'Select Country first' : statesLoading ? 'Loading states...' : editState || 'Select State'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${stateDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {stateDropdownOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <input type="text" value={stateSearchText} onChange={e => setStateSearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search state..." autoFocus onClick={e => e.stopPropagation()} />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {stateList.filter(s => !stateSearchText || s.toLowerCase().includes(stateSearchText.toLowerCase())).map(s => (
                      <button key={s} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${editState === s ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                        onClick={() => { setEditState(s); setEditCity(''); setStateDropdownOpen(false); setStateSearchText(''); }}>{s}</button>
                    ))}
                    {stateList.filter(s => !stateSearchText || s.toLowerCase().includes(stateSearchText.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
              {cityDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCityDropdownOpen(false); setCitySearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between ${!editState || citiesLoading ? 'pointer-events-none' : ''}`}
                onClick={() => { if (editState && !citiesLoading) setCityDropdownOpen(!cityDropdownOpen); }}
              >
                <span className={editCity ? 'text-gray-900' : 'text-gray-400'}>{!editState ? 'Select State first' : citiesLoading ? 'Loading...' : editCity || 'Select City'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {cityDropdownOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <input type="text" value={citySearchText} onChange={e => setCitySearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search city..." autoFocus onClick={e => e.stopPropagation()} />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {cityList.filter(c => !citySearchText || c.toLowerCase().includes(citySearchText.toLowerCase())).map(c => (
                      <button key={c} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${editCity === c ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                        onClick={() => { setEditCity(c); setCityDropdownOpen(false); setCitySearchText(''); }}>{c}</button>
                    ))}
                    {cityList.filter(c => !citySearchText || c.toLowerCase().includes(citySearchText.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Row 3 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code <span className="text-red-500">*</span></label>
              <input value={editZipcode} maxLength={6} onChange={e => setEditZipcode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <div className="flex gap-2">
                <select
                  value={editCountryCode}
                  onChange={e => setEditCountryCode(e.target.value)}
                  className="input-field w-32"
                  disabled={editPhoneCodesLoading}
                >
                  {editPhoneCodesLoading ? (
                    <option>Loading...</option>
                  ) : editPhoneCodeList.length > 0 ? (
                    editPhoneCodeList.map(c => (
                      <option key={`${c.code}-${c.dial_code}`} value={c.dial_code}>{c.dial_code} ({c.code})</option>
                    ))
                  ) : (
                    <>
                      <option value="+1">+1 (US)</option>
                      <option value="+91">+91 (IN)</option>
                      <option value="+44">+44 (GB)</option>
                    </>
                  )}
                </select>
                <input
                  value={editMobile}
                  maxLength={10}
                  onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setEditMobile(v); }}
                  className="input-field flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email ID <span className="text-red-500">*</span></label>
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="input-field" />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={cancelEdit} className="px-6 py-2 bg-gray-300 text-gray-700 rounded text-sm font-semibold hover:bg-gray-400 transition-colors">Cancel</button>
            <button onClick={() => updateMutation.mutate()} disabled={!editName.trim() || !editCity.trim() || !editState.trim() || !editCountry.trim() || !editZipcode.trim() || !editEmail.trim() || updateMutation.isPending} className="px-8 py-2 bg-green-700 text-white rounded text-sm font-semibold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </button>
          </div>
          </div>
        </div>
      )}

      {!editId && (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="bg-gray-100 px-4 sm:px-6 py-3 border-b">
          <h2 className="text-base font-bold text-gray-800">Umpire List</h2>
        </div>
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="py-8 text-center text-gray-400">Loading umpires...</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-700 font-bold text-sm">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3">City</th>
                      <th className="pb-3">Rating</th>
                      <th className="pb-3">Matches</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {umpireList.map((u: any) => {
                      const uid = u.id || u.umpireId;
                      return (
                        <tr key={uid} className={`border-b last:border-b-0 hover:bg-gray-50 ${editId === uid ? 'bg-blue-50' : ''}`}>
                          <td className="py-3 font-medium">{u.umpireName || u.name || '-'}</td>
                          <td className="py-3">{u.email || '-'}</td>
                          <td className="py-3">{u.mobile || u.contactNumber ? `${u.countryCode || ''} ${u.mobile || u.contactNumber}` : '-'}</td>
                          <td className="py-3">{u.city || '-'}</td>
                          <td className="py-3">{u.rating != null ? `${'⭐'.repeat(Math.round(u.rating))} (${Number(u.rating).toFixed(1)})` : '-'}</td>
                          <td className="py-3">{u.totalMatches ?? '-'}</td>
                          <td className="py-3 space-x-2">
                            <button onClick={() => handleEdit(u)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                            <button onClick={() => setDeleteConfirmId(uid)} disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                          </td>
                        </tr>
                      );
                    })}
                    {(!umpireList.length) && (
                      <tr><td colSpan={7} className="py-8 text-center text-gray-400">No umpires created yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden space-y-4">
                {umpireList.map((u: any) => {
                  const uid = u.id || u.umpireId;
                  return (
                    <div key={uid} className={`border rounded-lg p-4 ${editId === uid ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-800">{u.umpireName || u.name || '-'}</h3>
                        <div className="space-x-2">
                          <button onClick={() => handleEdit(u)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                          <button onClick={() => setDeleteConfirmId(uid)} disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div><span className="text-gray-400">Email:</span> {u.email || '-'}</div>
                        <div><span className="text-gray-400">Phone:</span> {u.mobile || u.contactNumber || '-'}</div>
                        <div><span className="text-gray-400">City:</span> {u.city || '-'}</div>
                        <div><span className="text-gray-400">Rating:</span> {u.rating != null ? Number(u.rating).toFixed(1) : '-'}</div>
                        <div><span className="text-gray-400">Matches:</span> {u.totalMatches ?? '-'}</div>
                      </div>
                    </div>
                  );
                })}
                {(!umpireList.length) && (
                  <div className="py-8 text-center text-gray-400">No umpires created yet.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Delete Umpire?</h3>
              <p className="text-xs text-gray-500 mb-4">Are you sure you want to delete? This action cannot be undone.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">Cancel</button>
                <button onClick={() => { deleteMutation.mutate(deleteConfirmId); setDeleteConfirmId(null); }} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors text-sm">
                  {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <h3 className="text-base font-bold text-gray-800 mb-1">Discard Changes?</h3>
              <p className="text-xs text-gray-500 mb-4">Are you sure you want to cancel? Any unsaved changes will be lost.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">No, Keep Editing</button>
                <button onClick={confirmCancel} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors text-sm">Yes, Discard</button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

// ── CREATE GROUND TAB ──
function CreateGroundTab({ onCreated, onClose }: { onCreated?: () => void; onClose?: () => void }) {
  const [name, setName] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<{ id: string; name: string; logoUrl?: string } | null>(null);
  const [homeTeamSearch, setHomeTeamSearch] = useState('');
  const [showHomeTeamDropdown, setShowHomeTeamDropdown] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // Location cascading dropdown state
  const [countryList, setCountryList] = useState<string[]>([]);
  const [stateList, setStateList] = useState<string[]>([]);
  const [cityList, setCityList] = useState<string[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [countrySearchText, setCountrySearchText] = useState('');
  const [stateSearchText, setStateSearchText] = useState('');
  const [citySearchText, setCitySearchText] = useState('');

  useEffect(() => {
    setCountriesLoading(true);
    fetchCountries().then(setCountryList).catch(() => setCountryList([])).finally(() => setCountriesLoading(false));
  }, []);

  useEffect(() => {
    if (!country) { setStateList([]); setCityList([]); return; }
    setStatesLoading(true);
    fetchStates(country).then(setStateList).catch(() => setStateList([])).finally(() => setStatesLoading(false));
  }, [country]);

  useEffect(() => {
    if (!country || !state) { setCityList([]); return; }
    setCitiesLoading(true);
    fetchCities(country, state).then(setCityList).catch(() => setCityList([])).finally(() => setCitiesLoading(false));
  }, [country, state]);

  // Fetch user's boards/teams for home team dropdown
  const { data: boardsList, isLoading: boardsLoading } = useQuery({
    queryKey: ['boardsByOwner', user?.id],
    queryFn: async () => {
      try {
        const stored = sessionStorage.getItem('recentBoards');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((b: any) => ({
              id: b.id || b.Id || b.boardId || '',
              name: b.name || b.boardName || b.Name || '',
              logoUrl: b.logoUrl || '',
            }));
          }
        }
      } catch {}
      const [ownerRes, coOwnerRes] = await Promise.all([
        boardService.getByOwner(user?.id).catch(() => ({ data: null })),
        boardService.getByOwner(undefined, user?.id).catch(() => ({ data: null })),
      ]);
      const extract = (raw: any): any[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (raw?.items) return raw.items;
        if (raw?.data?.items) return raw.data.items;
        if (Array.isArray(raw?.data)) return raw.data;
        if (Array.isArray(raw?.result)) return raw.result;
        return [];
      };
      const seen = new Set<string>();
      const merged: any[] = [];
      for (const b of [...extract(ownerRes.data), ...extract(coOwnerRes.data)]) {
        const id = b.id || b.Id || b.boardId || '';
        if (id && !seen.has(id)) { seen.add(id); merged.push({ id, name: b.name || b.boardName || '', logoUrl: b.logoUrl || '' }); }
      }
      return merged;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const teamList = Array.isArray(boardsList) ? boardsList : [];
  const filteredTeams = teamList.filter((b: any) => {
    const q = homeTeamSearch.toLowerCase();
    return !q || b.name?.toLowerCase().includes(q);
  });

  const resetForm = () => {
    setName(''); setAddress1(''); setAddress2('');
    setCity(''); setState(''); setCountry(''); setZipCode('');
    setLandmark(''); setHomeTeam(''); setSelectedHomeTeam(null); setHomeTeamSearch('');
  };

  const createMutation = useMutation({
    mutationFn: () => leagueService.createGround({
      groundName: name,
      address1: address1,
      address2: address2,
      city: city,
      state: state,
      country: country,
      zipcode: zipCode,
      landmark: landmark,
      homeTeam: homeTeam,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grounds'] });
      resetForm();
      setSuccessMsg('Ground created successfully!');
      setErrorMsg('');
      setTimeout(() => {
        setSuccessMsg('');
        onCreated?.();
        onClose?.();
      }, 1500);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to create ground. Please try again.');
      setSuccessMsg('');
    },
  });

  const handleSubmit = () => {
    setErrorMsg('');
    if (!name || !city || !state || !country) {
      setErrorMsg('Please fill in all mandatory fields: Ground Name, City, State, Country.');
      return;
    }
    createMutation.mutate();
  };

  const hasAnyData = () => name.trim() || address1.trim() || address2.trim() || city.trim() || state.trim() || country.trim() || zipCode.trim() || landmark.trim() || homeTeam.trim();

  const handleCancel = () => {
    if (hasAnyData()) { setShowCancelConfirm(true); return; }
    if (onClose) onClose();
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    resetForm();
    setErrorMsg('');
    setSuccessMsg('');
    if (onClose) onClose();
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="bg-gray-100 px-6 py-3 border-b">
          <h2 className="text-base font-bold text-gray-800">Create Ground</h2>
        </div>
        <div className="p-6">
          {successMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{successMsg}</div>}
          {errorMsg && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{errorMsg}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            {/* Row 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ground Name <span className="text-red-500">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input value={address1} onChange={e => setAddress1(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input value={address2} onChange={e => setAddress2(e.target.value)} className="input-field" />
            </div>

            {/* Row 2: Country → State → City cascading dropdowns */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
              {countryDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCountryDropdownOpen(false); setCountrySearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between ${countriesLoading ? 'opacity-50' : ''}`}
                onClick={() => { if (!countriesLoading) setCountryDropdownOpen(!countryDropdownOpen); }}
              >
                <span className={country ? 'text-gray-900' : 'text-gray-400'}>{countriesLoading ? 'Loading countries...' : country || 'Select Country'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {countryDropdownOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <input type="text" value={countrySearchText} onChange={e => setCountrySearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search country..." autoFocus onClick={e => e.stopPropagation()} />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {countryList.filter(c => !countrySearchText || c.toLowerCase().includes(countrySearchText.toLowerCase())).map(c => (
                      <button key={c} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${country === c ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                        onClick={() => { setCountry(c); setState(''); setCity(''); setCountryDropdownOpen(false); setCountrySearchText(''); }}>{c}</button>
                    ))}
                    {countryList.filter(c => !countrySearchText || c.toLowerCase().includes(countrySearchText.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
              {stateDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setStateDropdownOpen(false); setStateSearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between ${!country || statesLoading ? 'pointer-events-none' : ''}`}
                onClick={() => { if (country && !statesLoading) setStateDropdownOpen(!stateDropdownOpen); }}
              >
                <span className={state ? 'text-gray-900' : 'text-gray-400'}>{!country ? 'Select Country first' : statesLoading ? 'Loading states...' : state || 'Select State'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${stateDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {stateDropdownOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <input type="text" value={stateSearchText} onChange={e => setStateSearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search state..." autoFocus onClick={e => e.stopPropagation()} />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {stateList.filter(s => !stateSearchText || s.toLowerCase().includes(stateSearchText.toLowerCase())).map(s => (
                      <button key={s} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${state === s ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                        onClick={() => { setState(s); setCity(''); setStateDropdownOpen(false); setStateSearchText(''); }}>{s}</button>
                    ))}
                    {stateList.filter(s => !stateSearchText || s.toLowerCase().includes(stateSearchText.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
              {cityDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCityDropdownOpen(false); setCitySearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between ${!state || citiesLoading ? 'pointer-events-none' : ''}`}
                onClick={() => { if (state && !citiesLoading) setCityDropdownOpen(!cityDropdownOpen); }}
              >
                <span className={city ? 'text-gray-900' : 'text-gray-400'}>{!state ? 'Select State first' : citiesLoading ? 'Loading...' : city || 'Select City'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {cityDropdownOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <input type="text" value={citySearchText} onChange={e => setCitySearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search city..." autoFocus onClick={e => e.stopPropagation()} />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {cityList.filter(c => !citySearchText || c.toLowerCase().includes(citySearchText.toLowerCase())).map(c => (
                      <button key={c} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${city === c ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                        onClick={() => { setCity(c); setCityDropdownOpen(false); setCitySearchText(''); }}>{c}</button>
                    ))}
                    {cityList.filter(c => !citySearchText || c.toLowerCase().includes(citySearchText.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Row 3 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
              <input value={zipCode} maxLength={6} onChange={e => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
              <input value={landmark} onChange={e => setLandmark(e.target.value)} className="input-field" />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Home Team for the Ground</label>
              {selectedHomeTeam ? (
                <div className="flex items-center gap-2 input-field bg-gray-50">
                  <div className="w-6 h-6 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-xs">
                    {selectedHomeTeam.logoUrl
                      ? <img src={selectedHomeTeam.logoUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                      : selectedHomeTeam.name?.[0]?.toUpperCase() || '?'
                    }
                  </div>
                  <span className="flex-1 text-sm truncate">{selectedHomeTeam.name}</span>
                  <button type="button" onClick={() => { setSelectedHomeTeam(null); setHomeTeam(''); setHomeTeamSearch(''); }} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
                </div>
              ) : (
                <>
                  {showHomeTeamDropdown && (
                    <div className="fixed inset-0 z-[5]" onClick={() => { setShowHomeTeamDropdown(false); setHomeTeamSearch(''); }} />
                  )}
                  <div
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between"
                    onClick={() => setShowHomeTeamDropdown(!showHomeTeamDropdown)}
                  >
                    <span className="text-gray-400 text-sm">Select Team</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${showHomeTeamDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {showHomeTeamDropdown && (
                    <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl" style={{ top: '100%' }}>
                      <div className="p-2 border-b border-gray-100">
                        <input
                          type="text"
                          value={homeTeamSearch}
                          onChange={e => setHomeTeamSearch(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent"
                          placeholder="Search teams..."
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {boardsLoading ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading teams...</div>
                        ) : filteredTeams.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">No teams found</div>
                        ) : (
                          filteredTeams.map((b: any) => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => { setSelectedHomeTeam(b); setHomeTeam(b.name); setShowHomeTeamDropdown(false); setHomeTeamSearch(''); }}
                              className="w-full text-left px-4 py-2 hover:bg-brand-green/5 flex items-center gap-2 text-sm border-b last:border-0"
                            >
                              <div className="w-7 h-7 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-xs">
                                {b.logoUrl
                                  ? <img src={b.logoUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                                  : b.name?.[0]?.toUpperCase() || '?'
                                }
                              </div>
                              <span className="font-medium text-gray-900">{b.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded text-sm font-semibold hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !name.trim() || !city.trim() || !state.trim() || !country.trim()}
              className="px-8 py-2 bg-green-700 text-white rounded text-sm font-semibold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Discard Changes?</h3>
              <p className="text-xs text-gray-500 mb-4">You have unsaved changes. Are you sure you want to discard them?</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">No, Keep Editing</button>
                <button onClick={confirmCancel} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors text-sm">Yes, Discard</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── GROUND LIST TAB ──
function GroundListTab() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress1, setEditAddress1] = useState('');
  const [editAddress2, setEditAddress2] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editZipcode, setEditZipcode] = useState('');
  const [editLandmark, setEditLandmark] = useState('');
  const [editHomeTeam, setEditHomeTeam] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [editOriginal, setEditOriginal] = useState<any>(null);

  // Location cascading dropdown state for edit form
  const [countryList, setCountryList] = useState<string[]>([]);
  const [stateList, setStateList] = useState<string[]>([]);
  const [cityList, setCityList] = useState<string[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [countrySearchText, setCountrySearchText] = useState('');
  const [stateSearchText, setStateSearchText] = useState('');
  const [citySearchText, setCitySearchText] = useState('');

  useEffect(() => {
    setCountriesLoading(true);
    fetchCountries().then(setCountryList).catch(() => setCountryList([])).finally(() => setCountriesLoading(false));
  }, []);

  useEffect(() => {
    if (!editCountry) { setStateList([]); setCityList([]); return; }
    setStatesLoading(true);
    fetchStates(editCountry).then(setStateList).catch(() => setStateList([])).finally(() => setStatesLoading(false));
  }, [editCountry]);

  useEffect(() => {
    if (!editCountry || !editState) { setCityList([]); return; }
    setCitiesLoading(true);
    fetchCities(editCountry, editState).then(setCityList).catch(() => setCityList([])).finally(() => setCitiesLoading(false));
  }, [editCountry, editState]);

  const { data: grounds, isLoading } = useQuery({
    queryKey: ['grounds'],
    queryFn: () => leagueService.getGrounds().then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d as any)?.data ?? (d as any)?.items ?? [];
    }),
  });
  const groundList = Array.isArray(grounds) ? grounds : [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leagueService.deleteGround(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grounds'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => leagueService.updateGround(editId!, {
      id: editId!,
      groundId: editId!,
      groundName: editName,
      address1: editAddress1,
      address2: editAddress2,
      city: editCity,
      state: editState,
      country: editCountry,
      zipcode: editZipcode,
      landmark: editLandmark,
      homeTeam: editHomeTeam,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grounds'] });
      setEditId(null);
      setUpdateError('');
      setUpdateSuccess('Ground updated successfully!');
      setTimeout(() => setUpdateSuccess(''), 4000);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.response?.data?.title || error?.message || 'Failed to update ground.';
      setUpdateError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const handleEdit = (g: any) => {
    setEditId(g.id || g.groundId);
    setEditName(g.groundName || '');
    setEditAddress1(g.address1 || '');
    setEditAddress2(g.address2 || '');
    setEditCity(g.city || '');
    setEditState(g.state || '');
    setEditCountry(g.country || '');
    setEditZipcode(g.zipcode || '');
    setEditLandmark(g.landmark || '');
    setEditHomeTeam(g.homeTeam || '');
    setEditOriginal({ name: g.groundName || '', address1: g.address1 || '', address2: g.address2 || '', city: g.city || '', state: g.state || '', country: g.country || '', zipcode: g.zipcode || '', landmark: g.landmark || '', homeTeam: g.homeTeam || '' });
    setUpdateError('');
    setUpdateSuccess('');
  };

  const cancelEdit = () => {
    const hasChanges = editOriginal && (editName !== editOriginal.name || editAddress1 !== editOriginal.address1 || editAddress2 !== editOriginal.address2 || editCity !== editOriginal.city || editState !== editOriginal.state || editCountry !== editOriginal.country || editZipcode !== editOriginal.zipcode || editLandmark !== editOriginal.landmark || editHomeTeam !== editOriginal.homeTeam);
    if (hasChanges) { setShowCancelConfirm(true); return; }
    setEditId(null);
    setUpdateError('');
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    setEditId(null);
    setUpdateError('');
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Grounds</h2>
        {!showCreate && !editId && (
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-4">
            + Create Ground
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-6">
          <CreateGroundTab onClose={() => setShowCreate(false)} />
        </div>
      )}

      {!showCreate && (
        <>
      {updateSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{updateSuccess}</div>}

      {/* Edit form */}
      {editId && (
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="bg-gray-100 px-6 py-3 border-b">
            <h2 className="text-base font-bold text-gray-800">Edit Ground</h2>
          </div>
          <div className="p-6">
          {updateError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{updateError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            {/* Row 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ground Name <span className="text-red-500">*</span></label>
              <input value={editName} onChange={e => setEditName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input value={editAddress1} onChange={e => setEditAddress1(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input value={editAddress2} onChange={e => setEditAddress2(e.target.value)} className="input-field" />
            </div>

            {/* Row 2: Country → State → City */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              {countryDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCountryDropdownOpen(false); setCountrySearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between ${countriesLoading ? 'opacity-50' : ''}`}
                onClick={() => { if (!countriesLoading) setCountryDropdownOpen(!countryDropdownOpen); }}
              >
                <span className={editCountry ? 'text-gray-900' : 'text-gray-400'}>{countriesLoading ? 'Loading countries...' : editCountry || 'Select Country'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {countryDropdownOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <input type="text" value={countrySearchText} onChange={e => setCountrySearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search country..." autoFocus onClick={e => e.stopPropagation()} />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {countryList.filter(c => !countrySearchText || c.toLowerCase().includes(countrySearchText.toLowerCase())).map(c => (
                      <button key={c} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${editCountry === c ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                        onClick={() => { setEditCountry(c); setEditState(''); setEditCity(''); setCountryDropdownOpen(false); setCountrySearchText(''); }}>{c}</button>
                    ))}
                    {countryList.filter(c => !countrySearchText || c.toLowerCase().includes(countrySearchText.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              {stateDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setStateDropdownOpen(false); setStateSearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between ${!editCountry || statesLoading ? 'pointer-events-none' : ''}`}
                onClick={() => { if (editCountry && !statesLoading) setStateDropdownOpen(!stateDropdownOpen); }}
              >
                <span className={editState ? 'text-gray-900' : 'text-gray-400'}>{!editCountry ? 'Select Country first' : statesLoading ? 'Loading states...' : editState || 'Select State'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${stateDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {stateDropdownOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <input type="text" value={stateSearchText} onChange={e => setStateSearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search state..." autoFocus onClick={e => e.stopPropagation()} />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {stateList.filter(s => !stateSearchText || s.toLowerCase().includes(stateSearchText.toLowerCase())).map(s => (
                      <button key={s} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${editState === s ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                        onClick={() => { setEditState(s); setEditCity(''); setStateDropdownOpen(false); setStateSearchText(''); }}>{s}</button>
                    ))}
                    {stateList.filter(s => !stateSearchText || s.toLowerCase().includes(stateSearchText.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              {cityDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCityDropdownOpen(false); setCitySearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between ${!editState || citiesLoading ? 'pointer-events-none' : ''}`}
                onClick={() => { if (editState && !citiesLoading) setCityDropdownOpen(!cityDropdownOpen); }}
              >
                <span className={editCity ? 'text-gray-900' : 'text-gray-400'}>{!editState ? 'Select State first' : citiesLoading ? 'Loading...' : editCity || 'Select City'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {cityDropdownOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <input type="text" value={citySearchText} onChange={e => setCitySearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search city..." autoFocus onClick={e => e.stopPropagation()} />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {cityList.filter(c => !citySearchText || c.toLowerCase().includes(citySearchText.toLowerCase())).map(c => (
                      <button key={c} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${editCity === c ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                        onClick={() => { setEditCity(c); setCityDropdownOpen(false); setCitySearchText(''); }}>{c}</button>
                    ))}
                    {cityList.filter(c => !citySearchText || c.toLowerCase().includes(citySearchText.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zipcode</label>
              <input value={editZipcode} maxLength={6} onChange={e => setEditZipcode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
              <input value={editLandmark} onChange={e => setEditLandmark(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Home Team for the Ground</label>
              <input value={editHomeTeam} onChange={e => setEditHomeTeam(e.target.value)} className="input-field" />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={cancelEdit} className="px-6 py-2 bg-gray-300 text-gray-700 rounded text-sm font-semibold hover:bg-gray-400 transition-colors">Cancel</button>
            <button onClick={() => updateMutation.mutate()} disabled={!editName.trim() || !editCity.trim() || !editState.trim() || !editCountry.trim() || updateMutation.isPending} className="px-8 py-2 bg-green-700 text-white rounded text-sm font-semibold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </button>
          </div>
          </div>
        </div>
      )}

      {!editId && (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="bg-gray-100 px-4 sm:px-6 py-3 border-b">
          <h2 className="text-base font-bold text-gray-800">Ground List</h2>
        </div>
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="py-8 text-center text-gray-400">Loading grounds...</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-700 font-bold text-sm">
                      <th className="pb-3">Ground Name</th>
                      <th className="pb-3">City</th>
                      <th className="pb-3">State</th>
                      <th className="pb-3">Country</th>
                      <th className="pb-3">Address</th>
                      <th className="pb-3">Home Team</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groundList.map((g: any) => {
                      const gid = g.id || g.groundId;
                      return (
                        <tr key={gid} className={`border-b last:border-b-0 hover:bg-gray-50 ${editId === gid ? 'bg-blue-50' : ''}`}>
                          <td className="py-3 font-medium">{g.groundName || '-'}</td>
                          <td className="py-3">{g.city || '-'}</td>
                          <td className="py-3">{g.state || '-'}</td>
                          <td className="py-3">{g.country || '-'}</td>
                          <td className="py-3 text-xs">{g.address1 || '-'}</td>
                          <td className="py-3">{g.homeTeam || '-'}</td>
                          <td className="py-3 space-x-2">
                            <button onClick={() => handleEdit(g)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                            <button onClick={() => setDeleteConfirmId(gid)} disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                          </td>
                        </tr>
                      );
                    })}
                    {(!groundList.length) && (
                      <tr><td colSpan={7} className="py-8 text-center text-gray-400">No grounds created yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden space-y-4">
                {groundList.map((g: any) => {
                  const gid = g.id || g.groundId;
                  return (
                    <div key={gid} className={`border rounded-lg p-4 ${editId === gid ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🏟️</span>
                          <h3 className="font-medium text-gray-800">{g.groundName || '-'}</h3>
                        </div>
                        <div className="space-x-2">
                          <button onClick={() => handleEdit(g)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                          <button onClick={() => setDeleteConfirmId(gid)} disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                        </div>
                      </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div><span className="text-gray-400">City:</span> {g.city || '-'}</div>
                      <div><span className="text-gray-400">State:</span> {g.state || '-'}</div>
                      <div><span className="text-gray-400">Country:</span> {g.country || '-'}</div>
                      <div><span className="text-gray-400">Address:</span> {g.address1 || '-'}</div>
                      <div><span className="text-gray-400">Home Team:</span> {g.homeTeam || '-'}</div>
                    </div>
                  </div>
                  );
                })}
                {(!groundList.length) && (
                  <div className="py-8 text-center text-gray-400">No grounds created yet.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Delete Ground?</h3>
              <p className="text-xs text-gray-500 mb-4">Are you sure you want to delete? This action cannot be undone.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">Cancel</button>
                <button onClick={() => { deleteMutation.mutate(deleteConfirmId); setDeleteConfirmId(null); }} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors text-sm">
                  {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <h3 className="text-base font-bold text-gray-800 mb-1">Discard Changes?</h3>
              <p className="text-xs text-gray-500 mb-4">Are you sure you want to cancel? Any unsaved changes will be lost.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">No, Keep Editing</button>
                <button onClick={confirmCancel} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors text-sm">Yes, Discard</button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

// ── CREATE TROPHY TAB ──
interface TrophyGroup {
  name: string;
  teamIds: string[];
}

function CreateTrophyTab({ boardId, onClose }: { boardId: string; onClose?: () => void }) {
  const [name, setName] = useState('');
  const [winPoints, setWinPoints] = useState('2');
  const [umpireOption, setUmpireOption] = useState<'list' | 'buddy'>('list');
  const [groups, setGroups] = useState<TrophyGroup[]>([{ name: 'group A', teamIds: [] }]);
  const [teamSearches, setTeamSearches] = useState<string[]>(['']);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // Load boards from sessionStorage (stored by Dashboard) + API fallback
  const { data: boardsList, isLoading: boardsLoading, refetch: refetchBoards } = useQuery({
    queryKey: ['boardsByOwner', user?.id],
    queryFn: async () => {
      // 1. Try sessionStorage first (same cache Dashboard uses)
      try {
        const stored = sessionStorage.getItem('recentBoards');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((b: any) => ({
              id: b.id || b.Id || b.boardId || '',
              name: b.name || b.boardName || b.Name || '',
              logoUrl: b.logoUrl || '',
              description: b.description || b.city || '',
            }));
          }
        }
      } catch {}

      // 2. Fallback: fetch from API
      const [ownerRes, coOwnerRes] = await Promise.all([
        boardService.getByOwner(user?.id).catch(() => ({ data: null })),
        boardService.getByOwner(undefined, user?.id).catch(() => ({ data: null })),
      ]);
      const extract = (raw: any): any[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (raw?.items) return raw.items;
        if (raw?.data?.items) return raw.data.items;
        if (Array.isArray(raw?.data)) return raw.data;
        if (Array.isArray(raw?.result)) return raw.result;
        return [];
      };
      const ownerItems = extract(ownerRes.data);
      const coOwnerItems = extract(coOwnerRes.data);
      const seen = new Set<string>();
      const merged: any[] = [];
      for (const b of [...ownerItems, ...coOwnerItems]) {
        const id = b.id || b.Id || b.boardId || '';
        if (id && !seen.has(id)) {
          seen.add(id);
          merged.push({
            id,
            name: b.name || b.boardName || b.Name || '',
            logoUrl: b.logoUrl || '',
            description: b.description || b.city || '',
          });
        }
      }
      return merged;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: () => tournamentService.createTournament({
      tournamentName: name,
      winPoint: Number(winPoints) || 0,
      umpireCheck: umpireOption === 'list' ? 1 : 0,
      active: 1,
      scheduleCoordinator: true,
      matchType: 'league',
      groupList: groups.map(g => ({
        id: crypto.randomUUID(),
        tournamentGroupName: g.name,
        active: 1,
        teamBoardId: g.teamIds,
      })),
      createdBy: user?.id ?? '',
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournaments', boardId] });
      qc.invalidateQueries({ queryKey: ['umpireTournaments'] });
      setName(''); setWinPoints('2'); setGroups([{ name: 'group A', teamIds: [] }]); setTeamSearches(['']);
      setSuccessMsg('Tournament created successfully!');
      setErrorMsg('');
      setTimeout(() => { setSuccessMsg(''); if (onClose) onClose(); }, 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to create tournament. Please try again.');
      setSuccessMsg('');
    },
  });

  const addGroup = () => {
    const letter = String.fromCharCode(65 + groups.length);
    setGroups([...groups, { name: `group ${letter}`, teamIds: [] }]);
    setTeamSearches([...teamSearches, '']);
  };

  const removeGroup = (idx: number) => {
    setGroups(groups.filter((_, i) => i !== idx));
    setTeamSearches(teamSearches.filter((_, i) => i !== idx));
  };

  const updateGroupName = (idx: number, val: string) => {
    const updated = [...groups];
    updated[idx] = { ...updated[idx], name: val };
    setGroups(updated);
  };

  const addTeamToGroup = (groupIdx: number, teamId: string) => {
    const updated = [...groups];
    if (!updated[groupIdx].teamIds.includes(teamId)) {
      updated[groupIdx] = { ...updated[groupIdx], teamIds: [...updated[groupIdx].teamIds, teamId] };
      setGroups(updated);
    }
    const searches = [...teamSearches];
    searches[groupIdx] = '';
    setTeamSearches(searches);
  };

  const removeTeamFromGroup = (groupIdx: number, teamId: string) => {
    const updated = [...groups];
    updated[groupIdx] = { ...updated[groupIdx], teamIds: updated[groupIdx].teamIds.filter(t => t !== teamId) };
    setGroups(updated);
  };

  const getFilteredBoards = (groupIdx: number) => {
    const search = teamSearches[groupIdx]?.toLowerCase() || '';
    const alreadySelected = groups[groupIdx].teamIds;
    return (boardsList || []).filter((b: any) =>
      !alreadySelected.includes(b.id) &&
      (!search || b.name.toLowerCase().includes(search))
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="bg-gray-100 px-6 py-3 border-b">
          <h2 className="text-base font-bold text-gray-800">Group Tournament</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Tournament Name + Win Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Create Tournament <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Win Points for the Match <span className="text-red-500">*</span>
              </label>
              <select
                value={winPoints}
                onChange={e => setWinPoints(e.target.value)}
                className="input-field"
              >
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <option key={n} value={String(n)}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Groups */}
          <div className="space-y-4">
            {groups.map((group, gIdx) => (
              <div key={gIdx} className="border-2 border-red-500 rounded-lg overflow-hidden">
                <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between">
                  <span className="font-bold text-sm uppercase">Group {String.fromCharCode(65 + gIdx)}</span>
                  <div className="flex items-center gap-2">
                    {groups.length > 1 && (
                      <button onClick={() => removeGroup(gIdx)} className="text-white hover:text-red-200 text-lg" title="Remove group">🗑️</button>
                    )}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={group.name}
                      onChange={e => updateGroupName(gIdx, e.target.value)}
                      className="input-field max-w-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Board <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3 items-start">
                      <div className="relative flex-1 max-w-xs">
                        {openDropdown === gIdx && (
                          <div className="fixed inset-0 z-[5]" onClick={() => { setOpenDropdown(null); const s = [...teamSearches]; s[gIdx] = ''; setTeamSearches(s); }} />
                        )}
                        <div
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between"
                          onClick={() => {
                            setOpenDropdown(prev => prev === gIdx ? null : gIdx);
                            refetchBoards();
                          }}
                        >
                          <span className="text-gray-400 text-sm">Select Team</span>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === gIdx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        {openDropdown === gIdx && (
                          <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl" style={{ top: '100%' }}>
                            <div className="p-2 border-b border-gray-100">
                              <input
                                type="text"
                                value={teamSearches[gIdx] || ''}
                                onChange={e => {
                                  const searches = [...teamSearches];
                                  searches[gIdx] = e.target.value;
                                  setTeamSearches(searches);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent"
                                placeholder="Search boards..."
                                autoFocus
                                onClick={e => e.stopPropagation()}
                              />
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                              {boardsLoading ? (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading boards...</div>
                              ) : (() => {
                                const filtered = getFilteredBoards(gIdx);
                                return filtered.length === 0 ? (
                                  <div className="px-4 py-3 text-sm text-gray-500 text-center">No boards found</div>
                                ) : (
                                  filtered.map((b: any) => (
                                    <button
                                      key={b.id}
                                      onClick={() => {
                                        addTeamToGroup(gIdx, b.id);
                                        setOpenDropdown(null);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-brand-green/5 flex items-center gap-2 text-sm border-b last:border-0"
                                    >
                                      <div className="w-7 h-7 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-xs">
                                        {b.logoUrl
                                          ? <img src={b.logoUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                                          : b.name?.[0]?.toUpperCase() || '?'
                                        }
                                      </div>
                                      <div className="min-w-0">
                                        <span className="block font-medium text-gray-900">{b.name}</span>
                                        {b.description && <span className="block text-xs text-gray-600 truncate">{b.description}</span>}
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
                        onClick={() => {
                          setOpenDropdown(prev => prev === gIdx ? null : gIdx);
                          refetchBoards();
                        }}
                        className="px-6 py-2 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {group.teamIds.length > 0 && (
                    <div className="space-y-2">
                      {group.teamIds.map(tid => {
                        const board = boardsList?.find((b: any) => b.id === tid);
                        return (
                          <div key={tid} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                            <div className="flex items-center gap-3">
                              {board?.logoUrl
                                ? <img src={board.logoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                                : <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm">🏏</div>
                              }
                              <span className="text-sm font-medium">{board?.name || tid}</span>
                            </div>
                            <button onClick={() => removeTeamFromGroup(gIdx, tid)} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={addGroup}
              className="px-6 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              + Add Group
            </button>
          </div>

          {/* Action Buttons */}
          {successMsg && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{successMsg}</div>}
          {errorMsg && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{errorMsg}</div>}
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => {
                const hasData = name.trim() || winPoints !== '2' || groups.some(g => g.name.trim() !== 'group A' || g.teamIds.length > 0) || groups.length > 1;
                if (hasData) { setShowCancelConfirm(true); return; }
                if (onClose) onClose();
              }}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded text-sm font-semibold hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setErrorMsg('');
                if (!name.trim()) { setErrorMsg('Tournament Name is mandatory.'); return; }
                if (groups.length === 0) { setErrorMsg('At least one group is required.'); return; }
                for (let i = 0; i < groups.length; i++) {
                  if (!groups[i].name.trim()) { setErrorMsg(`Group ${String.fromCharCode(65 + i)} must have a name.`); return; }
                  if (groups[i].teamIds.length === 0) { setErrorMsg(`Group ${String.fromCharCode(65 + i)} must have at least one team.`); return; }
                }
                createMutation.mutate();
              }}
              disabled={createMutation.isPending || !name.trim() || !winPoints.trim() || groups.length === 0 || groups.some(g => !g.name.trim() || g.teamIds.length === 0)}
              className="px-6 py-2 bg-green-700 text-white rounded text-sm font-semibold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>


        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Discard Changes?</h3>
              <p className="text-xs text-gray-500 mb-4">You have unsaved changes. Are you sure you want to discard them?</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">No, Keep Editing</button>
                <button onClick={() => { setShowCancelConfirm(false); setName(''); setWinPoints('2'); setGroups([{ name: 'group A', teamIds: [] }]); setTeamSearches(['']); setErrorMsg(''); setSuccessMsg(''); if (onClose) onClose(); }} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors text-sm">Yes, Discard</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CANCEL GAME BY DATE TAB ──
function CancelGameTab({ boardId }: { boardId: string }) {
  const today = new Date();
  const [from, setFrom] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0]);
  const qc = useQueryClient();
  const bulkCancelMutation = useMutation({
    mutationFn: () => leagueService.cancelGames(boardId, from, to),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule', boardId] }),
  });

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="bg-gray-100 px-6 py-3 border-b">
          <h2 className="text-base font-bold text-gray-800">Cancel Game by Date</h2>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">From</label><input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">To</label><input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-field" /></div>
            <button onClick={() => bulkCancelMutation.mutate()} disabled={bulkCancelMutation.isPending || !from || !to}
              className="px-6 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {bulkCancelMutation.isPending ? 'Cancelling...' : 'Cancel Games'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TOURNAMENTS TAB ──
function TournamentsTab({ boardId }: { boardId: string }) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editOriginal, setEditOriginal] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editWinPoint, setEditWinPoint] = useState('2');
  const [editUmpireCheck, setEditUmpireCheck] = useState<number>(1);
  const [editMatchType, setEditMatchType] = useState('league');
  const [editGroups, setEditGroups] = useState<{ id: string; tournamentGroupName: string; active: number; teamBoardId: string[] }[]>([]);
  const [editGroupSearches, setEditGroupSearches] = useState<string[]>([]);
  const [editOpenDropdown, setEditOpenDropdown] = useState<number | null>(null);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Fetch tournaments from GET /api/v{version}/Tournament (umpireApi)
  const { data: tournaments, isLoading } = useQuery({
    queryKey: ['umpireTournaments'],
    queryFn: async () => {
      const r = await tournamentService.getTournaments(1, 100);
      const d = r.data as any;
      const list = Array.isArray(d) ? d : d?.items ?? d?.data ?? [];
      return list;
    },
  });
  const tournamentList = Array.isArray(tournaments) ? tournaments : [];

  // Fetch boards for edit dropdown (same as CreateTrophyTab)
  const { data: boardsList, isLoading: boardsLoading, refetch: refetchBoards } = useQuery({
    queryKey: ['boardsByOwner', user?.id],
    queryFn: async () => {
      try {
        const stored = sessionStorage.getItem('recentBoards');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((b: any) => ({
              id: b.id || b.Id || b.boardId || '',
              name: b.name || b.boardName || b.Name || '',
              logoUrl: b.logoUrl || '',
            }));
          }
        }
      } catch {}
      const [ownerRes, coOwnerRes] = await Promise.all([
        boardService.getByOwner(user?.id).catch(() => ({ data: null })),
        boardService.getByOwner(undefined, user?.id).catch(() => ({ data: null })),
      ]);
      const extract = (raw: any): any[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (raw?.items) return raw.items;
        if (raw?.data?.items) return raw.data.items;
        if (Array.isArray(raw?.data)) return raw.data;
        return [];
      };
      const seen = new Set<string>();
      const merged: any[] = [];
      for (const b of [...extract(ownerRes.data), ...extract(coOwnerRes.data)]) {
        const id = b.id || b.Id || b.boardId || '';
        if (id && !seen.has(id)) { seen.add(id); merged.push({ id, name: b.name || b.boardName || '', logoUrl: b.logoUrl || '' }); }
      }
      return merged;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tournamentService.deleteTournament(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['umpireTournaments'] });
      setUpdateSuccess('Tournament deleted successfully!');
      setTimeout(() => setUpdateSuccess(''), 4000);
    },
    onError: (err: any) => setUpdateError(err?.response?.data?.message || err?.message || 'Failed to delete tournament.'),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      // Build payload with ONLY the fields the PUT API accepts — nothing extra
      const payload = {
        id: editId!,
        tournamentName: editName.trim(),
        winPoint: Number(editWinPoint) || 0,
        umpireCheck: Number(editOriginal?.umpireCheck ?? 0),
        active: Number(editOriginal?.active ?? 0),
        scheduleCoordinator: editOriginal?.scheduleCoordinator ?? true,
        startNode: Number(editOriginal?.startNode ?? 0),
        endNode: Number(editOriginal?.endNode ?? 0),
        recordCount: Number(editOriginal?.recordCount ?? 0),
        matchType: editMatchType || 'league',
        groupList: editGroups.map(g => ({
          id: g.id,
          tournamentGroupName: g.tournamentGroupName,
          active: Number(g.active ?? 0),
          teamBoardId: Array.isArray(g.teamBoardId) ? g.teamBoardId.filter((tid: string) => typeof tid === 'string' && tid.trim()) : [],
        })),
        modifiedBy: user?.id ?? '',
      };
      console.log('[UpdateTournament] PUT payload:', JSON.stringify(payload, null, 2));
      return tournamentService.updateTournament(editId!, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['umpireTournaments'] });
      setEditId(null);
      setUpdateError('');
      setUpdateSuccess('Tournament updated successfully!');
      setTimeout(() => setUpdateSuccess(''), 4000);
    },
    onError: (err: any) => {
      console.error('[UpdateTournament] Error:', err?.response?.status, err?.response?.data);
      const errData = err?.response?.data;
      const msg = typeof errData === 'string' ? errData : errData?.message || errData?.title || errData?.errors ? JSON.stringify(errData.errors) : err?.message || 'Failed to update tournament.';
      setUpdateError(msg);
    },
  });

  const handleEdit = (t: any) => {
    console.log('[EditTournament] Raw GET data:', JSON.stringify(t, null, 2));
    setEditId(t.id);
    setEditOriginal(t);
    setEditName(t.tournamentName || t.name || '');
    setEditWinPoint(String(t.winPoint ?? 2));
    setEditUmpireCheck(Number(t.umpireCheck ?? 1));
    setEditMatchType(t.matchType || 'league');
    const rawGroups = Array.isArray(t.groupList) ? t.groupList : [];
    console.log('[EditTournament] Raw groupList:', JSON.stringify(rawGroups, null, 2));
    const groups = rawGroups.map((g: any) => {
      // Extract teamBoardId robustly: could be string[], object[], single string, or missing
      const rawTeams = g.teamBoardId || g.teamBoardIds || g.teams || [];
      let teamIds: string[] = [];
      if (Array.isArray(rawTeams)) {
        teamIds = rawTeams.map((item: any) => typeof item === 'string' ? item : (item?.id || item?.boardId || '')).filter(Boolean);
      } else if (typeof rawTeams === 'string' && rawTeams) {
        teamIds = [rawTeams];
      }
      return {
        id: g.id || g.groupId || crypto.randomUUID(),
        tournamentGroupName: g.tournamentGroupName || g.groupName || g.name || '',
        active: Number(g.active ?? 1),
        teamBoardId: teamIds,
      };
    });
    setEditGroups(groups);
    setEditGroupSearches(groups.map(() => ''));
    setEditOpenDropdown(null);
    setUpdateError('');
    setUpdateSuccess('');
    refetchBoards();
  };

  const cancelEdit = () => {
    if (editOriginal) {
      const origName = editOriginal.tournamentName || editOriginal.name || '';
      const origWin = String(editOriginal.winPoint ?? 2);
      const origMatch = editOriginal.matchType || 'league';
      if (editName !== origName || editWinPoint !== origWin || editMatchType !== origMatch) {
        setShowCancelConfirm(true);
        return;
      }
    }
    setEditId(null);
    setUpdateError('');
    setEditOpenDropdown(null);
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    setEditId(null);
    setUpdateError('');
    setEditOpenDropdown(null);
  };

  const addBoardToEditGroup = (gIdx: number, boardId: string) => {
    const updated = [...editGroups];
    if (!updated[gIdx].teamBoardId.includes(boardId)) {
      updated[gIdx] = { ...updated[gIdx], teamBoardId: [...updated[gIdx].teamBoardId, boardId] };
      setEditGroups(updated);
    }
    const searches = [...editGroupSearches];
    searches[gIdx] = '';
    setEditGroupSearches(searches);
    setEditOpenDropdown(null);
  };

  const removeBoardFromEditGroup = (gIdx: number, boardId: string) => {
    const updated = [...editGroups];
    updated[gIdx] = { ...updated[gIdx], teamBoardId: updated[gIdx].teamBoardId.filter(id => id !== boardId) };
    setEditGroups(updated);
  };

  const getFilteredBoardsForEdit = (gIdx: number) => {
    const search = editGroupSearches[gIdx]?.toLowerCase() || '';
    const alreadySelected = editGroups[gIdx]?.teamBoardId || [];
    return (boardsList || []).filter((b: any) =>
      !alreadySelected.includes(b.id) &&
      (!search || b.name.toLowerCase().includes(search))
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Tournaments</h2>
        {!showCreate && !editId && (
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-4">
            + Create Tournament
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-6">
          <CreateTrophyTab boardId={boardId} onClose={() => setShowCreate(false)} />
        </div>
      )}

      {!showCreate && (
        <>
      {updateSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{updateSuccess}</div>}

      {/* Edit form */}
      {editId && (
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="bg-gray-100 px-6 py-3 border-b">
            <h2 className="text-base font-bold text-gray-800">Edit Tournament</h2>
          </div>
          <div className="p-6 space-y-6">
          {updateError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{updateError}</div>}

          {/* Tournament Name + Win Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name <span className="text-red-500">*</span></label>
              <input value={editName} onChange={e => setEditName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Win Points for the Match <span className="text-red-500">*</span></label>
              <select value={editWinPoint} onChange={e => setEditWinPoint(e.target.value)} className="input-field">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <option key={n} value={String(n)}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Edit Groups with Team Board dropdowns */}
          <div className="space-y-4">
              {editGroups.map((group, gIdx) => (
                <div key={group.id} className="border-2 border-red-500 rounded-lg overflow-hidden">
                  <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between">
                    <span className="font-bold text-sm uppercase">Group {String.fromCharCode(65 + gIdx)}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Name <span className="text-red-500">*</span></label>
                    <input
                      value={group.tournamentGroupName}
                      onChange={e => {
                        const updated = [...editGroups];
                        updated[gIdx] = { ...updated[gIdx], tournamentGroupName: e.target.value };
                        setEditGroups(updated);
                      }}
                      className="input-field max-w-xs"
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Board <span className="text-red-500">*</span></label>
                  <div className="flex gap-3 items-start">
                    <div className="relative flex-1 max-w-xs">
                      {editOpenDropdown === gIdx && (
                        <div className="fixed inset-0 z-[5]" onClick={() => { setEditOpenDropdown(null); const s = [...editGroupSearches]; s[gIdx] = ''; setEditGroupSearches(s); }} />
                      )}
                      <div
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between"
                        onClick={() => { setEditOpenDropdown(prev => prev === gIdx ? null : gIdx); refetchBoards(); }}
                      >
                        <span className="text-gray-400 text-sm">Select Team</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${editOpenDropdown === gIdx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {editOpenDropdown === gIdx && (
                        <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl" style={{ top: '100%' }}>
                          <div className="p-2 border-b border-gray-100">
                            <input
                              type="text"
                              value={editGroupSearches[gIdx] || ''}
                              onChange={e => { const s = [...editGroupSearches]; s[gIdx] = e.target.value; setEditGroupSearches(s); }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent"
                              placeholder="Search boards..."
                              autoFocus
                              onClick={e => e.stopPropagation()}
                            />
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {boardsLoading ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading boards...</div>
                            ) : (() => {
                              const filtered = getFilteredBoardsForEdit(gIdx);
                              return filtered.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">No boards found</div>
                              ) : (
                                filtered.map((b: any) => (
                                  <button
                                    key={b.id}
                                    onClick={() => addBoardToEditGroup(gIdx, b.id)}
                                    className="w-full text-left px-4 py-2 hover:bg-brand-green/5 flex items-center gap-2 text-sm border-b last:border-0"
                                  >
                                    <div className="w-7 h-7 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-xs">
                                      {b.logoUrl ? <img src={b.logoUrl} alt="" className="w-7 h-7 rounded-full object-cover" /> : b.name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <span className="font-medium text-gray-900">{b.name}</span>
                                  </button>
                                ))
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => { setEditOpenDropdown(prev => prev === gIdx ? null : gIdx); refetchBoards(); }}
                      className="px-6 py-2 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  </div>
                  {group.teamBoardId.length > 0 && (
                    <div className="space-y-2">
                      {group.teamBoardId.map(tid => {
                        const b = boardsList?.find((brd: any) => brd.id === tid);
                        return (
                          <div key={tid} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                            <div className="flex items-center gap-3">
                              {b?.logoUrl
                                ? <img src={b.logoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                                : <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm">🏏</div>
                              }
                              <span className="text-sm font-medium">{b?.name || tid}</span>
                            </div>
                            <button onClick={() => removeBoardFromEditGroup(gIdx, tid)} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>
                </div>
              ))}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={cancelEdit} className="px-6 py-2 bg-gray-300 text-gray-700 rounded text-sm font-semibold hover:bg-gray-400 transition-colors">Cancel</button>
            <button onClick={() => updateMutation.mutate()} disabled={!editName.trim() || !editWinPoint.trim() || updateMutation.isPending} className="px-6 py-2 bg-green-700 text-white rounded text-sm font-semibold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </button>
          </div>
          </div>
        </div>
      )}

      {!editId && (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="bg-gray-100 px-4 sm:px-6 py-3 border-b">
          <h2 className="text-base font-bold text-gray-800">Tournament List</h2>
        </div>
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="py-8 text-center text-gray-400">Loading tournaments...</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-700 font-bold text-sm">
                      <th className="pb-3">Tournament Name</th>
                      <th className="pb-3">Win Points</th>
                      <th className="pb-3">Match Type</th>
                      <th className="pb-3">Groups</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournamentList.map((t: any) => {
                      const tid = t.id;
                      const groupCount = Array.isArray(t.groupList) ? t.groupList.length : 0;
                      return (
                        <tr key={tid} className={`border-b last:border-b-0 hover:bg-gray-50 ${editId === tid ? 'bg-blue-50' : ''}`}>
                          <td className="py-3 font-medium">{t.tournamentName || t.name || '-'}</td>
                          <td className="py-3">{t.winPoint ?? '-'}</td>
                          <td className="py-3">{t.matchType || '-'}</td>
                          <td className="py-3">{groupCount} group{groupCount !== 1 ? 's' : ''}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${t.active === 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {t.active === 0 ? 'Inactive' : 'Active'}
                            </span>
                          </td>
                          <td className="py-3 space-x-2">
                            <button onClick={() => handleEdit(t)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                            <button onClick={() => setDeleteConfirmId(tid)} disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                          </td>
                        </tr>
                      );
                    })}
                    {(!tournamentList.length) && (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400">No tournaments created yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden space-y-4">
                {tournamentList.map((t: any) => {
                  const tid = t.id;
                  const groupCount = Array.isArray(t.groupList) ? t.groupList.length : 0;
                  return (
                    <div key={tid} className={`border rounded-lg p-4 ${editId === tid ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-800">{t.tournamentName || t.name || '-'}</h3>
                        <div className="space-x-2">
                          <button onClick={() => handleEdit(t)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                          <button onClick={() => setDeleteConfirmId(tid)} disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div><span className="text-gray-400">Win Points:</span> {t.winPoint ?? '-'}</div>
                        <div><span className="text-gray-400">Match Type:</span> {t.matchType || '-'}</div>
                        <div><span className="text-gray-400">Groups:</span> {groupCount}</div>
                        <div><span className="text-gray-400">Status:</span> {t.active === 0 ? 'Inactive' : 'Active'}</div>
                      </div>
                    </div>
                  );
                })}
                {(!tournamentList.length) && (
                  <div className="py-8 text-center text-gray-400">No tournaments created yet.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Delete Tournament?</h3>
              <p className="text-xs text-gray-500 mb-4">Are you sure you want to delete? This action cannot be undone.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">Cancel</button>
                <button onClick={() => { deleteMutation.mutate(deleteConfirmId); setDeleteConfirmId(null); }} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors text-sm">
                  {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Discard Changes?</h3>
              <p className="text-xs text-gray-500 mb-4">You have unsaved changes. Are you sure you want to discard them?</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">No, Keep Editing</button>
                <button onClick={confirmCancel} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors text-sm">Yes, Discard</button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

// ── SCHEDULE TAB ──
function ScheduleTab({ boardId }: { boardId: string }) {
  const today = new Date();
  const user = useAuthStore((s) => s.user);
  const pad = (n: number) => String(n).padStart(2, '0');
  const [from, setFrom] = useState(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`);
  const [to, setTo] = useState(() => { const last = new Date(today.getFullYear(), today.getMonth() + 2, 0); return `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`; });
  const [editMatchId, setEditMatchId] = useState<string | null>(null);
  const [editTournamentId, setEditTournamentId] = useState('');
  const [editGameType, setEditGameType] = useState('');
  const [editHomeTeamId, setEditHomeTeamId] = useState('');
  const [editAwayTeamId, setEditAwayTeamId] = useState('');
  const [editGround, setEditGround] = useState('');
  const [editUmpire, setEditUmpire] = useState('');
  const [editAppScorer, setEditAppScorer] = useState('');
  const [editPortalScorer, setEditPortalScorer] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editError, setEditError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [editOriginal, setEditOriginal] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateCancelConfirm, setShowCreateCancelConfirm] = useState(false);
  const [newTournamentId, setNewTournamentId] = useState('');
  const [newHomeTeamId, setNewHomeTeamId] = useState('');
  const [newAwayTeamId, setNewAwayTeamId] = useState('');
  const [newGroundId, setNewGroundId] = useState('');
  const [newUmpireId, setNewUmpireId] = useState('');
  const [newAppScorerId, setNewAppScorerId] = useState('');
  const [newPortalScorerId, setNewPortalScorerId] = useState('');
  const [newScheduledAt, setNewScheduledAt] = useState('');
  const [newGameType, setNewGameType] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // User search state for Umpire, App Scorer, Portal Scorer
  const [umpireSearch, setUmpireSearch] = useState('');
  const [appScorerSearch, setAppScorerSearch] = useState('');
  const [portalScorerSearch, setPortalScorerSearch] = useState('');
  const [showUmpireDropdown, setShowUmpireDropdown] = useState(false);
  const [showAppScorerDropdown, setShowAppScorerDropdown] = useState(false);
  const [showPortalScorerDropdown, setShowPortalScorerDropdown] = useState(false);
  const [selectedUmpire, setSelectedUmpire] = useState<{ id: string; name: string; email?: string } | null>(null);
  const [selectedAppScorer, setSelectedAppScorer] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);
  const [selectedPortalScorer, setSelectedPortalScorer] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);

  // Team board search state for Home/Away
  const [homeTeamSearch, setHomeTeamSearch] = useState('');
  const [awayTeamSearch, setAwayTeamSearch] = useState('');
  const [showHomeTeamDropdown, setShowHomeTeamDropdown] = useState(false);
  const [showAwayTeamDropdown, setShowAwayTeamDropdown] = useState(false);
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<{ id: string; name: string } | null>(null);
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<{ id: string; name: string } | null>(null);

  // Edit-form searchable dropdown state
  const [editHomeTeamSearch, setEditHomeTeamSearch] = useState('');
  const [editAwayTeamSearch, setEditAwayTeamSearch] = useState('');
  const [editUmpireSearchText, setEditUmpireSearchText] = useState('');
  const [editAppScorerSearch, setEditAppScorerSearch] = useState('');
  const [editPortalScorerSearch, setEditPortalScorerSearch] = useState('');
  const [showEditHomeTeamDropdown, setShowEditHomeTeamDropdown] = useState(false);
  const [showEditAwayTeamDropdown, setShowEditAwayTeamDropdown] = useState(false);
  const [showEditUmpireDropdown, setShowEditUmpireDropdown] = useState(false);
  const [showEditAppScorerDropdown, setShowEditAppScorerDropdown] = useState(false);
  const [showEditPortalScorerDropdown, setShowEditPortalScorerDropdown] = useState(false);
  const [selectedEditHomeTeam, setSelectedEditHomeTeam] = useState<{ id: string; name: string } | null>(null);
  const [selectedEditAwayTeam, setSelectedEditAwayTeam] = useState<{ id: string; name: string } | null>(null);
  const [selectedEditUmpire, setSelectedEditUmpire] = useState<{ id: string; name: string; email?: string } | null>(null);
  const [selectedEditAppScorer, setSelectedEditAppScorer] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);
  const [selectedEditPortalScorer, setSelectedEditPortalScorer] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);

  const qc = useQueryClient();
  const { data: matches } = useQuery({
    queryKey: ['schedule', boardId, from, to],
    queryFn: () => leagueService.getSchedule(boardId, from, to).then(r => {
      const d = r.data;
      const list = Array.isArray(d) ? d : (d as any)?.items ?? (d as any)?.data ?? [];
      console.log('📋 Schedule GET raw response:', d);
      if (list.length > 0) console.log('📋 First schedule item keys:', Object.keys(list[0]), 'values:', list[0]);
      return list;
    }),
    enabled: !!from && !!to,
  });

  // Fetch tournaments from umpire API (has groupList with teamBoardId)
  const { data: umpireTournaments } = useQuery({
    queryKey: ['umpireTournaments'],
    queryFn: async () => {
      const r = await tournamentService.getTournaments(1, 100);
      const d = r.data as any;
      return Array.isArray(d) ? d : d?.items ?? d?.data ?? [];
    },
  });
  const tournamentList = Array.isArray(umpireTournaments) ? umpireTournaments : [];

  // Load boards from sessionStorage + API fallback (same as CreateTrophyTab / TournamentsTab)
  const { data: boardsList } = useQuery({
    queryKey: ['boardsByOwner', user?.id],
    queryFn: async () => {
      try {
        const stored = sessionStorage.getItem('recentBoards');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((b: any) => ({
              id: b.id || b.Id || b.boardId || '',
              name: b.name || b.boardName || b.Name || '',
              logoUrl: b.logoUrl || '',
            }));
          }
        }
      } catch {}
      const [ownerRes, coOwnerRes] = await Promise.all([
        boardService.getByOwner(user?.id).catch(() => ({ data: null })),
        boardService.getByOwner(undefined, user?.id).catch(() => ({ data: null })),
      ]);
      const extract = (raw: any): any[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (raw?.items) return raw.items;
        if (raw?.data?.items) return raw.data.items;
        if (Array.isArray(raw?.data)) return raw.data;
        if (Array.isArray(raw?.result)) return raw.result;
        return [];
      };
      const seen = new Set<string>();
      const merged: any[] = [];
      for (const b of [...extract(ownerRes.data), ...extract(coOwnerRes.data)]) {
        const id = b.id || b.Id || b.boardId || '';
        if (id && !seen.has(id)) { seen.add(id); merged.push({ id, name: b.name || b.boardName || '', logoUrl: b.logoUrl || '' }); }
      }
      return merged;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });
  const allBoards = Array.isArray(boardsList) ? boardsList : [];

  // Fetch teams for the selected tournament via Schedules dropdown API
  const { data: tournamentTeams, isLoading: tournamentTeamsLoading } = useQuery({
    queryKey: ['tournamentTeams', newTournamentId],
    queryFn: async () => {
      const r = await leagueService.getTeamsByTournament(newTournamentId);
      const d = r.data as any;
      console.log('📋 Tournament teams raw response:', d);
      const list = Array.isArray(d) ? d : d?.items ?? d?.data ?? d?.teams ?? d?.teamBoards ?? [];
      return list.map((t: any) => ({
        id: t.id || t.Id || t.teamId || t.TeamId || t.teamBoardId || t.TeamBoardId || t.boardId || t.BoardId || '',
        name: t.name || t.teamName || t.TeamName || t.boardName || t.BoardName || t.Name || '',
        logoUrl: t.logoUrl || t.logo || '',
      }));
    },
    enabled: !!newTournamentId,
  });
  const tournamentTeamList = Array.isArray(tournamentTeams) ? tournamentTeams : [];

  // Fetch teams for the selected edit tournament
  const { data: editTournamentTeamsData, isLoading: editTournamentTeamsLoading } = useQuery({
    queryKey: ['editTournamentTeams', editTournamentId],
    queryFn: async () => {
      const r = await leagueService.getTeamsByTournament(editTournamentId);
      const d = r.data as any;
      const list = Array.isArray(d) ? d : d?.items ?? d?.data ?? d?.teams ?? d?.teamBoards ?? [];
      return list.map((t: any) => ({
        id: t.id || t.Id || t.teamId || t.TeamId || t.teamBoardId || t.TeamBoardId || t.boardId || t.BoardId || '',
        name: t.name || t.teamName || t.TeamName || t.boardName || t.BoardName || t.Name || '',
        logoUrl: t.logoUrl || t.logo || '',
      }));
    },
    enabled: !!editTournamentId && !!editMatchId,
  });
  const editTournamentTeamList = Array.isArray(editTournamentTeamsData) ? editTournamentTeamsData : [];

  // Show all boards for Home/Away team selection (same as Team Board in CreateTournament)
  const teamBoardList = allBoards;

  // Fetch user list for App Scorer / Portal Scorer (also used for table lookups)
  const shouldFetchUsers = true;
  const { data: userList } = useQuery({
    queryKey: ['usersListSchedule'],
    queryFn: async () => {
      const r = await userService.list();
      const raw = r.data as any;
      const list = Array.isArray(raw) ? raw
        : Array.isArray(raw?.data) ? raw.data
        : Array.isArray(raw?.items) ? raw.items
        : Array.isArray(raw?.users) ? raw.users
        : Array.isArray(raw?.result) ? raw.result
        : raw ? [raw] : [];
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
    enabled: shouldFetchUsers,
  });
  const normalizedUsers = Array.isArray(userList) ? userList : [];

  const { data: grounds } = useQuery({
    queryKey: ['grounds'],
    queryFn: () => leagueService.getGrounds().then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d as any)?.data ?? (d as any)?.items ?? [];
    }),
  });
  const { data: umpires } = useQuery({
    queryKey: ['umpires', boardId],
    queryFn: () => leagueService.getUmpires(boardId).then(r => {
      const d = r.data;
      return (Array.isArray(d) ? d : (d as any)?.items ?? (d as any)?.data ?? []) as Umpire[];
    }),
    enabled: !!boardId,
  });

  const umpireList = Array.isArray(umpires) ? umpires : [];
  const groundList = Array.isArray(grounds) ? grounds : [];
  const matchList = Array.isArray(matches) ? matches : [];

  // Lookup helpers to resolve IDs to names for the schedule table
  const lookupTournamentName = (m: any) =>
    m.tournamentName || tournamentList.find((t: any) => t.id === m.tournamentId)?.tournamentName || tournamentList.find((t: any) => t.id === m.tournamentId)?.name || '-';
  const lookupTeamName = (boardId: string | undefined) => {
    if (!boardId) return '-';
    return allBoards.find((b: any) => b.id === boardId)?.name || boardId.slice(0, 8) + '...';
  };
  const lookupGroundName = (groundId: string | undefined) => {
    if (!groundId) return '-';
    return groundList.find((g: any) => (g.groundId || g.id) === groundId)?.groundName || groundList.find((g: any) => (g.groundId || g.id) === groundId)?.name || '-';
  };
  const lookupUmpireName = (umpireId: string | undefined) => {
    if (!umpireId) return '-';
    const u = umpireList.find((u: any) => (u.id || (u as any).umpireId) === umpireId) as any;
    return u?.umpireName || u?.name || '-';
  };
  const lookupUserName = (userId: string | undefined) => {
    if (!userId) return '-';
    const u = normalizedUsers.find((u: any) => u.id === userId);
    return u ? `${u.firstName} ${u.lastName}`.trim() : '-';
  };

  // Filter users based on search text
  const filterUsers = (search: string) => {
    const q = search.toLowerCase();
    return normalizedUsers.filter((u: any) =>
      !q || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  };

  // Filter team boards based on search text — use tournament teams when available, else all boards
  const filterTeamBoards = (search: string, excludeId?: string) => {
    const q = search.toLowerCase();
    const source = tournamentTeamList.length > 0 ? tournamentTeamList : teamBoardList;
    return source.filter((b: any) =>
      (!excludeId || b.id !== excludeId) &&
      (!q || b.name.toLowerCase().includes(q))
    );
  };

  // Reset teams when tournament changes
  useEffect(() => {
    setNewHomeTeamId('');
    setNewAwayTeamId('');
    setSelectedHomeTeam(null);
    setSelectedAwayTeam(null);
    setHomeTeamSearch('');
    setAwayTeamSearch('');
  }, [newTournamentId]);

  // Auto-fill defaults when form opens
  useEffect(() => {
    if (!showCreate) return;
    if (tournamentList.length > 0 && !newTournamentId) {
      setNewTournamentId(tournamentList[0].id);
    }
    if (!newGameType) {
      setNewGameType('T20');
    }
  }, [showCreate, tournamentList.length]);

  const updateMatchMutation = useMutation({
    mutationFn: () => {
      const payload = {
        tournamentId: editTournamentId || null,
        gameType: editGameType || '',
        homeTeamBoardId: editHomeTeamId || null,
        awayTeamBoardId: editAwayTeamId || null,
        groundId: editGround || null,
        startAtUtc: editScheduledAt ? new Date(editScheduledAt).toISOString() : null,
        umpireId: editUmpire || null,
        appScorerId: editAppScorer || '',
        portalScorerId: editPortalScorer || '',
        active: true,
      };
      console.log('📤 Schedule PUT payload:', JSON.stringify(payload, null, 2));
      return leagueService.updateSchedule(editMatchId!, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule', boardId] });
      setEditMatchId(null);
      setEditError('');
    },
    onError: (error: any) => {
      const respData = error?.response?.data;
      let msg = typeof respData === 'string' ? respData : respData?.message || respData?.title || respData?.detail || '';
      if (respData?.errors) {
        const ve = Object.entries(respData.errors).map(([f, e]) => `${f}: ${Array.isArray(e) ? e.join(', ') : e}`).join('; ');
        msg = msg ? `${msg} — ${ve}` : ve;
      }
      setEditError(msg || error?.message || 'Failed to update schedule.');
    },
  });

  const deleteMatchMutation = useMutation({
    mutationFn: (id: string) => leagueService.deleteSchedule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule', boardId] });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      alert(`Failed to delete schedule. ${error?.response?.data?.message || error?.response?.data?.title || error?.message || ''}`);
      setDeleteConfirmId(null);
    },
  });

  const createMatchMutation = useMutation({
    mutationFn: () => {
      // API expects all fields: GUIDs as value or null, strings as value or ""
      const payload = {
        tournamentId: newTournamentId || null,
        gameType: newGameType || '',
        homeTeamBoardId: newHomeTeamId || null,
        awayTeamBoardId: newAwayTeamId || null,
        groundId: newGroundId || null,
        startAtUtc: newScheduledAt ? new Date(newScheduledAt).toISOString() : new Date().toISOString(),
        umpireId: newUmpireId || null,
        appScorerId: newAppScorerId || '',
        portalScorerId: newPortalScorerId || '',
        active: true,
      };
      console.log('📤 Schedule POST payload:', JSON.stringify(payload, null, 2));
      return tournamentService.createSchedule(payload as any);
    },
    onSuccess: (response: any) => {
      console.log('✅ Schedule created successfully:', response?.data);
      qc.invalidateQueries({ queryKey: ['schedule', boardId] });
      setCreateError('');
      setCreateSuccess('Schedule created successfully!');
      resetCreateForm();
      setTimeout(() => setCreateSuccess(''), 4000);
    },
    onError: (error: any) => {
      console.error('❌ Schedule creation failed:', error?.response?.status, error?.response?.data);
      const respData = error?.response?.data;
      let msg = '';
      if (typeof respData === 'string') {
        msg = respData;
      } else if (respData) {
        msg = respData.message || respData.title || respData.error || respData.detail || '';
        // Show validation errors if present
        if (respData.errors) {
          const validationErrors = Object.entries(respData.errors)
            .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
            .join('; ');
          msg = msg ? `${msg} — ${validationErrors}` : validationErrors;
        }
      }
      if (!msg) msg = error?.message || 'Failed to create schedule.';
      setCreateError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setCreateSuccess('');
    },
  });

  const handleEditMatch = (m: any) => {
    setEditMatchId(m.id);
    setEditTournamentId(m.tournamentId || '');
    setEditGameType(m.gameType || '');
    setEditHomeTeamId(m.homeTeamBoardId || '');
    setEditAwayTeamId(m.awayTeamBoardId || '');
    setEditGround(m.groundId || '');
    setEditUmpire(m.umpireId || '');
    setEditAppScorer(m.appScorerId || '');
    setEditPortalScorer(m.portalScorerId || '');
    const schedAt = m.startAtUtc ? new Date(m.startAtUtc).toISOString().slice(0, 16) : m.scheduledAt ? new Date(m.scheduledAt).toISOString().slice(0, 16) : '';
    setEditScheduledAt(schedAt);
    setEditOriginal({ tournamentId: m.tournamentId || '', gameType: m.gameType || '', homeTeamId: m.homeTeamBoardId || '', awayTeamId: m.awayTeamBoardId || '', ground: m.groundId || '', umpire: m.umpireId || '', appScorer: m.appScorerId || '', portalScorer: m.portalScorerId || '', scheduledAt: schedAt });
    setEditError('');
    // Pre-populate searchable dropdown selections
    const homeBoard = allBoards.find((b: any) => b.id === m.homeTeamBoardId);
    setSelectedEditHomeTeam(homeBoard ? { id: homeBoard.id, name: homeBoard.name } : m.homeTeamBoardId ? { id: m.homeTeamBoardId, name: m.homeTeamName || m.homeTeamBoardId } : null);
    const awayBoard = allBoards.find((b: any) => b.id === m.awayTeamBoardId);
    setSelectedEditAwayTeam(awayBoard ? { id: awayBoard.id, name: awayBoard.name } : m.awayTeamBoardId ? { id: m.awayTeamBoardId, name: m.awayTeamName || m.awayTeamBoardId } : null);
    const ump = umpireList.find((u: any) => (u.id || u.umpireId) === m.umpireId);
    setSelectedEditUmpire(ump ? { id: ump.id || (ump as any).umpireId, name: (ump as any).umpireName || (ump as any).name || '', email: (ump as any).email } : null);
    const appSc = normalizedUsers.find((u: any) => u.id === m.appScorerId);
    setSelectedEditAppScorer(appSc ? { id: appSc.id, firstName: appSc.firstName, lastName: appSc.lastName, email: appSc.email } : null);
    const portalSc = normalizedUsers.find((u: any) => u.id === m.portalScorerId);
    setSelectedEditPortalScorer(portalSc ? { id: portalSc.id, firstName: portalSc.firstName, lastName: portalSc.lastName, email: portalSc.email } : null);
    setEditHomeTeamSearch(''); setEditAwayTeamSearch(''); setEditUmpireSearchText(''); setEditAppScorerSearch(''); setEditPortalScorerSearch('');
    setShowEditHomeTeamDropdown(false); setShowEditAwayTeamDropdown(false); setShowEditUmpireDropdown(false); setShowEditAppScorerDropdown(false); setShowEditPortalScorerDropdown(false);
  };

  const cancelEdit = () => {
    if (editOriginal) {
      const hasChanges = editTournamentId !== editOriginal.tournamentId || editGameType !== editOriginal.gameType || editHomeTeamId !== editOriginal.homeTeamId || editAwayTeamId !== editOriginal.awayTeamId || editGround !== editOriginal.ground || editUmpire !== editOriginal.umpire || editAppScorer !== editOriginal.appScorer || editPortalScorer !== editOriginal.portalScorer || editScheduledAt !== editOriginal.scheduledAt;
      if (hasChanges) { setShowCancelConfirm(true); return; }
    }
    confirmCancelEdit();
  };

  const confirmCancelEdit = () => {
    setShowCancelConfirm(false);
    setEditMatchId(null);
    setEditTournamentId('');
    setEditGameType('');
    setEditHomeTeamId('');
    setEditAwayTeamId('');
    setEditGround('');
    setEditUmpire('');
    setEditAppScorer('');
    setEditPortalScorer('');
    setEditScheduledAt('');
    setEditError('');
    setEditOriginal(null);
    // Clear edit searchable dropdown state
    setSelectedEditHomeTeam(null); setSelectedEditAwayTeam(null); setSelectedEditUmpire(null); setSelectedEditAppScorer(null); setSelectedEditPortalScorer(null);
    setEditHomeTeamSearch(''); setEditAwayTeamSearch(''); setEditUmpireSearchText(''); setEditAppScorerSearch(''); setEditPortalScorerSearch('');
    setShowEditHomeTeamDropdown(false); setShowEditAwayTeamDropdown(false); setShowEditUmpireDropdown(false); setShowEditAppScorerDropdown(false); setShowEditPortalScorerDropdown(false);
  };

  const resetCreateForm = () => {
    setNewTournamentId(tournamentList.length > 0 ? tournamentList[0].id : '');
    setNewGameType('T20');
    setNewHomeTeamId('');
    setNewAwayTeamId('');
    setNewGroundId('');
    setNewUmpireId('');
    setNewAppScorerId('');
    setNewPortalScorerId('');
    setNewScheduledAt('');
    setSelectedHomeTeam(null);
    setSelectedAwayTeam(null);
    setSelectedUmpire(null);
    setSelectedAppScorer(null);
    setSelectedPortalScorer(null);
    setHomeTeamSearch('');
    setAwayTeamSearch('');
    setUmpireSearch('');
    setAppScorerSearch('');
    setPortalScorerSearch('');
    setFormErrors({});
  };

  // Check if all required fields for creating a match are filled
  const isCreateFormValid = !!(newTournamentId && newGameType && newHomeTeamId && newAwayTeamId && newScheduledAt);

  const validateAndCreate = () => {
    const errors: Record<string, string> = {};
    if (!newTournamentId) errors.tournament = 'Tournament is required';
    if (!newGameType) errors.gameType = 'Game Type is required';
    if (!newHomeTeamId) errors.homeTeam = 'Home Team is required';
    if (!newAwayTeamId) errors.awayTeam = 'Away Team is required';
    if (!newScheduledAt) errors.scheduledAt = 'Date & Time is required';
    setFormErrors(errors);
    setCreateError('');
    setCreateSuccess('');
    if (Object.keys(errors).length > 0) return;
    createMatchMutation.mutate();
  };

  const statusColor = (s: string) => s === 'Scheduled' ? 'bg-blue-100 text-blue-700' : s === 'Live' ? 'bg-green-100 text-green-700' : s === 'Completed' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700';

  // Searchable umpire dropdown using Umpire API data
  const renderUmpireDropdown = (
    search: string,
    setSearch: (v: string) => void,
    showDd: boolean,
    setShowDd: (v: boolean) => void,
    selected: { id: string; name: string; email?: string } | null,
    onSelect: (u: { id: string; name: string; email?: string }) => void,
    onClear: () => void,
  ) => {
    const q = search.toLowerCase();
    const getUmpireId = (u: any) => u.id || u.umpireId || '';
    const getUmpireName = (u: any) => u.umpireName || u.name || '';
    const filtered = umpireList.filter((u: any) =>
      !q || getUmpireName(u).toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    );
    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Umpire</label>
        {selected ? (
          <div className="flex items-center gap-2 input-field bg-gray-50">
            <span className="flex-1 text-sm truncate">{selected.name}</span>
            <button type="button" onClick={onClear} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
          </div>
        ) : (
          <>
            {showDd && (
              <div className="fixed inset-0 z-[5]" onClick={() => { setShowDd(false); setSearch(''); }} />
            )}
            <input
              type="text"
              placeholder="Search umpire..."
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDd(true); }}
              onFocus={() => setShowDd(true)}
              className="input-field"
            />
            {showDd && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filtered.length > 0 ? filtered.slice(0, 20).map((u: any) => (
                  <button
                    key={getUmpireId(u)}
                    type="button"
                    onClick={() => { onSelect({ id: getUmpireId(u), name: getUmpireName(u), email: u.email }); setShowDd(false); setSearch(''); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-brand-green/10 border-b last:border-b-0"
                  >
                    <span className="font-medium">{getUmpireName(u)}</span>
                    {u.email && <span className="text-gray-400 ml-2 text-xs">{u.email}</span>}
                  </button>
                )) : (
                  <div className="px-3 py-2 text-sm text-gray-400">No umpires found</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Reusable searchable user dropdown
  const renderUserSearchDropdown = (
    label: string,
    search: string,
    setSearch: (v: string) => void,
    showDropdown: boolean,
    setShowDropdown: (v: boolean) => void,
    selected: { id: string; firstName: string; lastName: string; email: string } | null,
    onSelect: (u: { id: string; firstName: string; lastName: string; email: string }) => void,
    onClear: () => void,
  ) => (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {selected ? (
        <div className="flex items-center gap-2 input-field bg-gray-50">
          <span className="flex-1 text-sm truncate">{`${selected.firstName} ${selected.lastName}`.trim() || selected.email}</span>
          <button type="button" onClick={onClear} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder={`Search ${label.toLowerCase()}...`}
            value={search}
            onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            className="input-field"
          />
          {showDropdown && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filterUsers(search).length > 0 ? filterUsers(search).slice(0, 20).map((u: any) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { onSelect(u); setShowDropdown(false); setSearch(''); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-brand-green/10 border-b last:border-b-0"
                >
                  <span className="font-medium">{`${u.firstName} ${u.lastName}`.trim()}</span>
                  {u.email && <span className="text-gray-400 ml-2 text-xs">{u.email}</span>}
                </button>
              )) : (
                <div className="px-3 py-2 text-sm text-gray-400">No users found</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  // Reusable searchable team board dropdown (same UI as Team Board in CreateTrophyTab)
  const renderTeamBoardDropdown = (
    label: string,
    search: string,
    setSearch: (v: string) => void,
    showDropdown: boolean,
    setShowDropdown: (v: boolean) => void,
    selected: { id: string; name: string } | null,
    onSelect: (b: { id: string; name: string }) => void,
    onClear: () => void,
    excludeId?: string,
    opts?: { tournamentId?: string; teamSource?: any[]; teamsLoading?: boolean },
  ) => {
    const effectiveTournamentId = opts?.tournamentId !== undefined ? opts.tournamentId : newTournamentId;
    const noTournament = !effectiveTournamentId;
    const effectiveTeamSource = opts?.teamSource !== undefined ? opts.teamSource : tournamentTeamList;
    const effectiveTeamsLoading = opts?.teamsLoading !== undefined ? opts.teamsLoading : tournamentTeamsLoading;
    return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label.replace(' *', '')} {label.includes('*') && <span className="text-red-500">*</span>}</label>
      {selected ? (
        <div className="flex items-center gap-2 input-field bg-gray-50">
          <div className="w-6 h-6 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-xs">
            {selected.name?.[0]?.toUpperCase() || '?'}
          </div>
          <span className="flex-1 text-sm truncate">{selected.name}</span>
          <button type="button" onClick={onClear} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
        </div>
      ) : (
        <>
          {showDropdown && (
            <div className="fixed inset-0 z-[5]" onClick={() => { setShowDropdown(false); setSearch(''); }} />
          )}
          <div
            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between ${noTournament ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={() => { if (!noTournament) setShowDropdown(!showDropdown); }}
          >
            <span className="text-gray-400 text-sm">{noTournament ? 'Select tournament first' : 'Search team...'}</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {showDropdown && (
            <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl" style={{ top: '100%' }}>
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  placeholder="Search teams..."
                  autoFocus
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {effectiveTeamsLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading teams...</div>
                ) : (() => {
                  const q = search.toLowerCase();
                  const source = effectiveTeamSource.length > 0 ? effectiveTeamSource : teamBoardList;
                  const filtered = source.filter((b: any) => (!excludeId || b.id !== excludeId) && (!q || b.name.toLowerCase().includes(q)));
                  return filtered.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">No teams found</div>
                  ) : (
                    filtered.map((b: any) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => { onSelect(b); setShowDropdown(false); setSearch(''); }}
                        className="w-full text-left px-4 py-2 hover:bg-brand-green/5 flex items-center gap-2 text-sm border-b last:border-0"
                      >
                        <div className="w-7 h-7 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-xs">
                          {b.logoUrl
                            ? <img src={b.logoUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                            : b.name?.[0]?.toUpperCase() || '?'
                          }
                        </div>
                        <span className="font-medium text-gray-900">{b.name}</span>
                      </button>
                    ))
                  );
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Schedule</h2>
        {!showCreate && !editMatchId && (
          <button onClick={() => {
            setShowCreate(true);
            resetCreateForm(); setCreateError(''); setCreateSuccess('');
          }} className="btn-primary text-sm px-4">
            + Create Match
          </button>
        )}
      </div>

      {showCreate && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">Create Match Schedule</h3>
          {createError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{createError}</div>}
          {createSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{createSuccess}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tournament <span className="text-red-500">*</span></label>
              <select value={newTournamentId} onChange={e => { setNewTournamentId(e.target.value); if (formErrors.tournament) setFormErrors(p => ({ ...p, tournament: '' })); }} className={`input-field ${formErrors.tournament ? 'border-red-500' : ''}`}>
                <option value="">Select Tournament</option>
                {tournamentList.map((t: any) => <option key={t.id} value={t.id}>{t.tournamentName || t.name}</option>)}
              </select>
              {formErrors.tournament && <p className="text-red-500 text-xs mt-1">{formErrors.tournament}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Type <span className="text-red-500">*</span></label>
              <select value={newGameType} onChange={e => { setNewGameType(e.target.value); if (formErrors.gameType) setFormErrors(p => ({ ...p, gameType: '' })); }} className={`input-field ${formErrors.gameType ? 'border-red-500' : ''}`}>
                <option value="">Select Game Type</option>
                <option value="T20">T20</option>
                <option value="ODI">ODI</option>
                <option value="Test Match">Test Match</option>
              </select>
              {formErrors.gameType && <p className="text-red-500 text-xs mt-1">{formErrors.gameType}</p>}
            </div>
            {renderTeamBoardDropdown(
              'Home Team *', homeTeamSearch, setHomeTeamSearch,
              showHomeTeamDropdown, setShowHomeTeamDropdown,
              selectedHomeTeam,
              (b) => { setSelectedHomeTeam(b); setNewHomeTeamId(b.id); if (b.id === newAwayTeamId) { setNewAwayTeamId(''); setSelectedAwayTeam(null); } if (formErrors.homeTeam) setFormErrors(p => ({ ...p, homeTeam: '' })); },
              () => { setSelectedHomeTeam(null); setNewHomeTeamId(''); setHomeTeamSearch(''); },
              newAwayTeamId,
            )}
            {renderTeamBoardDropdown(
              'Away Team *', awayTeamSearch, setAwayTeamSearch,
              showAwayTeamDropdown, setShowAwayTeamDropdown,
              selectedAwayTeam,
              (b) => { setSelectedAwayTeam(b); setNewAwayTeamId(b.id); if (formErrors.awayTeam) setFormErrors(p => ({ ...p, awayTeam: '' })); },
              () => { setSelectedAwayTeam(null); setNewAwayTeamId(''); setAwayTeamSearch(''); },
              newHomeTeamId,
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ground</label>
              <select value={newGroundId} onChange={e => setNewGroundId(e.target.value)} className="input-field">
                <option value="">Select Ground</option>
                {groundList.map((g: any) => <option key={g.groundId} value={g.groundId}>{g.groundName}</option>)}
              </select>
            </div>
            {renderUmpireDropdown(
              umpireSearch, setUmpireSearch,
              showUmpireDropdown, setShowUmpireDropdown,
              selectedUmpire,
              (u) => { setSelectedUmpire(u); setNewUmpireId(u.id); },
              () => { setSelectedUmpire(null); setNewUmpireId(''); setUmpireSearch(''); },
            )}
            {renderUserSearchDropdown(
              'App Scorer', appScorerSearch, setAppScorerSearch,
              showAppScorerDropdown, setShowAppScorerDropdown,
              selectedAppScorer,
              (u) => { setSelectedAppScorer(u); setNewAppScorerId(u.id); },
              () => { setSelectedAppScorer(null); setNewAppScorerId(''); setAppScorerSearch(''); },
            )}
            {renderUserSearchDropdown(
              'Portal Scorer', portalScorerSearch, setPortalScorerSearch,
              showPortalScorerDropdown, setShowPortalScorerDropdown,
              selectedPortalScorer,
              (u) => { setSelectedPortalScorer(u); setNewPortalScorerId(u.id); },
              () => { setSelectedPortalScorer(null); setNewPortalScorerId(''); setPortalScorerSearch(''); },
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={newScheduledAt} onChange={e => { setNewScheduledAt(e.target.value); if (formErrors.scheduledAt) setFormErrors(p => ({ ...p, scheduledAt: '' })); }} className={`input-field ${formErrors.scheduledAt ? 'border-red-500' : ''}`} />
              {formErrors.scheduledAt && <p className="text-red-500 text-xs mt-1">{formErrors.scheduledAt}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                const hasData = newTournamentId || newHomeTeamId || newAwayTeamId || newGroundId || newUmpireId || newAppScorerId || newPortalScorerId || newScheduledAt || newGameType;
                if (hasData) { setShowCreateCancelConfirm(true); return; }
                setShowCreate(false);
              }}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={validateAndCreate}
              disabled={!isCreateFormValid || createMatchMutation.isPending}
              className={`text-sm px-6 rounded-lg py-2 font-medium transition-colors ${isCreateFormValid && !createMatchMutation.isPending ? 'btn-primary' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              {createMatchMutation.isPending ? 'Creating...' : 'Create Match'}
            </button>
          </div>
        </div>
      )}

      {!showCreate && (
        <>
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">From</label><input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">To</label><input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-field" /></div>
        </div>
      </div>

      {editMatchId && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">Edit Schedule</h3>
          {editError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{editError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tournament <span className="text-red-500">*</span></label>
              <select value={editTournamentId} onChange={e => { setEditTournamentId(e.target.value); setEditHomeTeamId(''); setEditAwayTeamId(''); setSelectedEditHomeTeam(null); setSelectedEditAwayTeam(null); setEditHomeTeamSearch(''); setEditAwayTeamSearch(''); }} className="input-field">
                <option value="">Select Tournament</option>
                {tournamentList.map((t: any) => <option key={t.id} value={t.id}>{t.tournamentName || t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Type <span className="text-red-500">*</span></label>
              <select value={editGameType} onChange={e => setEditGameType(e.target.value)} className="input-field">
                <option value="">Select Game Type</option>
                <option value="T20">T20</option>
                <option value="ODI">ODI</option>
                <option value="Test Match">Test Match</option>
              </select>
            </div>
            {renderTeamBoardDropdown(
              'Home Team *', editHomeTeamSearch, setEditHomeTeamSearch,
              showEditHomeTeamDropdown, setShowEditHomeTeamDropdown,
              selectedEditHomeTeam,
              (b) => { setSelectedEditHomeTeam(b); setEditHomeTeamId(b.id); if (b.id === editAwayTeamId) { setEditAwayTeamId(''); setSelectedEditAwayTeam(null); } },
              () => { setSelectedEditHomeTeam(null); setEditHomeTeamId(''); setEditHomeTeamSearch(''); },
              editAwayTeamId,
              { tournamentId: editTournamentId, teamSource: editTournamentTeamList, teamsLoading: editTournamentTeamsLoading },
            )}
            {renderTeamBoardDropdown(
              'Away Team *', editAwayTeamSearch, setEditAwayTeamSearch,
              showEditAwayTeamDropdown, setShowEditAwayTeamDropdown,
              selectedEditAwayTeam,
              (b) => { setSelectedEditAwayTeam(b); setEditAwayTeamId(b.id); },
              () => { setSelectedEditAwayTeam(null); setEditAwayTeamId(''); setEditAwayTeamSearch(''); },
              editHomeTeamId,
              { tournamentId: editTournamentId, teamSource: editTournamentTeamList, teamsLoading: editTournamentTeamsLoading },
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ground</label>
              <select value={editGround} onChange={e => setEditGround(e.target.value)} className="input-field">
                <option value="">Select Ground</option>
                {groundList.map((g: any) => <option key={g.groundId} value={g.groundId}>{g.groundName}</option>)}
              </select>
            </div>
            {renderUmpireDropdown(
              editUmpireSearchText, setEditUmpireSearchText,
              showEditUmpireDropdown, setShowEditUmpireDropdown,
              selectedEditUmpire,
              (u) => { setSelectedEditUmpire(u); setEditUmpire(u.id); },
              () => { setSelectedEditUmpire(null); setEditUmpire(''); setEditUmpireSearchText(''); },
            )}
            {renderUserSearchDropdown(
              'App Scorer', editAppScorerSearch, setEditAppScorerSearch,
              showEditAppScorerDropdown, setShowEditAppScorerDropdown,
              selectedEditAppScorer,
              (u) => { setSelectedEditAppScorer(u); setEditAppScorer(u.id); },
              () => { setSelectedEditAppScorer(null); setEditAppScorer(''); setEditAppScorerSearch(''); },
            )}
            {renderUserSearchDropdown(
              'Portal Scorer', editPortalScorerSearch, setEditPortalScorerSearch,
              showEditPortalScorerDropdown, setShowEditPortalScorerDropdown,
              selectedEditPortalScorer,
              (u) => { setSelectedEditPortalScorer(u); setEditPortalScorer(u.id); },
              () => { setSelectedEditPortalScorer(null); setEditPortalScorer(''); setEditPortalScorerSearch(''); },
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={editScheduledAt} onChange={e => setEditScheduledAt(e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={cancelEdit} className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors">Cancel</button>
            <button onClick={() => updateMatchMutation.mutate()} disabled={!editTournamentId || !editGameType || !editHomeTeamId || !editAwayTeamId || !editScheduledAt || updateMatchMutation.isPending} className="btn-primary text-sm px-6">{updateMatchMutation.isPending ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      )}

      {!editMatchId && (
      <div className="card">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-700 font-bold text-sm"><th className="pb-3">Tournament</th><th className="pb-3">Home</th><th className="pb-3">Away</th><th className="pb-3">Ground</th><th className="pb-3">Umpire</th><th className="pb-3">Scorer</th><th className="pb-3">Date</th><th className="pb-3">Status</th><th className="pb-3">Actions</th></tr></thead>
          <tbody>
            {matchList.map((m: any) => (
              <tr key={m.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="py-3 text-xs">{lookupTournamentName(m)}</td>
                <td className="py-3 font-medium text-sm">{m.homeTeamName || lookupTeamName(m.homeTeamBoardId)}</td>
                <td className="py-3 font-medium text-sm">{m.awayTeamName || lookupTeamName(m.awayTeamBoardId)}</td>
                <td className="py-3 text-xs">{m.groundName || lookupGroundName(m.groundId)}</td>
                <td className="py-3 text-xs">{m.umpireName || lookupUmpireName(m.umpireId)}</td>
                <td className="py-3 text-xs">{m.scorerName || lookupUserName(m.appScorerId) || '-'}</td>
                <td className="py-3 text-xs">{new Date(m.startAtUtc || m.scheduledAt).toLocaleString()}</td>
                <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs ${statusColor(m.status || (m.active ? 'Scheduled' : 'Cancelled'))}`}>{m.status || (m.active ? 'Scheduled' : 'Cancelled')}</span></td>
                <td className="py-3 text-xs flex gap-2">
                  <button onClick={() => handleEditMatch(m)} className="text-blue-500 hover:text-blue-700" title="Edit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => setDeleteConfirmId(m.id)} className="text-red-500 hover:text-red-700" title="Delete">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
            {(!matchList.length) && <tr><td colSpan={9} className="py-8 text-center text-gray-400">No matches in selected date range.</td></tr>}
          </tbody>
        </table>
      </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <h3 className="text-base font-bold text-gray-800 mb-1">Delete Schedule?</h3>
              <p className="text-xs text-gray-500 mb-4">Are you sure you want to delete this match schedule? This action cannot be undone.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">Cancel</button>
                <button onClick={() => deleteMatchMutation.mutate(deleteConfirmId)} disabled={deleteMatchMutation.isPending} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors text-sm">
                  {deleteMatchMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Discard Changes?</h3>
              <p className="text-xs text-gray-500 mb-4">You have unsaved changes. Are you sure you want to discard them?</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">No, Keep Editing</button>
                <button onClick={confirmCancelEdit} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors text-sm">Yes, Discard</button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Create Form Cancel Confirmation Modal */}
      {showCreateCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateCancelConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Discard Changes?</h3>
              <p className="text-xs text-gray-500 mb-4">You have unsaved changes. Are you sure you want to discard them?</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowCreateCancelConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">No, Keep Editing</button>
                <button onClick={() => { setShowCreateCancelConfirm(false); resetCreateForm(); setCreateError(''); setCreateSuccess(''); setShowCreate(false); }} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors text-sm">Yes, Discard</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── APPLICATIONS TAB ──
function ApplicationsTab({ boardId }: { boardId: string }) {
  const [selectedTournament, setSelectedTournament] = useState('');
  const qc = useQueryClient();
  const { data: tournaments } = useQuery({ queryKey: ['tournaments', boardId], queryFn: () => tournamentService.getByBoard(boardId).then(r => {
    const d = r.data;
    return Array.isArray(d) ? d : (d as any)?.items ?? (d as any)?.data ?? [];
  }) });
  const tournamentList = Array.isArray(tournaments) ? tournaments : [];
  const { data: apps } = useQuery({
    queryKey: ['applications', selectedTournament],
    queryFn: () => leagueService.getApplications(selectedTournament).then(r => r.data),
    enabled: !!selectedTournament,
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => leagueService.updateApplicationStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications', selectedTournament] }),
  });

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-gray-800 mb-6">League Applications</h2>
      <div className="card mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Tournament</label>
        <select value={selectedTournament} onChange={e => setSelectedTournament(e.target.value)} className="input-field max-w-md">
          <option value="">Choose a tournament...</option>
          {tournamentList.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      {selectedTournament && (
        <div className="card">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-700 font-bold text-sm"><th className="pb-3">Team</th><th className="pb-3">Payment</th><th className="pb-3">Waiver</th><th className="pb-3">Status</th><th className="pb-3">Submitted</th><th className="pb-3">Actions</th></tr></thead>
            <tbody>
              {apps?.map(a => (
                <tr key={a.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-3 font-medium">{a.teamName}</td>
                  <td className="py-3">{a.paymentAmount ? `$${a.paymentAmount}` : '-'} {a.paymentStatus && <span className="text-xs text-gray-400">({a.paymentStatus})</span>}</td>
                  <td className="py-3">{a.waiverSigned ? '✅' : '❌'}</td>
                  <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs ${a.status === 'Approved' ? 'bg-green-100 text-green-700' : a.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{a.status}</span></td>
                  <td className="py-3 text-xs">{new Date(a.submittedAt).toLocaleDateString()}</td>
                  <td className="py-3 space-x-2">
                    {a.status === 'Pending' && (<>
                      <button onClick={() => statusMutation.mutate({ id: a.id, status: 'Approved' })} className="text-green-600 hover:text-green-800 text-xs font-medium">Approve</button>
                      <button onClick={() => statusMutation.mutate({ id: a.id, status: 'Rejected' })} className="text-red-500 hover:text-red-700 text-xs font-medium">Reject</button>
                    </>)}
                  </td>
                </tr>
              ))}
              {(!apps?.length) && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No applications for this tournament.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── INVOICES TAB ──
function InvoicesTab({ boardId }: { boardId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState(''); const [description, setDescription] = useState(''); const [dueDate, setDueDate] = useState('');
  const qc = useQueryClient();
  const { data: invoices } = useQuery({ queryKey: ['invoices', boardId], queryFn: () => leagueService.getInvoices(boardId).then(r => r.data) });
  const createMutation = useMutation({
    mutationFn: () => leagueService.createInvoice(boardId, { amount: parseFloat(amount), description, dueDate }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices', boardId] }); setShowForm(false); setAmount(''); setDescription(''); setDueDate(''); },
  });
  const payMutation = useMutation({
    mutationFn: ({ id, amt }: { id: string; amt: number }) => leagueService.recordPayment(id, amt),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices', boardId] }),
  });

  const statusColor = (s: string) => s === 'Paid' ? 'bg-green-100 text-green-700' : s === 'Partial' ? 'bg-yellow-100 text-yellow-700' : s === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600';

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Invoicing</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm px-4">{showForm ? 'Cancel' : '+ Create Invoice'}</button>
      </div>
      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">Create Invoice</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input value={description} onChange={e => setDescription(e.target.value)} className="input-field" /></div>
          </div>
          <button onClick={() => amount && dueDate && createMutation.mutate()} disabled={!amount || !dueDate || createMutation.isPending}
            className="btn-primary text-sm px-6 mt-4">{createMutation.isPending ? 'Creating...' : 'Create Invoice'}</button>
        </div>
      )}
      <div className="card">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-700 font-bold text-sm"><th className="pb-3">Invoice #</th><th className="pb-3">Description</th><th className="pb-3">Amount</th><th className="pb-3">Paid</th><th className="pb-3">Due Date</th><th className="pb-3">Status</th><th className="pb-3">Actions</th></tr></thead>
          <tbody>
            {invoices?.map(inv => (
              <tr key={inv.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                <td className="py-3">{inv.description || '-'}</td>
                <td className="py-3 font-medium">${inv.amount.toFixed(2)}</td>
                <td className="py-3">${(inv.paidAmount ?? 0).toFixed(2)}</td>
                <td className="py-3 text-xs">{new Date(inv.dueDate).toLocaleDateString()}</td>
                <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs ${statusColor(inv.status)}`}>{inv.status}</span></td>
                <td className="py-3">
                  {inv.status !== 'Paid' && (
                    <button onClick={() => {
                      const amt = prompt('Enter payment amount:');
                      if (amt) payMutation.mutate({ id: inv.id, amt: parseFloat(amt) });
                    }} className="text-brand-green hover:text-brand-dark text-xs font-medium">Record Payment</button>
                  )}
                </td>
              </tr>
            ))}
            {(!invoices?.length) && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No invoices created yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
