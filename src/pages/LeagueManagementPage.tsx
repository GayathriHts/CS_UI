import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardService, leagueService, rosterService, tournamentService } from '../services/cricketSocialService';
import type { Umpire, Ground, Tournament, Match, LeagueApplication, Invoice } from '../types';

type LeagueTab = 'dashboard' | 'umpires' | 'grounds' | 'schedule' | 'tournaments' | 'applications' | 'invoices';

const menuItems: { id: LeagueTab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'umpires', label: 'Umpires', icon: '🧑‍⚖️' },
  { id: 'grounds', label: 'Grounds', icon: '🏟️' },
  { id: 'tournaments', label: 'Tournaments', icon: '🏆' },
  { id: 'schedule', label: 'Schedule', icon: '📅' },
  { id: 'applications', label: 'Applications', icon: '📋' },
  { id: 'invoices', label: 'Invoicing', icon: '💰' },
];

export default function LeagueManagementPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const [activeTab, setActiveTab] = useState<LeagueTab>('dashboard');
  const { data: board } = useQuery({ queryKey: ['board', boardId], queryFn: () => boardService.getById(boardId!).then(r => r.data), enabled: !!boardId });

  if (!board) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-dark shadow-lg">
        <div className="max-w-full mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-white/80 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
              <Link to="/" className="flex items-center gap-2"><img src="/images/cs-logo.png" alt="" className="h-8" /><span className="text-white font-bold text-lg">CricketSocial</span></Link>
            </div>
            <div className="text-white font-semibold">League Management — {board.name}</div>
          </div>
        </div>
      </nav>

      <div className="pt-14 flex">
        {/* Sidebar */}
        <div className="w-60 min-h-screen bg-white border-r shadow-sm fixed left-0 top-14">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green/10 rounded-xl flex items-center justify-center text-brand-green font-bold">{board.name[0]}</div>
              <div><p className="font-semibold text-sm">{board.name}</p><p className="text-xs text-gray-500">League Board</p></div>
            </div>
          </div>
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Manage Your League</p>
            {menuItems.map(m => (
              <button key={m.id} onClick={() => setActiveTab(m.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${activeTab === m.id ? 'bg-brand-green/10 text-brand-green font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span>{m.icon}</span> {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="ml-60 flex-1 p-6">
          {activeTab === 'dashboard' && <DashboardTab boardId={boardId!} />}
          {activeTab === 'umpires' && <UmpiresTab boardId={boardId!} />}
          {activeTab === 'grounds' && <GroundsTab />}
          {activeTab === 'tournaments' && <TournamentsTab boardId={boardId!} />}
          {activeTab === 'schedule' && <ScheduleTab boardId={boardId!} />}
          {activeTab === 'applications' && <ApplicationsTab boardId={boardId!} />}
          {activeTab === 'invoices' && <InvoicesTab boardId={boardId!} />}
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD TAB ──
function DashboardTab({ boardId }: { boardId: string }) {
  const { data: tournaments } = useQuery({ queryKey: ['tournaments', boardId], queryFn: () => tournamentService.getByBoard(boardId).then(r => r.data) });
  const { data: umpires } = useQuery({ queryKey: ['umpires', boardId], queryFn: () => leagueService.getUmpires(boardId).then(r => r.data) });
  const { data: invoices } = useQuery({ queryKey: ['invoices', boardId], queryFn: () => leagueService.getInvoices(boardId).then(r => r.data) });

  const totalRevenue = invoices?.reduce((s, i) => s + (i.paidAmount ?? 0), 0) ?? 0;
  const pendingInvoices = invoices?.filter(i => i.status === 'Pending').length ?? 0;

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">League Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tournaments', value: tournaments?.totalCount ?? 0, color: 'bg-blue-50 text-blue-700', icon: '🏆' },
          { label: 'Umpires', value: umpires?.length ?? 0, color: 'bg-green-50 text-green-700', icon: '🧑‍⚖️' },
          { label: 'Revenue', value: `$${totalRevenue.toFixed(0)}`, color: 'bg-purple-50 text-purple-700', icon: '💰' },
          { label: 'Pending Invoices', value: pendingInvoices, color: 'bg-orange-50 text-orange-700', icon: '📋' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
            <div className="flex items-center justify-between">
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-sm opacity-80">{s.label}</p></div>
              <span className="text-3xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>
      {tournaments?.items && tournaments.items.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Tournaments</h3>
          <div className="space-y-3">
            {tournaments.items.slice(0, 5).map(t => (
              <div key={t.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                <div><p className="font-medium">{t.name}</p><p className="text-xs text-gray-500">{t.format} · {t.matchCount} matches</p></div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${t.status === 'Completed' ? 'bg-green-100 text-green-700' : t.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── UMPIRES TAB ──
function UmpiresTab({ boardId }: { boardId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(''); const [contact, setContact] = useState(''); const [city, setCity] = useState('');
  const qc = useQueryClient();
  const { data: umpires } = useQuery({ queryKey: ['umpires', boardId], queryFn: () => leagueService.getUmpires(boardId).then(r => r.data) });
  const createMutation = useMutation({
    mutationFn: () => leagueService.createUmpire(boardId, { name, contactNumber: contact, city }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['umpires', boardId] }); setShowForm(false); setName(''); setContact(''); setCity(''); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => leagueService.deleteUmpire(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['umpires', boardId] }),
  });

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Umpires</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm px-4">{showForm ? 'Cancel' : '+ Create Umpire'}</button>
      </div>
      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">Create Umpire</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Umpire name" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={contact} onChange={e => setContact(e.target.value)} className="input-field" placeholder="Phone number" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input value={city} onChange={e => setCity(e.target.value)} className="input-field" placeholder="City" /></div>
          </div>
          <button onClick={() => name && createMutation.mutate()} disabled={!name || createMutation.isPending} className="btn-primary text-sm px-6 mt-4">{createMutation.isPending ? 'Creating...' : 'Create'}</button>
        </div>
      )}
      <div className="card">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500"><th className="pb-3">Name</th><th className="pb-3">Phone</th><th className="pb-3">City</th><th className="pb-3">Rating</th><th className="pb-3">Matches</th><th className="pb-3">Actions</th></tr></thead>
          <tbody>
            {umpires?.map(u => (
              <tr key={u.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="py-3 font-medium">{u.name}</td><td className="py-3">{u.contactNumber || '-'}</td><td className="py-3">{u.city || '-'}</td>
                <td className="py-3">{'⭐'.repeat(Math.round(u.rating))} ({u.rating.toFixed(1)})</td><td className="py-3">{u.totalMatches}</td>
                <td className="py-3"><button onClick={() => deleteMutation.mutate(u.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button></td>
              </tr>
            ))}
            {(!umpires?.length) && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No umpires created yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── GROUNDS TAB ──
function GroundsTab() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(''); const [address, setAddress] = useState(''); const [city, setCity] = useState(''); const [state, setState] = useState('');
  const qc = useQueryClient();
  const { data: grounds } = useQuery({ queryKey: ['grounds'], queryFn: () => leagueService.getGrounds().then(r => r.data) });
  const createMutation = useMutation({
    mutationFn: () => leagueService.createGround({ name, address, city, state }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grounds'] }); setShowForm(false); setName(''); setAddress(''); setCity(''); setState(''); },
  });

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Grounds</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm px-4">{showForm ? 'Cancel' : '+ Create Ground'}</button>
      </div>
      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">Create Ground</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Ground name" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input value={address} onChange={e => setAddress(e.target.value)} className="input-field" placeholder="Address" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input value={city} onChange={e => setCity(e.target.value)} className="input-field" placeholder="City" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label><input value={state} onChange={e => setState(e.target.value)} className="input-field" placeholder="State" /></div>
          </div>
          <button onClick={() => name && createMutation.mutate()} disabled={!name || createMutation.isPending} className="btn-primary text-sm px-6 mt-4">{createMutation.isPending ? 'Creating...' : 'Create'}</button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {grounds?.map(g => (
          <div key={g.id} className="card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl">🏟️</div>
              <div><p className="font-semibold">{g.name}</p>{g.city && <p className="text-xs text-gray-500">{g.city}{g.state ? `, ${g.state}` : ''}</p>}</div>
            </div>
            {g.address && <p className="text-sm text-gray-600">{g.address}</p>}
          </div>
        ))}
        {(!grounds?.length) && <div className="card col-span-full text-center py-8 text-gray-400">No grounds created yet.</div>}
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
  const { data: umpires } = useQuery({ queryKey: ['umpires', boardId], queryFn: () => leagueService.getUmpires(boardId).then(r => r.data), enabled: !!boardId });
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

  const bulkCancelMutation = useMutation({
    mutationFn: () => leagueService.cancelGames(boardId, from, to),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule', boardId] }),
  });

  const createMatchMutation = useMutation({
    mutationFn: () => tournamentService.createMatch({
      tournamentId: newTournamentId,
      homeTeamId: newHomeTeamId,
      awayTeamId: newAwayTeamId,
      groundId: newGroundId || undefined,
      umpireId: newUmpireId || undefined,
      scorerId: newScorerId || undefined,
      scheduledAt: new Date(newScheduledAt).toISOString(),
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
          <button onClick={() => bulkCancelMutation.mutate()} disabled={bulkCancelMutation.isPending} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50">{bulkCancelMutation.isPending ? 'Cancelling...' : 'Cancel Games in Range'}</button>
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
