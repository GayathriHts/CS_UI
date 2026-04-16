import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardService, boardDetailService, leagueService, rosterService, tournamentService, userService } from '../services/cricketSocialService';
import { fetchCountries, fetchStates, fetchCities, fetchCountryPhoneCodes } from '../services/locationService';
import type { Umpire, Ground, Tournament, Match, LeagueApplication, Invoice } from '../types';
import { useAuthStore } from '../store/slices/authStore';
import Navbar from '../components/Navbar';

type LeagueTab = 'dashboard' | 'umpire-list' | 'ground-list' | 'schedule' | 'tournaments' | 'applications' | 'invoices' | 'cancel-game' | 'edit';

type SidebarSection = 'umpires' | 'grounds' | 'trophy' | 'schedules';

/** Sanitize text input: no leading spaces, auto-capitalize first letter, strip special characters */
const sanitizeTextInput = (value: string, allowAddressChars = false): string => {
  let v = value.replace(/^\s+/, '');
  if (allowAddressChars) {
    v = v.replace(/[^a-zA-Z0-9\s,.\/#\-]/g, '');
  } else {
    v = v.replace(/[^a-zA-Z0-9\s]/g, '');
  }
  if (v.length > 0) {
    v = v.charAt(0).toUpperCase() + v.slice(1);
  }
  return v;
};

const sidebarSections: { id: SidebarSection; label: string; items: { id: LeagueTab; label: string }[] }[] = [
  {
    id: 'umpires', label: 'UMPIRES',
    items: [
      { id: 'umpire-list', label: 'Umpire List' },
    ],
  },
  {
    id: 'grounds', label: 'GROUNDS',
    items: [
      { id: 'ground-list', label: 'Ground List' },
    ],
  },
  {
    id: 'trophy', label: 'TOURNAMENTS',
    items: [
      { id: 'tournaments', label: 'Tournament List' },
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
  const [pendingNav, setPendingNav] = useState<{ tab: LeagueTab; section: SidebarSection } | null>(null);
  const dirtyRef = useRef(false);
  const qc = useQueryClient();
  const { data: board } = useQuery({ queryKey: ['board', boardId], queryFn: () => boardService.getById(boardId!).then(r => r.data), enabled: !!boardId });

  const onDirtyChange = (dirty: boolean) => { dirtyRef.current = dirty; };

  const toggleSection = (section: SidebarSection) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleTabClick = (tab: LeagueTab, section: SidebarSection) => {
    if (tab === activeTab) return;
    if (dirtyRef.current) {
      setPendingNav({ tab, section });
      return;
    }
    setActiveTab(tab);
    if (!expandedSections.includes(section)) {
      setExpandedSections(prev => [...prev, section]);
    }
  };

  const confirmNavigation = () => {
    if (pendingNav) {
      dirtyRef.current = false;
      setActiveTab(pendingNav.tab);
      if (!expandedSections.includes(pendingNav.section)) {
        setExpandedSections(prev => [...prev, pendingNav.section]);
      }
      setPendingNav(null);
    }
  };

  if (!board) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar title={`League Management - ${board.name}`} backTo="/dashboard" />

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
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-gray-800">{board.name}</span>
                <button
                  onClick={() => {
                    if (dirtyRef.current) {
                      setPendingNav({ tab: 'edit', section: 'umpires' });
                    } else {
                      setActiveTab('edit');
                    }
                  }}
                  className="hover:text-brand-green transition-colors cursor-pointer"
                  title="Edit Board"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
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
        <div className={`ml-64 flex-1 ${activeTab === 'edit' ? '' : 'p-6'}`}>
          {activeTab === 'dashboard' && <LeagueLandingTab boardId={boardId!} />}
          {activeTab === 'umpire-list' && <UmpireListTab boardId={boardId!} onDirtyChange={onDirtyChange} />}
          {activeTab === 'ground-list' && <GroundListTab boardId={boardId!} onDirtyChange={onDirtyChange} />}
          {activeTab === 'tournaments' && <TournamentsTab boardId={boardId!} onDirtyChange={onDirtyChange} />}
          {activeTab === 'schedule' && <ScheduleTab boardId={boardId!} onDirtyChange={onDirtyChange} />}
          {activeTab === 'cancel-game' && <CancelGameTab boardId={boardId!} />}
          {activeTab === 'applications' && <ApplicationsTab boardId={boardId!} />}
          {activeTab === 'invoices' && <InvoicesTab boardId={boardId!} />}
          {activeTab === 'edit' && (
            <EditLeagueForm
              board={board}
              boardId={boardId!}
              onClose={() => { dirtyRef.current = false; setActiveTab('dashboard'); }}
              onSaved={() => {
                dirtyRef.current = false;
                setActiveTab('dashboard');
                qc.invalidateQueries({ queryKey: ['board', boardId] });
              }}
              onDirtyChange={onDirtyChange}
            />
          )}
        </div>
      </div>

      {/* Unsaved changes warning modal */}
      {pendingNav && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPendingNav(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Unsaved Changes</h3>
              <p className="text-xs text-gray-500 mb-4">You have unsaved changes. Are you sure you want to leave? Any unsaved data will be lost.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setPendingNav(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">Stay</button>
                <button onClick={confirmNavigation} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors text-sm">Discard & Leave</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── EDIT LEAGUE MODAL ──
function EditLeagueForm({ board, boardId, onClose, onSaved, onDirtyChange }: { board: any; boardId: string; onClose: () => void; onSaved: () => void; onDirtyChange?: (dirty: boolean) => void }) {
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

  // Pre-select co-owner from board's coOwnerId field only (never from ownerId)
  useEffect(() => {
    if (!coOwnerUserList || selectedCoOwner) return;
    const coOwnerId = board.coOwnerId || board.CoOwnerId || board.coOwnerid || board.co_owner_id || '';
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
      // ownerId must remain the original owner — never overwrite with co-owner
      const existingOwnerId = board.ownerId || board.owneriD || board.OwnerId || board.owner_id || board.createdBy || board.userId || board.ownerid || '';
      const resolvedOwnerId = existingOwnerId;
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
      const newLogoUrl = logoPreview; // always use local state  -  this is what the user chose
      const editOverlay = { name: newName, description: newDescription, city: newCity, state: newState, country: newCountry, logoUrl: newLogoUrl };
      try {
        const pending = JSON.parse(sessionStorage.getItem('boardEdits') || '{}');
        pending[boardId] = editOverlay;
        sessionStorage.setItem('boardEdits', JSON.stringify(pending));
      } catch {}
      const userId = useAuthStore.getState().user?.id;
      qc.setQueryData(['board', boardId], (old: any) => old ? { ...old, ...editOverlay } : updatedBoard || old);
      qc.setQueryData(['myBoards', userId], (old: any) => {
        if (!old?.items) return old;
        return { ...old, items: old.items.map((b: any) => b.id === boardId ? { ...b, ...editOverlay } : b) };
      });
      qc.invalidateQueries({ queryKey: ['myBoards', userId] });
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

  // Report dirty state to parent so sidebar navigation guard works
  useEffect(() => { onDirtyChange?.(hasChanges); }, [hasChanges]);

  return (
    <>
    <div className="bg-white shadow-md p-6 min-h-full w-full">
      <h3 className="font-semibold mb-4">Edit Board</h3>
      {/* Logo Upload */}
      <div className="flex flex-col items-start gap-1 mb-4">
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
        {logoError && <p className="text-xs text-red-500 mt-1">{logoError}</p>}
        <input id="edit-league-logo-input" type="file" accept="image/*" className="hidden" onChange={e => {
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
          <input value="League" disabled className="input-field bg-gray-100 text-gray-500 cursor-not-allowed" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} className="input-field resize-none" rows={3} />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
          {countryDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCountryDropdownOpen(false); setCountrySearchText(''); }} />}
          <div className={`input-field cursor-pointer flex items-center justify-between border-gray-400 ${countriesLoading ? 'bg-gray-50' : ''}`} onClick={() => { if (!countriesLoading) setCountryDropdownOpen(!countryDropdownOpen); }}>
            <span className={country ? 'text-gray-900' : 'text-gray-400'}>{countriesLoading ? 'Loading countries...' : country || ''}</span>
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
          <div className={`input-field flex items-center justify-between border-gray-400 ${!country || statesLoading ? 'bg-gray-200 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`} onClick={() => { if (country && !statesLoading) setStateDropdownOpen(!stateDropdownOpen); }}>
            <span className={state ? 'text-gray-900' : 'text-gray-400'}>{!country ? '' : statesLoading ? 'Loading states...' : state || ''}</span>
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
          <div className={`input-field flex items-center justify-between border-gray-400 ${!state || citiesLoading ? 'bg-gray-200 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`} onClick={() => { if (state && !citiesLoading) setCityDropdownOpen(!cityDropdownOpen); }}>
            <span className={city ? 'text-gray-900' : 'text-gray-400'}>{!state ? '' : citiesLoading ? 'Loading...' : city || ''}</span>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Co-Owner</label>
          <div className="relative">
            {showCoOwnerDropdown && <div className="fixed inset-0 z-[5]" onClick={() => { setShowCoOwnerDropdown(false); setCoOwnerSearch(''); }} />}
            <div className="input-field cursor-pointer flex items-center justify-between" onClick={() => setShowCoOwnerDropdown(prev => !prev)}>
              {selectedCoOwner ? (
                <span className="text-gray-900 flex items-center gap-2">
                  {selectedCoOwner.firstName || selectedCoOwner.lastName ? `${selectedCoOwner.firstName} ${selectedCoOwner.lastName}`.trim() : selectedCoOwner.email}
                  <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedCoOwner(null); }} className="text-gray-400 hover:text-red-500 font-bold text-sm">&times;</button>
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
                  <p className="text-xs text-gray-500">{m.tournamentName} � {new Date(m.scheduledAt).toLocaleString()}</p>
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
                  <p className="text-xs text-gray-500">{m.tournamentName} � {new Date(m.scheduledAt).toLocaleString()}</p>
                  {m.groundName && <p className="text-xs text-gray-400">?? {m.groundName}</p>}
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
  const [emailAutoFilled, setEmailAutoFilled] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const qc = useQueryClient();

  // User list for umpire name dropdown
  const [umpireNameDropdownOpen, setUmpireNameDropdownOpen] = useState(false);
  const [umpireNameSearch, setUmpireNameSearch] = useState('');
  const { data: umpireUserList, isLoading: umpireUsersLoading } = useQuery({
    queryKey: ['usersList'],
    queryFn: async () => {
      const r = await userService.list();
      const raw = r.data as any;
      return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.items) ? raw.items : Array.isArray(raw?.users) ? raw.users : [];
    },
  });

  // Fetch existing umpires for duplicate name check
  const { data: existingUmpires } = useQuery({
    queryKey: ['umpires', boardId],
    queryFn: async () => {
      const r = await leagueService.getUmpires(boardId);
      const d = r.data;
      return (Array.isArray(d) ? d : (d as any)?.items ?? (d as any)?.data ?? []) as any[];
    },
    enabled: !!boardId,
    staleTime: 0,
  });

  // Phone codes state
  const [phoneCodeList, setPhoneCodeList] = useState<{ name: string; code: string; dial_code: string; flag?: string }[]>([]);
  const [phoneCodesLoading, setPhoneCodesLoading] = useState(false);
  const [phoneCodeDropdownOpen, setPhoneCodeDropdownOpen] = useState(false);
  const [phoneCodeSearchText, setPhoneCodeSearchText] = useState('');

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
    const max = country === 'United States' ? 5 : 6;
    setZipCode(prev => prev.slice(0, max));
  }, [country]);

  useEffect(() => {
    if (!country || !state) { setCityList([]); return; }
    setCitiesLoading(true);
    fetchCities(country, state).then(setCityList).catch(() => setCityList([])).finally(() => setCitiesLoading(false));
  }, [country, state]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Umpire Name is required';
    else if ((existingUmpires || []).some((u: any) => (u.umpireName || u.name || '').trim().toLowerCase() === name.trim().toLowerCase())) newErrors.name = 'Umpire name is already used, please select a different name';
    if (!city.trim()) newErrors.city = 'City is required';
    if (!state.trim()) newErrors.state = 'State is required';
    if (!country.trim()) newErrors.country = 'Country is required';
    if (!zipCode.trim()) {
      newErrors.zipCode = 'Zip Code is required';
    } else if (country === 'United States' && !/^\d{5}$/.test(zipCode.trim())) {
      newErrors.zipCode = 'Zip Code must be exactly 5 digits';
    } else if (country !== 'United States' && !/^\d{6}$/.test(zipCode.trim())) {
      newErrors.zipCode = 'Zip Code must be exactly 6 digits';
    }
    if (!email.trim()) {
      newErrors.email = 'E-mail ID is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,3}$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
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
      mobile: contactNo.trim(),
      countryCode: contactNo.trim() ? countryCode : '',
      email: email.trim(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['umpires', boardId] });
      setName(''); setAddressLine1(''); setAddressLine2('');
      setCity(''); setState(''); setCountry('');
      setZipCode(''); setContactNo(''); setEmail(''); setEmailAutoFilled(false);
      setErrors({});
      setSubmitStatus({ type: 'success', message: 'Umpire created successfully!' });
      if (onClose) onClose();
    },
    onError: (err: any) => {
      const detail = err?.response?.data;
      const msg = detail?.message || detail?.title || detail?.errors?.[Object.keys(detail?.errors || {})[0]]?.[0] || (err?.response?.status === 500 ? 'Server error. Please check your inputs and try again.' : err?.message) || 'Failed to create umpire. Please try again.';
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
    setZipCode(''); setContactNo(''); setEmail(''); setEmailAutoFilled(false);
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
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Umpire Name <span className="text-red-500">*</span>
              </label>
              {umpireNameDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => setUmpireNameDropdownOpen(false)} />}
              <input
                value={name}
                onChange={e => {
                  const val = sanitizeTextInput(e.target.value);
                  setName(val);
                  setUmpireNameSearch(val);
                  setUmpireNameDropdownOpen(true);
                  setEmailAutoFilled(false);
                  setEmail('');
                  const trimmed = val.trim().toLowerCase();
                  const umpList = existingUmpires || [];
                  console.log('[DupCheck] existingUmpires count:', umpList.length, 'checking:', trimmed, 'names:', umpList.map((u: any) => u.umpireName || u.name || u.UmpireName || u.Name));
                  const isDup = trimmed && umpList.some((u: any) => {
                    const existing = (u.umpireName || u.name || u.UmpireName || u.Name || '').trim().toLowerCase();
                    return existing === trimmed;
                  });
                  if (isDup) {
                    setErrors(prev => ({ ...prev, name: 'Umpire name is already used, please select a different name' }));
                  } else {
                    setErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
                onFocus={() => setUmpireNameDropdownOpen(true)}
                placeholder=""
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                autoComplete="off"
              />
              {umpireNameDropdownOpen && name.trim().length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="max-h-48 overflow-y-auto">
                    {umpireUsersLoading ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading users...</div>
                    ) : (() => {
                      const filtered = (umpireUserList || []).filter((u: any) =>
                        `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''} ${u.userName || ''}`.toLowerCase().includes(name.trim().toLowerCase())
                      );
                      return filtered.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">No matching users � name will be submitted as entered</div>
                      ) : (
                        filtered.map((u: any) => {
                          const displayName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.userName || (u.email ? u.email.split('@')[0] : u.id);
                          const initial = (u.firstName?.[0] || u.userName?.[0] || '?').toUpperCase();
                          return (
                            <button
                              key={u.id}
                              onClick={() => {
                                setName(displayName);
                                setEmail(u.email || '');
                                setEmailAutoFilled(!!(u.email));
                                setUmpireNameDropdownOpen(false);
                                setUmpireNameSearch('');
                                const trimmed = displayName.trim().toLowerCase();
                                const isDup = trimmed && (existingUmpires || []).some((ump: any) => {
                                  const existing = (ump.umpireName || ump.name || ump.UmpireName || ump.Name || '').trim().toLowerCase();
                                  return existing === trimmed;
                                });
                                if (isDup) {
                                  setErrors(prev => ({ ...prev, name: 'Umpire name is already used, please select a different name' }));
                                } else {
                                  setErrors(prev => ({ ...prev, name: '' }));
                                }
                                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
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
                      );
                    })()}
                  </div>
                </div>
              )}
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input
                value={addressLine1}
                onChange={e => setAddressLine1(sanitizeTextInput(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input
                value={addressLine2}
                onChange={e => setAddressLine2(sanitizeTextInput(e.target.value))}
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
                className={`input-field cursor-pointer flex items-center justify-between border-gray-400 ${countriesLoading ? 'bg-gray-50' : ''} ${errors.country ? 'border-red-500' : ''}`}
                onClick={() => { if (!countriesLoading) setCountryDropdownOpen(!countryDropdownOpen); if (errors.country) setErrors(prev => ({ ...prev, country: '' })); }}
              >
                <span className={country ? 'text-gray-900' : 'text-gray-400'}>{countriesLoading ? 'Loading countries...' : country || ''}</span>
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
                className={`input-field flex items-center justify-between border-gray-400 ${!country || statesLoading ? 'bg-gray-200 cursor-not-allowed pointer-events-none' : 'cursor-pointer'} ${errors.state ? 'border-red-500' : ''}`}
                onClick={() => { if (country && !statesLoading) setStateDropdownOpen(!stateDropdownOpen); if (errors.state) setErrors(prev => ({ ...prev, state: '' })); }}
              >
                <span className={state ? 'text-gray-900' : 'text-gray-400'}>{!country ? '' : statesLoading ? 'Loading states...' : state || ''}</span>
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
                className={`input-field flex items-center justify-between border-gray-400 ${!state || citiesLoading ? 'bg-gray-200 cursor-not-allowed pointer-events-none' : 'cursor-pointer'} ${errors.city ? 'border-red-500' : ''}`}
                onClick={() => { if (state && !citiesLoading) setCityDropdownOpen(!cityDropdownOpen); if (errors.city) setErrors(prev => ({ ...prev, city: '' })); }}
              >
                <span className={city ? 'text-gray-900' : 'text-gray-400'}>{!state ? '' : citiesLoading ? 'Loading...' : city || ''}</span>
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
                maxLength={country === 'United States' ? 5 : 6}
                onChange={e => { const max = country === 'United States' ? 5 : 6; const v = e.target.value.replace(/\D/g, '').slice(0, max); setZipCode(v); if (errors.zipCode) setErrors(prev => ({ ...prev, zipCode: '' })); }}
                className={`input-field ${errors.zipCode ? 'border-red-500' : ''}`}
              />
              {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <div className="flex w-full border border-gray-400 rounded-lg h-[42px] bg-white focus-within:ring-2 focus-within:ring-brand-green focus-within:border-transparent transition-all duration-200">
                <div className="relative flex-shrink-0">
                  {phoneCodeDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setPhoneCodeDropdownOpen(false); setPhoneCodeSearchText(''); }} />}
                  <div
                    className="h-full px-2 text-sm cursor-pointer flex items-center gap-1 border-r border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors rounded-l-lg"
                    onClick={() => { if (!phoneCodesLoading) setPhoneCodeDropdownOpen(!phoneCodeDropdownOpen); }}
                  >
                    <img src={countryCode === '+91' ? '/images/flag-in.svg' : '/images/flag-us.svg'} alt="" className="w-4 h-3 object-cover rounded-sm" />
                    <span className="text-gray-900 text-xs">{phoneCodesLoading ? '...' : (() => { const sel = phoneCodeList.find(c => c.dial_code === countryCode); return sel ? `${sel.dial_code}` : `${countryCode}`; })()}</span>
                    <svg className={`w-3 h-3 text-gray-400 transition-transform ${phoneCodeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  {phoneCodeDropdownOpen && (
                    <div className="absolute z-10 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg">
                      <div className="p-2 border-b border-gray-100">
                        <input type="text" value={phoneCodeSearchText} onChange={e => setPhoneCodeSearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search code" autoFocus onClick={e => e.stopPropagation()} />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {(phoneCodeList.length > 0 ? phoneCodeList : [{ name: 'India', code: 'IN', dial_code: '+91', flag: '' }, { name: 'United States', code: 'US', dial_code: '+1', flag: '' }])
                          .filter(c => !phoneCodeSearchText || c.dial_code.includes(phoneCodeSearchText) || c.code.toLowerCase().includes(phoneCodeSearchText.toLowerCase()) || c.name.toLowerCase().includes(phoneCodeSearchText.toLowerCase()))
                          .map(c => (
                          <button key={`${c.code}-${c.dial_code}`} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 flex items-center gap-2 ${countryCode === c.dial_code ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                            onClick={() => { setCountryCode(c.dial_code); setContactNo(prev => prev.slice(0, c.dial_code === '+1' ? 9 : 10)); setPhoneCodeDropdownOpen(false); setPhoneCodeSearchText(''); }}>
                            <img src={c.code === 'IN' ? '/images/flag-in.svg' : '/images/flag-us.svg'} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
                            {c.dial_code} ({c.code})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  value={(() => { const d = contactNo; if (countryCode === '+1' && d.length > 0) { const a = d.slice(0,3), b = d.slice(3,6), c = d.slice(6); return d.length <= 3 ? `(${a}` : d.length <= 6 ? `(${a}) ${b}` : `(${a}) ${b}-${c}`; } if (countryCode === '+91' && d.length > 0) { return d.length <= 5 ? d.slice(0,5) : `${d.slice(0,5)} ${d.slice(5)}`; } return d; })()}
                  maxLength={countryCode === '+1' ? 14 : 11}
                  onChange={e => { const max = 10; const v = e.target.value.replace(/\D/g, '').slice(0, max); setContactNo(v); }}
                  className="flex-1 min-w-0 px-3 h-full text-sm bg-transparent outline-none rounded-r-lg"
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
                readOnly={emailAutoFilled}
                onChange={e => { if (!emailAutoFilled) { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: '' })); } }}
                className={`input-field ${errors.email ? 'border-red-500' : ''} ${emailAutoFilled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !name.trim() || !city.trim() || !state.trim() || !country.trim() || !zipCode.trim() || !email.trim() || !!errors.name}
              className="btn-primary px-8 py-2 text-sm"
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
function UmpireListTab({ boardId, onDirtyChange }: { boardId: string; onDirtyChange?: (dirty: boolean) => void }) {
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
  const [editLoading, setEditLoading] = useState(false);

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
  const [editPhoneCodeList, setEditPhoneCodeList] = useState<{ name: string; code: string; dial_code: string; flag?: string }[]>([]);
  const [editPhoneCodesLoading, setEditPhoneCodesLoading] = useState(false);
  const [editCountryCode, setEditCountryCode] = useState('+1');
  const [editPhoneCodeDropdownOpen, setEditPhoneCodeDropdownOpen] = useState(false);
  const [editPhoneCodeSearchText, setEditPhoneCodeSearchText] = useState('');

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
    const max = editCountry === 'United States' ? 5 : 6;
    setEditZipcode(prev => prev.slice(0, max));
  }, [editCountry]);

  useEffect(() => {
    if (!editCountry || !editState) { setCityList([]); return; }
    setCitiesLoading(true);
    fetchCities(editCountry, editState).then(setCityList).catch(() => setCityList([])).finally(() => setCitiesLoading(false));
  }, [editCountry, editState]);

  useEffect(() => { onDirtyChange?.(showCreate || !!editId); }, [showCreate, editId]);

  const { data: umpires, isLoading } = useQuery({
    queryKey: ['umpires', boardId],
    queryFn: () => leagueService.getUmpires(boardId).then(r => {
      const d = r.data;
      return (Array.isArray(d) ? d : (d as any)?.items ?? (d as any)?.data ?? []) as Umpire[];
    }),
    enabled: !!boardId,
  });
  const umpireList = Array.isArray(umpires) ? umpires : [];

  const formatPhone = (u: any): string => {
    const raw = u.mobile || u.contactNumber || '';
    if (!raw) return '-';
    const cc = u.countryCode || '';
    let digits = raw.replace(/\D/g, '');
    // Strip country code prefix from digits
    const ccDigits = cc.replace(/\D/g, '');
    if (ccDigits && digits.startsWith(ccDigits)) {
      digits = digits.slice(ccDigits.length);
    }
    // Detect effective country code from stored countryCode, umpire country, or raw number
    const country = (u.country || '').toLowerCase();
    let effectiveCC = cc;
    if (!effectiveCC) {
      if (digits.startsWith('91') && digits.length === 12) { effectiveCC = '+91'; digits = digits.slice(2); }
      else if (digits.startsWith('1') && digits.length === 11) { effectiveCC = '+1'; digits = digits.slice(1); }
      else if (country === 'india') { effectiveCC = '+91'; }
      else if (country === 'united states' || country === 'us' || country === 'usa') { effectiveCC = '+1'; }
    }
    // India format: +91 XXXXX XXXXX
    if (effectiveCC === '+91' && digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    // US format: +1 XXX XXX XXXX
    if (effectiveCC === '+1' && digits.length === 10) {
      return `+1 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    // Generic: show country code + digits
    return effectiveCC ? `${effectiveCC} ${digits}` : digits || '-';
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leagueService.deleteUmpire(boardId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['umpires', boardId] }),
  });

  const updateMutation = useMutation({
    mutationFn: () => leagueService.updateUmpire(boardId, editId!, {
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
      mobile: editMobile.trim(),
      countryCode: editMobile.trim() ? editCountryCode : '',
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

  const populateEditFields = (u: any) => {
    setEditName(u.umpireName || u.name || u.userName || u.fullName || '');
    setEditAddress1(u.address1 || u.addressLine1 || '');
    setEditAddress2(u.address2 || u.addressLine2 || '');
    setEditCity(u.city || '');
    setEditState(u.state || '');
    setEditCountry(u.country || '');
    setEditZipcode(u.zipcode || u.zipCode || '');
    setEditHomePhone(u.homePhone || '');
    setEditWorkPhone(u.workPhone || '');
    const rawMobile = u.mobile || u.contactNumber || '';
    const apiCC = u.countryCode || '';
    const umpireCountry = (u.country || '').toLowerCase();
    if (apiCC) {
      setEditCountryCode(apiCC);
      const digits = rawMobile.startsWith(apiCC) ? rawMobile.slice(apiCC.length) : rawMobile;
      setEditMobile(digits.replace(/\D/g, ''));
    } else if (rawMobile) {
      const digits = rawMobile.replace(/\D/g, '');
      // Try to detect country code from raw number
      if (digits.startsWith('91') && digits.length === 12) { setEditCountryCode('+91'); setEditMobile(digits.slice(2)); }
      else if (digits.startsWith('1') && digits.length === 11) { setEditCountryCode('+1'); setEditMobile(digits.slice(1)); }
      // Use umpire's country field as fallback
      else if (umpireCountry === 'india') { setEditCountryCode('+91'); setEditMobile(digits); }
      else if (umpireCountry === 'united states' || umpireCountry === 'us' || umpireCountry === 'usa') { setEditCountryCode('+1'); setEditMobile(digits); }
      else {
        const knownCodes = ['+91', '+1'];
        const matched = knownCodes.find(code => rawMobile.startsWith(code));
        if (matched) { setEditCountryCode(matched); setEditMobile(rawMobile.slice(matched.length).replace(/\D/g, '')); }
        else { setEditCountryCode('+1'); setEditMobile(digits); }
      }
    } else {
      // Default based on umpire country
      if (umpireCountry === 'india') setEditCountryCode('+91');
      else setEditCountryCode('+1');
      setEditMobile('');
    }
    setEditEmail(u.email || '');
    // Compute parsed values for editOriginal — must match the logic above
    let parsedCode = '+1';
    let parsedMobile = '';
    const origDigits = rawMobile.replace(/\D/g, '');
    if (apiCC) {
      parsedCode = apiCC;
      parsedMobile = (rawMobile.startsWith(apiCC) ? rawMobile.slice(apiCC.length) : rawMobile).replace(/\D/g, '');
    } else if (rawMobile) {
      if (origDigits.startsWith('91') && origDigits.length === 12) { parsedCode = '+91'; parsedMobile = origDigits.slice(2); }
      else if (origDigits.startsWith('1') && origDigits.length === 11) { parsedCode = '+1'; parsedMobile = origDigits.slice(1); }
      else if (umpireCountry === 'india') { parsedCode = '+91'; parsedMobile = origDigits; }
      else if (umpireCountry === 'united states' || umpireCountry === 'us' || umpireCountry === 'usa') { parsedCode = '+1'; parsedMobile = origDigits; }
      else { const m = ['+91', '+1'].find(c => rawMobile.startsWith(c)); if (m) { parsedCode = m; parsedMobile = rawMobile.slice(m.length).replace(/\D/g, ''); } else { parsedMobile = origDigits; } }
    } else {
      if (umpireCountry === 'india') parsedCode = '+91';
    }
    setEditOriginal({ name: u.umpireName || u.name || u.userName || u.fullName || '', address1: u.address1 || u.addressLine1 || '', address2: u.address2 || u.addressLine2 || '', city: u.city || '', state: u.state || '', country: u.country || '', zipcode: u.zipcode || u.zipCode || '', homePhone: u.homePhone || '', workPhone: u.workPhone || '', mobile: parsedMobile, countryCode: parsedCode, email: u.email || '' });
  };

  const handleEdit = (u: any) => {
    const uid = u.id || u.umpireId;
    setEditId(uid);
    setUpdateError('');
    setUpdateSuccess('');
    // Pre-fill from list data immediately
    populateEditFields(u);
    // Then fetch full data from API to ensure all fields are populated
    setEditLoading(true);
    leagueService.getUmpireById(boardId, uid)
      .then(res => {
        const raw = res.data as any;
        const full = raw?.data || raw;
        if (full && typeof full === 'object') {
          console.log('Umpire full data from API:', JSON.stringify(full, null, 2));
          populateEditFields(full);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch umpire details, using list data:', err?.message);
      })
      .finally(() => setEditLoading(false));
  };

  const cancelEdit = () => {
    const hasChanges = editOriginal && (editName !== editOriginal.name || editAddress1 !== editOriginal.address1 || editAddress2 !== editOriginal.address2 || editCity !== editOriginal.city || editState !== editOriginal.state || editCountry !== editOriginal.country || editZipcode !== editOriginal.zipcode || editHomePhone !== editOriginal.homePhone || editWorkPhone !== editOriginal.workPhone || editMobile !== editOriginal.mobile || editCountryCode !== editOriginal.countryCode || editEmail !== editOriginal.email);
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
        <h2 className="text-2xl font-bold text-gray-800">Umpire List</h2>
        {!showCreate && !editId && (
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-2">
            <span className="text-xl font-bold leading-none">+</span> Create Umpire
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
          {editLoading && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">Loading umpire details...</div>}
          {updateError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{updateError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            {/* Row 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Umpire Name <span className="text-red-500">*</span></label>
              <input value={editName} onChange={e => setEditName(sanitizeTextInput(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input value={editAddress1} onChange={e => setEditAddress1(sanitizeTextInput(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input value={editAddress2} onChange={e => setEditAddress2(sanitizeTextInput(e.target.value))} className="input-field" />
            </div>

            {/* Row 2: Country → State → City */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
              {countryDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCountryDropdownOpen(false); setCountrySearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between border-gray-400 ${countriesLoading ? 'bg-gray-50' : ''}`}
                onClick={() => { if (!countriesLoading) setCountryDropdownOpen(!countryDropdownOpen); }}
              >
                <span className={editCountry ? 'text-gray-900' : 'text-gray-400'}>{countriesLoading ? 'Loading countries...' : editCountry || ''}</span>
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
                className={`input-field flex items-center justify-between border-gray-400 ${!editCountry || statesLoading ? 'bg-gray-200 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
                onClick={() => { if (editCountry && !statesLoading) setStateDropdownOpen(!stateDropdownOpen); }}
              >
                <span className={editState ? 'text-gray-900' : 'text-gray-400'}>{!editCountry ? '' : statesLoading ? 'Loading states...' : editState || ''}</span>
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
                className={`input-field flex items-center justify-between border-gray-400 ${!editState || citiesLoading ? 'bg-gray-200 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
                onClick={() => { if (editState && !citiesLoading) setCityDropdownOpen(!cityDropdownOpen); }}
              >
                <span className={editCity ? 'text-gray-900' : 'text-gray-400'}>{!editState ? '' : citiesLoading ? 'Loading...' : editCity || ''}</span>
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
              <input value={editZipcode} maxLength={editCountry === 'United States' ? 5 : 6} onChange={e => { const max = editCountry === 'United States' ? 5 : 6; setEditZipcode(e.target.value.replace(/\D/g, '').slice(0, max)); }} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <div className="flex gap-2">
                <div className="relative">
                  {editPhoneCodeDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setEditPhoneCodeDropdownOpen(false); setEditPhoneCodeSearchText(''); }} />}
                  <div
                    className="input-field text-sm w-36 cursor-pointer flex items-center gap-2"
                    onClick={() => { if (!editPhoneCodesLoading) setEditPhoneCodeDropdownOpen(!editPhoneCodeDropdownOpen); }}
                  >
                    <img src={editCountryCode === '+91' ? '/images/flag-in.svg' : '/images/flag-us.svg'} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
                    <span className="flex-1 text-gray-900">{editPhoneCodesLoading ? 'Loading...' : (() => { const sel = editPhoneCodeList.find(c => c.dial_code === editCountryCode); return sel ? `${sel.dial_code} (${sel.code})` : `${editCountryCode}`; })()}</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${editPhoneCodeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  {editPhoneCodeDropdownOpen && (
                    <div className="absolute z-10 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg">
                      <div className="p-2 border-b border-gray-100">
                        <input type="text" value={editPhoneCodeSearchText} onChange={e => setEditPhoneCodeSearchText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent" placeholder="Search code..." autoFocus onClick={e => e.stopPropagation()} />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {(editPhoneCodeList.length > 0 ? editPhoneCodeList : [{ name: 'India', code: 'IN', dial_code: '+91', flag: '' }, { name: 'United States', code: 'US', dial_code: '+1', flag: '' }])
                          .filter(c => !editPhoneCodeSearchText || c.dial_code.includes(editPhoneCodeSearchText) || c.code.toLowerCase().includes(editPhoneCodeSearchText.toLowerCase()) || c.name.toLowerCase().includes(editPhoneCodeSearchText.toLowerCase()))
                          .map(c => (
                          <button key={`${c.code}-${c.dial_code}`} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 flex items-center gap-2 ${editCountryCode === c.dial_code ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                            onClick={() => { setEditCountryCode(c.dial_code); setEditPhoneCodeDropdownOpen(false); setEditPhoneCodeSearchText(''); }}>
                            <img src={c.code === 'IN' ? '/images/flag-in.svg' : '/images/flag-us.svg'} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
                            {c.dial_code} ({c.code})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  value={(() => { const d = editMobile; if (editCountryCode === '+1' && d.length > 0) { const a = d.slice(0,3), b = d.slice(3,6), c = d.slice(6); return d.length <= 3 ? `(${a}` : d.length <= 6 ? `(${a}) ${b}` : `(${a}) ${b}-${c}`; } if (editCountryCode === '+91' && d.length > 0) { return d.length <= 5 ? d.slice(0,5) : `${d.slice(0,5)} ${d.slice(5)}`; } return d; })()}
                  maxLength={editCountryCode === '+1' ? 14 : 11}
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
            <button onClick={cancelEdit} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={() => {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,3}$/;
              if (!emailRegex.test(editEmail.trim())) { setUpdateError('Please enter a valid email address'); return; }
              setUpdateError('');
              updateMutation.mutate();
            }} disabled={!editName.trim() || !editCity.trim() || !editState.trim() || !editCountry.trim() || !editZipcode.trim() || !editEmail.trim() || updateMutation.isPending} className="btn-primary text-sm px-8">
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </button>
          </div>
          </div>
        </div>
      )}

      {!editId && (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="py-8 text-center text-gray-400">Loading umpires...</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr className="text-white text-left font-bold text-sm" style={{backgroundColor: '#8091A5'}}>
                      <th className="py-3 px-4 rounded-tl-lg w-[18%]">Umpire Name</th>
                      <th className="py-3 px-4 w-[22%]">Email-ID</th>
                      <th className="py-3 px-4 w-[18%]">Contact Number</th>
                      <th className="py-3 px-4 w-[16%]">Rating</th>
                      <th className="py-3 px-4 w-[14%]">Matches</th>
                      <th className="py-3 px-4 rounded-tr-lg w-[12%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {umpireList.map((u: any) => {
                      const uid = u.id || u.umpireId;
                      return (
                        <tr key={uid} className={`border-b last:border-b-0 hover:bg-gray-50 ${editId === uid ? 'bg-blue-50' : ''}`}>
                          <td className="py-3 px-4 font-medium truncate">{u.umpireName || u.name || '-'}</td>
                          <td className="py-3 px-4 truncate">{u.email || '-'}</td>
                          <td className="py-3 px-4 truncate">{formatPhone(u)}</td>
                          <td className="py-3 px-4 truncate">{u.rating != null ? `${'?�'.repeat(Math.round(u.rating))} (${Number(u.rating).toFixed(1)})` : '-'}</td>
                          <td className="py-3 px-4">{u.totalMatches ?? '-'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-4">
                              <button onClick={() => handleEdit(u)} className="text-blue-500 hover:text-blue-700" title="Edit">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button onClick={() => setDeleteConfirmId(uid)} disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-700" title="Delete">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!umpireList.length) && (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400">No umpires created yet.</td></tr>
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
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(u)} className="text-blue-500 hover:text-blue-700" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => setDeleteConfirmId(uid)} disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-700" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div><span className="text-gray-400">Email:</span> {u.email || '-'}</div>
                        <div><span className="text-gray-400">Phone:</span> {formatPhone(u)}</div>
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
function CreateGroundTab({ boardId, onCreated, onClose }: { boardId: string; onCreated?: () => void; onClose?: () => void }) {
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
  // New fields
  const [placeOfGround, setPlaceOfGround] = useState('');
  const [additionalDirection, setAdditionalDirection] = useState('');
  const [groundFacilities, setGroundFacilities] = useState('');
  const [pitchDescription, setPitchDescription] = useState('');
  const [wicketType, setWicketType] = useState('Regular Turf');
  const [permitHour, setPermitHour] = useState('');
  const [permitMinutes, setPermitMinutes] = useState('');
  const [permitSeconds, setPermitSeconds] = useState('');
  const [permitAmPm, setPermitAmPm] = useState('AM');
  const [permitTimezone, setPermitTimezone] = useState('EST');
  const [wicketDropdownOpen, setWicketDropdownOpen] = useState(false);
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
    const max = country === 'United States' ? 5 : 6;
    setZipCode(prev => prev.slice(0, max));
  }, [country]);

  useEffect(() => {
    if (!country || !state) { setCityList([]); return; }
    setCitiesLoading(true);
    fetchCities(country, state).then(setCityList).catch(() => setCityList([])).finally(() => setCitiesLoading(false));
  }, [country, state]);

  // Fetch Team Boards from GET /Boards/bytype/1 (boardType=1 = Team Boards)
  const { data: boardsList, isLoading: boardsLoading } = useQuery({
    queryKey: ['teamBoards'],
    queryFn: async () => {
      const res = await boardService.getByType(1, 1, 50);
      const raw = res.data as any;
      console.log('[TeamBoards-Schedule] API response:', raw);
      const items = Array.isArray(raw) ? raw : (raw?.items ?? raw?.data ?? (Array.isArray(raw?.result) ? raw.result : []));
      return (Array.isArray(items) ? items : []).map((b: any) => ({
        id: b.id || b.Id || b.boardId || '',
        name: b.name || b.boardName || b.Name || '',
        logoUrl: b.logoUrl || '',
      }));
    },
    staleTime: 60000,
    retry: 1,
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
    setPlaceOfGround(''); setAdditionalDirection(''); setGroundFacilities('');
    setPitchDescription(''); setWicketType('Regular Turf');
    setPermitHour(''); setPermitMinutes(''); setPermitSeconds(''); setPermitAmPm('AM'); setPermitTimezone('EST');
  };

  const createMutation = useMutation({
    mutationFn: () => {
      // Build permitTime as single string e.g. "01:30:00 AM"
      const permitTime = (permitHour && permitMinutes) ? `${permitHour.padStart(2, '0')}:${permitMinutes.padStart(2, '0')}:${(permitSeconds || '0').padStart(2, '0')} ${permitAmPm}` : '';
      const payload = {
        boardId: boardId,
        groundName: name.trim(),
        address1: placeOfGround.trim(),
        address2: address1.trim(),
        placeOfGround: placeOfGround.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        zipcode: zipCode.trim(),
        landmark: landmark.trim(),
        homeTeam: homeTeam,
        additionalDirection: additionalDirection.trim(),
        groundFacilities: groundFacilities.trim(),
        pitchDescription: pitchDescription.trim(),
        wicketType: wicketType,
        permitTime: permitTime,
      };
      console.log('Creating ground with payload:', JSON.stringify(payload, null, 2));
      return leagueService.createGround(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grounds', boardId] });
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
      console.error('Create ground error:', err?.response?.status, JSON.stringify(err?.response?.data, null, 2));
      const detail = err?.response?.data;
      // Extract the most useful error message from various .NET response shapes
      // Prioritize specific field errors over generic title
      const fieldErrors = detail?.errors ? Object.entries(detail.errors).map(([k, v]: [string, any]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ') : '';
      const msg = fieldErrors
        || detail?.detail
        || detail?.message
        || detail?.title
        || (typeof detail === 'string' ? detail : '')
        || err?.message
        || 'Failed to create ground. Please try again.';
      setErrorMsg(`${msg}${detail?.status ? ` (Status: ${detail.status})` : ''}`);
      setSuccessMsg('');
    },
  });

  const handleSubmit = () => {
    setErrorMsg('');
    if (!name.trim() || !city.trim() || !state.trim() || !country.trim() || !zipCode.trim()) {
      setErrorMsg('Please fill in all mandatory fields: Ground Name, City, State, Country, Zip Code.');
      return;
    }
    if (!permitHour.trim() || !permitMinutes.trim()) {
      setErrorMsg('Please fill in the Permit Time (HH and MM are required).');
      return;
    }
    createMutation.mutate();
  };

  const hasAnyData = () => name.trim() || address1.trim() || address2.trim() || city.trim() || state.trim() || country.trim() || zipCode.trim() || landmark.trim() || homeTeam.trim() || placeOfGround.trim() || additionalDirection.trim() || groundFacilities.trim() || pitchDescription.trim() || permitHour.trim() || permitMinutes.trim();

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
            {/* Row 1: Ground Name, Place of Ground, Address Line 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ground Name <span className="text-red-500">*</span></label>
              <input value={name} onChange={e => setName(sanitizeTextInput(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Place of Ground <span className="text-red-500">*</span></label>
              <input value={placeOfGround} onChange={e => setPlaceOfGround(sanitizeTextInput(e.target.value, true))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input value={address1} onChange={e => setAddress1(sanitizeTextInput(e.target.value, true))} className="input-field" />
            </div>

            {/* Row 2: Country, State, City */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
              {countryDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCountryDropdownOpen(false); setCountrySearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between border-gray-400 ${countriesLoading ? 'bg-gray-50' : ''}`}
                onClick={() => { if (!countriesLoading) setCountryDropdownOpen(!countryDropdownOpen); }}
              >
                <span className={country ? 'text-gray-900' : 'text-gray-400'}>{countriesLoading ? 'Loading countries...' : country || ''}</span>
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
                className={`input-field flex items-center justify-between border-gray-400 ${!country || statesLoading ? 'bg-gray-200 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
                onClick={() => { if (country && !statesLoading) setStateDropdownOpen(!stateDropdownOpen); }}
              >
                <span className={state ? 'text-gray-900' : 'text-gray-400'}>{!country ? '' : statesLoading ? 'Loading states...' : state || ''}</span>
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
                className={`input-field flex items-center justify-between border-gray-400 ${!state || citiesLoading ? 'bg-gray-200 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
                onClick={() => { if (state && !citiesLoading) setCityDropdownOpen(!cityDropdownOpen); }}
              >
                <span className={city ? 'text-gray-900' : 'text-gray-400'}>{!state ? '' : citiesLoading ? 'Loading...' : city || ''}</span>
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

            {/* Row 3: Zip Code, Landmark, Home Team */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code <span className="text-red-500">*</span></label>
              <input value={zipCode} maxLength={country === 'United States' ? 5 : 6} onChange={e => { const max = country === 'United States' ? 5 : 6; setZipCode(e.target.value.replace(/\D/g, '').slice(0, max)); }} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
              <input value={landmark} onChange={e => setLandmark(sanitizeTextInput(e.target.value, true))} className="input-field" />
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
                              onClick={() => { setSelectedHomeTeam(b); setHomeTeam(b.id); setShowHomeTeamDropdown(false); setHomeTeamSearch(''); }}
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

            {/* Row 4: Additional Direction, Ground Facilities, Pitch Description (textareas) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Direction</label>
              <textarea value={additionalDirection} onChange={e => setAdditionalDirection(sanitizeTextInput(e.target.value, true))} rows={3} className="input-field resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ground Facilities</label>
              <textarea value={groundFacilities} onChange={e => setGroundFacilities(sanitizeTextInput(e.target.value, true))} rows={3} className="input-field resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pitch Description</label>
              <textarea value={pitchDescription} onChange={e => setPitchDescription(sanitizeTextInput(e.target.value, true))} rows={3} className="input-field resize-none" />
            </div>

            {/* Row 5: Wicket Type, Permit Time */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Wicket Type</label>
              {wicketDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => setWicketDropdownOpen(false)} />}
              <div
                className="input-field cursor-pointer flex items-center justify-between"
                onClick={() => setWicketDropdownOpen(!wicketDropdownOpen)}
              >
                <span className="text-gray-900">{wicketType}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${wicketDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {wicketDropdownOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  {['Regular Turf', 'Artificial Turf', 'Matting', 'Concrete', 'Indoor'].map(wt => (
                    <button key={wt} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${wicketType === wt ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                      onClick={() => { setWicketType(wt); setWicketDropdownOpen(false); }}>{wt}</button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Permit Time <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-2">
                <input
                  value={permitHour}
                  onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || (Number(v) >= 0 && Number(v) <= 12)) setPermitHour(v.slice(0, 2)); }}
                  placeholder="HH"
                  maxLength={2}
                  className="input-field w-16 text-center"
                />
                <span className="text-gray-500 font-bold">:</span>
                <input
                  value={permitMinutes}
                  onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || (Number(v) >= 0 && Number(v) <= 59)) setPermitMinutes(v.slice(0, 2)); }}
                  placeholder="MM"
                  maxLength={2}
                  className="input-field w-16 text-center"
                />
                <span className="text-gray-500 font-bold">:</span>
                <input
                  value={permitSeconds}
                  onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || (Number(v) >= 0 && Number(v) <= 59)) setPermitSeconds(v.slice(0, 2)); }}
                  placeholder="SS"
                  maxLength={2}
                  className="input-field w-16 text-center"
                />
                <select
                  value={permitAmPm}
                  onChange={e => setPermitAmPm(e.target.value)}
                  className="input-field w-20 text-center appearance-none cursor-pointer"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
                <select
                  value={permitTimezone}
                  onChange={e => setPermitTimezone(e.target.value)}
                  className="input-field w-20 text-center appearance-none cursor-pointer"
                >
                  <option value="EST">EST</option>
                  <option value="IST">IST</option>
                </select>
              </div>
            </div>
            <div>{/* spacer */}</div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !name.trim() || !city.trim() || !state.trim() || !country.trim() || !zipCode.trim() || !permitHour.trim() || !permitMinutes.trim()}
              className="btn-primary px-8 py-2 text-sm"
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
function GroundListTab({ boardId, onDirtyChange }: { boardId: string; onDirtyChange?: (dirty: boolean) => void }) {
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
  const [editSelectedHomeTeam, setEditSelectedHomeTeam] = useState<{ id: string; name: string; logoUrl?: string } | null>(null);
  const [editHomeTeamSearch, setEditHomeTeamSearch] = useState('');
  const [editShowHomeTeamDropdown, setEditShowHomeTeamDropdown] = useState(false);
  const [updateError, setUpdateError] = useState('');
  // New ground fields for edit
  const [editPlaceOfGround, setEditPlaceOfGround] = useState('');
  const [editAdditionalDirection, setEditAdditionalDirection] = useState('');
  const [editGroundFacilities, setEditGroundFacilities] = useState('');
  const [editPitchDescription, setEditPitchDescription] = useState('');
  const [editWicketType, setEditWicketType] = useState('Regular Turf');
  const [editPermitHour, setEditPermitHour] = useState('');
  const [editPermitMinutes, setEditPermitMinutes] = useState('');
  const [editPermitSeconds, setEditPermitSeconds] = useState('');
  const [editPermitAmPm, setEditPermitAmPm] = useState('AM');
  const [editPermitTimezone, setEditPermitTimezone] = useState('EST');
  const [editWicketDropdownOpen, setEditWicketDropdownOpen] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [editOriginal, setEditOriginal] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

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
    const max = editCountry === 'United States' ? 5 : 6;
    setEditZipcode(prev => prev.slice(0, max));
  }, [editCountry]);

  useEffect(() => {
    if (!editCountry || !editState) { setCityList([]); return; }
    setCitiesLoading(true);
    fetchCities(editCountry, editState).then(setCityList).catch(() => setCityList([])).finally(() => setCitiesLoading(false));
  }, [editCountry, editState]);

  useEffect(() => { onDirtyChange?.(showCreate || !!editId); }, [showCreate, editId]);

  // Fetch all team boards for home team edit dropdown
  const { data: editTeamBoards, isLoading: editTeamsLoading } = useQuery({
    queryKey: ['allTeamBoards'],
    queryFn: async () => {
      try {
        const res = await boardService.getMyBoards(1, 200);
        const raw = res.data as any;
        const items = Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
        return items
          .filter((b: any) => (b.boardType === 1 || b.boardType === 'Team'))
          .map((b: any) => ({
            id: b.id || b.Id || b.boardId || '',
            name: b.name || b.boardName || b.Name || '',
            logoUrl: b.logoUrl || '',
          }));
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
  const editTeamList = Array.isArray(editTeamBoards) ? editTeamBoards : [];
  const editFilteredTeams = editTeamList.filter((b: any) => {
    const q = editHomeTeamSearch.toLowerCase();
    return !q || b.name?.toLowerCase().includes(q);
  });

  const { data: grounds, isLoading } = useQuery({
    queryKey: ['grounds', boardId],
    queryFn: () => leagueService.getGrounds(boardId).then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d as any)?.data ?? (d as any)?.items ?? [];
    }),
    enabled: !!boardId,
  });
  const groundList = Array.isArray(grounds) ? grounds : [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leagueService.deleteGround(boardId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grounds', boardId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      const permitTime = (editPermitHour && editPermitMinutes) ? `${editPermitHour.padStart(2, '0')}:${editPermitMinutes.padStart(2, '0')}:${(editPermitSeconds || '0').padStart(2, '0')} ${editPermitAmPm}` : '';
      return leagueService.updateGround(boardId, editId!, {
        id: editId!,
        groundId: editId!,
        groundName: editName,
        address1: editPlaceOfGround,
        address2: editAddress1,
        placeOfGround: editPlaceOfGround,
        city: editCity,
        state: editState,
        country: editCountry,
        zipcode: editZipcode,
        landmark: editLandmark,
        homeTeam: editHomeTeam,
        additionalDirection: editAdditionalDirection,
        groundFacilities: editGroundFacilities,
        pitchDescription: editPitchDescription,
        wicketType: editWicketType,
        permitTime: permitTime,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grounds', boardId] });
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

  const populateGroundFields = (g: any) => {
    setEditName(g.groundName || '');
    setEditAddress1(g.address2 || '');
    setEditAddress2('');
    setEditCity(g.city || '');
    setEditState(g.state || '');
    setEditCountry(g.country || '');
    setEditZipcode(g.zipcode || '');
    setEditLandmark(g.landmark || '');
    setEditHomeTeam(g.homeTeam || '');
    const matchedTeam = editTeamList.find((b: any) => b.name === (g.homeTeam || ''));
    setEditSelectedHomeTeam(matchedTeam || (g.homeTeam ? { id: '', name: g.homeTeam, logoUrl: '' } : null));
    setEditHomeTeamSearch('');
    setEditPlaceOfGround(g.address1 || g.placeOfGround || '');
    // API uses typo "additonalDirection"
    setEditAdditionalDirection(g.additionalDirection || g.additonalDirection || '');
    setEditGroundFacilities(g.groundFacilities || '');
    setEditPitchDescription(g.pitchDescription || '');
    setEditWicketType(g.wicketType || 'Regular Turf');
    // Parse permitTime string "HH:MM:SS AM/PM TZ" into separate fields
    const pt = g.permitTime || '';
    const ptMatch = pt.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)(?:\s+(EST|IST))?$/i);
    setEditPermitHour(ptMatch ? ptMatch[1] : '');
    setEditPermitMinutes(ptMatch ? ptMatch[2] : '');
    setEditPermitSeconds(ptMatch && ptMatch[3] ? ptMatch[3] : '');
    setEditPermitAmPm(ptMatch && ptMatch[4] ? ptMatch[4].toUpperCase() : 'AM');
    setEditPermitTimezone(ptMatch && ptMatch[5] ? ptMatch[5].toUpperCase() : 'EST');
    const dirVal = g.additionalDirection || g.additonalDirection || '';
    setEditOriginal({ name: g.groundName || '', address1: g.address2 || '', address2: '', city: g.city || '', state: g.state || '', country: g.country || '', zipcode: g.zipcode || '', landmark: g.landmark || '', homeTeam: g.homeTeam || '', placeOfGround: g.address1 || g.placeOfGround || '', additionalDirection: dirVal, groundFacilities: g.groundFacilities || '', pitchDescription: g.pitchDescription || '', wicketType: g.wicketType || 'Regular Turf', permitTimeHour: ptMatch ? ptMatch[1] : '', permitTimeMinutes: ptMatch ? ptMatch[2] : '', permitTimeSeconds: ptMatch && ptMatch[3] ? ptMatch[3] : '', permitTimeAmPm: ptMatch && ptMatch[4] ? ptMatch[4].toUpperCase() : 'AM', permitTimeTimezone: ptMatch && ptMatch[5] ? ptMatch[5].toUpperCase() : 'EST' });
  };

  const handleEdit = (g: any) => {
    const gid = g.id || g.groundId;
    setEditId(gid);
    setUpdateError('');
    setUpdateSuccess('');
    // Pre-fill from list data immediately
    populateGroundFields(g);
    // Then fetch full data from API
    setEditLoading(true);
    leagueService.getGroundById(boardId, gid)
      .then(res => {
        const raw = res.data as any;
        const full = raw?.data || raw;
        if (full && typeof full === 'object') {
          console.log('Ground full data from API:', JSON.stringify(full, null, 2));
          populateGroundFields(full);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch ground details, using list data:', err?.message);
      })
      .finally(() => setEditLoading(false));
  };

  const cancelEdit = () => {
    const hasChanges = editOriginal && (editName !== editOriginal.name || editAddress1 !== editOriginal.address1 || editAddress2 !== editOriginal.address2 || editCity !== editOriginal.city || editState !== editOriginal.state || editCountry !== editOriginal.country || editZipcode !== editOriginal.zipcode || editLandmark !== editOriginal.landmark || editHomeTeam !== editOriginal.homeTeam || editPlaceOfGround !== editOriginal.placeOfGround || editAdditionalDirection !== editOriginal.additionalDirection || editGroundFacilities !== editOriginal.groundFacilities || editPitchDescription !== editOriginal.pitchDescription || editWicketType !== editOriginal.wicketType || editPermitHour !== editOriginal.permitTimeHour || editPermitMinutes !== editOriginal.permitTimeMinutes || editPermitAmPm !== editOriginal.permitTimeAmPm);
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
        <h2 className="text-2xl font-bold text-gray-800">Ground List</h2>
        {!showCreate && !editId && (
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-2">
            <span className="text-xl font-bold leading-none">+</span> Create Ground
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-6">
          <CreateGroundTab boardId={boardId} onClose={() => setShowCreate(false)} />
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
          {editLoading && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">Loading ground details...</div>}
          {updateError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{updateError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            {/* Row 1: Ground Name, Place of Ground, Address Line 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ground Name <span className="text-red-500">*</span></label>
              <input value={editName} onChange={e => setEditName(sanitizeTextInput(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Place of Ground <span className="text-red-500">*</span></label>
              <input value={editPlaceOfGround} onChange={e => setEditPlaceOfGround(sanitizeTextInput(e.target.value, true))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input value={editAddress1} onChange={e => setEditAddress1(sanitizeTextInput(e.target.value, true))} className="input-field" />
            </div>

            {/* Row 2: City, State, Country */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
              {cityDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCityDropdownOpen(false); setCitySearchText(''); }} />}
              <div
                className={`input-field flex items-center justify-between border-gray-400 ${!editState || citiesLoading ? 'bg-gray-200 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
                onClick={() => { if (editState && !citiesLoading) setCityDropdownOpen(!cityDropdownOpen); }}
              >
                <span className={editCity ? 'text-gray-900' : 'text-gray-400'}>{!editState ? '' : citiesLoading ? 'Loading...' : editCity || ''}</span>
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
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
              {stateDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setStateDropdownOpen(false); setStateSearchText(''); }} />}
              <div
                className={`input-field flex items-center justify-between border-gray-400 ${!editCountry || statesLoading ? 'bg-gray-200 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
                onClick={() => { if (editCountry && !statesLoading) setStateDropdownOpen(!stateDropdownOpen); }}
              >
                <span className={editState ? 'text-gray-900' : 'text-gray-400'}>{!editCountry ? '' : statesLoading ? 'Loading states...' : editState || ''}</span>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
              {countryDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => { setCountryDropdownOpen(false); setCountrySearchText(''); }} />}
              <div
                className={`input-field cursor-pointer flex items-center justify-between border-gray-400 ${countriesLoading ? 'bg-gray-50' : ''}`}
                onClick={() => { if (!countriesLoading) setCountryDropdownOpen(!countryDropdownOpen); }}
              >
                <span className={editCountry ? 'text-gray-900' : 'text-gray-400'}>{countriesLoading ? 'Loading countries...' : editCountry || ''}</span>
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

            {/* Row 3: Zip Code, Landmark, Home Team */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code <span className="text-red-500">*</span></label>
              <input value={editZipcode} maxLength={editCountry === 'United States' ? 5 : 6} onChange={e => { const max = editCountry === 'United States' ? 5 : 6; setEditZipcode(e.target.value.replace(/\D/g, '').slice(0, max)); }} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
              <input value={editLandmark} onChange={e => setEditLandmark(sanitizeTextInput(e.target.value, true))} className="input-field" />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Home Team for the Ground</label>
              {editSelectedHomeTeam ? (
                <div className="flex items-center gap-2 input-field bg-gray-50">
                  <div className="w-6 h-6 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-xs">
                    {editSelectedHomeTeam.logoUrl
                      ? <img src={editSelectedHomeTeam.logoUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                      : editSelectedHomeTeam.name?.[0]?.toUpperCase() || '?'
                    }
                  </div>
                  <span className="flex-1 text-sm truncate">{editSelectedHomeTeam.name}</span>
                  <button type="button" onClick={() => { setEditSelectedHomeTeam(null); setEditHomeTeam(''); setEditHomeTeamSearch(''); }} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
                </div>
              ) : (
                <>
                  {editShowHomeTeamDropdown && (
                    <div className="fixed inset-0 z-[5]" onClick={() => { setEditShowHomeTeamDropdown(false); setEditHomeTeamSearch(''); }} />
                  )}
                  <div
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between"
                    onClick={() => setEditShowHomeTeamDropdown(!editShowHomeTeamDropdown)}
                  >
                    <span className="text-gray-400 text-sm">Select Team</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${editShowHomeTeamDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {editShowHomeTeamDropdown && (
                    <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl" style={{ top: '100%' }}>
                      <div className="p-2 border-b border-gray-100">
                        <input
                          type="text"
                          value={editHomeTeamSearch}
                          onChange={e => setEditHomeTeamSearch(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-brand-green focus:border-transparent"
                          placeholder="Search teams..."
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {editTeamsLoading ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading teams...</div>
                        ) : editFilteredTeams.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">No teams found</div>
                        ) : (
                          editFilteredTeams.map((b: any) => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => { setEditSelectedHomeTeam(b); setEditHomeTeam(b.name); setEditShowHomeTeamDropdown(false); setEditHomeTeamSearch(''); }}
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

            {/* Row 4: Additional Direction, Ground Facilities, Pitch Description (textareas) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Direction</label>
              <textarea value={editAdditionalDirection} onChange={e => setEditAdditionalDirection(sanitizeTextInput(e.target.value, true))} rows={3} className="input-field resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ground Facilities</label>
              <textarea value={editGroundFacilities} onChange={e => setEditGroundFacilities(sanitizeTextInput(e.target.value, true))} rows={3} className="input-field resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pitch Description</label>
              <textarea value={editPitchDescription} onChange={e => setEditPitchDescription(sanitizeTextInput(e.target.value, true))} rows={3} className="input-field resize-none" />
            </div>

            {/* Row 5: Wicket Type, Permit Time */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Wicket Type</label>
              {editWicketDropdownOpen && <div className="fixed inset-0 z-[5]" onClick={() => setEditWicketDropdownOpen(false)} />}
              <div
                className="input-field cursor-pointer flex items-center justify-between"
                onClick={() => setEditWicketDropdownOpen(!editWicketDropdownOpen)}
              >
                <span className="text-gray-900">{editWicketType}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${editWicketDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {editWicketDropdownOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  {['Regular Turf', 'Artificial Turf', 'Matting', 'Concrete', 'Indoor'].map(wt => (
                    <button key={wt} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-green/10 ${editWicketType === wt ? 'bg-brand-green/10 text-brand-green font-medium' : 'text-gray-700'}`}
                      onClick={() => { setEditWicketType(wt); setEditWicketDropdownOpen(false); }}>{wt}</button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Permit Time <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-2">
                <input
                  value={editPermitHour}
                  onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || (Number(v) >= 0 && Number(v) <= 12)) setEditPermitHour(v.slice(0, 2)); }}
                  placeholder="HH"
                  maxLength={2}
                  className="input-field w-16 text-center"
                />
                <span className="text-gray-500 font-bold">:</span>
                <input
                  value={editPermitMinutes}
                  onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || (Number(v) >= 0 && Number(v) <= 59)) setEditPermitMinutes(v.slice(0, 2)); }}
                  placeholder="MM"
                  maxLength={2}
                  className="input-field w-16 text-center"
                />
                <span className="text-gray-500 font-bold">:</span>
                <input
                  value={editPermitSeconds}
                  onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || (Number(v) >= 0 && Number(v) <= 59)) setEditPermitSeconds(v.slice(0, 2)); }}
                  placeholder="SS"
                  maxLength={2}
                  className="input-field w-16 text-center"
                />
                <select
                  value={editPermitAmPm}
                  onChange={e => setEditPermitAmPm(e.target.value)}
                  className="input-field w-20 text-center appearance-none cursor-pointer"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
                <select
                  value={editPermitTimezone}
                  onChange={e => setEditPermitTimezone(e.target.value)}
                  className="input-field w-20 text-center appearance-none cursor-pointer"
                >
                  <option value="EST">EST</option>
                  <option value="IST">IST</option>
                </select>
              </div>
            </div>
            <div>{/* spacer */}</div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={cancelEdit} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={() => updateMutation.mutate()} disabled={!editName.trim() || !editCity.trim() || !editState.trim() || !editCountry.trim() || !editZipcode.trim() || !editPermitHour.trim() || !editPermitMinutes.trim() || updateMutation.isPending} className="btn-primary text-sm px-8">
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </button>
          </div>
          </div>
        </div>
      )}

      {!editId && (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="py-8 text-center text-gray-400">Loading grounds...</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr className="text-white text-left font-bold text-sm" style={{backgroundColor: '#8091A5'}}>
                      <th className="py-3 px-4 rounded-tl-lg w-[18%]">Ground Name</th>
                      <th className="py-3 px-4 w-[14%]">Country</th>
                      <th className="py-3 px-4 w-[22%]">State</th>
                      <th className="py-3 px-4 w-[14%]">City</th>
                      <th className="py-3 px-4 w-[22%]">Home Team</th>
                      <th className="py-3 px-4 rounded-tr-lg w-[10%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groundList.map((g: any) => {
                      const gid = g.id || g.groundId;
                      const homeTeamBoard = g.homeTeam ? editTeamList.find((b: any) => b.id === g.homeTeam) : null;
                      const homeTeamDisplay = homeTeamBoard?.name || g.homeTeamName || (!g.homeTeam ? '-' : g.homeTeam);
                      return (
                        <tr key={gid} className={`border-b last:border-b-0 hover:bg-gray-50 ${editId === gid ? 'bg-blue-50' : ''}`}>
                          <td className="py-3 px-4 font-medium truncate">{g.groundName || '-'}</td>
                          <td className="py-3 px-4 truncate">{g.country || '-'}</td>
                          <td className="py-3 px-4 truncate">{g.state || '-'}</td>
                          <td className="py-3 px-4 truncate">{g.city || '-'}</td>
                          <td className="py-3 px-4 truncate">{homeTeamDisplay}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEdit(g)} className="text-blue-500 hover:text-blue-700" title="Edit">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button onClick={() => setDeleteConfirmId(gid)} disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-700" title="Delete">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!groundList.length) && (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400">No grounds created yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden space-y-4">
                {groundList.map((g: any) => {
                  const gid = g.id || g.groundId;
                  const mobileHomeTeam = g.homeTeam ? (editTeamList.find((b: any) => b.id === g.homeTeam)?.name || g.homeTeamName || g.homeTeam) : '-';
                  return (
                    <div key={gid} className={`border rounded-lg p-4 ${editId === gid ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">???</span>
                          <h3 className="font-medium text-gray-800">{g.groundName || '-'}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(g)} className="text-blue-500 hover:text-blue-700" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => setDeleteConfirmId(gid)} disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-700" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div><span className="text-gray-400">Country:</span> {g.country || '-'}</div>
                      <div><span className="text-gray-400">State:</span> {g.state || '-'}</div>
                      <div><span className="text-gray-400">City:</span> {g.city || '-'}</div>
                      <div><span className="text-gray-400">Home Team:</span> {mobileHomeTeam}</div>
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

function CreateTrophyTab({ boardId, onClose, editTournamentId }: { boardId: string; onClose?: () => void; editTournamentId?: string | null }) {
  const isEditMode = !!editTournamentId;
  const [name, setName] = useState('');
  const [winPoints, setWinPoints] = useState('2');
  const [umpireOption, setUmpireOption] = useState<'list' | 'buddy'>('list');
  const [groups, setGroups] = useState<TrophyGroup[]>([{ name: '', teamIds: [] }]);
  const [teamSearches, setTeamSearches] = useState<string[]>(['']);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const dropdownTriggerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // Fetch tournament details when in edit mode
  useEffect(() => {
    if (!editTournamentId) return;
    setEditLoading(true);
    tournamentService.getTournamentById(editTournamentId).then(res => {
      const d = res.data as any;
      setName(d.name || d.tournamentName || '');
      setWinPoints(String(d.winPoints ?? d.winPoint ?? 2));
      const allowList = d.allowUmpireFromList ?? true;
      const allowBuddy = d.allowBuddyAsUmpire ?? false;
      setUmpireOption(allowBuddy ? 'buddy' : 'list');
      const rawGroups = d.groups || d.groupList || [];
      if (Array.isArray(rawGroups) && rawGroups.length > 0) {
        const parsed = rawGroups.map((g: any) => {
          const rawTeams = g.teamBoardIds || g.teams || g.teamBoardId || [];
          let teamIds: string[] = [];
          if (Array.isArray(rawTeams)) {
            teamIds = rawTeams.map((item: any) => typeof item === 'string' ? item : item?.teamBoardId || item?.boardId || item?.id || '').filter(Boolean);
          }
          return { name: g.name || g.tournamentGroupName || '', teamIds };
        });
        setGroups(parsed);
        setTeamSearches(parsed.map(() => ''));
      }
    }).catch(err => {
      console.error('[EditTournament] Fetch error:', err);
      setErrorMsg('Failed to load tournament details.');
    }).finally(() => setEditLoading(false));
  }, [editTournamentId]);

  // Load Team Boards from GET /Boards/bytype/1 (boardType=1 = Team Boards)
  const [teamBoardError, setTeamBoardError] = useState('');
  const { data: boardsList, isLoading: boardsLoading, refetch: refetchBoards } = useQuery({
    queryKey: ['teamBoards'],
    queryFn: async () => {
      try {
        setTeamBoardError('');
        const res = await boardService.getByType(1, 1, 50);
        const raw = res.data as any;
        console.log('[TeamBoards] API response:', raw);
        const items = Array.isArray(raw) ? raw : (raw?.items ?? raw?.data ?? (Array.isArray(raw?.result) ? raw.result : []));
        const list = Array.isArray(items) ? items : [];
        console.log('[TeamBoards] Parsed items:', list.length);
        return list.map((b: any) => ({
          id: b.id || b.Id || b.boardId || '',
          name: b.name || b.boardName || b.Name || '',
          logoUrl: b.logoUrl || '',
          description: b.description || b.city || '',
        }));
      } catch (err) {
        console.error('[TeamBoards] API error:', err);
        setTeamBoardError('Failed to load Team Boards. Please try again.');
        throw err;
      }
    },
    enabled: isEditMode,
    staleTime: 60000,
    retry: 1,
  });

  const buildPayload = () => ({
    name: name,
    winPoints: Number(winPoints) || 0,
    allowUmpireFromList: umpireOption === 'list',
    allowBuddyAsUmpire: umpireOption === 'buddy',
    groups: groups.map((g, idx) => ({
      name: g.name,
      sortOrder: idx,
      teamBoardIds: g.teamIds,
    })),
  });

  const createMutation = useMutation({
    mutationFn: () => tournamentService.createTournament(boardId, buildPayload()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournaments', boardId] });
      qc.invalidateQueries({ queryKey: ['umpireTournaments'] });
      setName(''); setWinPoints('2'); setGroups([{ name: '', teamIds: [] }]); setTeamSearches(['']);
      setSuccessMsg('Tournament created successfully!');
      setErrorMsg('');
      if (onClose) onClose();
      setTimeout(() => { setSuccessMsg(''); }, 4000);
    },
    onError: (err: any) => {
      const respData = err?.response?.data;
      let msg = typeof respData === 'string' ? respData : respData?.message || respData?.title || respData?.detail || '';
      if (respData?.errors) {
        const ve = Object.entries(respData.errors).map(([f, e]) => `${f}: ${Array.isArray(e) ? e.join(', ') : e}`).join('; ');
        msg = msg ? `${msg} — ${ve}` : ve;
      }
      setErrorMsg(msg || err?.message || 'Failed to create tournament. Please try again.');
      setSuccessMsg('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => tournamentService.updateTournament(editTournamentId!, buildPayload()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournaments', boardId] });
      qc.invalidateQueries({ queryKey: ['umpireTournaments'] });
      setSuccessMsg('Tournament updated successfully!');
      setErrorMsg('');
      setTimeout(() => { setSuccessMsg(''); if (onClose) onClose(); }, 4000);
    },
    onError: (err: any) => {
      const respData = err?.response?.data;
      let msg = typeof respData === 'string' ? respData : respData?.message || respData?.title || respData?.detail || '';
      if (respData?.errors) {
        const ve = Object.entries(respData.errors).map(([f, e]) => `${f}: ${Array.isArray(e) ? e.join(', ') : e}`).join('; ');
        msg = msg ? `${msg} — ${ve}` : ve;
      }
      setErrorMsg(msg || err?.message || 'Failed to update tournament. Please try again.');
      setSuccessMsg('');
    },
  });

  const saveMutation = isEditMode ? updateMutation : createMutation;

  const addGroup = () => {
    setGroups([...groups, { name: '', teamIds: [] }]);
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

  const [duplicateTeamErrors, setDuplicateTeamErrors] = useState<Record<number, string>>({});

  const addTeamToGroup = (groupIdx: number, teamId: string) => {
    const updated = [...groups];
    if (!updated[groupIdx].teamIds.includes(teamId)) {
      // Check if this team is already selected in another group
      const otherGroupIdx = updated.findIndex((g, i) => i !== groupIdx && g.teamIds.includes(teamId));
      if (otherGroupIdx !== -1) {
        setDuplicateTeamErrors(prev => ({ ...prev, [groupIdx]: 'Team Board must be unique' }));
        const searches = [...teamSearches];
        searches[groupIdx] = '';
        setTeamSearches(searches);
        return;
      }
      setDuplicateTeamErrors(prev => { const next = { ...prev }; delete next[groupIdx]; return next; });
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
    setDuplicateTeamErrors(prev => { const next = { ...prev }; delete next[groupIdx]; return next; });
  };

  const getFilteredBoards = (groupIdx: number) => {
    const search = teamSearches[groupIdx]?.toLowerCase() || '';
    const alreadySelected = groups[groupIdx].teamIds;
    const selectedInOtherGroups = groups.flatMap((g, i) => i !== groupIdx ? g.teamIds : []);
    return (boardsList || []).filter((b: any) =>
      !alreadySelected.includes(b.id) &&
      !selectedInOtherGroups.includes(b.id) &&
      (!search || b.name.toLowerCase().includes(search))
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="bg-gray-100 px-6 py-3 border-b">
          <h2 className="text-base font-bold text-gray-800">{isEditMode ? 'Edit Tournament' : 'Group Tournament'}</h2>
        </div>

        {editLoading ? (
          <div className="p-6 flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" /></div>
        ) : (
        <div className="p-6 space-y-6">
          {/* Tournament Name + Win Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Tournament Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
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
                <button
                  type="button"
                  onClick={() => setCollapsedGroups(prev => {
                    const next = new Set(prev);
                    if (next.has(gIdx)) next.delete(gIdx); else next.add(gIdx);
                    return next;
                  })}
                  className="w-full bg-red-600 text-white px-4 py-2 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-bold text-sm uppercase">{group.name || '\u00A0'}</span>
                  <div className="flex items-center gap-2">
                    {groups.length > 1 && (
                      <span onClick={(e) => { e.stopPropagation(); removeGroup(gIdx); }} className="text-white hover:text-red-200 cursor-pointer" title="Remove group">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </span>
                    )}
                    <svg className={`w-4 h-4 transition-transform duration-200 ${collapsedGroups.has(gIdx) ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {!collapsedGroups.has(gIdx) && (
                <div className="p-4 space-y-4">
                  {/* Group Name  -  full width */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={group.name}
                      onChange={e => updateGroupName(gIdx, e.target.value)}
                      className="input-field w-full"
                    />
                  </div>

                  {/* Team slots  -  fixed dropdown row + chips row below */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team Board <span className="text-red-500">*</span>
                    </label>
                    {duplicateTeamErrors[gIdx] && (
                      <p className="text-red-500 text-xs mb-2">{duplicateTeamErrors[gIdx]}</p>
                    )}

                    {/* Select Team dropdown  -  always fixed at top, never moves */}
                    <div className="relative w-44 mb-3"
                      ref={el => { dropdownTriggerRefs.current[gIdx] = el; }}
                    >
                      <div
                        className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer flex items-center justify-between bg-gray-50 hover:border-brand-green hover:bg-brand-green/5 transition-colors"
                        onClick={() => {
                          if (openDropdown === gIdx) {
                            setOpenDropdown(null);
                            setDropdownPos(null);
                          } else {
                            const el = dropdownTriggerRefs.current[gIdx];
                            if (el) {
                              const rect = el.getBoundingClientRect();
                              setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: Math.max(rect.width, 224) });
                            }
                            setOpenDropdown(gIdx);
                            refetchBoards();
                          }
                        }}
                      >
                        <span className="text-gray-400 text-sm truncate">Select Team</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-1 ${openDropdown === gIdx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Portal dropdown  -  renders at body level to escape overflow:hidden */}
                    {openDropdown === gIdx && dropdownPos && ReactDOM.createPortal(
                      <>
                        <div className="fixed inset-0 z-[9998]" onClick={() => { setOpenDropdown(null); setDropdownPos(null); const s = [...teamSearches]; s[gIdx] = ''; setTeamSearches(s); }} />
                        <div
                          className="absolute z-[9999] bg-white border border-gray-200 rounded-lg shadow-2xl"
                          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
                        >
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
                          {teamBoardError && <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-b border-red-100">{teamBoardError}</div>}
                          <div className="max-h-60 overflow-y-auto">
                            {boardsLoading ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />Loading Team Boards...</div>
                            ) : (() => {
                              const filtered = getFilteredBoards(gIdx);
                              return filtered.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">No Team Boards Available</div>
                              ) : (
                                filtered.map((b: any) => (
                                  <button
                                    key={b.id}
                                    onClick={() => {
                                      addTeamToGroup(gIdx, b.id);
                                      setOpenDropdown(null);
                                      setDropdownPos(null);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-brand-green/5 flex items-center gap-2 text-sm border-b last:border-0"
                                  >
                                    <div className="w-7 h-7 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold text-xs flex-shrink-0">
                                      {b.logoUrl
                                        ? <img src={b.logoUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                                        : b.name?.[0]?.toUpperCase() || '?'
                                      }
                                    </div>
                                    <div className="min-w-0">
                                      <span className="block font-medium text-gray-900 truncate">{b.name}</span>
                                      {b.description && <span className="block text-xs text-gray-600 truncate">{b.description}</span>}
                                    </div>
                                  </button>
                                ))
                              );
                            })()}
                          </div>
                        </div>
                      </>,
                      document.body
                    )}

                    {/* Selected team chips  -  separate row, never shifts the dropdown above */}
                    {group.teamIds.length > 0 && (
                      <div className="flex flex-wrap gap-3 items-start mt-1">
                        {group.teamIds.map(tid => {
                          const board = boardsList?.find((b: any) => b.id === tid);
                          return (
                            <div key={tid} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm min-w-[140px] max-w-[180px]">
                              {board?.logoUrl
                                ? <img src={board.logoUrl} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                                : <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-xs flex-shrink-0">??</div>
                              }
                              <span className="text-sm font-medium text-gray-800 truncate flex-1">{board?.name || tid}</span>
                              <button
                                onClick={() => removeTeamFromGroup(gIdx, tid)}
                                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-1"
                                title="Remove team"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>
            ))}

            <button
              onClick={addGroup}
              className="btn-primary text-sm px-6"
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
                const hasData = name.trim() || winPoints !== '2' || groups.some(g => g.name.trim() !== '' || g.teamIds.length > 0) || groups.length > 1;
                if (hasData) { setShowCancelConfirm(true); return; }
                if (onClose) onClose();
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
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
                const groupNames = groups.map(g => g.name.trim().toLowerCase());
                const duplicates = groupNames.filter((n, i) => groupNames.indexOf(n) !== i);
                if (duplicates.length > 0) { setErrorMsg('Group names must be different. Please use unique names for each group.'); return; }
                // Check for duplicate Team Boards across groups
                const allTeamIds: string[] = [];
                const dupErrors: Record<number, string> = {};
                for (let i = 0; i < groups.length; i++) {
                  for (const tid of groups[i].teamIds) {
                    if (allTeamIds.includes(tid)) {
                      dupErrors[i] = 'Team Board must be unique';
                      break;
                    }
                    allTeamIds.push(tid);
                  }
                }
                if (Object.keys(dupErrors).length > 0) {
                  setDuplicateTeamErrors(dupErrors);
                  setErrorMsg('Team Board must be unique across all groups.');
                  return;
                }
                setDuplicateTeamErrors({});
                saveMutation.mutate();
              }}
              disabled={saveMutation.isPending || !name.trim() || !winPoints.trim() || groups.length === 0 || groups.some(g => !g.name.trim() || g.teamIds.length === 0)}
              className="btn-primary text-sm px-6"
            >
              {saveMutation.isPending ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update' : 'Create Schedule')}
            </button>
          </div>


        </div>
        )}
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
                <button onClick={() => { setShowCancelConfirm(false); setName(''); setWinPoints('2'); setGroups([{ name: '', teamIds: [] }]); setTeamSearches(['']); setErrorMsg(''); setSuccessMsg(''); if (onClose) onClose(); }} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors text-sm">Yes, Discard</button>
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
function TournamentsTab({ boardId, onDirtyChange }: { boardId: string; onDirtyChange?: (dirty: boolean) => void }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  useEffect(() => { onDirtyChange?.(showCreate || !!editId); }, [showCreate, editId]);

  // Fetch tournaments from GET /api/v1/tournament/boards/{boardId}/tournaments (umpireApi)
  const { data: tournaments, isLoading, isFetching } = useQuery({
    queryKey: ['umpireTournaments', boardId],
    queryFn: async () => {
      const r = await tournamentService.getTournaments(boardId, 1, 100);
      const d = r.data as any;
      const list = Array.isArray(d) ? d : d?.items ?? d?.data ?? [];
      return list;
    },
  });
  const tournamentList = Array.isArray(tournaments) ? tournaments : [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tournamentService.deleteTournament(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['umpireTournaments'] });
      setUpdateSuccess('Tournament deleted successfully!');
      setTimeout(() => setUpdateSuccess(''), 4000);
    },
    onError: (err: any) => setUpdateError(err?.response?.data?.message || err?.message || 'Failed to delete tournament.'),
  });

  const handleEdit = (t: any) => {
    setEditId(t.id);
    setUpdateError('');
    setUpdateSuccess('');
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tournaments</h2>
        {!showCreate && !editId && (
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-2">
            <span className="text-xl font-bold leading-none">+</span> Create Tournament
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-6">
          <CreateTrophyTab boardId={boardId} onClose={() => setShowCreate(false)} />
        </div>
      )}

      {!showCreate && editId && (
        <div className="mb-6">
          <CreateTrophyTab boardId={boardId} editTournamentId={editId} onClose={() => { setEditId(null); setUpdateError(''); setUpdateSuccess(''); }} />
        </div>
      )}

      {!showCreate && !editId && (
        <>
      {updateSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{updateSuccess}</div>}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="bg-gray-100 px-4 sm:px-6 py-3 border-b">
          <h2 className="text-base font-bold text-gray-800">Tournament List</h2>
        </div>
        <div className="p-4 sm:p-6">
          {(isLoading || isFetching) ? (
            <div className="py-8 text-center text-gray-400">Loading tournaments...</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr className="text-white text-left font-bold text-sm" style={{backgroundColor: '#8091A5'}}>
                      <th className="py-3 px-4 rounded-tl-lg w-[30%]">Tournament Name</th>
                      <th className="py-3 px-4 w-[18%]">Win Points</th>
                      <th className="py-3 px-4 w-[18%]">Match Type</th>
                      <th className="py-3 px-4 w-[18%]">Status</th>
                      <th className="py-3 px-4 rounded-tr-lg w-[16%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournamentList.map((t: any) => {
                      const tid = t.id;
                      return (
                        <tr key={tid} className={`border-b last:border-b-0 hover:bg-gray-50 ${editId === tid ? 'bg-blue-50' : ''}`}>
                          <td className="py-3 px-4 font-medium truncate">{t.tournamentName || t.name || '-'}</td>
                          <td className="py-3 px-4">{t.winPoint ?? '-'}</td>
                          <td className="py-3 px-4">{t.matchType || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${t.active === 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {t.active === 0 ? 'Inactive' : 'Active'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEdit(t)} className="text-blue-500 hover:text-blue-700" title="Edit">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button onClick={() => setDeleteConfirmId(tid)} disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-700" title="Delete">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!tournamentList.length) && (
                      <tr><td colSpan={5} className="py-8 text-center text-gray-400">No tournaments created yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden space-y-4">
                {tournamentList.map((t: any) => {
                  const tid = t.id;
                  return (
                    <div key={tid} className={`border rounded-lg p-4 ${editId === tid ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-800">{t.tournamentName || t.name || '-'}</h3>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(t)} className="text-blue-500 hover:text-blue-700" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => setDeleteConfirmId(tid)} disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-700" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div><span className="text-gray-400">Win Points:</span> {t.winPoint ?? '-'}</div>
                        <div><span className="text-gray-400">Match Type:</span> {t.matchType || '-'}</div>
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
        </>
      )}
    </div>
  );
}

// ── SCHEDULE TAB ──
function ScheduleTab({ boardId, onDirtyChange }: { boardId: string; onDirtyChange?: (dirty: boolean) => void }) {
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

  // SessionStorage helpers for schedule form
  const SS_PREFIX = 'schedule_';
  const ssSet = (key: string, val: string) => { sessionStorage.setItem(SS_PREFIX + key, val); };
  const ssGet = (key: string) => sessionStorage.getItem(SS_PREFIX + key) || '';
  const ssClearAll = () => {
    ['tournamentId', 'gameType', 'homeTeamId', 'awayTeamId', 'groundId', 'umpireId', 'appScorerId', 'portalScorerId', 'startAtUtc'].forEach(k => sessionStorage.removeItem(SS_PREFIX + k));
  };

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

  useEffect(() => { onDirtyChange?.(showCreate || !!editMatchId); }, [showCreate, editMatchId]);

  const qc = useQueryClient();

  // Fetch game types from API
  const { data: gameTypeOptions } = useQuery({
    queryKey: ['gameTypes'],
    queryFn: async () => {
      const r = await leagueService.getGameTypes();
      const d = r.data;
      const list = Array.isArray(d) ? d : (d as any)?.items ?? (d as any)?.data ?? (d as any)?.$values ?? [];
      return list as string[];
    },
  });

  const { data: matches } = useQuery({
    queryKey: ['schedule', boardId, from, to],
    queryFn: () => leagueService.getSchedule(boardId, from, to).then(r => {
      const d = r.data;
      const list = Array.isArray(d) ? d : (d as any)?.items ?? (d as any)?.data ?? [];
      console.log('?? Schedule GET raw response:', d);
      if (list.length > 0) console.log('?? First schedule item keys:', Object.keys(list[0]), 'values:', list[0]);
      return list;
    }),
    enabled: !!from && !!to,
  });

  // Fetch tournaments from umpire API (has groupList with teamBoardId)
  const { data: umpireTournaments } = useQuery({
    queryKey: ['umpireTournaments', boardId],
    queryFn: async () => {
      const r = await tournamentService.getTournaments(boardId, 1, 100);
      const d = r.data as any;
      return Array.isArray(d) ? d : d?.items ?? d?.data ?? [];
    },
  });
  const tournamentList = Array.isArray(umpireTournaments) ? umpireTournaments : [];

  // Helper: deeply unwrap $values from .NET JSON responses
  const unwrapValues = (d: any): any[] => {
    if (Array.isArray(d)) return d;
    if (!d || typeof d !== 'object') return [];
    if (Array.isArray(d.$values)) return d.$values;
    if (Array.isArray(d.data?.$values)) return d.data.$values;
    if (Array.isArray(d.result?.$values)) return d.result.$values;
    if (Array.isArray(d.items?.$values)) return d.items.$values;
    if (Array.isArray(d.teams?.$values)) return d.teams.$values;
    if (Array.isArray(d.teamBoards?.$values)) return d.teamBoards.$values;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d.result)) return d.result;
    if (Array.isArray(d.teams)) return d.teams;
    if (Array.isArray(d.teamBoards)) return d.teamBoards;
    if (Array.isArray(d.rosters)) return d.rosters;
    if (Array.isArray(d.rosters?.$values)) return d.rosters.$values;
    return [];
  };

  const mapTeamItem = (t: any) => ({
    id: t.rosterId || t.RosterId || t.id || t.Id || t.teamId || t.TeamId || t.teamBoardId || t.TeamBoardId || t.boardId || t.BoardId || '',
    name: t.rosterName || t.RosterName || t.name || t.teamName || t.TeamName || t.boardName || t.BoardName || t.Name || '',
    logoUrl: t.logoUrl || t.logo || '',
  });

  // Load Team Boards from GET /Boards/bytype/1 (boardType=1 = Team Boards)
  const { data: boardsList } = useQuery({
    queryKey: ['teamBoards'],
    queryFn: async () => {
      const res = await boardService.getByType(1, 1, 50);
      const raw = res.data as any;
      console.log('[TeamBoards-Schedule] raw response:', raw);
      const items = unwrapValues(raw);
      console.log('[TeamBoards-Schedule] unwrapped items:', items.length, items.slice(0, 2));
      return items.map((b: any) => ({
        id: b.id || b.Id || b.boardId || '',
        name: b.name || b.boardName || b.Name || '',
        logoUrl: b.logoUrl || '',
      }));
    },
    staleTime: 60000,
  });
  const allBoards = Array.isArray(boardsList) ? boardsList : [];

  // Fetch teams for the selected tournament via Schedules dropdown API
  // API: GET /tournament/Schedules/dropdowns/{tournamentId}/teams
  const { data: tournamentTeams, isLoading: tournamentTeamsLoading } = useQuery({
    queryKey: ['tournamentTeams', newTournamentId],
    queryFn: async () => {
      const r = await leagueService.getTeamsByTournament(newTournamentId);
      const d = r.data as any;
      console.log('🏏 Tournament teams raw response:', JSON.stringify(d, null, 2));
      // Try multiple response shapes from the API
      const inner = d?.data || d;
      // Look for rosters array first (API returns rosterId/rosterName)
      const rosters = Array.isArray(inner?.rosters) ? inner.rosters
        : Array.isArray(inner?.rosters?.$values) ? inner.rosters.$values
        : Array.isArray(inner?.Rosters) ? inner.Rosters
        : [];
      const teamsboard = Array.isArray(inner?.teamsboard) ? inner.teamsboard
        : Array.isArray(inner?.teamsBoard) ? inner.teamsBoard
        : Array.isArray(inner?.TeamsBoard) ? inner.TeamsBoard
        : Array.isArray(inner?.teams) ? inner.teams
        : Array.isArray(inner?.Teams) ? inner.Teams
        : [];
      // Prefer rosters, then teamsboard, then generic unwrap
      const list = rosters.length > 0 ? rosters : teamsboard.length > 0 ? teamsboard : unwrapValues(inner);
      console.log('🏏 Tournament teams extracted:', list.length, list.slice(0, 3));
      const mapped = list.map(mapTeamItem);
      console.log('🏏 Tournament teams mapped:', mapped.length, mapped.slice(0, 3));
      return mapped;
    },
    enabled: !!newTournamentId,
  });
  const tournamentTeamList = Array.isArray(tournamentTeams) ? tournamentTeams : [];

  // Fetch teams for the selected edit tournament
  // API: GET /tournament/Schedules/dropdowns/{tournamentId}/teams
  const { data: editTournamentTeamsData, isLoading: editTournamentTeamsLoading } = useQuery({
    queryKey: ['editTournamentTeams', editTournamentId],
    queryFn: async () => {
      const r = await leagueService.getTeamsByTournament(editTournamentId);
      const d = r.data as any;
      console.log('🏏 Edit tournament teams raw response:', JSON.stringify(d, null, 2));
      const inner = d?.data || d;
      const rosters = Array.isArray(inner?.rosters) ? inner.rosters
        : Array.isArray(inner?.rosters?.$values) ? inner.rosters.$values
        : Array.isArray(inner?.Rosters) ? inner.Rosters
        : [];
      const teamsboard = Array.isArray(inner?.teamsboard) ? inner.teamsboard
        : Array.isArray(inner?.teamsBoard) ? inner.teamsBoard
        : Array.isArray(inner?.TeamsBoard) ? inner.TeamsBoard
        : Array.isArray(inner?.teams) ? inner.teams
        : Array.isArray(inner?.Teams) ? inner.Teams
        : [];
      const list = rosters.length > 0 ? rosters : teamsboard.length > 0 ? teamsboard : unwrapValues(inner);
      return list.map(mapTeamItem);
    },
    enabled: !!editTournamentId && !!editMatchId,
  });
  const editTournamentTeamList = Array.isArray(editTournamentTeamsData) ? editTournamentTeamsData : [];

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
    queryKey: ['grounds', boardId],
    queryFn: () => leagueService.getGrounds(boardId).then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d as any)?.data ?? (d as any)?.items ?? [];
    }),
    enabled: !!boardId,
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

  // Collect unique tournament IDs from schedule to fetch team names
  const scheduleTournamentIds = Array.from(new Set(matchList.map((m: any) => m.tournamentId).filter(Boolean))) as string[];
  const { data: rosterNameMap } = useQuery({
    queryKey: ['rosterNameMap', scheduleTournamentIds.join(',')],
    queryFn: async () => {
      const map: Record<string, string> = {};
      await Promise.all(scheduleTournamentIds.map(async (tid) => {
        try {
          const r = await leagueService.getTeamsByTournament(tid);
          const d = r.data as any;
          const inner = d?.data || d;
          const rosters = Array.isArray(inner?.rosters) ? inner.rosters
            : Array.isArray(inner?.rosters?.$values) ? inner.rosters.$values
            : Array.isArray(inner?.Rosters) ? inner.Rosters
            : [];
          const teamsboard = Array.isArray(inner?.teamsboard) ? inner.teamsboard
            : Array.isArray(inner?.teamsBoard) ? inner.teamsBoard
            : Array.isArray(inner?.teams) ? inner.teams
            : [];
          const list = rosters.length > 0 ? rosters : teamsboard.length > 0 ? teamsboard : unwrapValues(inner);
          list.forEach((t: any) => {
            const id = t.rosterId || t.RosterId || t.id || t.Id || t.teamId || t.teamBoardId || t.boardId || '';
            const name = t.rosterName || t.RosterName || t.name || t.teamName || t.boardName || t.Name || '';
            if (id && name) map[id] = name;
          });
        } catch (e) { /* skip failed lookups */ }
      }));
      return map;
    },
    enabled: scheduleTournamentIds.length > 0,
    staleTime: 60000,
  });
  const rosterLookup = rosterNameMap || {};

  // Lookup helpers to resolve IDs to names for the schedule table
  const lookupTournamentName = (m: any) =>
    m.tournamentName || tournamentList.find((t: any) => t.id === m.tournamentId)?.tournamentName || tournamentList.find((t: any) => t.id === m.tournamentId)?.name || '-';
  const lookupTeamName = (teamId: string | undefined) => {
    if (!teamId) return '-';
    return rosterLookup[teamId] || allBoards.find((b: any) => b.id === teamId)?.name || teamId.slice(0, 8) + '...';
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
  }, [showCreate, tournamentList.length]);

  // SessionStorage helpers for schedule edit form
  const EDIT_SS_PREFIX = 'schedule_edit_';
  const editSsSet = (key: string, val: string) => { sessionStorage.setItem(EDIT_SS_PREFIX + key, val); };
  const editSsGet = (key: string) => sessionStorage.getItem(EDIT_SS_PREFIX + key) || '';
  const editSsClearAll = () => {
    ['id', 'tournamentId', 'gameType', 'homeTeamId', 'awayTeamId', 'groundId', 'umpireId', 'appScorerId', 'portalScorerId', 'startAtUtc'].forEach(k => sessionStorage.removeItem(EDIT_SS_PREFIX + k));
  };

  const updateMatchMutation = useMutation({
    mutationFn: () => {
      // Store current edit form values to sessionStorage before sending
      const scheduleId = editSsGet('id') || editMatchId!;
      editSsSet('id', scheduleId);
      editSsSet('tournamentId', editTournamentId);
      editSsSet('gameType', editGameType);
      editSsSet('homeTeamId', editHomeTeamId);
      editSsSet('awayTeamId', editAwayTeamId);
      editSsSet('groundId', editGround);
      editSsSet('umpireId', editUmpire);
      editSsSet('appScorerId', editAppScorer);
      editSsSet('portalScorerId', editPortalScorer);
      editSsSet('startAtUtc', editScheduledAt ? new Date(editScheduledAt).toISOString() : '');

      // Build payload from sessionStorage values
      const payload = {
        tournamentId: editSsGet('tournamentId') || null,
        gameType: editSsGet('gameType') || '',
        homeTeamId: editSsGet('homeTeamId') || null,
        awayTeamId: editSsGet('awayTeamId') || null,
        groundId: editSsGet('groundId') || null,
        startAtUtc: editSsGet('startAtUtc') || null,
        umpireId: editSsGet('umpireId') || null,
        appScorerId: editSsGet('appScorerId') || '',
        portalScorerId: editSsGet('portalScorerId') || '',
        active: true,
      };
      console.log('📋 Schedule PUT payload (from sessionStorage):', JSON.stringify(payload, null, 2));
      console.log('📋 Schedule PUT id:', scheduleId);
      return leagueService.updateSchedule(scheduleId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule', boardId] });
      editSsClearAll();
      setEditMatchId(null);
      setEditError('');
    },
    onError: (error: any) => {
      const respData = error?.response?.data;
      let msg = typeof respData === 'string' ? respData : respData?.message || respData?.title || respData?.detail || '';
      if (respData?.errors) {
        const ve = Object.entries(respData.errors).map(([f, e]) => `${f}: ${Array.isArray(e) ? e.join(', ') : e}`).join('; ');
        msg = msg ? `${msg}  -  ${ve}` : ve;
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
      // Store current form values to sessionStorage before sending
      ssSet('tournamentId', newTournamentId);
      ssSet('gameType', newGameType);
      ssSet('homeTeamId', newHomeTeamId);
      ssSet('awayTeamId', newAwayTeamId);
      ssSet('groundId', newGroundId);
      ssSet('umpireId', newUmpireId);
      ssSet('appScorerId', newAppScorerId);
      ssSet('portalScorerId', newPortalScorerId);
      ssSet('startAtUtc', newScheduledAt ? new Date(newScheduledAt).toISOString() : new Date().toISOString());

      // Build payload from sessionStorage values
      const payload: Record<string, any> = {
        tournamentId: ssGet('tournamentId') || null,
        gameType: ssGet('gameType') || '',
        homeTeamId: ssGet('homeTeamId') || null,
        awayTeamId: ssGet('awayTeamId') || null,
        groundId: ssGet('groundId') || null,
        startAtUtc: ssGet('startAtUtc'),
        umpireId: ssGet('umpireId') || null,
        appScorerId: ssGet('appScorerId') || null,
        portalScorerId: ssGet('portalScorerId') || null,
        active: true,
      };
      console.log('📋 Schedule POST payload (from sessionStorage):', JSON.stringify(payload, null, 2));
      return tournamentService.createSchedule(payload as any);
    },
    onSuccess: (response: any) => {
      console.log('✅ Schedule created successfully:', response?.data);
      qc.invalidateQueries({ queryKey: ['schedule', boardId] });
      setCreateError('');
      setCreateSuccess('Schedule created successfully!');
      ssClearAll();
      resetCreateForm();
      setShowCreate(false);
      setTimeout(() => setCreateSuccess(''), 4000);
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const respData = error?.response?.data;
      console.error('❌ Schedule creation failed:', status, respData);
      console.error('❌ Full error response:', JSON.stringify(error?.response?.data, null, 2));
      console.error('❌ Request config:', JSON.stringify({ url: error?.config?.url, headers: error?.config?.headers, data: error?.config?.data }, null, 2));
      let msg = '';
      if (typeof respData === 'string') {
        msg = respData;
      } else if (respData) {
        msg = respData.message || respData.title || respData.error || respData.detail || '';
        // Show validation errors if present
        if (respData.errors) {
          const validationErrors = Object.entries(respData.errors)
            .map(([field, errs]) => {
              if (Array.isArray(errs)) return `${field}: ${errs.join(', ')}`;
              if (typeof errs === 'string') return `${field}: ${errs}`;
              if (typeof errs === 'object' && errs !== null) return `${field}: ${JSON.stringify(errs)}`;
              return `${field}: ${String(errs)}`;
            })
            .join('; ');
          msg = msg ? `${msg}  -  ${validationErrors}` : validationErrors;
        }
        // Include exception details if server returns them
        if (respData.exceptionMessage || respData.stackTrace || respData.innerException) {
          const extra = respData.exceptionMessage || respData.innerException?.message || '';
          if (extra) msg = msg ? `${msg} | ${extra}` : extra;
        }
      }
      if (!msg) msg = `Request failed with status code ${status || 'unknown'}. Check browser console for details.`;
      setCreateError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setCreateSuccess('');
    },
  });

  const handleEditMatch = (m: any) => {
    // Store the selected schedule ID in sessionStorage so it persists
    editSsClearAll();
    editSsSet('id', m.id);
    setEditMatchId(m.id);
    setEditTournamentId(m.tournamentId || '');
    setEditGameType(m.gameType || '');
    setEditHomeTeamId(m.homeTeamId || m.homeTeamBoardId || '');
    setEditAwayTeamId(m.awayTeamId || m.awayTeamBoardId || '');
    setEditGround(m.groundId || '');
    setEditUmpire(m.umpireId || '');
    setEditAppScorer(m.appScorerId || '');
    setEditPortalScorer(m.portalScorerId || '');
    const schedAt = m.startAtUtc ? new Date(m.startAtUtc).toISOString().slice(0, 16) : m.scheduledAt ? new Date(m.scheduledAt).toISOString().slice(0, 16) : '';
    setEditScheduledAt(schedAt);
    setEditOriginal({ tournamentId: m.tournamentId || '', gameType: m.gameType || '', homeTeamId: m.homeTeamId || m.homeTeamBoardId || '', awayTeamId: m.awayTeamId || m.awayTeamBoardId || '', ground: m.groundId || '', umpire: m.umpireId || '', appScorer: m.appScorerId || '', portalScorer: m.portalScorerId || '', scheduledAt: schedAt });
    setEditError('');
    // Pre-populate searchable dropdown selections
    const homeId = m.homeTeamId || m.homeTeamBoardId;
    const awayId = m.awayTeamId || m.awayTeamBoardId;
    const homeName = m.homeTeamName || rosterLookup[homeId] || allBoards.find((b: any) => b.id === homeId)?.name || '';
    setSelectedEditHomeTeam(homeId ? { id: homeId, name: homeName || homeId } : null);
    const awayName = m.awayTeamName || rosterLookup[awayId] || allBoards.find((b: any) => b.id === awayId)?.name || '';
    setSelectedEditAwayTeam(awayId ? { id: awayId, name: awayName || awayId } : null);
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
    editSsClearAll();
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
    ssClearAll();
    setNewTournamentId('');
    setNewGameType('');
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
    if (newHomeTeamId && newAwayTeamId && newHomeTeamId === newAwayTeamId) errors.awayTeam = 'Home and Away teams must be different';
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
                  const source = effectiveTeamSource;
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
        <h2 className="text-2xl font-bold text-gray-800">Schedules & Results</h2>
        {!showCreate && !editMatchId && (
          <button onClick={() => {
            setShowCreate(true);
            resetCreateForm(); setCreateError(''); setCreateSuccess('');
          }} className="btn-primary text-sm flex items-center gap-2">
            <span className="text-xl font-bold leading-none">+</span> Create Match
          </button>
        )}
      </div>

      {showCreate && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">Create Match</h3>
          {createError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{createError}</div>}
          {createSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{createSuccess}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tournament <span className="text-red-500">*</span></label>
              <select value={newTournamentId} onChange={e => { setNewTournamentId(e.target.value); ssSet('tournamentId', e.target.value); if (formErrors.tournament) setFormErrors(p => ({ ...p, tournament: '' })); }} className={`input-field ${formErrors.tournament ? 'border-red-500' : ''}`}>
                <option value="">Select Tournament</option>
                {tournamentList.map((t: any) => <option key={t.id} value={t.id}>{t.tournamentName || t.name}</option>)}
              </select>
              {formErrors.tournament && <p className="text-red-500 text-xs mt-1">{formErrors.tournament}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Type <span className="text-red-500">*</span></label>
              <select value={newGameType} onChange={e => { setNewGameType(e.target.value); ssSet('gameType', e.target.value); if (formErrors.gameType) setFormErrors(p => ({ ...p, gameType: '' })); }} className={`input-field ${formErrors.gameType ? 'border-red-500' : ''}`}>
                <option value="">Select Game Type</option>
                {(gameTypeOptions || []).map((gt: string) => <option key={gt} value={gt}>{gt}</option>)}
              </select>
              {formErrors.gameType && <p className="text-red-500 text-xs mt-1">{formErrors.gameType}</p>}
            </div>
            {renderTeamBoardDropdown(
              'Home Team *', homeTeamSearch, setHomeTeamSearch,
              showHomeTeamDropdown, setShowHomeTeamDropdown,
              selectedHomeTeam,
              (b) => { setSelectedHomeTeam(b); setNewHomeTeamId(b.id); ssSet('homeTeamId', b.id); if (b.id === newAwayTeamId) { setNewAwayTeamId(''); setSelectedAwayTeam(null); ssSet('awayTeamId', ''); } if (formErrors.homeTeam) setFormErrors(p => ({ ...p, homeTeam: '' })); },
              () => { setSelectedHomeTeam(null); setNewHomeTeamId(''); ssSet('homeTeamId', ''); setHomeTeamSearch(''); },
              newAwayTeamId,
            )}
            {renderTeamBoardDropdown(
              'Away Team *', awayTeamSearch, setAwayTeamSearch,
              showAwayTeamDropdown, setShowAwayTeamDropdown,
              selectedAwayTeam,
              (b) => { setSelectedAwayTeam(b); setNewAwayTeamId(b.id); ssSet('awayTeamId', b.id); if (formErrors.awayTeam) setFormErrors(p => ({ ...p, awayTeam: '' })); },
              () => { setSelectedAwayTeam(null); setNewAwayTeamId(''); ssSet('awayTeamId', ''); setAwayTeamSearch(''); },
              newHomeTeamId,
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ground</label>
              <select value={newGroundId} onChange={e => { setNewGroundId(e.target.value); ssSet('groundId', e.target.value); }} className="input-field">
                <option value="">Select Ground</option>
                {groundList.map((g: any) => <option key={g.groundId} value={g.groundId}>{g.groundName}</option>)}
              </select>
            </div>
            {renderUmpireDropdown(
              umpireSearch, setUmpireSearch,
              showUmpireDropdown, setShowUmpireDropdown,
              selectedUmpire,
              (u) => { setSelectedUmpire(u); setNewUmpireId(u.id); ssSet('umpireId', u.id); },
              () => { setSelectedUmpire(null); setNewUmpireId(''); ssSet('umpireId', ''); setUmpireSearch(''); },
            )}
            {renderUserSearchDropdown(
              'App Scorer', appScorerSearch, setAppScorerSearch,
              showAppScorerDropdown, setShowAppScorerDropdown,
              selectedAppScorer,
              (u) => { setSelectedAppScorer(u); setNewAppScorerId(u.id); ssSet('appScorerId', u.id); },
              () => { setSelectedAppScorer(null); setNewAppScorerId(''); ssSet('appScorerId', ''); setAppScorerSearch(''); },
            )}
            {renderUserSearchDropdown(
              'Portal Scorer', portalScorerSearch, setPortalScorerSearch,
              showPortalScorerDropdown, setShowPortalScorerDropdown,
              selectedPortalScorer,
              (u) => { setSelectedPortalScorer(u); setNewPortalScorerId(u.id); ssSet('portalScorerId', u.id); },
              () => { setSelectedPortalScorer(null); setNewPortalScorerId(''); ssSet('portalScorerId', ''); setPortalScorerSearch(''); },
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={newScheduledAt} onChange={e => { setNewScheduledAt(e.target.value); ssSet('startAtUtc', e.target.value ? new Date(e.target.value).toISOString() : ''); if (formErrors.scheduledAt) setFormErrors(p => ({ ...p, scheduledAt: '' })); }} className={`input-field ${formErrors.scheduledAt ? 'border-red-500' : ''}`} />
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
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
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
                {(gameTypeOptions || []).map((gt: string) => <option key={gt} value={gt}>{gt}</option>)}
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
            <button onClick={() => updateMatchMutation.mutate()} disabled={!editTournamentId || !editGameType || !editHomeTeamId || !editAwayTeamId || !editScheduledAt || updateMatchMutation.isPending} className="btn-primary text-sm px-6">{updateMatchMutation.isPending ? 'Updating...' : 'Update'}</button>
          </div>
        </div>
      )}

      {!editMatchId && (
      <div className="card">
        <table className="w-full text-sm table-fixed">
          <thead><tr className="text-white text-left font-bold text-sm" style={{backgroundColor: '#8091A5'}}><th className="py-3 px-4 rounded-tl-lg w-[14%]">Tournament</th><th className="py-3 px-4 w-[12%]">Home</th><th className="py-3 px-4 w-[12%]">Away</th><th className="py-3 px-4 w-[12%]">Ground</th><th className="py-3 px-4 w-[12%]">Umpire</th><th className="py-3 px-4 w-[12%]">Scorer</th><th className="py-3 px-4 w-[16%]">Date</th><th className="py-3 px-4 rounded-tr-lg w-[10%]">Actions</th></tr></thead>
          <tbody>
            {matchList.map((m: any) => (
              <tr key={m.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="py-3 px-4 text-xs truncate">{lookupTournamentName(m)}</td>
                <td className="py-3 px-4 font-medium text-sm truncate">{m.homeTeamName || lookupTeamName(m.homeTeamId || m.homeTeamBoardId)}</td>
                <td className="py-3 px-4 font-medium text-sm truncate">{m.awayTeamName || lookupTeamName(m.awayTeamId || m.awayTeamBoardId)}</td>
                <td className="py-3 px-4 text-xs truncate">{m.groundName || lookupGroundName(m.groundId)}</td>
                <td className="py-3 px-4 text-xs truncate">{m.umpireName || lookupUmpireName(m.umpireId)}</td>
                <td className="py-3 px-4 text-xs truncate">{m.scorerName || lookupUserName(m.appScorerId) || '-'}</td>
                <td className="py-3 px-4 text-xs truncate">{new Date(m.startAtUtc || m.scheduledAt).toLocaleString()}</td>
                <td className="py-3 px-4 text-xs"><div className="flex gap-2">
                  <button onClick={() => handleEditMatch(m)} className="text-blue-500 hover:text-blue-700" title="Edit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => setDeleteConfirmId(m.id)} className="text-red-500 hover:text-red-700" title="Delete">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div></td>
              </tr>
            ))}
            {(!matchList.length) && <tr><td colSpan={8} className="py-8 text-center text-gray-400">No matches in selected date range.</td></tr>}
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
