import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardService, leagueService, rosterService, tournamentService } from '../services/cricketSocialService';
import type { Umpire, Ground, Tournament, Match, LeagueApplication, Invoice } from '../types';
import Navbar from '../components/Navbar';

type LeagueTab = 'dashboard' | 'create-umpire' | 'umpire-list' | 'create-ground' | 'ground-list' | 'create-trophy' | 'schedule' | 'tournaments' | 'applications' | 'invoices' | 'cancel-game';

type SidebarSection = 'umpires' | 'grounds' | 'trophy' | 'schedules';

const sidebarSections: { id: SidebarSection; label: string; items: { id: LeagueTab; label: string }[] }[] = [
  {
    id: 'umpires', label: 'UMPIRES',
    items: [
      { id: 'create-umpire', label: 'Create Umpire' },
      { id: 'umpire-list', label: 'Umpire List' },
    ],
  },
  {
    id: 'grounds', label: 'GROUNDS',
    items: [
      { id: 'create-ground', label: 'Create Ground' },
      { id: 'ground-list', label: 'Ground List' },
    ],
  },
  {
    id: 'trophy', label: 'TROPHY',
    items: [
      { id: 'create-trophy', label: 'Create Trophy' },
    ],
  },
  {
    id: 'schedules', label: 'SCHEDULES AND RESULTS',
    items: [
      { id: 'schedule', label: 'Schedule' },
      { id: 'tournaments', label: 'Tournaments' },
      { id: 'cancel-game', label: 'Cancel Game by Date' },
      { id: 'applications', label: 'New Applications' },
      { id: 'invoices', label: 'Invoicing' },
    ],
  },
];

export default function LeagueManagementPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const [activeTab, setActiveTab] = useState<LeagueTab>('dashboard');
  const [expandedSections, setExpandedSections] = useState<SidebarSection[]>([]);
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
              <p className="font-bold text-sm flex items-center gap-1">✏️ {board.name}</p>
              <p className="text-xs text-gray-500 mt-1">{board.fanCount ?? 0} Page Views | {board.rosterCount ?? 0} Users</p>
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
          {activeTab === 'create-umpire' && <CreateUmpireTab boardId={boardId!} />}
          {activeTab === 'umpire-list' && <UmpireListTab boardId={boardId!} />}
          {activeTab === 'create-ground' && <CreateGroundTab />}
          {activeTab === 'ground-list' && <GroundListTab />}
          {activeTab === 'create-trophy' && <CreateTrophyTab boardId={boardId!} />}
          {activeTab === 'tournaments' && <TournamentsTab boardId={boardId!} />}
          {activeTab === 'schedule' && <ScheduleTab boardId={boardId!} />}
          {activeTab === 'cancel-game' && <CancelGameTab boardId={boardId!} />}
          {activeTab === 'applications' && <ApplicationsTab boardId={boardId!} />}
          {activeTab === 'invoices' && <InvoicesTab boardId={boardId!} />}
        </div>
      </div>
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
      return leagueService.getSchedule(boardId, from, to).then(r => r.data);
    },
  });

  const recentResults = schedule?.filter(m => m.status === 'Completed').slice(0, 5) ?? [];
  const upcomingMatches = schedule?.filter(m => m.status === 'Scheduled' || m.status === 'Live').slice(0, 5) ?? [];

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
            {recentResults.map(m => (
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
          <p className="text-gray-400 text-sm italic">No completed match results</p>
        )}
      </div>

      {/* Upcoming / In Progress Matches */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase border-b-2 border-yellow-400 pb-2 mb-3">
          Upcoming/In Progress Matches
        </h3>
        {upcomingMatches.length > 0 ? (
          <div className="space-y-3">
            {upcomingMatches.map(m => (
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
function CreateUmpireTab({ boardId }: { boardId: string }) {
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
  const qc = useQueryClient();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Umpire Name is required';
    if (!city.trim()) newErrors.city = 'City is required';
    if (!state.trim()) newErrors.state = 'State is required';
    if (!country.trim()) newErrors.country = 'Country is required';
    if (!zipCode.trim()) newErrors.zipCode = 'Zip Code is required';
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

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="bg-gray-100 px-6 py-3 border-b">
          <h2 className="text-base font-bold text-gray-800 uppercase">Create Umpire</h2>
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
                <span className="text-red-500">*</span>Umpire Name
              </label>
              <input
                value={name}
                onChange={e => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: '' })); }}
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Search by Name, Email or Mobile No"
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

            {/* Row 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span>City
              </label>
              <input
                value={city}
                onChange={e => { setCity(e.target.value); if (errors.city) setErrors(prev => ({ ...prev, city: '' })); }}
                className={`input-field ${errors.city ? 'border-red-500' : ''}`}
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span>State
              </label>
              <input
                value={state}
                onChange={e => { setState(e.target.value); if (errors.state) setErrors(prev => ({ ...prev, state: '' })); }}
                className={`input-field ${errors.state ? 'border-red-500' : ''}`}
              />
              {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span>Country
              </label>
              <input
                value={country}
                onChange={e => { setCountry(e.target.value); if (errors.country) setErrors(prev => ({ ...prev, country: '' })); }}
                className={`input-field ${errors.country ? 'border-red-500' : ''}`}
              />
              {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
            </div>

            {/* Row 3 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span>Zip Code
              </label>
              <input
                value={zipCode}
                onChange={e => { setZipCode(e.target.value); if (errors.zipCode) setErrors(prev => ({ ...prev, zipCode: '' })); }}
                className={`input-field ${errors.zipCode ? 'border-red-500' : ''}`}
              />
              {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact No</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="input-field w-28"
                >
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+91">+91 (IN)</option>
                  <option value="+61">+61 (AU)</option>
                  <option value="+64">+64 (NZ)</option>
                  <option value="+27">+27 (ZA)</option>
                  <option value="+94">+94 (LK)</option>
                  <option value="+92">+92 (PK)</option>
                  <option value="+880">+880 (BD)</option>
                  <option value="+971">+971 (AE)</option>
                </select>
                <input
                  value={contactNo}
                  onChange={e => setContactNo(e.target.value)}
                  className="input-field flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span>E-mail ID
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

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="px-8 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── UMPIRE LIST TAB ──
function UmpireListTab({ boardId }: { boardId: string }) {
  const qc = useQueryClient();
  const { data: umpires } = useQuery({ queryKey: ['umpires', boardId], queryFn: () => leagueService.getUmpires(boardId).then(r => r.data as Umpire[]) });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => leagueService.deleteUmpire(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['umpires', boardId] }),
  });

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="bg-gray-100 px-6 py-3 border-b">
          <h2 className="text-base font-bold text-gray-800 uppercase">Umpire List</h2>
        </div>
        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
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
              {umpires?.map(u => (
                <tr key={u.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-3 font-medium">{u.name}</td>
                  <td className="py-3">{u.email || '-'}</td>
                  <td className="py-3">{u.contactNumber ? `${u.countryCode || ''} ${u.contactNumber}` : '-'}</td>
                  <td className="py-3">{u.city || '-'}</td>
                  <td className="py-3">{'⭐'.repeat(Math.round(u.rating))} ({u.rating.toFixed(1)})</td>
                  <td className="py-3">{u.totalMatches}</td>
                  <td className="py-3">
                    <button onClick={() => deleteMutation.mutate(u.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
                  </td>
                </tr>
              ))}
              {(!umpires?.length) && (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No umpires created yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── CREATE GROUND TAB ──
function CreateGroundTab() {
  const [name, setName] = useState('');
  const [placeOfGround, setPlaceOfGround] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [additionalDirection, setAdditionalDirection] = useState('');
  const [groundFacilities, setGroundFacilities] = useState('');
  const [pitchDescription, setPitchDescription] = useState('');
  const [wicketType, setWicketType] = useState('Regular Turf');
  const [permitHour, setPermitHour] = useState('');
  const [permitMinute, setPermitMinute] = useState('');
  const [permitPeriod, setPermitPeriod] = useState('AM');
  const [permitZone, setPermitZone] = useState('EST');
  const qc = useQueryClient();

  const resetForm = () => {
    setName(''); setPlaceOfGround(''); setAddressLine1('');
    setCity(''); setState(''); setCountry(''); setZipCode('');
    setLandmark(''); setHomeTeam(''); setAdditionalDirection('');
    setGroundFacilities(''); setPitchDescription(''); setWicketType('Regular Turf');
    setPermitHour(''); setPermitMinute(''); setPermitPeriod('AM'); setPermitZone('EST');
  };

  const createMutation = useMutation({
    mutationFn: () => leagueService.createGround({
      groundName: name,
      address1: placeOfGround || undefined,
      address2: addressLine1 || undefined,
      city: city || undefined,
      state: state || undefined,
      country: country || undefined,
      zipcode: zipCode || undefined,
      landmark: landmark || undefined,
      homeTeam: homeTeam || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grounds'] }); resetForm(); },
  });

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="bg-gray-100 px-6 py-3 border-b">
          <h2 className="text-base font-bold text-gray-800 uppercase">Create Ground</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            {/* Row 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><span className="text-red-500">*</span>Ground Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><span className="text-red-500">*</span>Place of Ground</label>
              <input value={placeOfGround} onChange={e => setPlaceOfGround(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input value={addressLine1} onChange={e => setAddressLine1(e.target.value)} className="input-field" />
            </div>

            {/* Row 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><span className="text-red-500">*</span>City</label>
              <input value={city} onChange={e => setCity(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><span className="text-red-500">*</span>State</label>
              <input value={state} onChange={e => setState(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><span className="text-red-500">*</span>Country</label>
              <input value={country} onChange={e => setCountry(e.target.value)} className="input-field" />
            </div>

            {/* Row 3 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><span className="text-red-500">*</span>Zip Code</label>
              <input value={zipCode} onChange={e => setZipCode(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
              <input value={landmark} onChange={e => setLandmark(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Home Team for the Ground</label>
              <input value={homeTeam} onChange={e => setHomeTeam(e.target.value)} className="input-field" />
            </div>

            {/* Row 4 — textareas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Direction</label>
              <textarea value={additionalDirection} onChange={e => setAdditionalDirection(e.target.value)} className="input-field min-h-[80px] resize-y" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ground Facilities</label>
              <textarea value={groundFacilities} onChange={e => setGroundFacilities(e.target.value)} className="input-field min-h-[80px] resize-y" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pitch Description</label>
              <textarea value={pitchDescription} onChange={e => setPitchDescription(e.target.value)} className="input-field min-h-[80px] resize-y" />
            </div>
          </div>

          {/* Row 5 — Wicket Type + Permit Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5 mt-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wicket Type</label>
              <select value={wicketType} onChange={e => setWicketType(e.target.value)} className="input-field">
                <option>Regular Turf</option>
                <option>Artificial Turf</option>
                <option>Matting</option>
                <option>Drop-in</option>
                <option>Cement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><span className="text-red-500">*</span>Permit Time</label>
              <div className="flex gap-2">
                <input type="number" min="1" max="12" placeholder="Hour" value={permitHour} onChange={e => setPermitHour(e.target.value)} className="input-field w-20" />
                <input type="number" min="0" max="59" placeholder="Minutes" value={permitMinute} onChange={e => setPermitMinute(e.target.value)} className="input-field w-24" />
                <select value={permitPeriod} onChange={e => setPermitPeriod(e.target.value)} className="input-field w-20">
                  <option>AM</option>
                  <option>PM</option>
                </select>
                <select value={permitZone} onChange={e => setPermitZone(e.target.value)} className="input-field w-20">
                  <option>EST</option>
                  <option>CST</option>
                  <option>MST</option>
                  <option>PST</option>
                  <option>IST</option>
                  <option>GMT</option>
                  <option>AEST</option>
                  <option>NZST</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => name && placeOfGround && city && state && country && zipCode && createMutation.mutate()}
              disabled={!name || !placeOfGround || !city || !state || !country || !zipCode || createMutation.isPending}
              className="px-8 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── GROUND LIST TAB ──
function GroundListTab() {
  const { data: grounds } = useQuery({ queryKey: ['grounds'], queryFn: () => leagueService.getGrounds().then(r => r.data) });

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="bg-gray-100 px-6 py-3 border-b">
          <h2 className="text-base font-bold text-gray-800 uppercase">Ground List</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grounds?.map(g => (
              <div key={g.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl">🏟️</div>
                  <div><p className="font-semibold">{g.name}</p>{g.city && <p className="text-xs text-gray-500">{g.city}{g.state ? `, ${g.state}` : ''}</p>}</div>
                </div>
                {g.addressLine1 && <p className="text-sm text-gray-600">{g.addressLine1}</p>}
              </div>
            ))}
            {(!grounds?.length) && <div className="col-span-full text-center py-8 text-gray-400">No grounds created yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CREATE TROPHY TAB ──
interface TrophyGroup {
  name: string;
  teamIds: string[];
}

function CreateTrophyTab({ boardId }: { boardId: string }) {
  const [name, setName] = useState('');
  const [winPoints, setWinPoints] = useState('2');
  const [umpireOption, setUmpireOption] = useState<'list' | 'buddy'>('list');
  const [groups, setGroups] = useState<TrophyGroup[]>([{ name: 'group A', teamIds: [] }]);
  const [teamSearches, setTeamSearches] = useState<string[]>(['']);
  const qc = useQueryClient();

  const { data: rosters } = useQuery({
    queryKey: ['rosters', boardId],
    queryFn: () => rosterService.getByBoard(boardId).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => tournamentService.createTournament({
      tournamentName: name,
      winPoint: Number(winPoints) || 0,
      umpireCheck: umpireOption === 'list' ? 1 : 0,
      active: 1,
      scheduleCoordinator: true,
      groupList: groups.map(g => ({
        tournamentGroupName: g.name,
        active: 1,
        teamBoardId: g.teamIds,
      })),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournaments', boardId] });
      setName(''); setWinPoints('2'); setGroups([{ name: 'group A', teamIds: [] }]); setTeamSearches(['']);
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

  const getFilteredRosters = (groupIdx: number) => {
    const search = teamSearches[groupIdx]?.toLowerCase() || '';
    if (!search) return [];
    return (rosters || []).filter(r => r.name.toLowerCase().includes(search));
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="bg-gray-100 px-6 py-3 border-b">
          <h2 className="text-base font-bold text-gray-800 uppercase">Group Tournament</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Tournament Name + Win Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span>Create Tournament / Trophy
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
                placeholder="Tournament name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span>Win Points for the Match
              </label>
              <input
                type="number"
                value={winPoints}
                onChange={e => setWinPoints(e.target.value)}
                className="input-field"
                placeholder="2"
              />
            </div>
          </div>

          {/* Umpire Assignment Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="umpireOption"
                checked={umpireOption === 'list'}
                onChange={() => setUmpireOption('list')}
                className="w-4 h-4 text-red-600 accent-red-600"
              />
              <span className="text-sm text-gray-700">Assign Umpire from Umpire list</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="umpireOption"
                checked={umpireOption === 'buddy'}
                onChange={() => setUmpireOption('buddy')}
                className="w-4 h-4 text-red-600 accent-red-600"
              />
              <span className="text-sm text-gray-700">Assign any CricketSocial Buddy as umpire</span>
            </label>
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
                      <span className="text-red-500">*</span>Group Name
                    </label>
                    <input
                      value={group.name}
                      onChange={e => updateGroupName(gIdx, e.target.value)}
                      className="input-field max-w-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500">*</span>Team Board
                    </label>
                    <div className="flex gap-3 items-start">
                      <div className="relative flex-1 max-w-xs">
                        <input
                          value={teamSearches[gIdx] || ''}
                          onChange={e => {
                            const searches = [...teamSearches];
                            searches[gIdx] = e.target.value;
                            setTeamSearches(searches);
                          }}
                          className="input-field"
                          placeholder="Search team..."
                        />
                        {teamSearches[gIdx] && getFilteredRosters(gIdx).length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {getFilteredRosters(gIdx).map(r => (
                              <button
                                key={r.id}
                                onClick={() => addTeamToGroup(gIdx, r.id)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                {r.logoUrl
                                  ? <img src={r.logoUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                                  : <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs">🏏</div>
                                }
                                {r.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const search = teamSearches[gIdx]?.toLowerCase() || '';
                          const match = rosters?.find(r => r.name.toLowerCase().includes(search));
                          if (match) addTeamToGroup(gIdx, match.id);
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
                        const team = rosters?.find(r => r.id === tid);
                        return team ? (
                          <div key={tid} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                            <div className="flex items-center gap-3">
                              {team.logoUrl
                                ? <img src={team.logoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                                : <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm">🏏</div>
                              }
                              <span className="text-sm font-medium">{team.name}</span>
                            </div>
                            <button onClick={() => removeTeamFromGroup(gIdx, tid)} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                          </div>
                        ) : null;
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
          <div className="flex gap-4">
            <button
              onClick={() => name && createMutation.mutate()}
              disabled={!name || createMutation.isPending}
              className="px-6 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Schedule'}
            </button>
            <button
              onClick={() => { setName(''); setGroups([{ name: 'group A', teamIds: [] }]); }}
              className="px-6 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
          </div>


        </div>
      </div>
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
          <h2 className="text-base font-bold text-gray-800 uppercase">Cancel Game by Date</h2>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">From</label><input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">To</label><input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-field" /></div>
            <button onClick={() => bulkCancelMutation.mutate()} disabled={bulkCancelMutation.isPending}
              className="px-6 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
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
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [format, setFormat] = useState('T20');
  const [overs, setOvers] = useState('20');
  const [maxPlayers, setMaxPlayers] = useState('11');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const qc = useQueryClient();
  const { data: tournaments } = useQuery({ queryKey: ['tournaments', boardId], queryFn: () => tournamentService.getByBoard(boardId).then(r => r.data) });
  
  const createMutation = useMutation({
    mutationFn: () => tournamentService.create({
      name, boardId, format, oversPerInning: parseInt(overs), maxPlayersPerTeam: parseInt(maxPlayers),
      startDate: startDate ? new Date(startDate) : undefined, endDate: endDate ? new Date(endDate) : undefined
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournaments', boardId] });
      setShowForm(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => tournamentService.update(editId!, {
      name, format, oversPerInning: parseInt(overs), maxPlayersPerTeam: parseInt(maxPlayers),
      startDate: startDate ? new Date(startDate) : undefined, endDate: endDate ? new Date(endDate) : undefined
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournaments', boardId] });
      setEditId(null);
      resetForm();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => tournamentService.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tournaments', boardId] }),
  });

  const resetForm = () => {
    setName('');
    setFormat('T20');
    setOvers('20');
    setMaxPlayers('11');
    setStartDate('');
    setEndDate('');
  };

  const handleEdit = (t: Tournament) => {
    setEditId(t.id);
    setName(t.name);
    setFormat(t.format || 'T20');
    setOvers(t.oversPerInning?.toString() || '20');
    setMaxPlayers(t.maxPlayersPerTeam?.toString() || '11');
    setStartDate(t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '');
    setEndDate(t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : '');
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Tournaments</h2>
        <button onClick={() => { setEditId(null); resetForm(); setShowForm(!showForm); }} className="btn-primary text-sm px-4">{showForm ? 'Cancel' : '+ Create Tournament'}</button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">{editId ? 'Edit Tournament' : 'Create Tournament'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Tournament name" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <select value={format} onChange={e => setFormat(e.target.value)} className="input-field">
                <option>T20</option><option>ODI</option><option>Test</option><option>Custom</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Overs per Innings</label><input type="number" value={overs} onChange={e => setOvers(e.target.value)} className="input-field" placeholder="20" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Players per Team</label><input type="number" value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)} className="input-field" placeholder="11" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field" /></div>
          </div>
          <button onClick={() => editId ? updateMutation.mutate() : createMutation.mutate()} disabled={!name || isLoading} className="btn-primary text-sm px-6 mt-4">{isLoading ? 'Saving...' : editId ? 'Update' : 'Create'}</button>
        </div>
      )}

      <div className="card">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500"><th className="pb-3">Name</th><th className="pb-3">Format</th><th className="pb-3">Matches</th><th className="pb-3">Dates</th><th className="pb-3">Status</th><th className="pb-3">Actions</th></tr></thead>
          <tbody>
            {tournaments?.items.map(t => (
              <tr key={t.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="py-3 font-medium">{t.name}</td>
                <td className="py-3">{t.format || '-'}</td>
                <td className="py-3">{t.matchCount}</td>
                <td className="py-3 text-xs">{t.startDate ? new Date(t.startDate).toLocaleDateString() : '-'} — {t.endDate ? new Date(t.endDate).toLocaleDateString() : '-'}</td>
                <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs ${t.status === 'Cancelled' ? 'bg-red-100 text-red-700' : t.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{t.status}</span></td>
                <td className="py-3 flex gap-2">
                  {t.status !== 'Cancelled' && t.status !== 'Completed' && (
                    <>
                      <button onClick={() => { handleEdit(t); setShowForm(true); }} className="text-blue-500 hover:text-blue-700 text-xs">Edit</button>
                      <button onClick={() => cancelMutation.mutate(t.id)} className="text-red-500 hover:text-red-700 text-xs">Cancel</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {(!tournaments?.items.length) && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No tournaments yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── SCHEDULE TAB ──
function ScheduleTab({ boardId }: { boardId: string }) {
  const today = new Date();
  const [from, setFrom] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0]);
  const [editMatchId, setEditMatchId] = useState<string | null>(null);
  const [editGround, setEditGround] = useState('');
  const [editUmpire, setEditUmpire] = useState('');
  const [editScorer, setEditScorer] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTournamentId, setNewTournamentId] = useState('');
  const [newHomeTeamId, setNewHomeTeamId] = useState('');
  const [newAwayTeamId, setNewAwayTeamId] = useState('');
  const [newGroundId, setNewGroundId] = useState('');
  const [newUmpireId, setNewUmpireId] = useState('');
  const [newScorerId, setNewScorerId] = useState('');
  const [newScheduledAt, setNewScheduledAt] = useState('');
  const [newGameType, setNewGameType] = useState('');
  
  const qc = useQueryClient();
  const { data: matches } = useQuery({
    queryKey: ['schedule', boardId, from, to],
    queryFn: () => leagueService.getSchedule(boardId, from, to).then(r => r.data),
    enabled: !!from && !!to,
  });
  const { data: tournaments } = useQuery({
    queryKey: ['tournaments', boardId],
    queryFn: () => tournamentService.getByBoard(boardId).then(r => r.data),
  });
  const { data: rosters } = useQuery({
    queryKey: ['rosters', boardId],
    queryFn: () => rosterService.getByBoard(boardId).then(r => r.data),
  });
  const { data: umpires } = useQuery({ queryKey: ['umpires', boardId], queryFn: () => leagueService.getUmpires(boardId).then(r => r.data as Umpire[]), enabled: !!boardId });
  const { data: grounds } = useQuery({ queryKey: ['grounds'], queryFn: () => leagueService.getGrounds().then(r => r.data) });

  const updateMatchMutation = useMutation({
    mutationFn: () => tournamentService.updateMatch(editMatchId!, {
      groundId: editGround || undefined,
      umpireId: editUmpire || undefined,
      scorerId: editScorer || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule', boardId] });
      setEditMatchId(null);
      setEditGround('');
      setEditUmpire('');
      setEditScorer('');
    },
  });

  const createMatchMutation = useMutation({
    mutationFn: () => tournamentService.createSchedule({
      tournamentId: newTournamentId,
      gameType: newGameType || undefined,
      homeTeamBoardId: newHomeTeamId,
      awayTeamBoardId: newAwayTeamId,
      groundId: newGroundId || undefined,
      startAtUtc: new Date(newScheduledAt).toISOString(),
      umpireId: newUmpireId || undefined,
      appScorerId: newScorerId || undefined,
      active: true,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule', boardId] });
      setShowCreate(false);
      resetCreateForm();
    },
  });

  const handleEditMatch = (m: Match) => {
    setEditMatchId(m.id);
    setEditGround(m.groundId || '');
    setEditUmpire(m.umpireId || '');
    setEditScorer(m.scorerId || '');
  };

  const resetCreateForm = () => {
    setNewTournamentId('');
    setNewHomeTeamId('');
    setNewAwayTeamId('');
    setNewGroundId('');
    setNewUmpireId('');
    setNewScorerId('');
    setNewScheduledAt('');
    setNewGameType('');
  };

  const statusColor = (s: string) => s === 'Scheduled' ? 'bg-blue-100 text-blue-700' : s === 'Live' ? 'bg-green-100 text-green-700' : s === 'Completed' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700';

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Schedule</h2>
        <button onClick={() => { setShowCreate(!showCreate); if (!showCreate) resetCreateForm(); }} className="btn-primary text-sm px-4">
          {showCreate ? 'Cancel' : '+ Create Match'}
        </button>
      </div>

      {showCreate && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">Create Match Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tournament *</label>
              <select value={newTournamentId} onChange={e => setNewTournamentId(e.target.value)} className="input-field">
                <option value="">Select Tournament</option>
                {tournaments?.items.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Type</label>
              <select value={newGameType} onChange={e => setNewGameType(e.target.value)} className="input-field">
                <option value="">Select Game Type</option>
                <option value="T20">T20</option>
                <option value="ODI">ODI</option>
                <option value="Test">Test</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Home Team *</label>
              <select value={newHomeTeamId} onChange={e => { setNewHomeTeamId(e.target.value); if (e.target.value === newAwayTeamId) setNewAwayTeamId(''); }} className="input-field">
                <option value="">Select Home Team</option>
                {rosters?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Away Team *</label>
              <select value={newAwayTeamId} onChange={e => setNewAwayTeamId(e.target.value)} className="input-field">
                <option value="">Select Away Team</option>
                {rosters?.filter(r => r.id !== newHomeTeamId).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ground</label>
              <select value={newGroundId} onChange={e => setNewGroundId(e.target.value)} className="input-field">
                <option value="">Select Ground</option>
                {grounds?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Umpire</label>
              <select value={newUmpireId} onChange={e => setNewUmpireId(e.target.value)} className="input-field">
                <option value="">Select Umpire</option>
                {umpires?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scorer</label>
              <select value={newScorerId} onChange={e => setNewScorerId(e.target.value)} className="input-field">
                <option value="">Select Scorer</option>
                {umpires?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
              <input type="datetime-local" value={newScheduledAt} onChange={e => setNewScheduledAt(e.target.value)} className="input-field" />
            </div>
          </div>
          <button
            onClick={() => createMatchMutation.mutate()}
            disabled={!newTournamentId || !newHomeTeamId || !newAwayTeamId || !newScheduledAt || createMatchMutation.isPending}
            className="btn-primary text-sm px-6 mt-4"
          >
            {createMatchMutation.isPending ? 'Creating...' : 'Create Match'}
          </button>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">From</label><input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">To</label><input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-field" /></div>
        </div>
      </div>

      {editMatchId && (
        <div className="card mb-6 bg-blue-50 border-l-4 border-blue-400 p-5">
          <h3 className="font-semibold mb-4 text-gray-800">Edit Match</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ground</label>
              <select value={editGround} onChange={e => setEditGround(e.target.value)} className="input-field">
                <option value="">Select Ground</option>
                {grounds?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Umpire</label>
              <select value={editUmpire} onChange={e => setEditUmpire(e.target.value)} className="input-field">
                <option value="">Select Umpire</option>
                {umpires?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scorer</label>
              <select value={editScorer} onChange={e => setEditScorer(e.target.value)} className="input-field">
                <option value="">Select Scorer</option>
                {umpires?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => updateMatchMutation.mutate()} disabled={updateMatchMutation.isPending} className="btn-primary text-sm px-6">{updateMatchMutation.isPending ? 'Saving...' : 'Save'}</button>
            <button onClick={() => { setEditMatchId(null); setEditGround(''); setEditUmpire(''); setEditScorer(''); }} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400">Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500"><th className="pb-3">Tournament</th><th className="pb-3">Home</th><th className="pb-3">Away</th><th className="pb-3">Ground</th><th className="pb-3">Umpire</th><th className="pb-3">Scorer</th><th className="pb-3">Date</th><th className="pb-3">Status</th><th className="pb-3">Actions</th></tr></thead>
          <tbody>
            {matches?.map(m => (
              <tr key={m.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="py-3 text-xs">{m.tournamentName}</td><td className="py-3 font-medium text-sm">{m.homeTeamName}</td><td className="py-3 font-medium text-sm">{m.awayTeamName}</td>
                <td className="py-3 text-xs">{m.groundName || '-'}</td><td className="py-3 text-xs">{m.umpireName || '-'}</td><td className="py-3 text-xs">{m.scorerName || '-'}</td><td className="py-3 text-xs">{new Date(m.scheduledAt).toLocaleString()}</td>
                <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs ${statusColor(m.status)}`}>{m.status}</span></td>
                <td className="py-3 text-xs">{m.status === 'Scheduled' && <button onClick={() => handleEditMatch(m)} className="text-blue-500 hover:text-blue-700">Assign</button>}</td>
              </tr>
            ))}
            {(!matches?.length) && <tr><td colSpan={9} className="py-8 text-center text-gray-400">No matches in selected date range.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── APPLICATIONS TAB ──
function ApplicationsTab({ boardId }: { boardId: string }) {
  const [selectedTournament, setSelectedTournament] = useState('');
  const qc = useQueryClient();
  const { data: tournaments } = useQuery({ queryKey: ['tournaments', boardId], queryFn: () => tournamentService.getByBoard(boardId).then(r => r.data) });
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
          {tournaments?.items.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      {selectedTournament && (
        <div className="card">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500"><th className="pb-3">Team</th><th className="pb-3">Payment</th><th className="pb-3">Waiver</th><th className="pb-3">Status</th><th className="pb-3">Submitted</th><th className="pb-3">Actions</th></tr></thead>
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
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="input-field" placeholder="0.00" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input value={description} onChange={e => setDescription(e.target.value)} className="input-field" placeholder="Description" /></div>
          </div>
          <button onClick={() => amount && dueDate && createMutation.mutate()} disabled={!amount || !dueDate || createMutation.isPending}
            className="btn-primary text-sm px-6 mt-4">{createMutation.isPending ? 'Creating...' : 'Create Invoice'}</button>
        </div>
      )}
      <div className="card">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500"><th className="pb-3">Invoice #</th><th className="pb-3">Description</th><th className="pb-3">Amount</th><th className="pb-3">Paid</th><th className="pb-3">Due Date</th><th className="pb-3">Status</th><th className="pb-3">Actions</th></tr></thead>
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
